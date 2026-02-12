import express from 'express';
import RecurringCost from '../models/RecurringCost.js';

const router = express.Router();

/**
 * GET /api/recurring-costs
 * List all recurring costs for the authenticated user.
 * Supports filtering by category and active status.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, active, limit = 100, offset = 0 } = req.query;

        const query = { userId };
        if (category && category !== 'all') query.category = category;
        if (active !== undefined) query.isActive = active === 'true';

        const [costs, total] = await Promise.all([
            RecurringCost.find(query)
                .sort({ category: 1, name: 1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .lean(),
            RecurringCost.countDocuments(query)
        ]);

        res.json({ costs, total });
    } catch (err) {
        console.error('Recurring costs list error:', err);
        res.status(500).json({ error: 'Failed to fetch recurring costs.' });
    }
});

/**
 * GET /api/recurring-costs/monthly-summary
 * Aggregate active recurring costs into monthly totals by category.
 */
router.get('/monthly-summary', async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregate fixed-fee active costs
        const byCategory = await RecurringCost.aggregate([
            { $match: { userId, isActive: true, feeType: 'fixed' } },
            {
                $group: {
                    _id: '$category',
                    totalMonthly: { $sum: '$monthlyEquivalent' },
                    count: { $sum: 1 },
                    items: {
                        $push: {
                            name: '$name',
                            amount: '$amount',
                            frequency: '$frequency',
                            monthlyEquivalent: '$monthlyEquivalent'
                        }
                    }
                }
            },
            { $sort: { totalMonthly: -1 } }
        ]);

        // Also fetch percentage-based costs (returned separately for client-side calculation)
        const percentageCosts = await RecurringCost.find({
            userId,
            isActive: true,
            feeType: 'percentage'
        }).lean();

        // Build summary object
        const summary = {
            agencyFees: { totalMonthly: 0, count: 0, items: [] },
            toolSubscriptions: { totalMonthly: 0, count: 0, items: [] },
            other: { totalMonthly: 0, count: 0, items: [] },
            grandTotalMonthly: 0,
            percentageCosts
        };

        byCategory.forEach(cat => {
            switch (cat._id) {
                case 'agency_fee':
                    summary.agencyFees = { totalMonthly: cat.totalMonthly, count: cat.count, items: cat.items };
                    break;
                case 'tool_subscription':
                    summary.toolSubscriptions = { totalMonthly: cat.totalMonthly, count: cat.count, items: cat.items };
                    break;
                case 'other':
                    summary.other = { totalMonthly: cat.totalMonthly, count: cat.count, items: cat.items };
                    break;
            }
        });

        summary.grandTotalMonthly =
            summary.agencyFees.totalMonthly +
            summary.toolSubscriptions.totalMonthly +
            summary.other.totalMonthly;

        res.json(summary);
    } catch (err) {
        console.error('Recurring costs summary error:', err);
        res.status(500).json({ error: 'Failed to fetch recurring costs summary.' });
    }
});

/**
 * POST /api/recurring-costs
 * Create a new recurring cost entry.
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name, category, feeType, amount,
            percentageBase, frequency, isActive,
            startDate, endDate, vendor, notes, tags
        } = req.body;

        if (!name || !category || amount === undefined) {
            return res.status(400).json({ error: 'name, category, and amount are required.' });
        }

        const cost = new RecurringCost({
            userId,
            name: name.trim(),
            category,
            feeType: feeType || 'fixed',
            amount: Math.abs(parseFloat(amount)),
            percentageBase: percentageBase || 'ad_spend',
            frequency: frequency || 'monthly',
            isActive: isActive !== undefined ? isActive : true,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            vendor: vendor || '',
            notes: notes || '',
            tags: tags || []
        });

        await cost.save();
        res.status(201).json(cost);
    } catch (err) {
        console.error('Recurring cost create error:', err);
        res.status(500).json({ error: 'Failed to create recurring cost.' });
    }
});

/**
 * PUT /api/recurring-costs/:id
 * Update an existing recurring cost.
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const cost = await RecurringCost.findOne({ _id: req.params.id, userId });
        if (!cost) {
            return res.status(404).json({ error: 'Recurring cost not found.' });
        }

        const {
            name, category, feeType, amount,
            percentageBase, frequency, isActive,
            startDate, endDate, vendor, notes, tags
        } = req.body;

        if (name !== undefined) cost.name = name.trim();
        if (category !== undefined) cost.category = category;
        if (feeType !== undefined) cost.feeType = feeType;
        if (amount !== undefined) cost.amount = Math.abs(parseFloat(amount));
        if (percentageBase !== undefined) cost.percentageBase = percentageBase;
        if (frequency !== undefined) cost.frequency = frequency;
        if (isActive !== undefined) cost.isActive = isActive;
        if (startDate !== undefined) cost.startDate = new Date(startDate);
        if (endDate !== undefined) cost.endDate = endDate ? new Date(endDate) : null;
        if (vendor !== undefined) cost.vendor = vendor;
        if (notes !== undefined) cost.notes = notes;
        if (tags !== undefined) cost.tags = tags;

        await cost.save();
        res.json(cost);
    } catch (err) {
        console.error('Recurring cost update error:', err);
        res.status(500).json({ error: 'Failed to update recurring cost.' });
    }
});

/**
 * DELETE /api/recurring-costs/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await RecurringCost.findOneAndDelete({ _id: req.params.id, userId });
        if (!result) {
            return res.status(404).json({ error: 'Recurring cost not found.' });
        }
        res.json({ success: true, message: 'Recurring cost deleted.' });
    } catch (err) {
        console.error('Recurring cost delete error:', err);
        res.status(500).json({ error: 'Failed to delete recurring cost.' });
    }
});

export default router;
