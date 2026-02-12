import express from 'express';
import ClientNote from '../models/ClientNote.js';

const router = express.Router();

/**
 * GET /api/client-notes
 * List all notes for the authenticated user.
 * Supports ?type=preference|constraint|decision|pattern
 * Supports ?importance=low|medium|high|critical
 * Supports ?pinned=true
 * Results: pinned first, then by updatedAt descending.
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const filter = { userId };

        if (req.query.type) filter.type = req.query.type;
        if (req.query.importance) filter.importance = req.query.importance;
        if (req.query.pinned === 'true') filter.pinned = true;
        if (req.query.tag) filter.tags = req.query.tag;

        const notes = await ClientNote.find(filter)
            .sort({ pinned: -1, updatedAt: -1 })
            .limit(200)
            .lean();

        // Aggregate counts by type
        const counts = await ClientNote.aggregate([
            { $match: { userId } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const typeCounts = {
            preference: 0,
            constraint: 0,
            decision: 0,
            pattern: 0,
            total: 0
        };
        counts.forEach(c => {
            typeCounts[c._id] = c.count;
            typeCounts.total += c.count;
        });

        res.json({ success: true, notes, counts: typeCounts });
    } catch (error) {
        console.error('Client notes fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
    }
});

/**
 * POST /api/client-notes
 * Create a new note.
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { type, title, content, importance, tags, outcome, frequency, aiVisible, pinned } = req.body;

        if (!type || !title || !content) {
            return res.status(400).json({ error: 'type, title, and content are required' });
        }

        const note = await ClientNote.create({
            userId,
            type,
            title: title.trim(),
            content: content.trim(),
            importance: importance || 'medium',
            tags: tags || [],
            outcome: outcome?.trim(),
            frequency: frequency || null,
            aiVisible: aiVisible !== false,
            pinned: pinned || false,
            source: 'manual'
        });

        res.status(201).json({ success: true, note });
    } catch (error) {
        console.error('Client note create error:', error);
        res.status(500).json({ error: 'Failed to create note', message: error.message });
    }
});

/**
 * PUT /api/client-notes/:id
 * Update an existing note.
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const note = await ClientNote.findOne({ _id: req.params.id, userId });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        const allowedFields = ['type', 'title', 'content', 'importance', 'tags', 'outcome', 'frequency', 'aiVisible', 'pinned'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                note[field] = req.body[field];
            }
        });

        await note.save();
        res.json({ success: true, note });
    } catch (error) {
        console.error('Client note update error:', error);
        res.status(500).json({ error: 'Failed to update note', message: error.message });
    }
});

/**
 * DELETE /api/client-notes/:id
 * Delete a note.
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const result = await ClientNote.findOneAndDelete({ _id: req.params.id, userId });
        if (!result) return res.status(404).json({ error: 'Note not found' });

        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        console.error('Client note delete error:', error);
        res.status(500).json({ error: 'Failed to delete note', message: error.message });
    }
});

/**
 * PATCH /api/client-notes/:id/pin
 * Toggle pin status of a note.
 */
router.patch('/:id/pin', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const note = await ClientNote.findOne({ _id: req.params.id, userId });
        if (!note) return res.status(404).json({ error: 'Note not found' });

        note.pinned = !note.pinned;
        await note.save();

        res.json({ success: true, note });
    } catch (error) {
        console.error('Client note pin error:', error);
        res.status(500).json({ error: 'Failed to toggle pin', message: error.message });
    }
});

export default router;
