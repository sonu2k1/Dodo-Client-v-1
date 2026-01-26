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
        enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'points_earned', 'points_redeemed', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    metadata: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
TransactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
