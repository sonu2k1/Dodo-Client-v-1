import express from 'express';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Get user ID from authenticated request
const getUserId = (req) => {
    return req.user?.id;
};

// GET /api/transactions - Get all transactions for user
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 50, offset = 0, type, category, eventType, source } = req.query;

        const query = { userId };
        if (type) query.type = type;
        if (category) query.category = category;
        if (eventType) query.eventType = eventType;
        if (source) query.source = source;

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
        const { amount, type, reason, category, eventType, source, auditRefId } = req.body;

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
            category: category || 'other',
            eventType: eventType || 'payment',
            source: source || 'system',
            auditRefId: auditRefId || null,
            auditTrail: [{
                action: 'created',
                status: 'Transaction initiated',
                actor: 'system',
                note: `Created via ${source || 'system'}`,
                timestamp: new Date()
            }]
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

// POST /api/transactions/:id/audit - Append an audit trail entry
router.post('/:id/audit', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { action, status, actor, note } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        const validActions = ['created', 'processing', 'completed', 'failed', 'reversed', 'flagged', 'note_added'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ error: `Action must be one of: ${validActions.join(', ')}` });
        }

        const transaction = await Transaction.findOne({
            transactionId: req.params.id,
            userId
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const entry = {
            action,
            status: status || '',
            actor: actor || 'system',
            note: note || '',
            timestamp: new Date()
        };

        transaction.auditTrail.push(entry);
        transaction.updatedAt = new Date();

        // If the audit action reflects a status change, update top-level status
        if (['completed', 'failed'].includes(action)) {
            transaction.status = action;
        }

        await transaction.save();

        res.json({
            success: true,
            auditTrail: transaction.auditTrail,
            message: 'Audit entry added'
        });
    } catch (error) {
        console.error('Error adding audit entry:', error);
        res.status(500).json({ error: 'Failed to add audit entry' });
    }
});

export default router;
