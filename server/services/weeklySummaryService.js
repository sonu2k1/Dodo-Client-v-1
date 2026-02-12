import Task from '../models/Task.js';
import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import ClientContext from '../models/ClientContext.js';

/**
 * Weekly Summary Data Aggregation Service
 * Queries MongoDB for the last 7 days of user activity across
 * Tasks, Transactions, Payments, Invoices, and Client Context.
 */

/**
 * Get the date 7 days ago from now
 */
function getWeekAgo() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
}

/**
 * Aggregate task data for the past week
 */
async function aggregateTasks(userId) {
    const weekAgo = getWeekAgo();

    // All tasks for this user
    const allTasks = await Task.find({ userId });

    // Tasks created this week
    const newTasks = await Task.find({
        userId,
        createdAt: { $gte: weekAgo }
    });

    // Tasks completed this week
    const completedThisWeek = await Task.find({
        userId,
        status: 'DONE',
        updatedAt: { $gte: weekAgo }
    });

    // Count by status
    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    allTasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

    // Count by priority
    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    allTasks.filter(t => t.status !== 'DONE').forEach(t => {
        priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });

    // Overdue tasks (due date in the past, not DONE)
    const now = new Date();
    const overdueTasks = allTasks.filter(t =>
        t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now
    );

    // High-priority open items
    const urgentOpen = allTasks.filter(t =>
        t.status !== 'DONE' && (t.priority === 'URGENT' || t.priority === 'HIGH')
    );

    return {
        total: allTasks.length,
        newThisWeek: newTasks.length,
        completedThisWeek: completedThisWeek.length,
        statusCounts,
        priorityCounts,
        overdueCount: overdueTasks.length,
        overdueTasks: overdueTasks.slice(0, 5).map(t => ({
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate
        })),
        urgentOpen: urgentOpen.slice(0, 5).map(t => ({
            title: t.title,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate
        }))
    };
}

/**
 * Aggregate transaction data for the past week
 */
async function aggregateTransactions(userId) {
    const weekAgo = getWeekAgo();

    const transactions = await Transaction.find({
        userId,
        createdAt: { $gte: weekAgo }
    }).sort({ createdAt: -1 });

    let totalCredits = 0;
    let totalDebits = 0;
    const categoryCounts = {};

    transactions.forEach(tx => {
        if (tx.type === 'credit') {
            totalCredits += tx.amount;
        } else {
            totalDebits += tx.amount;
        }
        categoryCounts[tx.category] = (categoryCounts[tx.category] || 0) + 1;
    });

    // Top categories sorted by count
    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

    return {
        count: transactions.length,
        totalCredits,
        totalDebits,
        netFlow: totalCredits - totalDebits,
        averageAmount: transactions.length > 0
            ? (transactions.reduce((s, t) => s + t.amount, 0) / transactions.length)
            : 0,
        topCategories,
        recentTransactions: transactions.slice(0, 5).map(tx => ({
            transactionId: tx.transactionId,
            amount: tx.amount,
            type: tx.type,
            reason: tx.reason,
            category: tx.category,
            date: tx.createdAt
        }))
    };
}

/**
 * Aggregate payment data for the past week
 */
async function aggregatePayments(userId) {
    const weekAgo = getWeekAgo();

    const payments = await Payment.find({
        userId,
        createdAt: { $gte: weekAgo }
    });

    const statusCounts = { pending: 0, processing: 0, completed: 0, failed: 0, refunded: 0 };
    let totalVolume = 0;

    payments.forEach(p => {
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        if (p.status === 'completed') {
            totalVolume += p.amount;
        }
    });

    return {
        count: payments.length,
        statusCounts,
        totalVolume,
        failedCount: statusCounts.failed,
        refundedCount: statusCounts.refunded
    };
}

/**
 * Aggregate invoice data for the past week
 */
async function aggregateInvoices(userId) {
    const weekAgo = getWeekAgo();

    const invoices = await Invoice.find({
        userId,
        createdAt: { $gte: weekAgo }
    });

    const statusCounts = { draft: 0, pending: 0, paid: 0, cancelled: 0, refunded: 0 };
    let totalRevenue = 0;

    invoices.forEach(inv => {
        statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
        if (inv.status === 'paid') {
            totalRevenue += inv.grandTotal || 0;
        }
    });

    // Open invoices (pending + draft)
    const openCount = statusCounts.pending + statusCounts.draft;

    return {
        count: invoices.length,
        statusCounts,
        totalRevenue,
        openCount,
        paidCount: statusCounts.paid
    };
}

/**
 * Load client context insights
 */
async function aggregateClientContext(userId) {
    const ctx = await ClientContext.findOne({ userId });
    if (!ctx) {
        return {
            preferences: {},
            budgetSensitivity: 'medium',
            riskAppetite: 'moderate',
            inferredTraits: {},
            recentDecisions: [],
            recentTasks: []
        };
    }

    return {
        preferences: ctx.preferences || {},
        budgetSensitivity: ctx.budgetSensitivity || 'medium',
        riskAppetite: ctx.riskAppetite || 'moderate',
        inferredTraits: {
            spendingPattern: ctx.inferredTraits?.spendingPattern || 'moderate',
            engagementLevel: ctx.inferredTraits?.engagementLevel || 'medium',
            primaryConcerns: ctx.inferredTraits?.primaryConcerns || []
        },
        recentDecisions: (ctx.pastDecisions || []).slice(-5).map(d => ({
            decision: d.decision,
            category: d.category,
            outcome: d.outcome,
            date: d.date
        })),
        recentTasks: (ctx.taskHistory || []).slice(-5).map(t => ({
            task: t.task,
            status: t.status,
            notes: t.notes,
            date: t.date
        }))
    };
}

/**
 * Main aggregation function — collects all weekly data
 * @param {string} userId
 * @returns {Promise<object>} aggregated weekly data
 */
export async function aggregateWeeklyData(userId) {
    const [tasks, transactions, payments, invoices, clientContext] = await Promise.all([
        aggregateTasks(userId),
        aggregateTransactions(userId),
        aggregatePayments(userId),
        aggregateInvoices(userId),
        aggregateClientContext(userId)
    ]);

    return {
        periodStart: getWeekAgo().toISOString(),
        periodEnd: new Date().toISOString(),
        tasks,
        transactions,
        payments,
        invoices,
        clientContext
    };
}
