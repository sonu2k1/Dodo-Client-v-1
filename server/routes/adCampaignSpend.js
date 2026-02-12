import express from 'express';
import AdCampaignSpend from '../models/AdCampaignSpend.js';

const router = express.Router();

/**
 * GET /api/ad-spend
 * List campaigns with filtering by platform, date range, and search.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { platform, startDate, endDate, search, limit = 50, offset = 0 } = req.query;

        const query = { userId };
        if (platform && platform !== 'all') query.platform = platform;

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        if (search) {
            query.campaignName = { $regex: search, $options: 'i' };
        }

        const [campaigns, total] = await Promise.all([
            AdCampaignSpend.find(query)
                .sort({ startDate: -1 })
                .skip(parseInt(offset))
                .limit(parseInt(limit))
                .lean(),
            AdCampaignSpend.countDocuments(query)
        ]);

        res.json({ campaigns, total });
    } catch (err) {
        console.error('Ad spend list error:', err);
        res.status(500).json({ error: 'Failed to fetch ad campaigns.' });
    }
});

/**
 * GET /api/ad-spend/summary
 * Aggregate totals + averages, optionally grouped by platform.
 */
router.get('/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        const match = { userId };
        if (startDate || endDate) {
            match.startDate = {};
            if (startDate) match.startDate.$gte = new Date(startDate);
            if (endDate) match.startDate.$lte = new Date(endDate);
        }

        // Overall totals
        const [overall] = await AdCampaignSpend.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalSpend: { $sum: '$spend' },
                    totalImpressions: { $sum: '$metrics.impressions' },
                    totalClicks: { $sum: '$metrics.clicks' },
                    totalConversions: { $sum: '$metrics.conversions' },
                    avgCpc: { $avg: '$metrics.cpc' },
                    avgCtr: { $avg: '$metrics.ctr' },
                    avgRoas: { $avg: '$metrics.roas' },
                    campaignCount: { $sum: 1 }
                }
            }
        ]);

        // Per-platform breakdown
        const byPlatform = await AdCampaignSpend.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$platform',
                    totalSpend: { $sum: '$spend' },
                    totalClicks: { $sum: '$metrics.clicks' },
                    totalConversions: { $sum: '$metrics.conversions' },
                    avgCpc: { $avg: '$metrics.cpc' },
                    campaignCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpend: -1 } }
        ]);

        res.json({
            overall: overall || {
                totalSpend: 0, totalImpressions: 0, totalClicks: 0,
                totalConversions: 0, avgCpc: 0, avgCtr: 0, avgRoas: 0, campaignCount: 0
            },
            byPlatform
        });
    } catch (err) {
        console.error('Ad spend summary error:', err);
        res.status(500).json({ error: 'Failed to fetch ad spend summary.' });
    }
});

/**
 * POST /api/ad-spend
 * Create a new campaign spend entry.
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            campaignName, platform, spend, currency,
            startDate, endDate, metrics, source,
            externalId, tags, notes
        } = req.body;

        if (!campaignName || !spend || !startDate || !endDate) {
            return res.status(400).json({ error: 'campaignName, spend, startDate, endDate are required.' });
        }

        const campaign = new AdCampaignSpend({
            userId,
            campaignName: campaignName.trim(),
            platform: platform || 'other',
            spend: Math.abs(parseFloat(spend)),
            currency: currency || 'USD',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            metrics: metrics || {},
            source: source || 'manual',
            externalId: externalId || null,
            tags: tags || [],
            notes: notes || ''
        });

        await campaign.save();
        res.status(201).json(campaign);
    } catch (err) {
        console.error('Ad spend create error:', err);
        res.status(500).json({ error: 'Failed to create ad campaign.' });
    }
});

/**
 * PUT /api/ad-spend/:id
 * Update an existing campaign spend entry.
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const campaign = await AdCampaignSpend.findOne({ _id: req.params.id, userId });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found.' });
        }

        const {
            campaignName, platform, spend, currency,
            startDate, endDate, metrics, source,
            externalId, tags, notes
        } = req.body;

        if (campaignName !== undefined) campaign.campaignName = campaignName.trim();
        if (platform !== undefined) campaign.platform = platform;
        if (spend !== undefined) campaign.spend = Math.abs(parseFloat(spend));
        if (currency !== undefined) campaign.currency = currency;
        if (startDate !== undefined) campaign.startDate = new Date(startDate);
        if (endDate !== undefined) campaign.endDate = new Date(endDate);
        if (metrics !== undefined) {
            campaign.metrics = { ...campaign.metrics.toObject?.() || campaign.metrics, ...metrics };
        }
        if (source !== undefined) campaign.source = source;
        if (externalId !== undefined) campaign.externalId = externalId;
        if (tags !== undefined) campaign.tags = tags;
        if (notes !== undefined) campaign.notes = notes;

        await campaign.save();
        res.json(campaign);
    } catch (err) {
        console.error('Ad spend update error:', err);
        res.status(500).json({ error: 'Failed to update ad campaign.' });
    }
});

/**
 * DELETE /api/ad-spend/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await AdCampaignSpend.findOneAndDelete({ _id: req.params.id, userId });
        if (!result) {
            return res.status(404).json({ error: 'Campaign not found.' });
        }
        res.json({ success: true, message: 'Campaign deleted.' });
    } catch (err) {
        console.error('Ad spend delete error:', err);
        res.status(500).json({ error: 'Failed to delete ad campaign.' });
    }
});

export default router;
