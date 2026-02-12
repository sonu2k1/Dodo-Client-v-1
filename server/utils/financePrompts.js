/**
 * Finance Prompt Utilities
 * Formats finance data into structured prompts for Gemini
 * to explain spend, analyse ROI, or flag risks.
 */

/**
 * Format EXPLAIN_SPEND prompt.
 */
export function formatExplainSpendPrompt(userMessage, data) {
    let prompt = `You are a senior financial analyst for this client. The user asked: "${userMessage}"

Your task: Explain the spend breakdown clearly and justify every category. If the user asks specifically about agency fees, provide detailed justification. Be data-driven.

Current Financial Data:
`;

    // Spend breakdowns
    if (data.spendBreakdowns?.length > 0) {
        prompt += '\nSpend by Period:\n';
        data.spendBreakdowns.forEach(b => {
            prompt += `  ${b.period}: Total $${b.totalSpend} (Ad Spend: $${b.adSpend}, Agency: $${b.agencyFees}, Tools: $${b.toolsCost}, Misc: $${b.miscCost})\n`;
        });
    }

    // Recurring costs
    if (data.recurringCosts?.length > 0) {
        prompt += '\nActive Recurring Costs:\n';
        data.recurringCosts.forEach(r => {
            const typeLabel = r.feeType === 'percentage' ? `${r.amount}% of ${r.percentageBase || 'ad spend'}` : `$${r.amount}/${r.frequency}`;
            prompt += `  - ${r.name} [${r.category}]: ${typeLabel} (Monthly eq: $${r.monthlyEquivalent}) ${r.vendor ? `— Vendor: ${r.vendor}` : ''}\n`;
        });
    }

    // Agency fees justification
    if (data.agencyFees?.length > 0) {
        prompt += '\nAgency Fee Details (Justify each):\n';
        data.agencyFees.forEach(a => {
            prompt += `  - ${a.name}: $${a.amount}/${a.frequency} from ${a.vendor || 'unknown vendor'}\n`;
        });
    }

    // Ad campaigns
    if (data.adCampaigns?.length > 0) {
        prompt += '\nRecent Ad Campaigns:\n';
        data.adCampaigns.forEach(c => {
            prompt += `  - "${c.campaignName}" (${c.platform}): $${c.spend} spent, ${c.conversions} conv, CTR ${c.ctr}%, CPC $${c.cpc}\n`;
        });
    }

    // Summary
    if (data.summary) {
        prompt += `\nSummary: Monthly recurring $${data.summary.totalMonthlyRecurring} | ${data.summary.agencyFeeCount} agency fees | ${data.summary.toolSubCount} tool subs | Latest period (${data.summary.latestPeriod}): $${data.summary.latestPeriodSpend}\n`;
    }

    prompt += `
Instructions:
- Break down where money is going, using exact numbers from the data above.
- If agency fees exist, explain what value they likely provide (campaign management, optimisation, reporting).
- Compare periods if multiple exist to show trends.
- Highlight the biggest spend categories.
- Be concise but thorough. Use bullet points.
- If data is missing for any category, mention it.
`;

    return prompt;
}

/**
 * Format ANALYZE_ROI prompt.
 */
export function formatAnalyzeROIPrompt(userMessage, data) {
    let prompt = `You are a senior ROI analyst. The user asked: "${userMessage}"

Your task: Analyse the ROI health based on the data below. Compute and explain key metrics. Identify trends and make actionable recommendations.

Financial Data:
`;

    // Per-period ROI
    if (data.periodMetrics?.length > 0) {
        prompt += '\nPeriod-by-Period Metrics:\n';
        prompt += '  Period | Revenue | Spend | Profit | ROI% | CPA | Margin%\n';
        data.periodMetrics.forEach(m => {
            prompt += `  ${m.period} | $${m.revenue} | $${m.spend} | $${m.profit} | ${m.roi}% | $${m.cpa} | ${m.profitMargin}%\n`;
        });
    }

    // Campaign performance
    if (data.campaignPerformance?.length > 0) {
        prompt += '\nCampaign Performance:\n';
        data.campaignPerformance.forEach(c => {
            prompt += `  - "${c.campaignName}" (${c.platform}): $${c.spend}, ${c.conversions} conv, ROAS ${c.roas}, CPC $${c.cpc}\n`;
        });
    }

    // Trend
    if (data.trend) {
        prompt += `\nTrend: ${data.trend.direction.toUpperCase()}\n`;
        prompt += `  ROI change: ${data.trend.roiChange > 0 ? '+' : ''}${data.trend.roiChange} pp\n`;
        if (data.trend.revenueChange !== null) prompt += `  Revenue MoM: ${data.trend.revenueChange > 0 ? '+' : ''}${data.trend.revenueChange}%\n`;
        if (data.trend.spendChange !== null) prompt += `  Spend MoM: ${data.trend.spendChange > 0 ? '+' : ''}${data.trend.spendChange}%\n`;
    }

    prompt += `\nMonthly recurring costs: $${data.monthlyRecurring || 0}\n`;

    prompt += `
Instructions:
- Lead with the overall ROI verdict (healthy, needs attention, critical).
- Explain what's driving the ROI — is revenue growing faster than spend or vice versa?
- Highlight the best and worst performing campaigns.
- Calculate effective CPA and compare across campaigns.
- Track the MoM trend and explain whether it's improving or deteriorating.
- Provide 2-3 specific, actionable recommendations to improve ROI.
- Use exact numbers from the data. Never invent figures.
- Format with headers, bullet points, and bold key metrics.
`;

    return prompt;
}

/**
 * Format FLAG_RISK prompt.
 */
export function formatFlagRiskPrompt(userMessage, data) {
    let prompt = `You are a financial risk analyst. The user asked: "${userMessage}"

Your task: Review the risk flags and financial data below and provide a clear risk assessment with recommendations.

Risk Assessment:
- Overall Risk Level: ${data.riskLevel?.toUpperCase() || 'UNKNOWN'}
- Flags Detected: ${data.flagCount || 0}
`;

    // Flags
    if (data.flags?.length > 0) {
        prompt += '\nDetected Risk Flags:\n';
        data.flags.forEach((f, i) => {
            prompt += `\n  ${i + 1}. [${f.severity.toUpperCase()}] ${f.type}\n`;
            prompt += `     ${f.detail}\n`;
            if (f.campaigns) {
                f.campaigns.forEach(c => {
                    prompt += `       → "${c.name}" (${c.platform}): $${c.spend}\n`;
                });
            }
        });
    } else {
        prompt += '\nNo critical risk flags detected.\n';
    }

    // Spend history
    if (data.spendHistory?.length > 0) {
        prompt += '\nSpend History:\n';
        data.spendHistory.forEach(s => {
            prompt += `  ${s.period}: Total $${s.totalSpend} (Ad: $${s.adSpend}, Agency: $${s.agencyFees}, Tools: $${s.toolsCost})\n`;
        });
    }

    // Percentage fees
    if (data.percentageFees?.length > 0) {
        prompt += '\nPercentage-Based Fees (monitor closely):\n';
        data.percentageFees.forEach(p => {
            prompt += `  - ${p.name}: ${p.amount}% of ${p.percentageBase || 'ad spend'} ${p.vendor ? `(${p.vendor})` : ''}\n`;
        });
    }

    prompt += `
Instructions:
- Start with a clear risk verdict: 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH.
- For each flag, explain WHY it's a risk and WHAT to do about it.
- If spend is spiking, suggest potential causes (new campaigns, rate increases, scope creep).
- If ROI is declining, explain the likely drivers.
- If agency fees are high, suggest negotiation strategies or benchmarks.
- For underperforming campaigns, recommend pausing, optimising, or reallocating budget.
- End with a prioritised action list (most urgent first).
- Use exact numbers. Be specific and actionable.
- Format with clear sections: Risk Summary, Detailed Findings, Recommendations.
`;

    return prompt;
}
