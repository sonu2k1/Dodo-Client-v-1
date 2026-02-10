import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Wallet from '../models/Wallet.js';

/**
 * Data Query Service
 * Fetches internal app data for the AI QUERY_DATA intent.
 * Each function accepts a userId and returns a plain result object.
 */

/**
 * Get the user's most recent transactions
 */
async function getRecentTransactions(userId, params = {}) {
    const limit = params.limit || 10;
    const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return {
        label: 'Recent Transactions',
        count: transactions.length,
        items: transactions.map(tx => ({
            id: tx.transactionId,
            amount: tx.amount,
            type: tx.type,
            reason: tx.reason,
            category: tx.category,
            status: tx.status,
            date: tx.createdAt
        }))
    };
}

/**
 * Get the single most recent transaction
 */
async function getLastTransaction(userId) {
    const tx = await Transaction.findOne({ userId })
        .sort({ createdAt: -1 })
        .lean();

    if (!tx) {
        return { label: 'Last Transaction', found: false, item: null };
    }

    return {
        label: 'Last Transaction',
        found: true,
        item: {
            id: tx.transactionId,
            amount: tx.amount,
            type: tx.type,
            reason: tx.reason,
            category: tx.category,
            status: tx.status,
            date: tx.createdAt
        }
    };
}

/**
 * Get invoices that are still open (pending or draft)
 */
async function getOpenInvoices(userId) {
    const invoices = await Invoice.find({
        userId,
        status: { $in: ['pending', 'draft'] }
    })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    return {
        label: 'Open Invoices',
        count: invoices.length,
        items: invoices.map(inv => ({
            id: inv.invoiceId,
            title: inv.title,
            grandTotal: inv.grandTotal,
            balanceDue: inv.balanceDue,
            status: inv.status,
            currency: inv.currency,
            date: inv.invoiceDate || inv.createdAt
        }))
    };
}

/**
 * Get completed payment history
 */
async function getPaymentHistory(userId, params = {}) {
    const limit = params.limit || 10;
    const payments = await Payment.find({
        userId,
        status: 'completed'
    })
        .sort({ completedAt: -1 })
        .limit(limit)
        .lean();

    return {
        label: 'Payment History',
        count: payments.length,
        items: payments.map(p => ({
            id: p.paymentId,
            amount: p.amount,
            currency: p.currency,
            gateway: p.gateway,
            completedAt: p.completedAt || p.createdAt
        }))
    };
}

/**
 * Aggregate activity summary for the past 7 days
 */
async function getWeeklySummary(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Transactions this week
    const transactions = await Transaction.find({
        userId,
        createdAt: { $gte: sevenDaysAgo }
    }).lean();

    const totalCredits = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

    // Payments this week
    const payments = await Payment.find({
        userId,
        status: 'completed',
        createdAt: { $gte: sevenDaysAgo }
    }).lean();

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    // Wallet current state
    const wallet = await Wallet.findOne({ userId }).lean();

    return {
        label: 'Weekly Activity Summary',
        period: {
            from: sevenDaysAgo.toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
        },
        transactions: {
            count: transactions.length,
            totalCredits,
            totalDebits,
            net: totalCredits - totalDebits
        },
        payments: {
            count: payments.length,
            totalAmount: totalPayments
        },
        wallet: wallet ? {
            balance: wallet.balance,
            dodoPoints: wallet.dodoPoints
        } : null
    };
}

/**
 * Get recent wallet history entries
 */
async function getWalletActivity(userId, params = {}) {
    const limit = params.limit || 10;
    const wallet = await Wallet.findOne({ userId }).lean();

    if (!wallet) {
        return { label: 'Wallet Activity', found: false, items: [] };
    }

    const recentHistory = wallet.history
        .slice(-limit)
        .reverse()
        .map(entry => ({
            type: entry.type,
            amount: entry.amount,
            description: entry.description,
            date: entry.date
        }));

    return {
        label: 'Wallet Activity',
        found: true,
        count: recentHistory.length,
        currentBalance: wallet.balance,
        currentPoints: wallet.dodoPoints,
        items: recentHistory
    };
}

/**
 * Dispatcher — routes a queryType to the correct handler
 * @param {string} userId
 * @param {string} queryType
 * @param {object} params - optional parameters (e.g. limit)
 * @returns {Promise<object>} query results
 */
export async function executeDataQuery(userId, queryType, params = {}) {
    switch (queryType) {
        case 'RECENT_TRANSACTIONS':
            return getRecentTransactions(userId, params);
        case 'LAST_TRANSACTION':
            return getLastTransaction(userId);
        case 'OPEN_INVOICES':
            return getOpenInvoices(userId);
        case 'PAYMENT_HISTORY':
            return getPaymentHistory(userId, params);
        case 'WEEKLY_SUMMARY':
            return getWeeklySummary(userId);
        case 'WALLET_ACTIVITY':
            return getWalletActivity(userId, params);
        default:
            return {
                label: 'Unknown Query',
                error: `Unsupported queryType: ${queryType}`,
                items: []
            };
    }
}
