import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'points_earned', 'points_redeemed', 'payment', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },

    // ── Enhanced fields ─────────────────────────────────
    eventType: {
        type: String,
        enum: ['payment', 'refund', 'manual_adjustment', 'points_transfer'],
        default: 'payment'
    },
    source: {
        type: String,
        enum: ['stripe', 'razorpay', 'admin', 'system', 'ai_concierge'],
        default: 'system'
    },
    auditRefId: {
        type: String,
        default: null
    },

    // ── Audit trail ─────────────────────────────────────
    auditTrail: [{
        action: {
            type: String,
            enum: ['created', 'processing', 'completed', 'failed', 'reversed', 'flagged', 'note_added'],
            required: true
        },
        status: {
            type: String,
            default: ''
        },
        actor: {
            type: String,
            enum: ['system', 'admin', 'gateway', 'user'],
            default: 'system'
        },
        note: {
            type: String,
            default: ''
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    metadata: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
TransactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
