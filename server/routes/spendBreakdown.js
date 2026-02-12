import express from 'express';
import SpendBreakdown from '../models/SpendBreakdown.js';

const router = express.Router();

/**
 * GET /api/spend-breakdown
 * List all spend breakdowns for the authenticated user.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const breakdowns = await SpendBreakdown.find({ userId })
            .sort({ periodStart: -1 })
            .lean();

        res.json({ breakdowns });
    } catch (err) {
        console.error('Spend breakdown list error:', err);
        res.status(500).json({ error: 'Failed to fetch spend breakdowns.' });
    }
});

/**
 * GET /api/spend-breakdown/summary
 * Aggregate totals across all periods for the authenticated user.
 */
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;

        const [totals] = await SpendBreakdown.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalAdSpend: { $sum: '$adSpend' },
                    totalAgencyFees: { $sum: '$agencyFees' },
                    totalToolsCost: { $sum: '$toolsCost' },
                    totalMiscCost: { $sum: '$miscCost' },
                    totalSpend: { $sum: '$totalSpend' },
                    periodCount: { $sum: 1 }
                }
            }
        ]);

        res.json(totals || {
            totalAdSpend: 0,
            totalAgencyFees: 0,
            totalToolsCost: 0,
            totalMiscCost: 0,
            totalSpend: 0,
            periodCount: 0
        });
    } catch (err) {
        console.error('Spend summary error:', err);
        res.status(500).json({ error: 'Failed to fetch spend summary.' });
    }
});

/**
 * POST /api/spend-breakdown
 * Create a new spend breakdown period.
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period, periodStart, periodEnd, adSpend, agencyFees, toolsCost, miscCost, notes } = req.body;

        if (!period || !periodStart || !periodEnd) {
            return res.status(400).json({ error: 'period, periodStart, and periodEnd are required.' });
        }

        const breakdown = new SpendBreakdown({
            userId,
            period,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            adSpend: Math.abs(adSpend || 0),
            agencyFees: Math.abs(agencyFees || 0),
            toolsCost: Math.abs(toolsCost || 0),
            miscCost: Math.abs(miscCost || 0),
            notes: notes || ''
        });

        await breakdown.save();
        res.status(201).json(breakdown);
    } catch (err) {
        console.error('Spend breakdown create error:', err);
        res.status(500).json({ error: 'Failed to create spend breakdown.' });
    }
});

/**
 * PUT /api/spend-breakdown/:id
 * Update an existing spend breakdown.
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { adSpend, agencyFees, toolsCost, miscCost, notes, period, periodStart, periodEnd } = req.body;

        const breakdown = await SpendBreakdown.findOne({ _id: req.params.id, userId });
        if (!breakdown) {
            return res.status(404).json({ error: 'Spend breakdown not found.' });
        }

        if (adSpend !== undefined) breakdown.adSpend = Math.abs(adSpend);
        if (agencyFees !== undefined) breakdown.agencyFees = Math.abs(agencyFees);
        if (toolsCost !== undefined) breakdown.toolsCost = Math.abs(toolsCost);
        if (miscCost !== undefined) breakdown.miscCost = Math.abs(miscCost);
        if (notes !== undefined) breakdown.notes = notes;
        if (period) breakdown.period = period;
        if (periodStart) breakdown.periodStart = new Date(periodStart);
        if (periodEnd) breakdown.periodEnd = new Date(periodEnd);

        await breakdown.save();
        res.json(breakdown);
    } catch (err) {
        console.error('Spend breakdown update error:', err);
        res.status(500).json({ error: 'Failed to update spend breakdown.' });
    }
});

/**
 * DELETE /api/spend-breakdown/:id
 * Delete a spend breakdown.
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await SpendBreakdown.findOneAndDelete({ _id: req.params.id, userId });

        if (!result) {
            return res.status(404).json({ error: 'Spend breakdown not found.' });
        }

        res.json({ success: true, message: 'Spend breakdown deleted.' });
    } catch (err) {
        console.error('Spend breakdown delete error:', err);
        res.status(500).json({ error: 'Failed to delete spend breakdown.' });
    }
});

export default router;
