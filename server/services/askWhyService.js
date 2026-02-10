import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Wallet from '../models/Wallet.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Ask-Why Service
 * Gathers contextual evidence from multiple data sources
 * so Gemini can build a reasoning chain for "why" questions.
 */

/**
 * Collect evidence relevant to a "why" question.
 * Pulls recent data from transactions, audit logs, wallet, invoices,
 * and payments to provide Gemini with a factual evidence base.
 *
 * @param {string} userId
 * @param {object} params - optional filters from the intent
 * @param {string} params.subject - what the user is asking about (e.g. "charge", "delay", "deduction")
 * @param {string} params.transactionId - specific transaction to focus on
 * @param {string} params.invoiceId - specific invoice to focus on
 * @returns {Promise<object>} evidence bundle
 */
export async function gatherEvidence(userId, params = {}) {
    const evidence = {
        askWhy: true,
        subject: params.subject || 'general',
        timeline: []
    };

    // 1. If a specific transaction is referenced, fetch it
    if (params.transactionId) {
        const tx = await Transaction.findOne({
            transactionId: params.transactionId,
            userId
        }).lean();
        if (tx) {
            evidence.focusedTransaction = {
                id: tx.transactionId,
                amount: tx.amount,
                type: tx.type,
                reason: tx.reason,
                category: tx.category,
                status: tx.status,
                date: tx.createdAt
            };
        }
    }

    // 2. If a specific invoice is referenced, fetch it
    if (params.invoiceId) {
        const inv = await Invoice.findOne({
            invoiceId: params.invoiceId,
            userId
        }).lean();
        if (inv) {
            evidence.focusedInvoice = {
                id: inv.invoiceId,
                title: inv.title,
                grandTotal: inv.grandTotal,
                status: inv.status,
                taxes: inv.taxes?.map(t => ({ name: t.name, rate: t.rate, amount: t.amount })),
                discounts: inv.discounts?.map(d => ({ name: d.name, amount: d.amount })),
                date: inv.invoiceDate || inv.createdAt
            };
        }
    }

    // 3. Recent transactions (last 15) for timeline context
    const recentTx = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(15)
        .lean();

    evidence.recentTransactions = recentTx.map(tx => ({
        id: tx.transactionId,
        amount: tx.amount,
        type: tx.type,
        reason: tx.reason,
        category: tx.category,
        status: tx.status,
        date: tx.createdAt
    }));

    // 4. Recent audit log entries (last 15) for action history
    try {
        const logs = await AuditLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(15)
            .lean();

        evidence.auditTrail = logs.map(log => ({
            action: log.action,
            category: log.category,
            description: log.description,
            amount: log.details?.amount,
            date: log.timestamp
        }));
    } catch {
        // AuditLog may be admin-only; gracefully skip
        evidence.auditTrail = [];
    }

    // 5. Wallet state + recent history
    const wallet = await Wallet.findOne({ userId }).lean();
    if (wallet) {
        evidence.wallet = {
            balance: wallet.balance,
            dodoPoints: wallet.dodoPoints,
            recentHistory: wallet.history.slice(-10).reverse().map(h => ({
                type: h.type,
                amount: h.amount,
                description: h.description,
                date: h.date
            }))
        };
    }

    // 6. Recent payments (last 10)
    const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    evidence.recentPayments = payments.map(p => ({
        id: p.paymentId,
        amount: p.amount,
        status: p.status,
        gateway: p.gateway,
        date: p.completedAt || p.createdAt,
        error: p.status === 'failed' ? p.errorMessage : undefined
    }));

    return evidence;
}
