import mongoose from 'mongoose';

const RevenueEntrySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    period: {
        type: String,
        required: true
        // e.g. '2026-02'
    },
    revenue: {
        type: Number,
        required: true,
        min: 0
    },
    conversions: {
        type: Number,
        default: 0,
        min: 0
    },
    source: {
        type: String,
        enum: ['manual', 'crm', 'api_sync'],
        default: 'manual'
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

RevenueEntrySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

RevenueEntrySchema.index({ userId: 1, period: -1 });

const RevenueEntry = mongoose.model('RevenueEntry', RevenueEntrySchema);

export default RevenueEntry;
