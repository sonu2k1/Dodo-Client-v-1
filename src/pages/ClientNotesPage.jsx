import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen,
    Plus,
    Pin,
    PinOff,
    Edit3,
    Trash2,
    X,
    Save,
    Search,
    Filter,
    AlertCircle,
    RefreshCw,
    Loader2,
    Heart,
    ShieldAlert,
    Lightbulb,
    Activity,
    Tag,
    Eye,
    EyeOff
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const TYPE_CONFIG = {
    preference: { label: 'Preference', icon: Heart, color: 'text-pink-400', border: 'border-pink-500/20', bg: 'bg-pink-500/5', activeBg: 'bg-pink-500/15', dot: 'bg-pink-400' },
    constraint: { label: 'Constraint', icon: ShieldAlert, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', activeBg: 'bg-amber-500/15', dot: 'bg-amber-400' },
    decision: { label: 'Decision', icon: Lightbulb, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', activeBg: 'bg-cyan-500/15', dot: 'bg-cyan-400' },
    pattern: { label: 'Pattern', icon: Activity, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5', activeBg: 'bg-purple-500/15', dot: 'bg-purple-400' }
};

const IMPORTANCE_CONFIG = {
    low: { label: 'Low', color: 'text-gray-400 border-gray-500/30' },
    medium: { label: 'Medium', color: 'text-blue-400 border-blue-500/30' },
    high: { label: 'High', color: 'text-amber-400 border-amber-500/30' },
    critical: { label: 'Critical', color: 'text-red-400 border-red-500/30' }
};

const FREQUENCY_OPTIONS = [
    { value: '', label: 'None' },
    { value: 'once', label: 'Once' },
    { value: 'occasional', label: 'Occasional' },
    { value: 'frequent', label: 'Frequent' },
    { value: 'consistent', label: 'Consistent' }
];

/**
 * ClientNotesPage — Premium glassmorphism client memory management
 */
const ClientNotesPage = () => {
    const { authFetch } = useAuth();
    const [notes, setNotes] = useState([]);
    const [counts, setCounts] = useState({ preference: 0, constraint: 0, decision: 0, pattern: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [activeType, setActiveType] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        type: 'preference', title: '', content: '', importance: 'medium',
        tags: '', outcome: '', frequency: '', aiVisible: true, pinned: false
    });

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (activeType) params.set('type', activeType);
            const res = await authFetch(`${API_BASE}/client-notes?${params}`);
            if (!res.ok) throw new Error(`Failed to fetch notes (${res.status})`);
            const data = await res.json();
            setNotes(data.notes);
            setCounts(data.counts);
        } catch (err) {
            console.error('Notes fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch, activeType]);

    useEffect(() => { fetchNotes(); }, [fetchNotes]);

    const openCreate = () => {
        setEditingNote(null);
        setForm({ type: 'preference', title: '', content: '', importance: 'medium', tags: '', outcome: '', frequency: '', aiVisible: true, pinned: false });
        setShowModal(true);
    };

    const openEdit = (note) => {
        setEditingNote(note);
        setForm({
            type: note.type,
            title: note.title,
            content: note.content,
            importance: note.importance,
            tags: (note.tags || []).join(', '),
            outcome: note.outcome || '',
            frequency: note.frequency || '',
            aiVisible: note.aiVisible,
            pinned: note.pinned
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return;
        setSaving(true);
        try {
            const body = {
                ...form,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                frequency: form.frequency || null
            };
            const url = editingNote
                ? `${API_BASE}/client-notes/${editingNote._id}`
                : `${API_BASE}/client-notes`;
            const method = editingNote ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Failed to save note');
            setShowModal(false);
            fetchNotes();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await authFetch(`${API_BASE}/client-notes/${id}`, {
                method: 'DELETE'
            });
            fetchNotes();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleTogglePin = async (id) => {
        try {
            await authFetch(`${API_BASE}/client-notes/${id}/pin`, {
                method: 'PATCH'
            });
            fetchNotes();
        } catch (err) {
            console.error('Pin error:', err);
        }
    };

    // Filter notes by search
    const filtered = notes.filter(n => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.tags || []).some(t => t.toLowerCase().includes(q));
    });

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

    // ─── Skeleton ───
    if (loading && notes.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-64 bg-white/10 rounded animate-pulse" />
                    <div className="h-10 w-36 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-28 bg-white/10 rounded-full animate-pulse" />)}
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card p-6 animate-pulse">
                        <div className="h-4 w-1/3 bg-white/10 rounded mb-3" />
                        <div className="h-3 w-2/3 bg-white/5 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-4xl font-bold text-gradient-neon">Client Notes</h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button onClick={fetchNotes} className="btn-glass-primary px-6 py-2 flex items-center gap-2 mx-auto">
                        <RefreshCw size={16} /> Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gradient-neon flex items-center gap-3">
                        <BookOpen size={36} className="text-neon-purple" />
                        Client Notes & Memory
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{counts.total} notes stored</p>
                </div>
                <button onClick={openCreate} className="btn-glass-primary px-5 py-2.5 flex items-center gap-2 text-sm font-medium">
                    <Plus size={16} /> Add Note
                </button>
            </motion.div>

            {/* Type Filters */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                <button
                    onClick={() => setActiveType(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${!activeType ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5'}`}
                >
                    All ({counts.total})
                </button>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveType(activeType === key ? null : key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${activeType === key ? `${cfg.border} ${cfg.activeBg} ${cfg.color}` : `border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5`}`}
                        >
                            <Icon size={14} />
                            {cfg.label} ({counts[key] || 0})
                        </button>
                    );
                })}
            </motion.div>

            {/* Search */}
            <motion.div variants={itemVariants} className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search notes, tags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 placeholder-gray-500 focus:border-neon-purple/40 focus:outline-none transition-colors"
                />
            </motion.div>

            {/* Notes List */}
            <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-card p-12 text-center"
                    >
                        <BookOpen className="mx-auto mb-4 text-gray-600" size={48} />
                        <p className="text-gray-400">
                            {searchQuery ? 'No notes match your search.' : activeType ? `No ${TYPE_CONFIG[activeType]?.label.toLowerCase()} notes yet.` : 'No notes yet. Click "Add Note" to get started.'}
                        </p>
                    </motion.div>
                ) : (
                    <motion.div layout className="space-y-3">
                        {filtered.map((note) => (
                            <NoteCard
                                key={note._id}
                                note={note}
                                onEdit={() => openEdit(note)}
                                onDelete={() => handleDelete(note._id)}
                                onTogglePin={() => handleTogglePin(note._id)}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <NoteModal
                        form={form}
                        setForm={setForm}
                        onSave={handleSave}
                        onClose={() => setShowModal(false)}
                        saving={saving}
                        isEdit={!!editingNote}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Note Card ───
const NoteCard = ({ note, onEdit, onDelete, onTogglePin }) => {
    const cfg = TYPE_CONFIG[note.type] || TYPE_CONFIG.preference;
    const Icon = cfg.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ y: -2 }}
            className={`glass-card p-5 border-l-4 ${cfg.border} transition-all`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                        <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-200 text-sm">{note.title}</h3>
                            {note.pinned && <Pin size={12} className="text-amber-400" />}
                            {!note.aiVisible && <EyeOff size={12} className="text-gray-600" title="Hidden from AI" />}
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${IMPORTANCE_CONFIG[note.importance]?.color || ''}`}>
                                {note.importance}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{note.content}</p>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            {note.tags?.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    <Tag size={11} className="text-gray-600" />
                                    {note.tags.map((t, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{t}</span>
                                    ))}
                                </div>
                            )}
                            {note.outcome && (
                                <span className="text-xs text-gray-500">
                                    Outcome: <span className="text-gray-300">{note.outcome}</span>
                                </span>
                            )}
                            {note.frequency && (
                                <span className="text-xs text-gray-500">
                                    Freq: <span className="text-gray-300 capitalize">{note.frequency}</span>
                                </span>
                            )}
                            <span className="text-xs text-gray-600">
                                {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={onTogglePin} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title={note.pinned ? 'Unpin' : 'Pin'}>
                        {note.pinned ? <PinOff size={14} className="text-amber-400" /> : <Pin size={14} className="text-gray-500" />}
                    </button>
                    <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Edit3 size={14} className="text-gray-400" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Create/Edit Modal ───
const NoteModal = ({ form, setForm, onSave, onClose, saving, isEdit }) => {
    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-white/10 bg-[rgba(15,15,25,0.95)] backdrop-blur-[30px] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">{isEdit ? 'Edit Note' : 'New Note'}</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5"><X size={18} className="text-gray-400" /></button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => update('type', key)}
                                className={`flex-1 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all
                                    ${form.type === key ? `${cfg.border} ${cfg.activeBg} ${cfg.color}` : 'border-white/10 bg-white/[0.02] text-gray-500 hover:bg-white/5'}`}
                            >
                                <Icon size={14} /> {cfg.label}
                            </button>
                        );
                    })}
                </div>

                {/* Title */}
                <input
                    type="text"
                    placeholder="Note title..."
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 placeholder-gray-500 focus:border-neon-purple/40 focus:outline-none"
                />

                {/* Content */}
                <textarea
                    placeholder="Describe this note in detail..."
                    value={form.content}
                    onChange={e => update('content', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 placeholder-gray-500 resize-none focus:border-neon-purple/40 focus:outline-none"
                />

                {/* Importance & Frequency */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Importance</label>
                        <select
                            value={form.importance}
                            onChange={e => update('importance', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 focus:outline-none text-sm"
                        >
                            {Object.entries(IMPORTANCE_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                    </div>
                    {form.type === 'pattern' && (
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                            <select
                                value={form.frequency}
                                onChange={e => update('frequency', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 focus:outline-none text-sm"
                            >
                                {FREQUENCY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Outcome (for decisions) */}
                {form.type === 'decision' && (
                    <input
                        type="text"
                        placeholder="Outcome (optional)..."
                        value={form.outcome}
                        onChange={e => update('outcome', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 placeholder-gray-500 focus:outline-none"
                    />
                )}

                {/* Tags */}
                <input
                    type="text"
                    placeholder="Tags (comma separated)..."
                    value={form.tags}
                    onChange={e => update('tags', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 placeholder-gray-500 focus:outline-none"
                />

                {/* Toggles */}
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.aiVisible}
                            onChange={e => update('aiVisible', e.target.checked)}
                            className="accent-neon-purple"
                        />
                        <Eye size={14} /> Visible to AI
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.pinned}
                            onChange={e => update('pinned', e.target.checked)}
                            className="accent-amber-400"
                        />
                        <Pin size={14} /> Pin to top
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 btn-glass px-4 py-2.5 text-sm">Cancel</button>
                    <button
                        onClick={onSave}
                        disabled={saving || !form.title.trim() || !form.content.trim()}
                        className="flex-1 btn-glass-primary px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isEdit ? 'Update' : 'Create'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ClientNotesPage;
