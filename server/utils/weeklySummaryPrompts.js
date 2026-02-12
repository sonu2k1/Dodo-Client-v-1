/**
 * Weekly Summary Prompt Templates for Gemini AI
 * Instructs Gemini to produce a structured executive summary
 * from aggregated weekly data.
 */

/**
 * Build the Gemini prompt for weekly summary generation
 * @param {object} weeklyData - Aggregated data from weeklySummaryService
 * @returns {string} formatted prompt
 */
export function formatWeeklySummaryPrompt(weeklyData) {
  const { tasks, transactions, payments, invoices, clientContext, periodStart, periodEnd } = weeklyData;

  return `You are a senior executive AI analyst for DoDo Point Client Concierge, a premium trust-based financial platform.

Analyse the following weekly activity data (${new Date(periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}) and produce an executive summary.

=== TASK DATA ===
Total tasks: ${tasks.total}
New this week: ${tasks.newThisWeek}
Completed this week: ${tasks.completedThisWeek}
Status breakdown: TODO=${tasks.statusCounts.TODO}, IN_PROGRESS=${tasks.statusCounts.IN_PROGRESS}, DONE=${tasks.statusCounts.DONE}
Open priority breakdown: LOW=${tasks.priorityCounts.LOW}, MEDIUM=${tasks.priorityCounts.MEDIUM}, HIGH=${tasks.priorityCounts.HIGH}, URGENT=${tasks.priorityCounts.URGENT}
Overdue tasks: ${tasks.overdueCount}
${tasks.overdueTasks.length > 0 ? 'Overdue items:\n' + tasks.overdueTasks.map(t => `  - "${t.title}" (${t.priority}, due ${new Date(t.dueDate).toLocaleDateString()})`).join('\n') : ''}
${tasks.urgentOpen.length > 0 ? 'Urgent/High priority open:\n' + tasks.urgentOpen.map(t => `  - "${t.title}" (${t.priority}, ${t.status})`).join('\n') : ''}

=== TRANSACTION DATA ===
Total transactions this week: ${transactions.count}
Total credits: $${transactions.totalCredits.toFixed(2)}
Total debits: $${transactions.totalDebits.toFixed(2)}
Net cash flow: $${transactions.netFlow.toFixed(2)}
Average transaction amount: $${transactions.averageAmount.toFixed(2)}
Top categories: ${transactions.topCategories.map(c => `${c.category} (${c.count})`).join(', ') || 'None'}

=== PAYMENT DATA ===
Total payments this week: ${payments.count}
Completed: ${payments.statusCounts.completed}, Pending: ${payments.statusCounts.pending}, Failed: ${payments.statusCounts.failed}, Refunded: ${payments.statusCounts.refunded}
Total completed volume: $${payments.totalVolume.toFixed(2)}

=== INVOICE DATA ===
Total invoices this week: ${invoices.count}
Paid: ${invoices.paidCount}, Open: ${invoices.openCount}
Total revenue (paid): $${invoices.totalRevenue.toFixed(2)}

=== CLIENT CONTEXT ===
Budget sensitivity: ${clientContext.budgetSensitivity}
Risk appetite: ${clientContext.riskAppetite}
Spending pattern: ${clientContext.inferredTraits.spendingPattern || 'unknown'}
Engagement level: ${clientContext.inferredTraits.engagementLevel || 'unknown'}
Primary concerns: ${clientContext.inferredTraits.primaryConcerns?.join(', ') || 'None identified'}
${clientContext.recentDecisions.length > 0 ? 'Recent decisions:\n' + clientContext.recentDecisions.map(d => `  - ${d.decision} (${d.category})`).join('\n') : ''}

=== OUTPUT INSTRUCTIONS ===
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:

{
  "overview": "A 2-3 sentence executive summary highlighting the most important takeaways from this week.",
  "tasks": {
    "summary": "Brief narrative about task activity this week.",
    "highlights": ["Array of 2-4 key highlights about tasks"],
    "completionRate": <percentage as number>,
    "recommendations": ["Array of 1-3 actionable recommendations"]
  },
  "financial": {
    "summary": "Brief narrative about financial activity.",
    "totalCredits": <number>,
    "totalDebits": <number>,
    "netFlow": <number>,
    "trend": "up" | "down" | "stable",
    "highlights": ["Array of 2-3 financial highlights"],
    "topCategories": ["Array of top spending/earning categories"]
  },
  "clientInsights": {
    "summary": "Brief narrative about client engagement and behaviour.",
    "engagementLevel": "low" | "medium" | "high",
    "spendingPattern": "frugal" | "moderate" | "generous",
    "keyDecisions": ["Array of notable client decisions"],
    "highlights": ["Array of 1-3 behavioural insights"]
  },
  "insights": {
    "successes": [
      {
        "title": "Short success title",
        "description": "What went well and why it matters.",
        "evidence": "Cite the specific metric or data point that proves this success (e.g. 'Completion rate hit 85%, up from the 60% baseline').",
        "category": "tasks" | "financial" | "client" | "operations"
      }
    ],
    "failures": [
      {
        "title": "Short failure title",
        "description": "What went wrong.",
        "rootCause": "Data-driven explanation of WHY this happened (e.g. '3 of 4 failed payments used the same gateway; likely a provider-side outage').",
        "impact": "Quantify the impact using the data (e.g. '$450 revenue delayed', '2 high-priority tasks missed deadline').",
        "suggestedFix": "Concrete, actionable next step to resolve or mitigate.",
        "category": "tasks" | "financial" | "client" | "operations"
      }
    ],
    "reasoning": [
      {
        "title": "Insight title",
        "observation": "The pattern or trend you noticed in the data.",
        "reasoning": "Your step-by-step logical explanation connecting data points to the conclusion.",
        "recommendation": "What action should be taken based on this reasoning."
      }
    ]
  },
  "actionItems": [
    {
      "title": "Action item title",
      "description": "Brief description of what to do",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "category": "tasks" | "financial" | "client" | "operations"
    }
  ],
  "riskAlerts": [
    {
      "title": "Risk alert title",
      "description": "Brief description of the risk",
      "severity": "low" | "medium" | "high" | "critical",
      "category": "tasks" | "financial" | "client" | "operations"
    }
  ],
  "predictions": {
    "keyRisks": [
      {
        "risk": "Concise risk statement (1 sentence).",
        "likelihood": "low" | "medium" | "high",
        "timeframe": "next week" | "next 2 weeks" | "next month",
        "basedOn": "The specific data point(s) driving this prediction.",
        "mitigation": "One concrete preventive action."
      }
    ],
    "nextWeekActions": [
      {
        "action": "What to do (imperative, 1 sentence).",
        "why": "Why this matters next week (1 sentence).",
        "timeline": "Monday" | "Early week" | "Mid-week" | "End of week",
        "expectedOutcome": "What success looks like (1 sentence)."
      }
    ],
    "recommendedPriorities": [
      {
        "rank": 1,
        "title": "Priority title (short).",
        "rationale": "Why this should be #1 based on the data.",
        "currentStatus": "Where this stands right now.",
        "urgency": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      }
    ]
  }
}

CRITICAL RULES:
- Do NOT wrap the JSON in markdown code fences.
- Do NOT hallucinate numbers — only use the data provided above.
- If data is insufficient for a section, use reasonable defaults and note the limitation.
- Keep all text concise and professional.
- Completion rate = completedThisWeek / (newThisWeek || 1) * 100, capped at 100.
- If there are overdue/urgent tasks, include at least one risk alert.
- If there are failed payments, include a risk alert.
- Action items should be specific and actionable.

INSIGHTS ANALYSIS RULES (VERY IMPORTANT):
- Successes: Identify 2-4 wins. Each MUST cite a specific number or metric from the data as evidence. If tasks were completed on time, if payments succeeded, if positive cash flow was achieved — call it out with the exact figure.
- Failures: Identify 1-3 failures or issues. Each MUST include a root cause analysis explaining WHY based on the data patterns. Quantify the impact with real numbers. Never say "unknown reason" — reason from the data.
- Reasoning: Provide 1-3 strategic observations. Connect multiple data points together (e.g. "High task volume + low completion rate + high urgency count suggests the team is overloaded"). Think step-by-step and be specific.
- If there are zero failures (no overdue tasks, no failed payments, no negative patterns), include one entry noting the clean record with evidence.
- Always prefer specificity over vagueness. Use exact numbers from the data.

PREDICTIVE INSIGHTS RULES (VERY IMPORTANT):
- Key Risks: Identify 2-4 forward-looking risks. Each must be grounded in THIS WEEK's data — extrapolate logically. E.g. if 3 tasks went overdue this week, predict that backlog will grow next week unless addressed.
- Next-Week Actions: Provide 3-5 prioritised actions for the coming week. Each must have a clear timeline and expected outcome. Actions must follow directly from the data and insights above.
- Recommended Priorities: Rank the top 3 focus areas for next week. Rationale must cite specific numbers. E.g. "$1,200 in open invoices makes collections the #1 priority."
- ALL prediction text must be concise, executive-friendly, and jargon-free. Maximum 1-2 sentences per field.
- Do NOT predict things that have no basis in the data. Every prediction must cite its evidence.`;
}
