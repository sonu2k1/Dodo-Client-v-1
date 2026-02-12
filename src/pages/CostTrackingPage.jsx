import React, { useState, useEffect, useCallback } from 'react';
import {
    Briefcase,
    Wrench,
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    DollarSign,
    Percent,
    Loader2,
    Calendar,
    ToggleLeft,
    ToggleRight,
    TrendingUp,
    MoreHorizontal,
    Repeat,
    BarChart3,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';

// ── Category + frequency helpers ────────────────────
const CATEGORY_CONFIG = {
    agency_fee: { label: 'Agency Fee', icon: Briefcase, color: '#b400ff', rgb: '180,0,255' },
    tool_subscription: { label: 'Tool Subscription', icon: Wrench, color: '#00d4ff', rgb: '0,212,255' },
    other: { label: 'Other', icon: MoreHorizontal, color: '#ff00e5', rgb: '255,0,229' },
};

const FREQUENCIES = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'annual', label: 'Annual' },
    { key: 'one_time', label: 'One-time' },
];

const FEE_TYPES = [
    { key: 'fixed', label: 'Fixed $', icon: DollarSign },
    { key: 'percentage', label: '% of Spend', icon: Percent },
];

const formatCurrency = (v) => `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Animated counter ────────────────────────────────
const AnimatedValue = ({ value, prefix = '$', suffix = '' }) => {
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
    return <>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}</>;
};

// ── Summary stat card ───────────────────────────────
const StatCard = ({ icon: Icon, label, value, count, color, rgb, delay }) => (
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
                <AnimatedValue value={value || 0} />
            </p>
            {count !== undefined && (
                <p className="text-[10px] text-gray-600 mt-1">{count} active item{count !== 1 ? 's' : ''}</p>
            )}
        </div>
    </motion.div>
);

// ── Category badge ──────────────────────────────────
const CategoryBadge = ({ category }) => {
    const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
    const Icon = cfg.icon;
    return (
        <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border"
            style={{
                backgroundColor: `rgba(${cfg.rgb}, 0.1)`,
                borderColor: `rgba(${cfg.rgb}, 0.25)`,
                color: cfg.color
            }}
        >
            <Icon size={12} />
            {cfg.label}
        </span>
    );
};

// ── Frequency badge ─────────────────────────────────
const FrequencyBadge = ({ frequency }) => {
    const f = FREQUENCIES.find(fr => fr.key === frequency) || FREQUENCIES[0];
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 border border-white/[0.08]">
            <Repeat size={9} />
            {f.label}
        </span>
    );
};

// ── Add/Edit modal ──────────────────────────────────
const CostModal = ({ isOpen, onClose, onSave, initialData, saving }) => {
    const [form, setForm] = useState({
        name: '', category: 'agency_fee', feeType: 'fixed',
        amount: 0, percentageBase: 'ad_spend',
        frequency: 'monthly', isActive: true,
        startDate: '', endDate: '', vendor: '', notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name || '',
                category: initialData.category || 'agency_fee',
                feeType: initialData.feeType || 'fixed',
                amount: initialData.amount || 0,
                percentageBase: initialData.percentageBase || 'ad_spend',
                frequency: initialData.frequency || 'monthly',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                vendor: initialData.vendor || '',
                notes: initialData.notes || ''
            });
        } else {
            setForm({
                name: '', category: 'agency_fee', feeType: 'fixed',
                amount: 0, percentageBase: 'ad_spend',
                frequency: 'monthly', isActive: true,
                startDate: new Date().toISOString().split('T')[0],
                endDate: '', vendor: '', notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            amount: parseFloat(form.amount) || 0,
        });
    };

    // Live monthly equivalent
    const liveAmount = parseFloat(form.amount) || 0;
    const liveMonthly = form.feeType === 'fixed'
        ? (form.frequency === 'monthly' ? liveAmount
            : form.frequency === 'quarterly' ? liveAmount / 3
                : form.frequency === 'annual' ? liveAmount / 12
                    : 0)
        : 0;

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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-blue-600/10 flex items-center justify-center">
                                <Sparkles size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {initialData ? 'Edit Cost' : 'New Recurring Cost'}
                                </h3>
                                <p className="text-[11px] text-gray-500">Track agency fees & tool subscriptions</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name + Category */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    placeholder="e.g. HubSpot, Agency XYZ"
                                    required
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => handleChange('category', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all appearance-none"
                                >
                                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                                        <option key={key} value={key} className="bg-gray-900">{cfg.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Fee Type toggle */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Fee Type</label>
                            <div className="flex gap-2">
                                {FEE_TYPES.map(ft => {
                                    const Icon = ft.icon;
                                    const active = form.feeType === ft.key;
                                    return (
                                        <button
                                            key={ft.key}
                                            type="button"
                                            onClick={() => handleChange('feeType', ft.key)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${active
                                                ? 'bg-white/10 text-white border-white/20 shadow-sm'
                                                : 'bg-white/3 text-gray-500 border-white/6 hover:text-gray-300'
                                                }`}
                                        >
                                            <Icon size={14} />
                                            {ft.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Amount + Frequency */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-neon-cyan uppercase tracking-wider mb-1.5 block">
                                    {form.feeType === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                        {form.feeType === 'fixed' ? '$' : '%'}
                                    </span>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.amount}
                                        onChange={e => handleChange('amount', e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Frequency</label>
                                <select
                                    value={form.frequency}
                                    onChange={e => handleChange('frequency', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all appearance-none"
                                >
                                    {FREQUENCIES.map(f => (
                                        <option key={f.key} value={f.key} className="bg-gray-900">{f.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Percentage base (conditional) */}
                        {form.feeType === 'percentage' && (
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Percentage Of</label>
                                <select
                                    value={form.percentageBase}
                                    onChange={e => handleChange('percentageBase', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all appearance-none"
                                >
                                    <option value="ad_spend" className="bg-gray-900">Ad Spend</option>
                                    <option value="total_spend" className="bg-gray-900">Total Spend</option>
                                    <option value="custom" className="bg-gray-900">Custom</option>
                                </select>
                            </div>
                        )}

                        {/* Live monthly estimate */}
                        {form.feeType === 'fixed' && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 border border-white/6">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                                    <Repeat size={11} /> Monthly Equivalent
                                </span>
                                <span className="text-sm font-semibold text-neon-cyan">{formatCurrency(liveMonthly)}</span>
                            </div>
                        )}

                        {/* Separator */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/8" />
                            <span className="text-[10px] text-gray-600 uppercase tracking-wider">Details</span>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>

                        {/* Dates + Vendor */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                                <input
                                    type="date" value={form.startDate}
                                    onChange={e => handleChange('startDate', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                                <input
                                    type="date" value={form.endDate}
                                    onChange={e => handleChange('endDate', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Vendor</label>
                                <input
                                    type="text"
                                    value={form.vendor}
                                    onChange={e => handleChange('vendor', e.target.value)}
                                    placeholder="Vendor name"
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/3 border border-white/6">
                            <span className="text-sm text-gray-400">Active</span>
                            <button
                                type="button"
                                onClick={() => handleChange('isActive', !form.isActive)}
                                className="transition-colors"
                            >
                                {form.isActive
                                    ? <ToggleRight size={28} className="text-emerald-400" />
                                    : <ToggleLeft size={28} className="text-gray-600" />
                                }
                            </button>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={e => handleChange('notes', e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all resize-none"
                                placeholder="Optional notes…"
                            />
                        </div>

                        <GlassButton type="submit" className="w-full" disabled={saving}>
                            {saving
                                ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving…</>
                                : <><Plus size={16} className="mr-2" /> {initialData ? 'Update Cost' : 'Add Cost'}</>
                            }
                        </GlassButton>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Main page ───────────────────────────────────────
const CostTrackingPage = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [costs, setCosts] = useState([]);
    const [summary, setSummary] = useState({
        agencyFees: { totalMonthly: 0, count: 0 },
        toolSubscriptions: { totalMonthly: 0, count: 0 },
        other: { totalMonthly: 0, count: 0 },
        grandTotalMonthly: 0,
        percentageCosts: []
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // Tab filter
    const [activeTab, setActiveTab] = useState('all');

    // ── Fetch ───────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'all') params.set('category', activeTab);

            const [listRes, summaryRes] = await Promise.all([
                authFetch(`${API_BASE}/recurring-costs?${params.toString()}`),
                authFetch(`${API_BASE}/recurring-costs/monthly-summary`)
            ]);

            if (listRes.ok) {
                const data = await listRes.json();
                setCosts(data.costs || []);
            }
            if (summaryRes.ok) {
                setSummary(await summaryRes.json());
            }
        } catch (err) {
            console.error('Cost tracking fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch, isAuthenticated, activeTab]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Handlers ────────────────────────────────────
    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const url = editingItem ? `${API_BASE}/recurring-costs/${editingItem._id}` : `${API_BASE}/recurring-costs`;
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
        if (!window.confirm('Delete this recurring cost?')) return;
        setDeleting(id);
        try {
            const res = await authFetch(`${API_BASE}/recurring-costs/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAll();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(null);
        }
    };

    const handleToggleActive = async (item) => {
        try {
            await authFetch(`${API_BASE}/recurring-costs/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !item.isActive })
            });
            fetchAll();
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const TABS = [
        { key: 'all', label: 'All Costs' },
        { key: 'agency_fee', label: 'Agency Fees', icon: Briefcase },
        { key: 'tool_subscription', label: 'Tool Subs', icon: Wrench },
        { key: 'other', label: 'Other', icon: MoreHorizontal },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-blue-600/10 flex items-center justify-center">
                        <Repeat className="text-purple-400" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-neon">Cost Tracking</h1>
                        <p className="text-gray-500 text-xs">Agency fees, tool subscriptions & recurring costs</p>
                    </div>
                </div>
                <div className="flex gap-2 self-start">
                    <GlassButton onClick={fetchAll} variant="secondary" className="!px-3">
                        <RefreshCw size={15} />
                    </GlassButton>
                    <GlassButton onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                        <Plus size={15} className="mr-1.5" /> Add Cost
                    </GlassButton>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                        <Loader2 size={36} className="text-neon-cyan" />
                    </motion.div>
                    <span className="mt-4 text-gray-500 text-sm">Loading costs…</span>
                </div>
            ) : (
                <>
                    {/* ── Monthly summary cards ─────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            icon={DollarSign} label="Monthly Total" value={summary.grandTotalMonthly}
                            color="#00fff9" rgb="0,255,249" delay={0}
                        />
                        <StatCard
                            icon={Briefcase} label="Agency Fees" value={summary.agencyFees.totalMonthly}
                            count={summary.agencyFees.count}
                            color="#b400ff" rgb="180,0,255" delay={0.08}
                        />
                        <StatCard
                            icon={Wrench} label="Tool Subs" value={summary.toolSubscriptions.totalMonthly}
                            count={summary.toolSubscriptions.count}
                            color="#00d4ff" rgb="0,212,255" delay={0.16}
                        />
                        <StatCard
                            icon={MoreHorizontal} label="Other" value={summary.other.totalMonthly}
                            count={summary.other.count}
                            color="#ff00e5" rgb="255,0,229" delay={0.24}
                        />
                    </div>

                    {/* Percentage-based costs notice */}
                    {summary.percentageCosts?.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-[rgba(180,0,255,0.06)] border border-[rgba(180,0,255,0.15)]"
                        >
                            <Percent size={16} className="text-purple-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm text-gray-300">
                                    <span className="text-purple-400 font-semibold">{summary.percentageCosts.length}</span> percentage-based fee{summary.percentageCosts.length > 1 ? 's' : ''} active — actual costs depend on your ad spend.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {summary.percentageCosts.map(pc => (
                                        <span key={pc._id} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-300 border border-purple-400/20">
                                            {pc.name}: {pc.amount}% of {pc.percentageBase?.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Tabs ─────────────────────────────── */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${activeTab === tab.key
                                    ? 'bg-white/10 text-white border-white/20'
                                    : 'bg-white/3 text-gray-500 border-white/6 hover:text-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Costs table ───────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        {costs.length === 0 ? (
                            <GlassCard className="p-14 text-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                    <Repeat size={44} className="mx-auto mb-4 text-gray-600" />
                                </motion.div>
                                <p className="text-gray-400 mb-2 text-lg">No recurring costs yet</p>
                                <p className="text-gray-600 text-sm mb-5">Add agency fees and tool subscriptions to track recurring spend</p>
                                <GlassButton onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                                    <Plus size={16} className="mr-2" /> Add First Cost
                                </GlassButton>
                            </GlassCard>
                        ) : (
                            <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[rgba(255,255,255,0.1)]">
                                                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-3.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-neon-cyan uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Frequency</th>
                                                <th className="px-4 py-3.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Monthly Eq.</th>
                                                <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {costs.map((c, i) => (
                                                <motion.tr
                                                    key={c._id}
                                                    initial={{ opacity: 0, x: -15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className={`border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors group ${!c.isActive ? 'opacity-50' : ''}`}
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-medium text-white text-sm max-w-[200px] truncate">{c.name}</div>
                                                        {c.vendor && <div className="text-[10px] text-gray-600">{c.vendor}</div>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <CategoryBadge category={c.category} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm font-bold text-neon-cyan">
                                                        {c.feeType === 'fixed'
                                                            ? formatCurrency(c.amount)
                                                            : `${c.amount}%`
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <FrequencyBadge frequency={c.frequency} />
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right text-sm text-gray-300">
                                                        {c.feeType === 'fixed'
                                                            ? formatCurrency(c.monthlyEquivalent)
                                                            : <span className="text-[10px] text-gray-600">Variable</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <button
                                                            onClick={() => handleToggleActive(c)}
                                                            className="transition-colors"
                                                            title={c.isActive ? 'Click to deactivate' : 'Click to activate'}
                                                        >
                                                            {c.isActive
                                                                ? <ToggleRight size={22} className="text-emerald-400" />
                                                                : <ToggleLeft size={22} className="text-gray-600" />
                                                            }
                                                        </button>
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

            {/* Modal */}
            <CostModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingItem(null); }}
                onSave={handleSave}
                initialData={editingItem}
                saving={saving}
            />
        </div>
    );
};

export default CostTrackingPage;
