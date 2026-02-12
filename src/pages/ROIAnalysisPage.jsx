import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    DollarSign,
    Loader2,
    Target,
    Percent,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Sparkles,
    Users,
    Minus,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import ExecutiveSnapshot from '../components/roi/ExecutiveSnapshot';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';

const formatCurrency = (v) => `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompact = (v) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${Math.round(v)}`;
};

// ── Animated counter ────────────────────────────────
const AnimatedValue = ({ value, prefix = '', suffix = '' }) => {
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

// ── Trend badge ─────────────────────────────────────
const TrendBadge = ({ value, invertColor = false }) => {
    if (value === null || value === undefined) return null;
    const isPositive = value > 0;
    const isGood = invertColor ? !isPositive : isPositive;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${isGood
            ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'
            : 'text-red-400 bg-red-400/10 border border-red-400/20'
            }`}>
            {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(value).toFixed(1)}%
        </span>
    );
};

// ── ROI Gauge ───────────────────────────────────────
const ROIGauge = ({ roi, size = 180 }) => {
    const clampedRoi = Math.max(-100, Math.min(300, roi));
    // Map -100..300 to 0..100% arc
    const pct = ((clampedRoi + 100) / 400) * 100;
    const isPositive = roi >= 0;

    return (
        <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Background ring */}
            <div
                className="absolute inset-2 rounded-full"
                style={{
                    background: `conic-gradient(
                        ${isPositive ? 'rgba(0,255,136,0.5)' : 'rgba(255,80,80,0.5)'} 0% ${pct}%,
                        rgba(255,255,255,0.05) ${pct}% 100%
                    )`,
                    maskImage: `radial-gradient(transparent ${size * 0.32}px, black ${size * 0.33}px)`,
                    WebkitMaskImage: `radial-gradient(transparent ${size * 0.32}px, black ${size * 0.33}px)`,
                }}
            />
            {/* Glow */}
            <div
                className="absolute inset-0 rounded-full opacity-20 blur-xl"
                style={{
                    background: `conic-gradient(
                        ${isPositive ? 'rgba(0,255,136,0.4)' : 'rgba(255,80,80,0.4)'} 0% ${pct}%,
                        transparent ${pct}% 100%
                    )`,
                }}
            />
            {/* Inner glass */}
            <div
                className="absolute rounded-full backdrop-blur-md bg-[rgba(10,10,20,0.65)] border border-[rgba(255,255,255,0.08)]"
                style={{ width: size * 0.62, height: size * 0.62 }}
            />
            {/* Center text */}
            <div className="relative text-center z-10">
                <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className={`text-2xl font-bold leading-none ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
                >
                    {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                </motion.p>
                <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-1">ROI</p>
            </div>
        </motion.div>
    );
};

// ── Revenue vs Spend bar chart ──────────────────────
const ComparisonChart = ({ periods }) => {
    const data = useMemo(() => [...periods].reverse().slice(-8), [periods]);
    const maxVal = Math.max(...data.map(p => Math.max(p.revenue, p.totalSpend)), 1);

    if (data.length === 0) {
        return (
            <div className="py-10 text-center">
                <BarChart3 size={28} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">Add revenue data to see the comparison</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                    <span className="text-[10px] text-gray-500">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-400" />
                    <span className="text-[10px] text-gray-500">Total Spend</span>
                </div>
            </div>

            {data.map((p, i) => {
                const revWidth = (p.revenue / maxVal) * 100;
                const spendWidth = (p.totalSpend / maxVal) * 100;
                const isProfit = p.revenue >= p.totalSpend;

                return (
                    <motion.div
                        key={p.period}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-300 font-medium">{p.period}</span>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isProfit ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                    {isProfit ? '+' : ''}{p.roi.toFixed(1)}% ROI
                                </span>
                            </div>
                        </div>
                        {/* Revenue bar */}
                        <div className="h-3.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden mb-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${revWidth}%` }}
                                transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/60"
                                title={`Revenue: ${formatCurrency(p.revenue)}`}
                            />
                        </div>
                        {/* Spend bar */}
                        <div className="h-3.5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${spendWidth}%` }}
                                transition={{ duration: 0.8, delay: i * 0.06 + 0.1, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-red-500/80 to-red-400/60"
                                title={`Spend: ${formatCurrency(p.totalSpend)}`}
                            />
                        </div>
                        {/* Values */}
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-emerald-400/70">{formatCompact(p.revenue)}</span>
                            <span className="text-[10px] text-red-400/70">{formatCompact(p.totalSpend)}</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// ── Revenue entry modal ─────────────────────────────
const RevenueModal = ({ isOpen, onClose, onSave, initialData, saving }) => {
    const [form, setForm] = useState({ period: '', revenue: 0, conversions: 0, notes: '' });

    useEffect(() => {
        if (initialData) {
            setForm({
                period: initialData.period || '',
                revenue: initialData.revenue || 0,
                conversions: initialData.conversions || 0,
                notes: initialData.notes || ''
            });
        } else {
            const now = new Date();
            setForm({
                period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
                revenue: 0, conversions: 0, notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            revenue: parseFloat(form.revenue) || 0,
            conversions: parseInt(form.conversions) || 0,
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-md backdrop-blur-[30px] bg-[rgba(15,15,25,0.9)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 flex items-center justify-center">
                                <Sparkles size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {initialData ? 'Edit Revenue' : 'Add Revenue'}
                                </h3>
                                <p className="text-[11px] text-gray-500">Track revenue & conversions</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Period</label>
                            <input
                                type="text" value={form.period}
                                onChange={e => handleChange('period', e.target.value)}
                                placeholder="2026-02"
                                required
                                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/40 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1.5 block">Revenue ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                    <input
                                        type="number" step="0.01" min="0"
                                        value={form.revenue}
                                        onChange={e => handleChange('revenue', e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400/40 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Conversions</label>
                                <input
                                    type="number" min="0"
                                    value={form.conversions}
                                    onChange={e => handleChange('conversions', e.target.value)}
                                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
                                />
                            </div>
                        </div>

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
                                : <><Plus size={16} className="mr-2" /> {initialData ? 'Update' : 'Add Revenue'}</>
                            }
                        </GlassButton>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Main page ───────────────────────────────────────
const ROIAnalysisPage = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [periods, setPeriods] = useState([]);
    const [summary, setSummary] = useState({
        revenue: 0, totalSpend: 0, conversions: 0,
        roi: 0, cpa: 0, profitMargin: 0, profit: 0,
        periodCount: 0, roiTrend: null
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // ── Fetch ───────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const [periodsRes, summaryRes] = await Promise.all([
                authFetch(`${API_BASE}/roi`),
                authFetch(`${API_BASE}/roi/summary`)
            ]);
            if (periodsRes.ok) {
                const data = await periodsRes.json();
                setPeriods(data.periods || []);
            }
            if (summaryRes.ok) {
                setSummary(await summaryRes.json());
            }
        } catch (err) {
            console.error('ROI fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch, isAuthenticated]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Handlers ────────────────────────────────────
    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const url = editingItem
                ? `${API_BASE}/roi/revenue/${editingItem._id}`
                : `${API_BASE}/roi/revenue`;
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
        if (!window.confirm('Delete this revenue entry?')) return;
        setDeleting(id);
        try {
            const res = await authFetch(`${API_BASE}/roi/revenue/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAll();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(null);
        }
    };

    const isPositiveROI = summary.roi >= 0;

    // ── Stat cards config ───────────────────────────
    const stats = [
        {
            label: 'Total Revenue',
            value: summary.revenue, prefix: '$',
            icon: DollarSign,
            color: '#00ff88', rgb: '0,255,136'
        },
        {
            label: 'Total Spend',
            value: summary.totalSpend, prefix: '$',
            icon: TrendingDown,
            color: '#ff5050', rgb: '255,80,80'
        },
        {
            label: 'Net Profit',
            value: summary.profit, prefix: '$',
            icon: summary.profit >= 0 ? TrendingUp : TrendingDown,
            color: summary.profit >= 0 ? '#00ff88' : '#ff5050',
            rgb: summary.profit >= 0 ? '0,255,136' : '255,80,80'
        },
        {
            label: 'Cost / Acquisition',
            value: summary.cpa, prefix: '$',
            icon: Target,
            color: '#00d4ff', rgb: '0,212,255'
        }
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 flex items-center justify-center">
                        <TrendingUp className="text-emerald-400" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-neon">ROI Analysis</h1>
                        <p className="text-gray-500 text-xs">Revenue vs Spend · Profitability metrics</p>
                    </div>
                </div>
                <div className="flex gap-2 self-start">
                    <GlassButton onClick={fetchAll} variant="secondary" className="!px-3">
                        <RefreshCw size={15} />
                    </GlassButton>
                    <GlassButton onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                        <Plus size={15} className="mr-1.5" /> Add Revenue
                    </GlassButton>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                        <Loader2 size={36} className="text-neon-cyan" />
                    </motion.div>
                    <span className="mt-4 text-gray-500 text-sm">Crunching numbers…</span>
                </div>
            ) : (
                <>
                    {/* ── Executive Snapshot ──────────────── */}
                    <ExecutiveSnapshot summary={summary} />

                    {/* ── Row 1: ROI Gauge + Key Stats ───── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                        {/* ROI + Profit Margin hero card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className={`backdrop-blur-[24px] bg-gradient-to-br ${isPositiveROI
                                ? 'from-[rgba(0,255,136,0.06)] to-[rgba(0,212,255,0.02)] border-[rgba(0,255,136,0.15)]'
                                : 'from-[rgba(255,80,80,0.06)] to-[rgba(255,0,0,0.02)] border-[rgba(255,80,80,0.15)]'
                                } border rounded-2xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden`}
                            >
                                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${isPositiveROI ? 'bg-emerald-400/5' : 'bg-red-400/5'} blur-3xl`} />

                                <ROIGauge roi={summary.roi} size={190} />

                                <div className="flex items-center gap-3 mt-4">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Profit Margin</p>
                                        <p className={`text-lg font-bold ${summary.profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {summary.profitMargin.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">MoM Trend</p>
                                        {summary.roiTrend !== null
                                            ? <TrendBadge value={summary.roiTrend} />
                                            : <p className="text-xs text-gray-600 mt-0.5">N/A</p>
                                        }
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Conversions</p>
                                        <p className="text-lg font-bold text-neon-cyan">{(summary.conversions || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Stat cards */}
                        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08, duration: 0.5 }}
                                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                    >
                                        <div
                                            className={`backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 hover:border-[rgba(${stat.rgb},0.3)] hover:shadow-[0_0_25px_rgba(${stat.rgb},0.08)] transition-all duration-300 h-full`}
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(${stat.rgb}, 0.15)` }}>
                                                    <Icon size={16} style={{ color: stat.color }} />
                                                </div>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</span>
                                            </div>
                                            <p className="text-2xl font-bold text-white">
                                                <AnimatedValue value={stat.value || 0} prefix={stat.prefix} />
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Row 2: Comparison chart ────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                    >
                        <div className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <BarChart3 size={18} className="text-neon-cyan" />
                                <h3 className="text-base font-semibold text-white">Revenue vs Spend</h3>
                            </div>
                            <ComparisonChart periods={periods} />
                        </div>
                    </motion.div>

                    {/* ── Row 3: Period breakdown table ────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={16} className="text-gray-500" />
                                    <h3 className="text-sm font-semibold text-white">Period Breakdown</h3>
                                </div>
                                <span className="text-[10px] text-gray-600">{periods.length} period{periods.length !== 1 ? 's' : ''}</span>
                            </div>

                            {periods.length === 0 ? (
                                <div className="p-12 text-center">
                                    <TrendingUp size={40} className="mx-auto mb-3 text-gray-600" />
                                    <p className="text-gray-400 mb-2">No data yet</p>
                                    <p className="text-gray-600 text-sm mb-4">Add revenue entries to see ROI analysis</p>
                                    <GlassButton onClick={() => { setEditingItem(null); setModalOpen(true); }}>
                                        <Plus size={16} className="mr-2" /> Add Revenue
                                    </GlassButton>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[rgba(255,255,255,0.08)]">
                                                <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Revenue</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-semibold text-red-400 uppercase tracking-wider">Spend</th>
                                                <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Profit</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-neon-cyan uppercase tracking-wider">ROI %</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">CPA</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Margin</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Conv.</th>
                                                <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {periods.map((p, i) => {
                                                const isProfit = p.profit >= 0;
                                                return (
                                                    <motion.tr
                                                        key={p.period}
                                                        initial={{ opacity: 0, x: -15 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                                                    >
                                                        <td className="px-5 py-3 text-sm font-medium text-white">{p.period}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">{formatCurrency(p.revenue)}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-red-400">{formatCurrency(p.totalSpend)}</td>
                                                        <td className={`px-4 py-3 text-right text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {isProfit ? '+' : ''}{formatCurrency(p.profit)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${isProfit
                                                                ? 'text-emerald-400 bg-emerald-400/10'
                                                                : 'text-red-400 bg-red-400/10'
                                                                }`}>
                                                                {isProfit ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                                                {p.roi.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-gray-300">
                                                            {p.conversions > 0 ? formatCurrency(p.cpa) : '—'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-xs font-semibold ${p.profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {p.profitMargin.toFixed(1)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm text-gray-400">{p.conversions || '—'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {p.revenueEntryId && (
                                                                <div className="inline-flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingItem({ _id: p.revenueEntryId, period: p.period, revenue: p.revenue, conversions: p.conversions });
                                                                            setModalOpen(true);
                                                                        }}
                                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(p.revenueEntryId)}
                                                                        disabled={deleting === p.revenueEntryId}
                                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                                                                    >
                                                                        {deleting === p.revenueEntryId ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}

            {/* Modal */}
            <RevenueModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingItem(null); }}
                onSave={handleSave}
                initialData={editingItem}
                saving={saving}
            />
        </div>
    );
};

export default ROIAnalysisPage;
