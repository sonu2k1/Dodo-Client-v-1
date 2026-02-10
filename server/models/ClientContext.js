import mongoose from 'mongoose';

/**
 * ClientContext Schema
 * Stores long-term AI context awareness data per user.
 * Captures preferences, past decisions, budget sensitivity,
 * risk appetite, and task history so Gemini can adapt its tone and advice.
 */
const ClientContextSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Communication & interaction preferences
    preferences: {
        communicationStyle: {
            type: String,
            enum: ['formal', 'casual', 'concise', 'detailed'],
            default: 'concise'
        },
        currency: {
            type: String,
            default: 'USD'
        },
        language: {
            type: String,
            default: 'en'
        },
        notificationLevel: {
            type: String,
            enum: ['minimal', 'moderate', 'verbose'],
            default: 'moderate'
        }
    },

    // Financial profile
    budgetSensitivity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    riskAppetite: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'moderate'
    },

    // Past decisions log (AI-maintained, rolling window)
    pastDecisions: [{
        decision: {
            type: String,
            required: true
        },
        context: String,
        outcome: String,
        category: {
            type: String,
            enum: ['financial', 'task', 'preference', 'other'],
            default: 'other'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],

    // Task history summaries (AI-maintained)
    taskHistory: [{
        task: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'cancelled', 'delayed'],
            default: 'completed'
        },
        notes: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],

    // AI-inferred traits (updated over time)
    inferredTraits: {
        spendingPattern: {
            type: String,
            enum: ['frugal', 'moderate', 'generous'],
            default: 'moderate'
        },
        engagementLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        primaryConcerns: [{
            type: String
        }]
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Keep pastDecisions and taskHistory capped at 50 entries each
ClientContextSchema.pre('save', function () {
    this.updatedAt = new Date();
    if (this.pastDecisions && this.pastDecisions.length > 50) {
        this.pastDecisions = this.pastDecisions.slice(-50);
    }
    if (this.taskHistory && this.taskHistory.length > 50) {
        this.taskHistory = this.taskHistory.slice(-50);
    }
});

const ClientContext = mongoose.model('ClientContext', ClientContextSchema);

export default ClientContext;
