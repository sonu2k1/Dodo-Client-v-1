import mongoose from 'mongoose';

const MetricsSchema = new mongoose.Schema({
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    ctr: { type: Number, default: 0 },  // click-through rate %
    cpc: { type: Number, default: 0 },  // cost per click
    roas: { type: Number, default: 0 },  // return on ad spend
}, { _id: false });

const AdCampaignSpendSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    campaignName: {
        type: String,
        required: true,
        trim: true
    },
    platform: {
        type: String,
        enum: ['google_ads', 'meta', 'tiktok', 'linkedin', 'twitter', 'other'],
        default: 'other'
    },
    spend: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    metrics: {
        type: MetricsSchema,
        default: () => ({})
    },
    // Entry source — manual by default, placeholder for future API sync
    source: {
        type: String,
        enum: ['manual', 'api_sync', 'csv_import'],
        default: 'manual'
    },
    // External campaign ID for API integration
    externalId: {
        type: String,
        default: null
    },
    tags: {
        type: [String],
        default: []
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate derived metrics before saving
AdCampaignSpendSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    // Auto-calc CTR and CPC if raw data is available
    if (this.metrics) {
        if (this.metrics.impressions > 0 && this.metrics.clicks > 0) {
            this.metrics.ctr = parseFloat(((this.metrics.clicks / this.metrics.impressions) * 100).toFixed(2));
        }
        if (this.metrics.clicks > 0 && this.spend > 0) {
            this.metrics.cpc = parseFloat((this.spend / this.metrics.clicks).toFixed(2));
        }
    }
    next();
});

AdCampaignSpendSchema.index({ userId: 1, platform: 1, startDate: -1 });
AdCampaignSpendSchema.index({ userId: 1, campaignName: 'text' });

const AdCampaignSpend = mongoose.model('AdCampaignSpend', AdCampaignSpendSchema);

export default AdCampaignSpend;
