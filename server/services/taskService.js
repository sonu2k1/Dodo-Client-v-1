import Task from '../models/Task.js';

/**
 * Intelligent Kanban Task Service
 *
 * Converts AI-detected task messages into structured Kanban cards with:
 *  - Priority scoring (0-100) and label inference
 *  - Owner auto-assignment based on task history
 *  - Due date estimation based on urgency cues
 */

// ─── Priority Scoring ────────────────────────────────────────────────

const PRIORITY_SIGNALS = {
    // Each signal: [keywords[], scoreBoost]
    critical: [['urgent', 'asap', 'immediately', 'critical', 'emergency', 'right now', 'right away', 'blocker'], 40],
    high: [['important', 'high priority', 'priority', 'soon', 'quickly', 'deadline', 'overdue', 'escalate'], 25],
    moderate: [['need to', 'should', 'follow up', 'review', 'check', 'update', 'prepare'], 10],
    low: [['when you can', 'when you get a chance', 'low priority', 'eventually', 'no rush', 'sometime', 'nice to have', 'optional'], -15],
};

// Domain signals that boost priority (real-estate / finance context)
const DOMAIN_BOOSTERS = [
    { keywords: ['contract', 'legal', 'compliance', 'closing'], boost: 15 },
    { keywords: ['payment', 'invoice', 'billing', 'refund'], boost: 12 },
    { keywords: ['client', 'customer', 'buyer', 'seller'], boost: 8 },
    { keywords: ['meeting', 'call', 'appointment'], boost: 5 },
];

/**
 * Compute a numeric priority score (0–100) from free-text.
 * Higher = more urgent.
 */
function computePriorityScore(text) {
    const lower = text.toLowerCase();
    let score = 50; // baseline

    // Apply keyword signals
    for (const [, [keywords, boost]] of Object.entries(PRIORITY_SIGNALS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            score += boost;
        }
    }

    // Apply domain boosters
    for (const { keywords, boost } of DOMAIN_BOOSTERS) {
        if (keywords.some(kw => lower.includes(kw))) {
            score += boost;
        }
    }

    // Exclamation marks add urgency
    const exclamationCount = (text.match(/!/g) || []).length;
    score += Math.min(exclamationCount * 3, 9);

    // ALL CAPS words add urgency (ignore single-letter words)
    const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
    score += Math.min(capsWords * 4, 12);

    return Math.max(0, Math.min(100, score));
}

/**
 * Map a numeric score to a priority label
 */
function scoreToPriority(score) {
    if (score >= 80) return 'URGENT';
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
}

// ─── Due Date Inference ──────────────────────────────────────────────

const DUE_DATE_PATTERNS = [
    { keywords: ['immediately', 'right now', 'right away', 'asap'], days: 0 },
    { keywords: ['today', 'eod', 'end of day'], days: 0 },
    { keywords: ['tomorrow', 'by tomorrow'], days: 1 },
    { keywords: ['this week', 'end of week', 'eow'], days: 5 },
    { keywords: ['next week'], days: 7 },
    { keywords: ['this month', 'end of month', 'eom'], days: 14 },
    { keywords: ['next month'], days: 30 },
];

/**
 * Infer a due date from message text.
 * Falls back to priority-based defaults if no explicit cue is found.
 */
function inferDueDate(text, priorityScore) {
    const lower = text.toLowerCase();

    // Check for explicit time patterns
    for (const { keywords, days } of DUE_DATE_PATTERNS) {
        if (keywords.some(kw => lower.includes(kw))) {
            const due = new Date();
            due.setDate(due.getDate() + days);
            due.setHours(23, 59, 59, 0);
            return due;
        }
    }

    // Fallback: set due date based on priority score
    const due = new Date();
    if (priorityScore >= 80) due.setDate(due.getDate() + 1);       // URGENT → tomorrow
    else if (priorityScore >= 60) due.setDate(due.getDate() + 3);  // HIGH → 3 days
    else if (priorityScore >= 35) due.setDate(due.getDate() + 7);  // MEDIUM → 1 week
    else due.setDate(due.getDate() + 14);                          // LOW → 2 weeks
    due.setHours(23, 59, 59, 0);
    return due;
}

// ─── Owner Inference ─────────────────────────────────────────────────

/**
 * Auto-assign an owner based on the user's task history.
 * Looks at the most commonly assigned owner for similar tasks.
 * Falls back to the current user's name.
 *
 * @param {string} userId
 * @param {string} title
 * @param {string} userName – fallback owner name
 */
async function inferOwner(userId, title, userName = '') {
    try {
        // Find the most recent tasks by this user that have an owner set
        const recentTasks = await Task.find({
            userId,
            owner: { $ne: '' },
        }).sort({ createdAt: -1 }).limit(20).lean();

        if (recentTasks.length === 0) return userName || 'Me';

        // Count owner frequency
        const ownerCounts = {};
        for (const t of recentTasks) {
            ownerCounts[t.owner] = (ownerCounts[t.owner] || 0) + 1;
        }

        // Find the most frequent owner
        const topOwner = Object.entries(ownerCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        return topOwner;
    } catch {
        return userName || 'Me';
    }
}

// ─── Status Inference ────────────────────────────────────────────────

const STATUS_KEYWORDS = {
    IN_PROGRESS: ['start', 'working on', 'in progress', 'began', 'currently', 'continue', 'resume'],
    DONE: ['done', 'completed', 'finished', 'mark as done', 'close'],
};

function inferStatus(text) {
    const lower = text.toLowerCase();
    for (const [status, keywords] of Object.entries(STATUS_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) return status;
    }
    return 'TODO';
}

// ─── Tag Inference ──────────────────────────────────────────────────

const TAG_SIGNALS = {
    urgent: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocker'],
    finance: ['payment', 'invoice', 'billing', 'refund', 'money', 'cost', 'budget', 'tax'],
    client_risk: ['complaint', 'escalate', 'angry', 'upset', 'dissatisfied', 'risk'],
    legal: ['contract', 'legal', 'compliance', 'agreement', 'terms'],
    bug: ['bug', 'error', 'clean up', 'fix', 'broken', 'crash', 'issue'],
};

function inferTags(text) {
    const lower = text.toLowerCase();
    const tags = new Set();

    for (const [tag, keywords] of Object.entries(TAG_SIGNALS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            tags.add(tag.replace('_', '-')); // client_risk -> client-risk
        }
    }
    return Array.from(tags);
}

// ─── Main Conversion ─────────────────────────────────────────────────

/**
 * Convert AI intent parameters into an intelligent Kanban task.
 *
 * @param {string} userId
 * @param {object} params  – AI-extracted (title, description, status, priority, owner, dueDate, tags)
 * @param {string} originalMessage – raw user message for inference
 * @param {string} userName – authenticated user display name (fallback owner)
 * @returns {object} saved task with all enriched fields
 */
export async function convertToKanbanTask(userId, params = {}, originalMessage = '', userName = '') {
    const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
    const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    // 1. Priority scoring
    const priorityScore = computePriorityScore(originalMessage);
    const inferredPriority = scoreToPriority(priorityScore);
    const priority = VALID_PRIORITIES.includes(params.priority) ? params.priority : inferredPriority;

    // 2. Status / kanban column
    const status = VALID_STATUSES.includes(params.status)
        ? params.status
        : inferStatus(originalMessage);

    // 3. Due date
    const dueDate = params.dueDate
        ? new Date(params.dueDate)
        : inferDueDate(originalMessage, priorityScore);

    // 4. Owner
    const owner = params.owner || await inferOwner(userId, params.title || '', userName);

    // 5. Tags
    const aiTags = params.tags || [];
    const inferredTags = inferTags(originalMessage);
    const combinedTags = Array.from(new Set([...aiTags, ...inferredTags]));

    const task = await Task.create({
        userId,
        title: params.title || 'Untitled Task',
        description: params.description || '',
        status,
        priority,
        priorityScore,
        owner,
        dueDate,
        tags: combinedTags,
        createdVia: 'ai_chat',
    });

    return {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        priorityScore: task.priorityScore,
        owner: task.owner,
        dueDate: task.dueDate,
        tags: task.tags,
        createdAt: task.createdAt,
        column: formatColumnLabel(task.status),
    };
}

/**
 * Move an existing task to a different Kanban column
 */
export async function moveTaskColumn(userId, taskId, newStatus) {
    const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!VALID_STATUSES.includes(newStatus)) return null;

    const task = await Task.findOneAndUpdate(
        { _id: taskId, userId },
        { status: newStatus },
        { new: true, runValidators: true },
    );

    if (!task) return null;

    return {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        priorityScore: task.priorityScore,
        owner: task.owner,
        dueDate: task.dueDate,
        column: formatColumnLabel(task.status),
    };
}

/**
 * Get all tasks for a user grouped by Kanban column
 */
export async function getKanbanBoard(userId) {
    const tasks = await Task.find({ userId }).sort({ priorityScore: -1, createdAt: -1 }).lean();

    return {
        todo: tasks.filter(t => t.status === 'TODO'),
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
        done: tasks.filter(t => t.status === 'DONE'),
    };
}

/**
 * Human-readable column label
 */
function formatColumnLabel(status) {
    const labels = {
        TODO: 'To-Do',
        IN_PROGRESS: 'In Progress',
        DONE: 'Done',
    };
    return labels[status] || 'To-Do';
}
