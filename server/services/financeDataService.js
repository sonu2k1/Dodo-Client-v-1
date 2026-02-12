import SpendBreakdown from '../models/SpendBreakdown.js';
import AdCampaignSpend from '../models/AdCampaignSpend.js';
import RecurringCost from '../models/RecurringCost.js';
import RevenueEntry from '../models/RevenueEntry.js';

/**
 * Finance Data Service
 * Gathers spend, ROI, and risk data from multiple models
 * so Gemini can explain, analyse, and flag finance issues.
 */

/**
 * Gather spend breakdown data for EXPLAIN_SPEND intent.
 */
export async function gatherSpendData(userId, params = {}) {
    const data = { subject: params.subject || 'spend_breakdown' };

    // 1. Spend breakdowns (last 6 periods)
    const breakdowns = await SpendBreakdown.find({ userId })
        .sort({ periodStart: -1 })
        .limit(6)
        .lean();

    data.spendBreakdowns = breakdowns.map(b => ({
        period: b.period,
        adSpend: b.adSpend,
        agencyFees: b.agencyFees,
        toolsCost: b.toolsCost,
        miscCost: b.miscCost,
        totalSpend: b.totalSpend,
        periodStart: b.periodStart,
        periodEnd: b.periodEnd
    }));

    // 2. Active recurring costs
    const recurring = await RecurringCost.find({ userId, isActive: true }).lean();
    data.recurringCosts = recurring.map(r => ({
        name: r.name,
        category: r.category,
        feeType: r.feeType,
        amount: r.amount,
        frequency: r.frequency,
        monthlyEquivalent: r.monthlyEquivalent,
        vendor: r.vendor
    }));

    // Separate agency fees for justification
    data.agencyFees = data.recurringCosts.filter(r => r.category === 'agency_fee');
    data.toolSubscriptions = data.recurringCosts.filter(r => r.category === 'tool_subscription');

    // 3. Recent ad campaigns (last 10)
    const campaigns = await AdCampaignSpend.find({ userId })
        .sort({ startDate: -1 })
        .limit(10)
        .lean();

    data.adCampaigns = campaigns.map(c => ({
        campaignName: c.campaignName,
        platform: c.platform,
        spend: c.spend,
        startDate: c.startDate,
        endDate: c.endDate,
        impressions: c.metrics?.impressions || 0,
        clicks: c.metrics?.clicks || 0,
        conversions: c.metrics?.conversions || 0,
        ctr: c.metrics?.ctr || 0,
        cpc: c.metrics?.cpc || 0
    }));

    // 4. Summary totals
    const totalMonthlyRecurring = data.recurringCosts
        .filter(r => r.feeType === 'fixed')
        .reduce((sum, r) => sum + (r.monthlyEquivalent || 0), 0);

    const latestBreakdown = breakdowns[0];
    data.summary = {
        totalMonthlyRecurring: parseFloat(totalMonthlyRecurring.toFixed(2)),
        agencyFeeCount: data.agencyFees.length,
        toolSubCount: data.toolSubscriptions.length,
        latestPeriodSpend: latestBreakdown?.totalSpend || 0,
        latestPeriod: latestBreakdown?.period || 'N/A'
    };

    return data;
}

/**
 * Gather ROI data for ANALYZE_ROI intent.
 */
export async function gatherROIData(userId, params = {}) {
    const data = { subject: params.subject || 'roi_analysis' };

    // 1. Revenue entries (last 6 periods)
    const revenues = await RevenueEntry.find({ userId })
        .sort({ period: -1 })
        .limit(6)
        .lean();

    data.revenueEntries = revenues.map(r => ({
        period: r.period,
        revenue: r.revenue,
        conversions: r.conversions
    }));

    // 2. Spend breakdowns (matching periods)
    const breakdowns = await SpendBreakdown.find({ userId })
        .sort({ periodStart: -1 })
        .limit(6)
        .lean();

    data.spendBreakdowns = breakdowns.map(b => ({
        period: b.period,
        totalSpend: b.totalSpend,
        adSpend: b.adSpend,
        agencyFees: b.agencyFees,
        toolsCost: b.toolsCost
    }));

    // 3. Ad campaign performance (last 10)
    const campaigns = await AdCampaignSpend.find({ userId })
        .sort({ startDate: -1 })
        .limit(10)
        .lean();

    data.campaignPerformance = campaigns.map(c => ({
        campaignName: c.campaignName,
        platform: c.platform,
        spend: c.spend,
        conversions: c.metrics?.conversions || 0,
        roas: c.metrics?.roas || 0,
        cpc: c.metrics?.cpc || 0
    }));

    // 4. Recurring costs total
    const recurringAgg = await RecurringCost.aggregate([
        { $match: { userId, isActive: true, feeType: 'fixed' } },
        { $group: { _id: null, totalMonthly: { $sum: '$monthlyEquivalent' } } }
    ]);
    data.monthlyRecurring = recurringAgg[0]?.totalMonthly || 0;

    // 5. Compute per-period ROI
    const revenueMap = {};
    revenues.forEach(r => { revenueMap[r.period] = r; });
    const spendMap = {};
    breakdowns.forEach(b => { spendMap[b.period] = b; });

    const allPeriods = new Set([
        ...revenues.map(r => r.period),
        ...breakdowns.map(b => b.period)
    ]);

    data.periodMetrics = Array.from(allPeriods)
        .sort((a, b) => b.localeCompare(a))
        .map(period => {
            const rev = revenueMap[period]?.revenue || 0;
            const spend = (spendMap[period]?.totalSpend || 0) + data.monthlyRecurring;
            const conversions = revenueMap[period]?.conversions || 0;
            const roi = spend > 0 ? ((rev - spend) / spend) * 100 : 0;
            const cpa = conversions > 0 ? spend / conversions : 0;
            const margin = rev > 0 ? ((rev - spend) / rev) * 100 : 0;
            return {
                period, revenue: rev, spend,
                conversions, roi: parseFloat(roi.toFixed(2)),
                cpa: parseFloat(cpa.toFixed(2)),
                profitMargin: parseFloat(margin.toFixed(2)),
                profit: parseFloat((rev - spend).toFixed(2))
            };
        });

    // 6. Trend detection
    if (data.periodMetrics.length >= 2) {
        const curr = data.periodMetrics[0];
        const prev = data.periodMetrics[1];
        data.trend = {
            roiChange: parseFloat((curr.roi - prev.roi).toFixed(2)),
            revenueChange: prev.revenue > 0
                ? parseFloat((((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1))
                : null,
            spendChange: prev.spend > 0
                ? parseFloat((((curr.spend - prev.spend) / prev.spend) * 100).toFixed(1))
                : null,
            direction: curr.roi > prev.roi ? 'improving' : curr.roi < prev.roi ? 'declining' : 'stable'
        };
    }

    return data;
}

/**
 * Gather risk/anomaly data for FLAG_RISK intent.
 */
export async function gatherRiskData(userId, params = {}) {
    const data = { subject: params.subject || 'risk_analysis' };
    const flags = [];

    // 1. Get last 6 spend breakdowns for trend analysis
    const breakdowns = await SpendBreakdown.find({ userId })
        .sort({ periodStart: -1 })
        .limit(6)
        .lean();

    data.spendHistory = breakdowns.map(b => ({
        period: b.period,
        totalSpend: b.totalSpend,
        adSpend: b.adSpend,
        agencyFees: b.agencyFees,
        toolsCost: b.toolsCost
    }));

    // 2. Detect spend spikes (> 40% MoM increase)
    if (breakdowns.length >= 2) {
        const curr = breakdowns[0].totalSpend;
        const prev = breakdowns[1].totalSpend;
        if (prev > 0) {
            const changePercent = ((curr - prev) / prev) * 100;
            if (changePercent > 40) {
                flags.push({
                    type: 'SPEND_SPIKE',
                    severity: changePercent > 80 ? 'critical' : 'warning',
                    detail: `Total spend spiked ${changePercent.toFixed(1)}% from ${breakdowns[1].period} ($${prev}) to ${breakdowns[0].period} ($${curr}).`,
                    currentValue: curr,
                    previousValue: prev,
                    changePercent: parseFloat(changePercent.toFixed(1)),
                    navTarget: 'spend-meter'
                });
            }
        }
    }

    // 3. Detect ROI decline
    const revenues = await RevenueEntry.find({ userId })
        .sort({ period: -1 })
        .limit(3)
        .lean();

    if (revenues.length >= 2 && breakdowns.length >= 2) {
        const currRev = revenues[0]?.revenue || 0;
        const prevRev = revenues[1]?.revenue || 0;
        const currSpend = breakdowns[0]?.totalSpend || 0;
        const prevSpend = breakdowns[1]?.totalSpend || 0;
        const currROI = currSpend > 0 ? ((currRev - currSpend) / currSpend) * 100 : 0;
        const prevROI = prevSpend > 0 ? ((prevRev - prevSpend) / prevSpend) * 100 : 0;

        if (currROI < prevROI - 15) {
            flags.push({
                type: 'ROI_DECLINE',
                severity: currROI < 0 ? 'critical' : 'warning',
                detail: `ROI dropped from ${prevROI.toFixed(1)}% to ${currROI.toFixed(1)}% (${(currROI - prevROI).toFixed(1)} pp decline).`,
                currentROI: parseFloat(currROI.toFixed(1)),
                previousROI: parseFloat(prevROI.toFixed(1)),
                navTarget: 'roi-analysis'
            });
        }

        // Negative ROI
        if (currROI < 0) {
            flags.push({
                type: 'NEGATIVE_ROI',
                severity: 'critical',
                detail: `Current ROI is negative (${currROI.toFixed(1)}%). Spending exceeds revenue.`,
                currentROI: parseFloat(currROI.toFixed(1)),
                navTarget: 'roi-analysis'
            });
        }
    }

    // 4. High agency fee ratio
    const recurringCosts = await RecurringCost.find({ userId, isActive: true }).lean();
    const agencyTotal = recurringCosts
        .filter(r => r.category === 'agency_fee' && r.feeType === 'fixed')
        .reduce((s, r) => s + (r.monthlyEquivalent || 0), 0);

    if (breakdowns.length > 0 && breakdowns[0].totalSpend > 0) {
        const agencyRatio = (agencyTotal / breakdowns[0].totalSpend) * 100;
        if (agencyRatio > 30) {
            flags.push({
                type: 'HIGH_AGENCY_FEE_RATIO',
                severity: agencyRatio > 50 ? 'critical' : 'warning',
                detail: `Agency fees represent ${agencyRatio.toFixed(1)}% of total monthly spend ($${agencyTotal} / $${breakdowns[0].totalSpend}).`,
                agencyTotal,
                totalSpend: breakdowns[0].totalSpend,
                ratio: parseFloat(agencyRatio.toFixed(1)),
                navTarget: 'cost-tracking'
            });
        }
    }

    // 5. Underperforming campaigns (high spend, zero conversions)
    const campaigns = await AdCampaignSpend.find({ userId })
        .sort({ startDate: -1 })
        .limit(10)
        .lean();

    const underperformers = campaigns.filter(
        c => c.spend > 100 && (!c.metrics?.conversions || c.metrics.conversions === 0)
    );
    if (underperformers.length > 0) {
        flags.push({
            type: 'UNDERPERFORMING_CAMPAIGNS',
            severity: 'warning',
            detail: `${underperformers.length} campaign(s) with $100+ spend but zero conversions.`,
            campaigns: underperformers.map(c => ({
                name: c.campaignName,
                platform: c.platform,
                spend: c.spend
            })),
            navTarget: 'ad-spend'
        });
    }

    // 6. Tool cost creep (current tools cost > 20% above 3-month avg)
    if (breakdowns.length >= 3) {
        const toolsCosts = breakdowns.map(b => b.toolsCost || 0);
        const avgToolsCost = toolsCosts.slice(1, 4).reduce((s, v) => s + v, 0) / Math.min(toolsCosts.length - 1, 3);
        const currentToolsCost = toolsCosts[0];
        if (avgToolsCost > 0 && currentToolsCost > 0) {
            const toolCreep = ((currentToolsCost - avgToolsCost) / avgToolsCost) * 100;
            if (toolCreep > 20) {
                flags.push({
                    type: 'TOOL_COST_CREEP',
                    severity: toolCreep > 50 ? 'critical' : 'warning',
                    detail: `Tool/subscription costs increased ${toolCreep.toFixed(1)}% above the 3-month average ($${currentToolsCost} vs avg $${avgToolsCost.toFixed(0)}).`,
                    currentValue: currentToolsCost,
                    average: parseFloat(avgToolsCost.toFixed(2)),
                    changePercent: parseFloat(toolCreep.toFixed(1)),
                    navTarget: 'cost-tracking'
                });
            }
        }
    }

    // 7. Budget overshoot (current period spend exceeds revenue)
    if (revenues.length > 0 && breakdowns.length > 0) {
        const latestRevenue = revenues[0]?.revenue || 0;
        const latestSpend = breakdowns[0]?.totalSpend || 0;
        if (latestRevenue > 0 && latestSpend > latestRevenue) {
            const overshootPercent = ((latestSpend - latestRevenue) / latestRevenue) * 100;
            flags.push({
                type: 'BUDGET_OVERSHOOT',
                severity: overshootPercent > 50 ? 'critical' : 'warning',
                detail: `Spending ($${latestSpend}) exceeds revenue ($${latestRevenue}) by ${overshootPercent.toFixed(1)}% in ${breakdowns[0].period}.`,
                spend: latestSpend,
                revenue: latestRevenue,
                overshootPercent: parseFloat(overshootPercent.toFixed(1)),
                navTarget: 'roi-analysis'
            });
        }
    }

    // 8. Percentage-based fees without clear base
    const percentageFees = recurringCosts.filter(r => r.feeType === 'percentage');
    if (percentageFees.length > 0) {
        data.percentageFees = percentageFees.map(r => ({
            name: r.name,
            amount: r.amount,
            percentageBase: r.percentageBase,
            vendor: r.vendor
        }));
    }

    data.flags = flags;
    data.riskLevel = flags.some(f => f.severity === 'critical') ? 'high'
        : flags.length > 0 ? 'medium' : 'low';
    data.flagCount = flags.length;

    return data;
}
