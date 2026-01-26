import express from 'express';
import AuditLog from '../models/AuditLog.js';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import { generateResponse } from '../services/gemini.js';

const router = express.Router();

const getUserId = (req) => req.headers['x-user-id'] || 'demo-user-001';

// Helper to create audit log
export async function createAuditLog(data) {
    try {
        return await AuditLog.create(data);
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}

// GET /api/audit - Get all audit logs for user
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 50, offset = 0, category, action } = req.query;

        const query = { userId };
        if (category) query.category = category;
        if (action) query.action = action;

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(query);

        res.json({ logs, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// GET /api/audit/:logId - Get single audit log with details
router.get('/:logId', async (req, res) => {
    try {
        const userId = getUserId(req);
        const log = await AuditLog.findOne({ logId: req.params.logId, userId });

        if (!log) {
            return res.status(404).json({ error: 'Audit log not found' });
        }

        res.json(log);
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

// POST /api/audit/explain - AI explains a charge or transaction
router.post('/explain', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { transactionId, question } = req.body;

        // Gather context
        const wallet = await Wallet.findOne({ userId });
        const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10);
        const auditLogs = await AuditLog.find({ userId }).sort({ timestamp: -1 }).limit(10);

        // Find specific transaction if provided
        let targetTransaction = null;
        if (transactionId) {
            targetTransaction = await Transaction.findOne({ transactionId, userId });
        }

        // Build context for AI
        const contextData = {
            currentBalance: wallet?.balance || 0,
            currentPoints: wallet?.dodoPoints || 0,
            recentTransactions: transactions.map(t => ({
                id: t.transactionId,
                type: t.type,
                amount: t.amount,
                reason: t.reason,
                date: t.createdAt
            })),
            recentAuditLogs: auditLogs.map(l => ({
                action: l.action,
                description: l.description,
                proof: l.proof?.source,
                date: l.timestamp
            }))
        };

        if (targetTransaction) {
            contextData.targetTransaction = {
                id: targetTransaction.transactionId,
                type: targetTransaction.type,
                amount: targetTransaction.amount,
                reason: targetTransaction.reason,
                category: targetTransaction.category,
                date: targetTransaction.createdAt
            };
        }

        // Create AI prompt for explanation
        const prompt = `You are a trust-focused financial concierge. A user is asking about their charges.

User Question: "${question || 'Why was I charged?'}"

Context Data:
${JSON.stringify(contextData, null, 2)}

${targetTransaction ? `The user is specifically asking about transaction: ${targetTransaction.transactionId} for $${targetTransaction.amount} (${targetTransaction.reason})` : ''}

Provide a clear, trust-building explanation that:
1. Directly answers why the charge occurred
2. References specific transaction details as proof
3. Shows the audit trail that led to this charge
4. Reassures the user with transparency

Keep your response concise but thorough. Format as readable text, not JSON.`;

        const explanation = await generateResponse(prompt);

        // Log this query as an audit event
        await createAuditLog({
            userId,
            action: 'AI_QUERY',
            category: 'ai',
            description: `User asked: "${question || 'Why was I charged?'}"`,
            details: {
                transactionId: transactionId || null,
                metadata: new Map([['question', question || 'Why was I charged?']])
            },
            proof: {
                source: 'user_request',
                reference: targetTransaction?.transactionId || 'general_inquiry'
            },
            aiExplanation: {
                summary: explanation.substring(0, 200),
                detailed: explanation,
                generatedAt: new Date()
            }
        });

        res.json({
            explanation,
            context: {
                transactionId: targetTransaction?.transactionId,
                amount: targetTransaction?.amount,
                proofAvailable: auditLogs.length > 0
            }
        });

    } catch (error) {
        console.error('Error explaining charge:', error);
        res.status(500).json({ error: 'Failed to generate explanation' });
    }
});

// GET /api/audit/summary/stats - Get audit statistics
router.get('/summary/stats', async (req, res) => {
    try {
        const userId = getUserId(req);

        const stats = await AuditLog.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalLogs = await AuditLog.countDocuments({ userId });
        const recentActivity = await AuditLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(5)
            .select('action description timestamp');

        res.json({
            totalLogs,
            byCategory: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: 'Failed to fetch audit stats' });
    }
});

export default router;
