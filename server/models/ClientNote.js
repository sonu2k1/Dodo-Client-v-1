import mongoose from 'mongoose';

/**
 * ClientNote Schema
 * Stores user-managed client memory entries:
 * preferences, constraints, important decisions, and behavioral patterns.
 * These are explicit, human-written notes — separate from AI-inferred ClientContext.
 */
const ClientNoteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Note type determines the category
    type: {
        type: String,
        enum: ['preference', 'constraint', 'decision', 'pattern'],
        required: true,
        index: true
    },

    // Core content
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },

    // Importance level
    importance: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },

    // Optional tags for filtering
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],

    // For decisions: outcome tracking
    outcome: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // For patterns: frequency observation
    frequency: {
        type: String,
        enum: ['once', 'occasional', 'frequent', 'consistent'],
        default: null
    },

    // Whether the AI should consider this note in future interactions
    aiVisible: {
        type: Boolean,
        default: true
    },

    // Pin high-priority notes to the top
    pinned: {
        type: Boolean,
        default: false
    },

    // Source: manual entry or AI-suggested
    source: {
        type: String,
        enum: ['manual', 'ai-suggested'],
        default: 'manual'
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

// Compound index for efficient user + type queries
ClientNoteSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Update timestamp on save
ClientNoteSchema.pre('save', function () {
    this.updatedAt = new Date();
});

const ClientNote = mongoose.model('ClientNote', ClientNoteSchema);

export default ClientNote;
