import express from 'express';
import RevenueEntry from '../models/RevenueEntry.js';
import SpendBreakdown from '../models/SpendBreakdown.js';
import AdCampaignSpend from '../models/AdCampaignSpend.js';
import RecurringCost from '../models/RecurringCost.js';
import { gatherRiskData } from '../services/financeDataService.js';
import { generateResponse } from '../services/gemini.js';

const router = express.Router();

// ── Anomaly labels for human-friendly display ────
const ANOMALY_LABELS = {
    SPEND_SPIKE: 'Ad Spend Spike',
    ROI_DECLINE: 'ROI Declining',
    NEGATIVE_ROI: 'Negative ROI',
    HIGH_AGENCY_FEE_RATIO: 'High Agency Fees',
    UNDERPERFORMING_CAMPAIGNS: 'Underperforming Campaigns',
    TOOL_COST_CREEP: 'Tool Cost Creep',
    BUDGET_OVERSHOOT: 'Budget Overshoot'
};

/**
 * GET /api/roi/anomalies
 * Automated anomaly scan — returns risk flags with AI explanations.
 */
router.get('/anomalies', async (req, res) => {
    try {
        const userId = req.user.id;
        const riskData = await gatherRiskData(userId);

        // Generate brief AI explanation for each flag
        const flagsWithExplanations = await Promise.all(
            riskData.flags.map(async (flag) => {
                let aiExplanation = '';
                try {
                    const prompt = `You are a financial analyst. A risk flag was detected:\n\nType: ${flag.type}\nSeverity: ${flag.severity}\nDetail: ${flag.detail}\n\nProvide a brief 2-sentence explanation of why this is concerning and one actionable recommendation. Be concise and professional.`;
                    aiExplanation = await generateResponse(prompt);
                } catch {
                    aiExplanation = flag.detail;
                }
                return {
                    id: `${flag.type}_${Date.now()}`,
                    ...flag,
                    label: ANOMALY_LABELS[flag.type] || flag.type,
                    aiExplanation,
                    timestamp: new Date().toISOString()
                };
            })
        );

        res.json({
            flags: flagsWithExplanations,
            riskLevel: riskData.riskLevel,
            flagCount: riskData.flagCount,
            scannedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Anomaly scan error:', err);
        res.status(500).json({ error: 'Failed to run anomaly scan.' });
    }
});

// ── Helper: compute ROI metrics from raw numbers ────
function computeMetrics(revenue, totalSpend, conversions) {
    const roi = totalSpend > 0 ? ((revenue - totalSpend) / totalSpend) * 100 : 0;
    const cpa = conversions > 0 ? totalSpend / conversions : 0;
    const profitMargin = revenue > 0 ? ((revenue - totalSpend) / revenue) * 100 : 0;
    const profit = revenue - totalSpend;

    return {
        revenue: parseFloat(revenue.toFixed(2)),
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        conversions,
        roi: parseFloat(roi.toFixed(2)),
        cpa: parseFloat(cpa.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
    };
}

/**
 * GET /api/roi
 * Returns per-period ROI data by joining revenue entries with spend data.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch all revenue entries
        const revenueEntries = await RevenueEntry.find({ userId })
            .sort({ period: -1 })
            .lean();

        // 2. Fetch spend breakdowns
        const spendBreakdowns = await SpendBreakdown.find({ userId })
            .sort({ period: -1 })
            .lean();

        // 3. Fetch ad campaign spend aggregated by period (YYYY-MM)
        const adSpendByPeriod = await AdCampaignSpend.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m', date: '$startDate' }
                    },
                    totalAdSpend: { $sum: '$spend' },
                    totalConversions: { $sum: '$metrics.conversions' }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        // 4. Fetch active recurring monthly costs
        const recurringCosts = await RecurringCost.aggregate([
            { $match: { userId, isActive: true, feeType: 'fixed' } },
            {
                $group: {
                    _id: null,
                    totalMonthly: { $sum: '$monthlyEquivalent' }
                }
            }
        ]);
        const monthlyRecurring = recurringCosts[0]?.totalMonthly || 0;

        // 5. Build a set of all periods
        const periodSet = new Set();
        revenueEntries.forEach(r => periodSet.add(r.period));
        spendBreakdowns.forEach(s => periodSet.add(s.period));
        adSpendByPeriod.forEach(a => periodSet.add(a._id));

        // 6. Build per-period data
        const adSpendMap = {};
        adSpendByPeriod.forEach(a => { adSpendMap[a._id] = a; });
        const spendMap = {};
        spendBreakdowns.forEach(s => { spendMap[s.period] = s; });
        const revenueMap = {};
        revenueEntries.forEach(r => { revenueMap[r.period] = r; });

        const periods = Array.from(periodSet)
            .sort((a, b) => b.localeCompare(a))
            .map(period => {
                const rev = revenueMap[period];
                const spend = spendMap[period];
                const adData = adSpendMap[period];

                const revenue = rev?.revenue || 0;
                // Total spend = SpendBreakdown total OR ad spend only, plus recurring
                const periodSpend = spend?.totalSpend || adData?.totalAdSpend || 0;
                const totalSpend = periodSpend + monthlyRecurring;
                // Conversions from revenue entry or ad data
                const conversions = rev?.conversions || adData?.totalConversions || 0;

                return {
                    period,
                    ...computeMetrics(revenue, totalSpend, conversions),
                    revenueEntryId: rev?._id || null
                };
            });

        res.json({ periods });
    } catch (err) {
        console.error('ROI fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch ROI data.' });
    }
});

/**
 * GET /api/roi/summary
 * Overall ROI summary across all periods.
 */
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;

        // Total revenue
        const revAgg = await RevenueEntry.aggregate([
            { $match: { userId } },
            { $group: { _id: null, total: { $sum: '$revenue' }, conversions: { $sum: '$conversions' }, count: { $sum: 1 } } }
        ]);
        const totalRevenue = revAgg[0]?.total || 0;
        const totalConversions = revAgg[0]?.conversions || 0;
        const periodCount = revAgg[0]?.count || 0;

        // Total spend from breakdowns
        const spendAgg = await SpendBreakdown.aggregate([
            { $match: { userId } },
            { $group: { _id: null, total: { $sum: '$totalSpend' } } }
        ]);
        const totalFromBreakdowns = spendAgg[0]?.total || 0;

        // Total ad spend directly
        const adAgg = await AdCampaignSpend.aggregate([
            { $match: { userId } },
            { $group: { _id: null, total: { $sum: '$spend' }, conversions: { $sum: '$metrics.conversions' } } }
        ]);

        // Recurring costs (monthly * period count for rough estimate)
        const recurringCosts = await RecurringCost.aggregate([
            { $match: { userId, isActive: true, feeType: 'fixed' } },
            { $group: { _id: null, totalMonthly: { $sum: '$monthlyEquivalent' } } }
        ]);
        const monthlyRecurring = recurringCosts[0]?.totalMonthly || 0;

        const totalSpend = totalFromBreakdowns + (monthlyRecurring * Math.max(periodCount, 1));
        const conversions = totalConversions || adAgg[0]?.conversions || 0;

        const metrics = computeMetrics(totalRevenue, totalSpend, conversions);

        // MoM trend — compare last 2 periods
        const lastTwo = await RevenueEntry.find({ userId })
            .sort({ period: -1 })
            .limit(2)
            .lean();

        let roiTrend = null;
        if (lastTwo.length === 2) {
            const currentRev = lastTwo[0].revenue || 0;
            const prevRev = lastTwo[1].revenue || 0;
            roiTrend = prevRev > 0 ? parseFloat((((currentRev - prevRev) / prevRev) * 100).toFixed(1)) : null;
        }

        res.json({
            ...metrics,
            periodCount,
            roiTrend,
            monthlyRecurring
        });
    } catch (err) {
        console.error('ROI summary error:', err);
        res.status(500).json({ error: 'Failed to fetch ROI summary.' });
    }
});

/**
 * POST /api/roi/revenue
 * Create a new revenue entry.
 */
router.post('/revenue', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period, revenue, conversions, source, notes } = req.body;

        if (!period || revenue === undefined) {
            return res.status(400).json({ error: 'period and revenue are required.' });
        }

        const entry = new RevenueEntry({
            userId,
            period,
            revenue: parseFloat(revenue) || 0,
            conversions: parseInt(conversions) || 0,
            source: source || 'manual',
            notes: notes || ''
        });

        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        console.error('Revenue create error:', err);
        res.status(500).json({ error: 'Failed to create revenue entry.' });
    }
});

/**
 * PUT /api/roi/revenue/:id
 */
router.put('/revenue/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const entry = await RevenueEntry.findOne({ _id: req.params.id, userId });
        if (!entry) return res.status(404).json({ error: 'Revenue entry not found.' });

        const { period, revenue, conversions, source, notes } = req.body;
        if (period !== undefined) entry.period = period;
        if (revenue !== undefined) entry.revenue = parseFloat(revenue) || 0;
        if (conversions !== undefined) entry.conversions = parseInt(conversions) || 0;
        if (source !== undefined) entry.source = source;
        if (notes !== undefined) entry.notes = notes;

        await entry.save();
        res.json(entry);
    } catch (err) {
        console.error('Revenue update error:', err);
        res.status(500).json({ error: 'Failed to update revenue entry.' });
    }
});

/**
 * DELETE /api/roi/revenue/:id
 */
router.delete('/revenue/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await RevenueEntry.findOneAndDelete({ _id: req.params.id, userId });
        if (!result) return res.status(404).json({ error: 'Revenue entry not found.' });
        res.json({ success: true, message: 'Revenue entry deleted.' });
    } catch (err) {
        console.error('Revenue delete error:', err);
        res.status(500).json({ error: 'Failed to delete revenue entry.' });
    }
});

export default router;
