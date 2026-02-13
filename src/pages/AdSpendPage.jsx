import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Megaphone,
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    DollarSign,
    MousePointerClick,
    Eye,
    Target,
    Search,
    Filter,
    Loader2,
    Calendar,
    TrendingUp,
    ExternalLink,
    Sparkles,
    BarChart3,
    Cloud,
    Link2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

// ── Platform config ─────────────────────────────────
const PLATFORMS = [
    { key: 'google_ads', label: 'Google Ads', color: '#4285f4', rgb: '66,133,244', abbr: 'G' },
    { key: 'meta', label: 'Meta', color: '#0668E1', rgb: '6,104,225', abbr: 'M' },
    { key: 'tiktok', label: 'TikTok', color: '#ff0050', rgb: '255,0,80', abbr: 'T' },
    { key: 'linkedin', label: 'LinkedIn', color: '#0a66c2', rgb: '10,102,194', abbr: 'Li' },
    { key: 'twitter', label: 'Twitter / X', color: '#1d9bf0', rgb: '29,155,240', abbr: 'X' },
    { key: 'other', label: 'Other', color: '#6b7280', rgb: '107,114,128', abbr: '?' },
];

const getPlatform = (key) => PLATFORMS.find(p => p.key === key) || PLATFORMS[5];

const formatCurrency = (v) => `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (v) => (v || 0).toLocaleString();
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatDateFull = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Platform badge ──────────────────────────────────
const PlatformBadge = ({ platform }) => {
    const p = getPlatform(platform);
    return (
        <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border"
            style={{
                backgroundColor: `rgba(${p.rgb}, 0.1)`,
                borderColor: `rgba(${p.rgb}, 0.25)`,
                color: p.color
            }}
        >
            <span
                className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                style={{ backgroundColor: p.color }}
            >
                {p.abbr}
            </span>
            {p.label}
        </span>
    );
};

// ── Animated counter ────────────────────────────────
const AnimatedValue = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const duration = 700;
        const start = performance.now();
        const initial = display;
        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(initial + (value - initial) * eased);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);
    return <>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
};

// ── Summary stat card ───────────────────────────────
const StatCard = ({ icon: Icon, label, value, prefix, suffix, decimals, color, rgb, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: 'easeOut' }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
        <div className={`backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 hover:border-[rgba(${rgb},0.3)] hover:shadow-[0_0_25px_rgba(${rgb},0.08)] transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(${rgb}, 0.15)` }}>
                    <Icon size={16} style={{ color }} />
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">
                <AnimatedValue value={value || 0} prefix={prefix} suffix={suffix} decimals={decimals || 0} />
            </p>
        </div>
    </motion.div>
);

// ── Platform breakdown mini chart ───────────────────
const PlatformBreakdown = ({ byPlatform }) => {
    const total = byPlatform.reduce((s, p) => s + p.totalSpend, 0) || 1;

    return (
        <div className="space-y-2.5">
            {byPlatform.map((plat, i) => {
                const p = getPlatform(plat._id);
                const pct = ((plat.totalSpend / total) * 100).toFixed(1);
                return (
                    <motion.div
                        key={plat._id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 group"
                    >
                        <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black text-white shrink-0"
                            style={{ backgroundColor: p.color }}
                        >
                            {p.abbr}
                        </span>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-300">{p.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-600">{pct}%</span>
                                    <span className="text-xs font-semibold text-white">{formatCurrency(plat.totalSpend)}</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.7, delay: 0.2 + i * 0.08 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}44` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
            {byPlatform.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">No platform data yet</p>
            )}
        </div>
    );
};

// ── Add/Edit modal ──────────────────────────────────
const CampaignModal = ({ isOpen, onClose, onSave, initialData, saving }) => {
    const [form, setForm] = useState({
        campaignName: '', platform: 'google_ads', spend: 0,
        startDate: '', endDate: '',
        impressions: 0, clicks: 0, conversions: 0, roas: 0,
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                campaignName: initialData.campaignName || '',
                platform: initialData.platform || 'google_ads',
                spend: initialData.spend || 0,
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                impressions: initialData.metrics?.impressions || 0,
                clicks: initialData.metrics?.clicks || 0,
                conversions: initialData.metrics?.conversions || 0,
                roas: initialData.metrics?.roas || 0,
                notes: initialData.notes || ''
            });
        } else {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date();
            setForm({
                campaignName: '', platform: 'google_ads', spend: 0,
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0],
                impressions: 0, clicks: 0, conversions: 0, roas: 0, notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            campaignName: form.campaignName,
            platform: form.platform,
            spend: parseFloat(form.spend) || 0,
            startDate: form.startDate,
            endDate: form.endDate,
            metrics: {
                impressions: parseInt(form.impressions) || 0,
                clicks: parseInt(form.clicks) || 0,
                conversions: parseInt(form.conversions) || 0,
                roas: parseFloat(form.roas) || 0,
            },
            notes: form.notes,
            source: 'manual'
        });
    };

    // Live-computed metrics
    const liveClicks = parseInt(form.clicks) || 0;
    const liveImpressions = parseInt(form.impressions) || 0;
    const liveSpend = parseFloat(form.spend) || 0;
    const liveCtr = liveImpressions > 0 ? ((liveClicks / liveImpressions) * 100).toFixed(2) : '0.00';
    const liveCpc = liveClicks > 0 ? (liveSpend / liveClicks).toFixed(2) : '0.00';

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-xl backdrop-blur-[30px] bg-[rgba(15,15,25,0.9)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto scrollbar-glass"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/10 flex items-center justify-center">
                                <Megaphone size={20} className="text-neon-cyan" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {initialData ? 'Edit Campaign' : 'New Campaign'}
                                </h3>
                                <p className="text-[11px] text-gray-500">Track ad performance</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Campaign name + platform */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Campaign Name</label>
                                <input
                                    type="text"
                                    value={form.campaignName}
                                    onChange={e => handleChange('campaignName', e.target.value)}
                                    placeholder="Summer Sale 2026"
                                    required
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Platform</label>
                                <select
                                    value={form.platform}
                                    onChange={e => handleChange('platform', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all appearance-none"
                                >
                                    {PLATFORMS.map(p => (
                                        <option key={p.key} value={p.key} className="bg-gray-900">{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Spend + dates */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-neon-cyan uppercase tracking-wider mb-1.5 block">Spend ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.spend}
                                        onChange={e => handleChange('spend', e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                                <input
                                    type="date" value={form.startDate} required
                                    onChange={e => handleChange('startDate', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                                <input
                                    type="date" value={form.endDate} required
                                    onChange={e => handleChange('endDate', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/8" />
                            <span className="text-[10px] text-gray-600 uppercase tracking-wider">Performance Metrics</span>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>

                        {/* Performance metrics */}
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: 'Impressions', field: 'impressions', icon: Eye },
                                { label: 'Clicks', field: 'clicks', icon: MousePointerClick },
                                { label: 'Conversions', field: 'conversions', icon: Target },
                                { label: 'ROAS', field: 'roas', icon: TrendingUp },
                            ].map(m => (
                                <div key={m.field}>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <m.icon size={10} /> {m.label}
                                    </label>
                                    <input
                                        type="number" step={m.field === 'roas' ? '0.01' : '1'} min="0"
                                        value={form[m.field]}
                                        onChange={e => handleChange(m.field, e.target.value)}
                                        className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Live computed stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/3 border border-white/6">
                                <span className="text-[10px] text-gray-500">CTR (auto)</span>
                                <span className="text-sm font-semibold text-blue-400">{liveCtr}%</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/3 border border-white/6">
                                <span className="text-[10px] text-gray-500">CPC (auto)</span>
                                <span className="text-sm font-semibold text-purple-400">${liveCpc}</span>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={e => handleChange('notes', e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all resize-none"
                                placeholder="Campaign notes…"
                            />
                        </div>

                        <GlassButton type="submit" className="w-full" disabled={saving}>
                            {saving
                                ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving…</>
                                : <><Plus size={16} className="mr-2" /> {initialData ? 'Update Campaign' : 'Add Campaign'}</>
                            }
                        </GlassButton>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── API Integration Placeholder Modal ────────────────
const ApiIntegrationModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const integrations = [
        { platform: 'google_ads', label: 'Google Ads', status: 'coming_soon', description: 'Import campaigns, spend, and conversion data directly from Google Ads.' },
        { platform: 'meta', label: 'Meta Ads', status: 'coming_soon', description: 'Sync Facebook & Instagram ad performance automatically.' },
        { platform: 'tiktok', label: 'TikTok Ads', status: 'coming_soon', description: 'Pull in TikTok campaign metrics and spend data.' },
        { platform: 'linkedin', label: 'LinkedIn Ads', status: 'coming_soon', description: 'Connect LinkedIn Campaign Manager for B2B ad tracking.' },
        { platform: 'twitter', label: 'Twitter / X Ads', status: 'coming_soon', description: 'Import promoted tweet and campaign analytics.' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-lg backdrop-blur-[30px] bg-[rgba(15,15,25,0.92)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto scrollbar-glass"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-blue-600/10 flex items-center justify-center">
                                <Cloud size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">API Integrations</h3>
                                <p className="text-[11px] text-gray-500">Connect ad platforms to auto-sync spend data</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Info banner */}
                    <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-[rgba(0,212,255,0.06)] border border-[rgba(0,212,255,0.15)]">
                        <AlertCircle size={18} className="text-neon-cyan mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm text-gray-300">API integrations are <span className="text-neon-cyan font-semibold">coming soon</span>. Once available, you'll be able to auto-import campaign data from your connected ad platforms.</p>
                            <p className="text-[11px] text-gray-500 mt-1">In the meantime, use manual entry or CSV import to track campaigns.</p>
                        </div>
                    </div>

                    {/* Platform list */}
                    <div className="space-y-3">
                        {integrations.map((item, i) => {
                            const p = getPlatform(item.platform);
                            return (
                                <motion.div
                                    key={item.platform}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-all group"
                                >
                                    <span
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0"
                                        style={{ backgroundColor: p.color }}
                                    >
                                        {p.abbr}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-white">{item.label}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                Coming Soon
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{item.description}</p>
                                    </div>
                                    <Link2 size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
                        <p className="text-[11px] text-gray-600">Want a specific integration? Let us know!</p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Main page ───────────────────────────────────────
const AdSpendPage = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [summary, setSummary] = useState({ overall: {}, byPlatform: [] });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [apiModalOpen, setApiModalOpen] = useState(false);

    // Filters
    const [platformFilter, setPlatformFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // ── Fetch ───────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (platformFilter !== 'all') params.set('platform', platformFilter);
            if (searchQuery) params.set('search', searchQuery);
            if (dateFrom) params.set('startDate', dateFrom);
            if (dateTo) params.set('endDate', dateTo);

            const [listRes, summaryRes] = await Promise.all([
                authFetch(`${API_BASE}/ad-spend?${params.toString()}`),
                authFetch(`${API_BASE}/ad-spend/summary`)
            ]);

            if (listRes.ok) {
                const data = await listRes.json();
                setCampaigns(data.campaigns || []);
            }
            if (summaryRes.ok) {
                setSummary(await summaryRes.json());
            }
        } catch (err) {
            console.error('Ad spend fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch, isAuthenticated, platformFilter, searchQuery, dateFrom, dateTo]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Handlers ────────────────────────────────────
    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const url = editingItem ? `${API_BASE}/ad-spend/${editingItem._id}` : `${API_BASE}/ad-spend`;
            const method = editingItem ? 'PUT' : 'POST';
            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setModalOpen(false);
                setEditingItem(null);
                fetchAll();
            }
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this campaign?')) return;
        setDeleting(id);
        try {
            const res = await authFetch(`${API_BASE}/ad-spend/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAll();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(null);
        }
    };

    const ov = summary.overall || {};

    const hasActiveFilters = platformFilter !== 'all' || searchQuery || dateFrom || dateTo;
    const clearFilters = () => { setPlatformFilter('all'); setSearchQuery(''); setDateFrom(''); setDateTo(''); };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/10 flex items-center justify-center">
                        <Megaphone className="text-neon-cyan" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-neon">Ad Spend Tracker</h1>
                        <p className="text-gray-500 text-xs">Campaign-level spend & performance</p>
                    </div>
                </div>
                <div className="flex gap-2 self-start">
                    <GlassButton onClick={() => setApiModalOpen(true)} variant="secondary" className="!px-3 !gap-1.5">
                        <Cloud size={15} /> Connect API
                    </GlassButton>
                    <GlassButton onClick={fetchAll} variant="secondary" className="!px-3">
                        <RefreshCw size={15} />
                    </GlassButton>
                    <GlassButton onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                        <Plus size={15} className="mr-1.5" /> Add Campaign
                    </GlassButton>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                        <Loader2 size={36} className="text-neon-cyan" />
                    </motion.div>
                    <span className="mt-4 text-gray-500 text-sm">Loading campaigns…</span>
                </div>
            ) : (
                <>
                    {/* ── Summary cards ────────────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <StatCard icon={DollarSign} label="Total Spend" value={ov.totalSpend} prefix="$" decimals={2} color="#00fff9" rgb="0,255,249" delay={0} />
                        <StatCard icon={Eye} label="Impressions" value={ov.totalImpressions} decimals={0} color="#b400ff" rgb="180,0,255" delay={0.08} />
                        <StatCard icon={MousePointerClick} label="Clicks" value={ov.totalClicks} decimals={0} color="#00d4ff" rgb="0,212,255" delay={0.16} />
                        <StatCard icon={Target} label="Conversions" value={ov.totalConversions} decimals={0} color="#ff00e5" rgb="255,0,229" delay={0.24} />
                        <StatCard icon={TrendingUp} label="Avg CPC" value={ov.avgCpc} prefix="$" decimals={2} color="#00ff88" rgb="0,255,136" delay={0.32} />
                    </div>

                    {/* ── Platform breakdown + Filters ────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Platform breakdown card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <div className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 h-full">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 size={16} className="text-neon-cyan" />
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">By Platform</span>
                                </div>
                                <PlatformBreakdown byPlatform={summary.byPlatform || []} />
                            </div>
                        </motion.div>

                        {/* Filters card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
                            <div className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-gray-500" />
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Filters</span>
                                    </div>
                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className="text-[10px] text-neon-cyan hover:underline">Clear all</button>
                                    )}
                                </div>

                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search campaigns…"
                                        className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                    />
                                </div>

                                {/* Platform chips */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => setPlatformFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${platformFilter === 'all'
                                            ? 'bg-white/10 text-white border-white/20'
                                            : 'bg-white/3 text-gray-500 border-white/6 hover:text-gray-300'
                                            }`}
                                    >
                                        All
                                    </button>
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p.key}
                                            onClick={() => setPlatformFilter(p.key)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${platformFilter === p.key
                                                ? `border-[rgba(${p.rgb},0.4)] text-white`
                                                : 'bg-white/3 text-gray-500 border-white/6 hover:text-gray-300'
                                                }`}
                                            style={platformFilter === p.key ? { backgroundColor: `rgba(${p.rgb}, 0.15)` } : {}}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Date range */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 mb-1 block">From</label>
                                        <input
                                            type="date" value={dateFrom}
                                            onChange={e => setDateFrom(e.target.value)}
                                            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 mb-1 block">To</label>
                                        <input
                                            type="date" value={dateTo}
                                            onChange={e => setDateTo(e.target.value)}
                                            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Campaigns table ──────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Megaphone size={16} className="text-gray-500" />
                                <h2 className="text-base font-semibold text-white">Campaigns</h2>
                                <span className="text-xs text-gray-600">({campaigns.length})</span>
                            </div>
                        </div>

                        {campaigns.length === 0 ? (
                            <GlassCard className="p-14 text-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                    <Megaphone size={44} className="mx-auto mb-4 text-gray-600" />
                                </motion.div>
                                <p className="text-gray-400 mb-2 text-lg">
                                    {hasActiveFilters ? 'No campaigns match filters' : 'No campaigns yet'}
                                </p>
                                <p className="text-gray-600 text-sm mb-5">
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'Start tracking your ad spend by adding a campaign'}
                                </p>
                                {!hasActiveFilters && (
                                    <GlassButton onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                                        <Plus size={16} className="mr-2" /> Add First Campaign
                                    </GlassButton>
                                )}
                            </GlassCard>
                        ) : (
                            <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[rgba(255,255,255,0.1)]">
                                                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                                                <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-neon-cyan uppercase tracking-wider">Spend</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Impressions</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Clicks</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">CTR</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Conv.</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">CPC</th>
                                                <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {campaigns.map((c, i) => (
                                                <motion.tr
                                                    key={c._id}
                                                    initial={{ opacity: 0, x: -15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-medium text-white text-sm max-w-[200px] truncate">{c.campaignName}</div>
                                                        <div className="text-[10px] text-gray-600 flex items-center gap-1">
                                                            <Calendar size={9} />
                                                            {formatDate(c.startDate)} – {formatDate(c.endDate)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <PlatformBadge platform={c.platform} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm font-bold text-neon-cyan">
                                                        {formatCurrency(c.spend)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-gray-300">
                                                        {formatNumber(c.metrics?.impressions)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-gray-300">
                                                        {formatNumber(c.metrics?.clicks)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-blue-400">
                                                        {(c.metrics?.ctr || 0).toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-emerald-400">
                                                        {formatNumber(c.metrics?.conversions)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-purple-400">
                                                        ${(c.metrics?.cpc || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <div className="inline-flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingItem(c); setModalOpen(true); }}
                                                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                                            >
                                                                <Pencil size={13} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(c._id)}
                                                                disabled={deleting === c._id}
                                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                                                            >
                                                                {deleting === c._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}

            {/* Modals */}
            <CampaignModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingItem(null); }}
                onSave={handleSave}
                initialData={editingItem}
                saving={saving}
            />
            <ApiIntegrationModal
                isOpen={apiModalOpen}
                onClose={() => setApiModalOpen(false)}
            />
        </div>
    );
};

export default AdSpendPage;
