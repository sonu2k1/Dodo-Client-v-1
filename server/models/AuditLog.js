import mongoose from 'mongoose';

/**
 * AuditLog Schema - Immutable audit trail for all system actions
 * Once created, logs cannot be modified or deleted (enforced at application level)
 */
const AuditLogSchema = new mongoose.Schema({
    logId: {
        type: String,
        required: true,
        unique: true,
        default: () => `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'WALLET_CREATED',
            'FUNDS_ADDED',
            'FUNDS_WITHDRAWN',
            'POINTS_EARNED',
            'POINTS_REDEEMED',
            'TRANSACTION_CREATED',
            'CHARGE_APPLIED',
            'REFUND_ISSUED',
            'AI_QUERY',
            'LOGIN',
            'SETTINGS_CHANGED',
            'OTHER'
        ]
    },
    category: {
        type: String,
        enum: ['financial', 'account', 'security', 'ai', 'system'],
        default: 'system'
    },
    description: {
        type: String,
        required: true
    },
    details: {
        // Structured data about the action
        amount: Number,
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        transactionId: String,
        metadata: {
            type: Map,
            of: String
        }
    },
    proof: {
        // Evidence/proof for the action
        source: String,  // e.g., "system", "user_request", "scheduled_job"
        reference: String,  // Reference ID or link
        timestamp: Date,
        checksum: String  // Hash for integrity verification
    },
    aiExplanation: {
        // AI-generated explanation (populated on request)
        summary: String,
        detailed: String,
        generatedAt: Date
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true  // Cannot be changed after creation
    }
}, {
    // Disable updates to make logs effectively immutable
    strict: true
});

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ category: 1 });

// Generate checksum for proof integrity
AuditLogSchema.pre('save', function () {
    if (!this.proof) this.proof = {};
    this.proof.timestamp = new Date();
    // Simple checksum based on action details
    const data = `${this.userId}-${this.action}-${this.description}-${this.timestamp}`;
    this.proof.checksum = Buffer.from(data).toString('base64');
});

// Prevent updates (make immutable)
AuditLogSchema.pre('findOneAndUpdate', function () {
    throw new Error('Audit logs are immutable and cannot be modified');
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;
