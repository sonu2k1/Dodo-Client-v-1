import express from 'express';
import { generateResponse } from '../services/gemini.js';
import { aggregateWeeklyData } from '../services/weeklySummaryService.js';
import { formatWeeklySummaryPrompt } from '../utils/weeklySummaryPrompts.js';

const router = express.Router();

/**
 * GET /api/ai/weekly-summary
 * Generate an AI-powered weekly executive summary
 * Requires authentication
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        console.log(`📊 Generating weekly summary for user: ${userId}`);

        // Step 1: Aggregate data from all sources
        const weeklyData = await aggregateWeeklyData(userId);

        // Step 2: Build the Gemini prompt
        const prompt = formatWeeklySummaryPrompt(weeklyData);

        // Step 3: Generate AI summary
        let summary;
        try {
            const rawResponse = await generateResponse(prompt);

            // Clean and parse JSON response
            const cleanJson = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
            summary = JSON.parse(cleanJson);
        } catch (aiError) {
            console.error('AI generation failed, using fallback summary:', aiError.message);

            // Fallback: build a basic summary from raw data without AI
            summary = buildFallbackSummary(weeklyData);
        }

        res.json({
            success: true,
            summary,
            rawData: weeklyData,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Weekly summary error:', error);
        res.status(500).json({
            error: 'Failed to generate weekly summary',
            message: error.message
        });
    }
});

/**
 * Build a fallback summary when Gemini is unavailable
 */
function buildFallbackSummary(data) {
    const { tasks, transactions, payments, invoices } = data;

    const completionRate = tasks.newThisWeek > 0
        ? Math.min(Math.round((tasks.completedThisWeek / tasks.newThisWeek) * 100), 100)
        : 0;

    return {
        overview: `This week saw ${tasks.newThisWeek} new tasks created and ${tasks.completedThisWeek} completed. Financial activity included $${transactions.totalCredits.toFixed(2)} in credits and $${transactions.totalDebits.toFixed(2)} in debits across ${transactions.count} transactions.`,
        tasks: {
            summary: `${tasks.newThisWeek} new tasks, ${tasks.completedThisWeek} completed, ${tasks.overdueCount} overdue.`,
            highlights: [
                `${tasks.statusCounts.IN_PROGRESS} tasks currently in progress`,
                `${tasks.priorityCounts.URGENT + tasks.priorityCounts.HIGH} high-priority items need attention`,
                `Task completion rate: ${completionRate}%`
            ],
            completionRate,
            recommendations: tasks.overdueCount > 0
                ? ['Review and address overdue tasks', 'Consider re-prioritizing open items']
                : ['Maintain current task management cadence']
        },
        financial: {
            summary: `${transactions.count} transactions this week with a net flow of $${transactions.netFlow.toFixed(2)}.`,
            totalCredits: transactions.totalCredits,
            totalDebits: transactions.totalDebits,
            netFlow: transactions.netFlow,
            trend: transactions.netFlow > 0 ? 'up' : transactions.netFlow < 0 ? 'down' : 'stable',
            highlights: [
                `Total payment volume: $${payments.totalVolume.toFixed(2)}`,
                `${invoices.paidCount} invoices paid, ${invoices.openCount} open`
            ],
            topCategories: transactions.topCategories.map(c => c.category)
        },
        clientInsights: {
            summary: 'Client engagement data summary based on available context.',
            engagementLevel: data.clientContext.inferredTraits.engagementLevel || 'medium',
            spendingPattern: data.clientContext.inferredTraits.spendingPattern || 'moderate',
            keyDecisions: data.clientContext.recentDecisions.map(d => d.decision),
            highlights: ['AI-powered insights require Gemini API availability for detailed analysis']
        },
        insights: buildFallbackInsights(data),
        actionItems: [
            ...(tasks.overdueCount > 0 ? [{
                title: 'Address overdue tasks',
                description: `${tasks.overdueCount} tasks are past their due date`,
                priority: 'HIGH',
                category: 'tasks'
            }] : []),
            ...(payments.failedCount > 0 ? [{
                title: 'Investigate failed payments',
                description: `${payments.failedCount} payments failed this week`,
                priority: 'URGENT',
                category: 'financial'
            }] : []),
            {
                title: 'Review weekly summary',
                description: 'Assess weekly performance and plan next week',
                priority: 'MEDIUM',
                category: 'operations'
            }
        ],
        riskAlerts: [
            ...(tasks.overdueCount > 0 ? [{
                title: 'Overdue tasks detected',
                description: `${tasks.overdueCount} tasks are past due date`,
                severity: tasks.overdueCount > 3 ? 'high' : 'medium',
                category: 'tasks'
            }] : []),
            ...(payments.failedCount > 0 ? [{
                title: 'Payment failures',
                description: `${payments.failedCount} payments failed this week`,
                severity: 'high',
                category: 'financial'
            }] : [])
        ],
        predictions: buildFallbackPredictions(data)
    };
}

/**
 * Build data-driven insights when Gemini is unavailable
 */
function buildFallbackInsights(data) {
    const { tasks, transactions, payments, invoices } = data;

    const completionRate = tasks.newThisWeek > 0
        ? Math.min(Math.round((tasks.completedThisWeek / tasks.newThisWeek) * 100), 100)
        : 0;

    // ── Successes ──
    const successes = [];

    if (tasks.completedThisWeek > 0) {
        successes.push({
            title: 'Tasks completed on schedule',
            description: 'Team delivered completed work items this week.',
            evidence: `${tasks.completedThisWeek} tasks marked as DONE with a ${completionRate}% completion rate.`,
            category: 'tasks'
        });
    }

    if (transactions.netFlow > 0) {
        successes.push({
            title: 'Positive cash flow achieved',
            description: 'Income exceeded expenses this week.',
            evidence: `Net flow of +$${transactions.netFlow.toFixed(2)} ($${transactions.totalCredits.toFixed(2)} credits vs $${transactions.totalDebits.toFixed(2)} debits).`,
            category: 'financial'
        });
    }

    if (payments.statusCounts.completed > 0 && payments.failedCount === 0) {
        successes.push({
            title: 'Perfect payment success rate',
            description: 'All payments processed without failures.',
            evidence: `${payments.statusCounts.completed} payments completed with 0 failures.`,
            category: 'financial'
        });
    }

    if (invoices.paidCount > 0) {
        successes.push({
            title: 'Revenue collected',
            description: 'Invoices were paid this week.',
            evidence: `${invoices.paidCount} invoices paid, totalling $${invoices.totalRevenue.toFixed(2)} in revenue.`,
            category: 'financial'
        });
    }

    if (successes.length === 0) {
        successes.push({
            title: 'Baseline week',
            description: 'No significant wins or losses detected.',
            evidence: `${tasks.newThisWeek} tasks created, ${transactions.count} transactions processed.`,
            category: 'operations'
        });
    }

    // ── Failures ──
    const failures = [];

    if (tasks.overdueCount > 0) {
        const urgentOverdue = tasks.overdueTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;
        failures.push({
            title: 'Overdue tasks accumulating',
            description: `${tasks.overdueCount} tasks have passed their due date.`,
            rootCause: urgentOverdue > 0
                ? `${urgentOverdue} of ${tasks.overdueCount} overdue items are HIGH/URGENT priority, suggesting mis-estimated timelines or resource constraints.`
                : `Tasks were likely de-prioritized due to competing work; ${tasks.statusCounts.IN_PROGRESS} tasks are still in progress.`,
            impact: `${tasks.overdueCount} deliverables delayed, ${urgentOverdue} of which are critical priority.`,
            suggestedFix: 'Review overdue items, reassign or extend deadlines where appropriate, and consider workload rebalancing.',
            category: 'tasks'
        });
    }

    if (payments.failedCount > 0) {
        failures.push({
            title: 'Payment processing failures',
            description: `${payments.failedCount} payments failed during processing.`,
            rootCause: `${payments.failedCount} out of ${payments.count} total payments failed (${Math.round((payments.failedCount / Math.max(payments.count, 1)) * 100)}% failure rate), indicating potential gateway or validation issues.`,
            impact: `Estimated revenue delay from ${payments.failedCount} failed transactions.`,
            suggestedFix: 'Investigate failed payment error logs, verify gateway connectivity, and retry failed payments.',
            category: 'financial'
        });
    }

    if (transactions.netFlow < 0) {
        failures.push({
            title: 'Negative cash flow',
            description: 'Outgoing funds exceeded incoming this week.',
            rootCause: `Total debits ($${transactions.totalDebits.toFixed(2)}) surpassed credits ($${transactions.totalCredits.toFixed(2)}) by $${Math.abs(transactions.netFlow).toFixed(2)}.`,
            impact: `Net outflow of $${Math.abs(transactions.netFlow).toFixed(2)} reduces available balance.`,
            suggestedFix: 'Review debit transactions for anomalies and consider accelerating receivables.',
            category: 'financial'
        });
    }

    if (failures.length === 0) {
        failures.push({
            title: 'No critical failures',
            description: 'No significant failures detected this week.',
            rootCause: 'All systems operated within normal parameters.',
            impact: 'No negative impact on operations or revenue.',
            suggestedFix: 'Continue monitoring current processes.',
            category: 'operations'
        });
    }

    // ── Reasoning ──
    const reasoning = [];

    const highPriorityOpen = tasks.priorityCounts.HIGH + tasks.priorityCounts.URGENT;
    if (highPriorityOpen > 2 && completionRate < 70) {
        reasoning.push({
            title: 'Potential workload overload',
            observation: `${highPriorityOpen} HIGH/URGENT tasks remain open while completion rate is only ${completionRate}%.`,
            reasoning: `High task volume (${tasks.newThisWeek} new) combined with low completion rate (${completionRate}%) and ${highPriorityOpen} urgent open items suggests the team may be stretched thin or priorities are unclear.`,
            recommendation: 'Conduct a priority triage session to re-rank open items and consider deferring low-priority work.'
        });
    }

    if (transactions.count > 0 && invoices.openCount > 0) {
        reasoning.push({
            title: 'Open invoices vs transaction volume',
            observation: `${invoices.openCount} invoices remain unpaid despite ${transactions.count} transactions processed this week.`,
            reasoning: `Active transaction flow indicates operational activity, but ${invoices.openCount} open invoices represent uncollected revenue of potentially significant value.`,
            recommendation: 'Follow up on open invoices to improve cash collection cycle.'
        });
    }

    if (reasoning.length === 0) {
        reasoning.push({
            title: 'Steady-state operations',
            observation: 'Activity levels are consistent with no alarming patterns.',
            reasoning: `${tasks.newThisWeek} tasks, ${transactions.count} transactions, and ${payments.count} payments processed without significant anomalies.`,
            recommendation: 'Maintain current operational cadence and monitor for emerging trends.'
        });
    }

    return { successes, failures, reasoning };
}

/**
 * Build predictive insights when Gemini is unavailable
 */
function buildFallbackPredictions(data) {
    const { tasks, transactions, payments, invoices } = data;
    const highPriorityOpen = tasks.priorityCounts.HIGH + tasks.priorityCounts.URGENT;

    // ── Key Risks ──
    const keyRisks = [];

    if (tasks.overdueCount > 0) {
        keyRisks.push({
            risk: `Backlog will grow if ${tasks.overdueCount} overdue tasks are not resolved.`,
            likelihood: tasks.overdueCount > 3 ? 'high' : 'medium',
            timeframe: 'next week',
            basedOn: `${tasks.overdueCount} tasks currently past due date.`,
            mitigation: 'Triage overdue items Monday morning and reassign or reschedule.'
        });
    }

    if (payments.failedCount > 0) {
        keyRisks.push({
            risk: 'Recurring payment failures may erode client trust and delay revenue.',
            likelihood: 'medium',
            timeframe: 'next week',
            basedOn: `${payments.failedCount} payment failures this week.`,
            mitigation: 'Audit payment gateway logs and retry failed transactions.'
        });
    }

    if (transactions.netFlow < 0) {
        keyRisks.push({
            risk: `Continued negative cash flow could impact operational liquidity.`,
            likelihood: 'medium',
            timeframe: 'next 2 weeks',
            basedOn: `Net outflow of $${Math.abs(transactions.netFlow).toFixed(2)} this week.`,
            mitigation: 'Accelerate receivables and review discretionary spending.'
        });
    }

    if (highPriorityOpen > 2) {
        keyRisks.push({
            risk: 'High-priority task pile-up may cause deadline misses next week.',
            likelihood: highPriorityOpen > 4 ? 'high' : 'medium',
            timeframe: 'next week',
            basedOn: `${highPriorityOpen} HIGH/URGENT tasks remain open.`,
            mitigation: 'Re-rank priorities and defer non-critical items.'
        });
    }

    if (keyRisks.length === 0) {
        keyRisks.push({
            risk: 'No significant risks identified for next week.',
            likelihood: 'low',
            timeframe: 'next week',
            basedOn: 'All key metrics within normal ranges.',
            mitigation: 'Continue current operational cadence.'
        });
    }

    // ── Next-Week Actions ──
    const nextWeekActions = [];

    if (tasks.overdueCount > 0) {
        nextWeekActions.push({
            action: `Resolve ${tasks.overdueCount} overdue tasks or formally reschedule them.`,
            why: 'Prevents backlog from compounding into next week.',
            timeline: 'Monday',
            expectedOutcome: 'Zero overdue tasks by end of day Monday.'
        });
    }

    if (invoices.openCount > 0) {
        nextWeekActions.push({
            action: `Follow up on ${invoices.openCount} open invoices.`,
            why: 'Accelerates cash collection and improves cash flow.',
            timeline: 'Early week',
            expectedOutcome: 'At least 50% of open invoices moved to paid status.'
        });
    }

    if (payments.failedCount > 0) {
        nextWeekActions.push({
            action: 'Investigate and retry failed payments.',
            why: `${payments.failedCount} failed payments represent delayed revenue.`,
            timeline: 'Monday',
            expectedOutcome: 'All retryable payments reprocessed successfully.'
        });
    }

    nextWeekActions.push({
        action: 'Review this weekly summary with the team.',
        why: 'Aligns priorities and ensures everyone is aware of key metrics.',
        timeline: 'Early week',
        expectedOutcome: 'Shared understanding of priorities and blockers.'
    });

    if (tasks.newThisWeek > tasks.completedThisWeek) {
        nextWeekActions.push({
            action: 'Focus on task completion over new task creation.',
            why: `Created ${tasks.newThisWeek} tasks but only completed ${tasks.completedThisWeek}.`,
            timeline: 'Mid-week',
            expectedOutcome: 'Completion rate above 80% by Friday.'
        });
    }

    // ── Recommended Priorities ──
    const recommendedPriorities = [];
    let rank = 1;

    if (tasks.overdueCount > 0 || highPriorityOpen > 2) {
        recommendedPriorities.push({
            rank: rank++,
            title: 'Clear task backlog',
            rationale: `${tasks.overdueCount} overdue and ${highPriorityOpen} high-priority items demand immediate attention.`,
            currentStatus: `${tasks.statusCounts.IN_PROGRESS} in progress, ${tasks.overdueCount} overdue.`,
            urgency: tasks.overdueCount > 3 ? 'URGENT' : 'HIGH'
        });
    }

    if (invoices.openCount > 0 || transactions.netFlow < 0) {
        recommendedPriorities.push({
            rank: rank++,
            title: 'Improve cash position',
            rationale: `${invoices.openCount} open invoices and $${transactions.netFlow.toFixed(2)} net flow need attention.`,
            currentStatus: `$${invoices.totalRevenue.toFixed(2)} collected, ${invoices.openCount} pending.`,
            urgency: transactions.netFlow < 0 ? 'HIGH' : 'MEDIUM'
        });
    }

    if (payments.failedCount > 0) {
        recommendedPriorities.push({
            rank: rank++,
            title: 'Resolve payment issues',
            rationale: `${payments.failedCount} failed payments need investigation.`,
            currentStatus: `${payments.statusCounts.completed} successful, ${payments.failedCount} failed.`,
            urgency: 'HIGH'
        });
    }

    if (recommendedPriorities.length === 0) {
        recommendedPriorities.push({
            rank: 1,
            title: 'Maintain operational momentum',
            rationale: 'No critical issues detected — focus on steady progress.',
            currentStatus: `${tasks.completedThisWeek} tasks completed, $${transactions.netFlow.toFixed(2)} net flow.`,
            urgency: 'MEDIUM'
        });
    }

    return { keyRisks, nextWeekActions, recommendedPriorities };
}

export default router;
