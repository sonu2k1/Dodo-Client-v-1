import mongoose from 'mongoose';

const SpendBreakdownSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    period: {
        type: String,
        required: true
        // e.g. '2026-02', '2026-Q1', 'custom'
    },
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    },
    adSpend: {
        type: Number,
        default: 0,
        min: 0
    },
    agencyFees: {
        type: Number,
        default: 0,
        min: 0
    },
    toolsCost: {
        type: Number,
        default: 0,
        min: 0
    },
    miscCost: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpend: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
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

// Auto-calculate totalSpend before saving
SpendBreakdownSchema.pre('save', function (next) {
    this.totalSpend = (this.adSpend || 0) + (this.agencyFees || 0) + (this.toolsCost || 0) + (this.miscCost || 0);
    this.updatedAt = new Date();
    next();
});

// Also handle findOneAndUpdate
SpendBreakdownSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.$set) {
        const ad = update.$set.adSpend ?? 0;
        const agency = update.$set.agencyFees ?? 0;
        const tools = update.$set.toolsCost ?? 0;
        const misc = update.$set.miscCost ?? 0;
        update.$set.totalSpend = ad + agency + tools + misc;
        update.$set.updatedAt = new Date();
    }
    next();
});

SpendBreakdownSchema.index({ userId: 1, periodStart: -1 });

const SpendBreakdown = mongoose.model('SpendBreakdown', SpendBreakdownSchema);

export default SpendBreakdown;
