import mongoose from 'mongoose';

const RecurringCostSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['agency_fee', 'tool_subscription', 'other'],
        required: true
    },
    // For agency fees: fixed flat rate or percentage of ad spend
    feeType: {
        type: String,
        enum: ['fixed', 'percentage'],
        default: 'fixed'
    },
    // Dollar amount (if fixed) or percentage value (if percentage)
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // What the percentage is applied to (only relevant when feeType = 'percentage')
    percentageBase: {
        type: String,
        enum: ['ad_spend', 'total_spend', 'custom'],
        default: 'ad_spend'
    },
    frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'annual', 'one_time'],
        default: 'monthly'
    },
    // Normalised monthly cost — auto-calculated
    monthlyEquivalent: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null
    },
    vendor: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate monthlyEquivalent before saving
RecurringCostSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    // Only calculate monthly equivalent for fixed fees
    if (this.feeType === 'fixed') {
        switch (this.frequency) {
            case 'monthly':
                this.monthlyEquivalent = this.amount;
                break;
            case 'quarterly':
                this.monthlyEquivalent = parseFloat((this.amount / 3).toFixed(2));
                break;
            case 'annual':
                this.monthlyEquivalent = parseFloat((this.amount / 12).toFixed(2));
                break;
            case 'one_time':
                this.monthlyEquivalent = 0; // One-time costs are not recurring
                break;
            default:
                this.monthlyEquivalent = this.amount;
        }
    } else {
        // For percentage-based, store amount as-is (actual $ calculated at query time)
        this.monthlyEquivalent = 0;
    }

    next();
});

RecurringCostSchema.index({ userId: 1, category: 1 });
RecurringCostSchema.index({ userId: 1, isActive: 1 });

const RecurringCost = mongoose.model('RecurringCost', RecurringCostSchema);

export default RecurringCost;
