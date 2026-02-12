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

    // ── Client Memory (user-managed notes) ──
    const memory = unifiedContext.clientMemory;
    if (memory) {
        const hasNotes = ['preference', 'constraint', 'decision', 'pattern']
            .some(t => memory[t] && memory[t].length > 0);

        if (hasNotes) {
            section += '\nClient Memory (IMPORTANT — use this to maintain continuity):\n';

            if (memory.preference?.length > 0) {
                section += '  Preferences:\n';
                memory.preference.forEach(n => {
                    section += `    - ${n.title}: ${n.content}`;
                    if (n.importance === 'high' || n.importance === 'critical') section += ' [HIGH PRIORITY]';
                    section += '\n';
                });
            }

            if (memory.constraint?.length > 0) {
                section += '  Constraints (MUST RESPECT):\n';
                memory.constraint.forEach(n => {
                    section += `    - ${n.title}: ${n.content}`;
                    if (n.importance === 'high' || n.importance === 'critical') section += ' [STRICT]';
                    section += '\n';
                });
            }

            if (memory.decision?.length > 0) {
                section += '  Past Decisions (avoid contradicting these):\n';
                memory.decision.forEach(n => {
                    const dateStr = n.updatedAt ? new Date(n.updatedAt).toISOString().split('T')[0] : '';
                    section += `    - [${dateStr}] ${n.title}: ${n.content}`;
                    if (n.outcome) section += ` → Outcome: ${n.outcome}`;
                    section += '\n';
                });
            }

            if (memory.pattern?.length > 0) {
                section += '  Behavioral Patterns (adapt your responses accordingly):\n';
                memory.pattern.forEach(n => {
                    section += `    - ${n.title}: ${n.content}`;
                    if (n.frequency) section += ` (${n.frequency})`;
                    section += '\n';
                });
            }
        }
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

    // Budget sensitivity — detailed guidance
    section += '\nBudget Sensitivity Guidance:\n';
    switch (unifiedContext.budgetSensitivity) {
        case 'high':
            section += '- Client is HIGHLY cost-conscious. Always mention cost/ROI. Prefer affordable options. Warn before suggesting expensive actions.\n';
            section += '- Flag any recommendation that may exceed typical spending patterns.\n';
            break;
        case 'low':
            section += '- Client prioritises quality over cost. Focus on outcomes and premium options.\n';
            break;
        default:
            section += '- Client has moderate budget sensitivity. Balance cost and quality in recommendations.\n';
    }

    // Risk appetite — detailed guidance
    section += '\nRisk Appetite Guidance:\n';
    switch (unifiedContext.riskAppetite) {
        case 'conservative':
            section += '- Client prefers safe, proven options. Lead with risks. Add safety disclaimers to bold suggestions.\n';
            section += '- NEVER recommend untested approaches without flagging: "⚠️ Risk note: This is more aggressive than your usual approach."\n';
            break;
        case 'aggressive':
            section += '- Client is open to bold, high-reward strategies. Highlight opportunities. Mention risks briefly.\n';
            break;
        default:
            section += '- Client has moderate risk tolerance. Present balanced options with both risks and opportunities.\n';
    }

    // Decision guardrails — past approvals/rejections
    const allDecisions = [
        ...(unifiedContext.recentDecisions || []),
        ...((unifiedContext.clientMemory?.decision) || [])
    ];

    if (allDecisions.length > 0) {
        section += '\nDecision Guardrails (cross-check BEFORE recommending):\n';
        allDecisions.forEach(d => {
            const label = d.decision || d.title || '';
            const outcome = d.outcome || '';
            const dateStr = (d.date || d.updatedAt) ? new Date(d.date || d.updatedAt).toISOString().split('T')[0] : '';
            section += `- [${dateStr}] ${label}`;
            if (outcome) section += ` → ${outcome}`;
            section += '\n';
        });
        section += '- If your recommendation contradicts any of the above, FLAG it with ⚠️ and explain the conflict.\n';
    }

    return section;
}
