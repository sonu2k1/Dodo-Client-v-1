/**
 * Context-aware prompt formatting utilities.
 * Converts the unified client context into prompt sections
 * that teach Gemini about the user's profile, preferences,
 * and history so it can adapt tone and advice.
 */

/**
 * Format client context into a prompt section for Gemini.
 * @param {object} unifiedContext - Output of buildUnifiedContext()
 * @returns {string} formatted prompt section
 */
export function formatContextSection(unifiedContext) {
    if (!unifiedContext) return '';

    let section = 'Client Profile & Context:\n';

    // Preferences
    const prefs = unifiedContext.preferences;
    section += `- Communication style: ${prefs.communicationStyle}\n`;
    section += `- Preferred currency: ${prefs.currency}\n`;
    section += `- Detail level: ${prefs.notificationLevel}\n`;

    // Financial profile
    section += `- Budget sensitivity: ${unifiedContext.budgetSensitivity}\n`;
    section += `- Risk appetite: ${unifiedContext.riskAppetite}\n`;

    // Inferred traits
    const traits = unifiedContext.inferredTraits;
    if (traits) {
        section += `- Spending pattern: ${traits.spendingPattern}\n`;
        section += `- Engagement level: ${traits.engagementLevel}\n`;
        if (traits.primaryConcerns && traits.primaryConcerns.length > 0) {
            section += `- Primary concerns: ${traits.primaryConcerns.join(', ')}\n`;
        }
    }

    // Recent decisions
    if (unifiedContext.recentDecisions && unifiedContext.recentDecisions.length > 0) {
        section += '\nRecent Decisions:\n';
        unifiedContext.recentDecisions.forEach(d => {
            const dateStr = d.date ? new Date(d.date).toISOString().split('T')[0] : 'N/A';
            section += `- [${dateStr}] ${d.decision}`;
            if (d.outcome) section += ` → ${d.outcome}`;
            section += '\n';
        });
    }

    // Recent tasks
    if (unifiedContext.recentTasks && unifiedContext.recentTasks.length > 0) {
        section += '\nRecent Task History:\n';
        unifiedContext.recentTasks.forEach(t => {
            const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A';
            section += `- [${dateStr}] ${t.task} (${t.status})`;
            if (t.notes) section += ` — ${t.notes}`;
            section += '\n';
        });
    }

    // Session hints
    if (unifiedContext.sessionHints && unifiedContext.sessionHints.length > 0) {
        section += '\nConversation Hints (this session):\n';
        unifiedContext.sessionHints.slice(-5).forEach(hint => {
            section += `- ${hint}\n`;
        });
    }

    section += '\n';

    // Tone guidance
    section += 'Tone Adaptation Rules:\n';

    switch (prefs.communicationStyle) {
        case 'formal':
            section += '- Use formal, professional language. Avoid slang.\n';
            break;
        case 'casual':
            section += '- Use friendly, conversational language. Be approachable.\n';
            break;
        case 'detailed':
            section += '- Provide thorough explanations with full context.\n';
            break;
        case 'concise':
        default:
            section += '- Keep responses brief and to the point.\n';
            break;
    }

    if (unifiedContext.budgetSensitivity === 'high') {
        section += '- This client is cost-conscious. Highlight savings, value, and cost implications.\n';
    }

    if (unifiedContext.riskAppetite === 'conservative') {
        section += '- This client prefers safe, proven options. Warn about risks.\n';
    } else if (unifiedContext.riskAppetite === 'aggressive') {
        section += '- This client is open to bold moves. Highlight opportunities.\n';
    }

    return section;
}
