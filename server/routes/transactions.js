import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Get user ID from header
const getUserId = (req) => {
    return req.headers['x-user-id'] || 'demo-user-001';
};

// GET /api/transactions - Get all transactions for user
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 50, offset = 0, type, category } = req.query;

        const query = { userId };
        if (type) query.type = type;
        if (category) query.category = category;

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req, res) => {
    try {
        const userId = getUserId(req);
        const transaction = await Transaction.findOne({
            transactionId: req.params.id,
            userId
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { amount, type, reason, category } = req.body;

        if (!amount || !type || !reason) {
            return res.status(400).json({ error: 'Amount, type, and reason are required' });
        }

        if (!['credit', 'debit'].includes(type)) {
            return res.status(400).json({ error: 'Type must be credit or debit' });
        }

        const transaction = await Transaction.create({
            userId,
            amount: Math.abs(amount),
            type,
            reason,
            category: category || 'other'
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// GET /api/transactions/stats/summary - Get transaction summary
router.get('/stats/summary', async (req, res) => {
    try {
        const userId = getUserId(req);

        const stats = await Transaction.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            totalCredits: 0,
            totalDebits: 0,
            creditCount: 0,
            debitCount: 0
        };

        stats.forEach(s => {
            if (s._id === 'credit') {
                summary.totalCredits = s.total;
                summary.creditCount = s.count;
            } else {
                summary.totalDebits = s.total;
                summary.debitCount = s.count;
            }
        });

        summary.netBalance = summary.totalCredits - summary.totalDebits;

        res.json(summary);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
