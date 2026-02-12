import ClientContext from '../models/ClientContext.js';
import ClientNote from '../models/ClientNote.js';

/**
 * Context Service
 * Manages loading, updating, and building AI context
 * from both MongoDB (long-term) and session memory (short-term).
 */

/**
 * Load or create the persistent client context from MongoDB.
 * @param {string} userId
 * @returns {Promise<object>} client context document
 */
export async function loadClientContext(userId) {
    let ctx = await ClientContext.findOne({ userId });
    if (!ctx) {
        ctx = await ClientContext.create({ userId });
    }

    // Load user-managed notes that are visible to AI
    const clientNotes = await ClientNote.find({ userId, aiVisible: true })
        .sort({ pinned: -1, updatedAt: -1 })
        .limit(20)
        .lean();

    return { ctx, clientNotes };
}

/**
 * Build a unified context object merging long-term (MongoDB)
 * and short-term (session) data for prompt injection.
 *
 * @param {object} persistentCtx - ClientContext document from MongoDB
 * @param {object} sessionCtx - In-memory session data (conversation hints)
 * @returns {object} merged context for prompt formatting
 */
export function buildUnifiedContext(persistentCtx, sessionCtx = {}, clientNotes = []) {
    // Group client notes by type
    const notesByType = { preference: [], constraint: [], decision: [], pattern: [] };
    clientNotes.forEach(n => {
        if (notesByType[n.type]) notesByType[n.type].push(n);
    });

    return {
        // Client preferences
        preferences: {
            communicationStyle: persistentCtx.preferences?.communicationStyle || 'concise',
            currency: persistentCtx.preferences?.currency || 'USD',
            language: persistentCtx.preferences?.language || 'en',
            notificationLevel: persistentCtx.preferences?.notificationLevel || 'moderate'
        },

        // Financial profile
        budgetSensitivity: persistentCtx.budgetSensitivity || 'medium',
        riskAppetite: persistentCtx.riskAppetite || 'moderate',

        // AI-inferred traits
        inferredTraits: {
            spendingPattern: persistentCtx.inferredTraits?.spendingPattern || 'moderate',
            engagementLevel: persistentCtx.inferredTraits?.engagementLevel || 'medium',
            primaryConcerns: persistentCtx.inferredTraits?.primaryConcerns || []
        },

        // Recent past decisions (last 5 for prompt brevity)
        recentDecisions: (persistentCtx.pastDecisions || [])
            .slice(-5)
            .map(d => ({
                decision: d.decision,
                category: d.category,
                outcome: d.outcome,
                date: d.date
            })),

        // Recent task history (last 5)
        recentTasks: (persistentCtx.taskHistory || [])
            .slice(-5)
            .map(t => ({
                task: t.task,
                status: t.status,
                notes: t.notes,
                date: t.date
            })),

        // Client memory notes (user-managed, grouped)
        clientMemory: notesByType,

        // Short-term session hints (accumulated during conversation)
        sessionHints: sessionCtx.contextHints || []
    };
}

/**
 * Update persistent context with new insights detected during conversation.
 * Called after processing a chat message if the AI identifies context updates.
 *
 * @param {string} userId
 * @param {object} updates - Partial context updates
 * @param {object} updates.decision - New decision to log
 * @param {object} updates.task - New task to log
 * @param {object} updates.preferences - Preference updates
 * @param {object} updates.inferredTraits - Trait updates
 */
export async function updateClientContext(userId, updates = {}) {
    const ctx = await loadClientContext(userId);

    // Log a new decision
    if (updates.decision) {
        ctx.pastDecisions.push({
            decision: updates.decision.decision,
            context: updates.decision.context || '',
            outcome: updates.decision.outcome || '',
            category: updates.decision.category || 'other'
        });
    }

    // Log a new task
    if (updates.task) {
        ctx.taskHistory.push({
            task: updates.task.task,
            status: updates.task.status || 'completed',
            notes: updates.task.notes || ''
        });
    }

    // Update preferences
    if (updates.preferences) {
        if (updates.preferences.communicationStyle) {
            ctx.preferences.communicationStyle = updates.preferences.communicationStyle;
        }
        if (updates.preferences.currency) {
            ctx.preferences.currency = updates.preferences.currency;
        }
        if (updates.preferences.notificationLevel) {
            ctx.preferences.notificationLevel = updates.preferences.notificationLevel;
        }
    }

    // Update financial profile
    if (updates.budgetSensitivity) {
        ctx.budgetSensitivity = updates.budgetSensitivity;
    }
    if (updates.riskAppetite) {
        ctx.riskAppetite = updates.riskAppetite;
    }

    // Update inferred traits
    if (updates.inferredTraits) {
        if (updates.inferredTraits.spendingPattern) {
            ctx.inferredTraits.spendingPattern = updates.inferredTraits.spendingPattern;
        }
        if (updates.inferredTraits.engagementLevel) {
            ctx.inferredTraits.engagementLevel = updates.inferredTraits.engagementLevel;
        }
        if (updates.inferredTraits.primaryConcerns) {
            // Merge unique concerns, keep last 10
            const existing = ctx.inferredTraits.primaryConcerns || [];
            const merged = [...new Set([...existing, ...updates.inferredTraits.primaryConcerns])];
            ctx.inferredTraits.primaryConcerns = merged.slice(-10);
        }
    }

    await ctx.save();
    return ctx;
}
