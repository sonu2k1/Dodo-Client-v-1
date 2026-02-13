import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    PieChart,
    Plus,
    Pencil,
    Trash2,
    X,
    RefreshCw,
    DollarSign,
    Megaphone,
    Briefcase,
    Wrench,
    MoreHorizontal,
    Loader2,
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronUp,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    BarChart3,
    Info,
    Shield,
    Activity,
    Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

// ── Category config ─────────────────────────────────
const CATEGORIES = [
    { key: 'adSpend', label: 'Ad Spend', icon: Megaphone, color: '#00fff9', rgb: '0,255,249', gradient: 'from-cyan-400/20 to-cyan-600/5' },
    { key: 'agencyFees', label: 'Agency Fees', icon: Briefcase, color: '#b400ff', rgb: '180,0,255', gradient: 'from-purple-400/20 to-purple-600/5' },
    { key: 'toolsCost', label: 'Tools Cost', icon: Wrench, color: '#00d4ff', rgb: '0,212,255', gradient: 'from-blue-400/20 to-blue-600/5' },
    { key: 'miscCost', label: 'Other / Misc', icon: MoreHorizontal, color: '#ff00e5', rgb: '255,0,229', gradient: 'from-pink-400/20 to-pink-600/5' },
];

const formatCurrency = (v) => `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompact = (v) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${Math.round(v)}`;
};
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ── Stagger container ───────────────────────────────
const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

// ── Performance level config ────────────────────────
const HEALTH_LEVELS = [
    { min: 80, label: 'Excellent', color: '#00ff88', rgb: '0,255,136', bg: 'from-emerald-400/15 to-emerald-600/5', emoji: '🟢' },
    { min: 60, label: 'Good', color: '#00d4ff', rgb: '0,212,255', bg: 'from-cyan-400/15 to-cyan-600/5', emoji: '🔵' },
    { min: 40, label: 'Fair', color: '#ffc400', rgb: '255,196,0', bg: 'from-amber-400/15 to-amber-600/5', emoji: '🟡' },
    { min: 20, label: 'Poor', color: '#ff6b00', rgb: '255,107,0', bg: 'from-orange-400/15 to-orange-600/5', emoji: '🟠' },
    { min: 0, label: 'Critical', color: '#ff3355', rgb: '255,51,85', bg: 'from-red-400/15 to-red-600/5', emoji: '🔴' },
];

const getHealthLevel = (score) => HEALTH_LEVELS.find(l => score >= l.min) || HEALTH_LEVELS[HEALTH_LEVELS.length - 1];

/**
 * Compute a 0–100 spend health score from financial signals.
 * Factors: MoM change (40pts), spend diversification (30pts), spend trend (30pts)
 */
const computeHealthScore = (summary, breakdowns) => {
    let score = 100;

    // Factor 1 — MoM change penalty (max 40pt deduction)
    if (breakdowns.length >= 2) {
        const sorted = [...breakdowns].sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
        const current = sorted[0]?.totalSpend || 0;
        const prev = sorted[1]?.totalSpend || 1;
        const momPct = ((current - prev) / prev) * 100;
        if (momPct > 0) score -= Math.min(40, momPct * 0.8);
        else score += Math.min(10, Math.abs(momPct) * 0.2);
    }

    // Factor 2 — Concentration risk (max 30pt deduction)
    const total = summary.totalSpend || 1;
    const cats = [
        summary.totalAdSpend || 0,
        summary.totalAgencyFees || 0,
        summary.totalToolsCost || 0,
        summary.totalMiscCost || 0,
    ];
    const maxConcentration = Math.max(...cats) / total;
    if (maxConcentration > 0.6) {
        score -= (maxConcentration - 0.6) * 100;
    }

    // Factor 3 — Spend trajectory (max 15pt deduction)
    if (breakdowns.length >= 3) {
        const sorted = [...breakdowns].sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
        const last3 = sorted.slice(0, 3).map(b => b.totalSpend || 0);
        const increasing = last3[0] > last3[1] && last3[1] > last3[2];
        if (increasing) score -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
};

// ── Animated SVG Progress Ring ──────────────────────
const SpendHealthRing = ({ score, size = 200 }) => {
    const level = getHealthLevel(score);
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const factors = [
        { icon: TrendingDown, label: 'MoM Change', weight: '40%' },
        { icon: PieChart, label: 'Diversification', weight: '30%' },
        { icon: Activity, label: 'Spend Trajectory', weight: '30%' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4"
        >
            {/* Ring SVG */}
            <div className="relative" style={{ width: size, height: size }}>
                {/* Outer glow */}
                <div
                    className="absolute inset-0 rounded-full blur-xl opacity-30"
                    style={{ background: `radial-gradient(circle, ${level.color}40, transparent 70%)` }}
                />
                <svg width={size} height={size} className="-rotate-90">
                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Animated progress arc */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={level.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - progress }}
                        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                        style={{
                            filter: `drop-shadow(0 0 8px ${level.color}66)`,
                        }}
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                        className="text-center"
                    >
                        <p
                            className="text-4xl font-extrabold leading-none"
                            style={{ color: level.color, textShadow: `0 0 20px ${level.color}44` }}
                        >
                            {score}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">Health Score</p>
                    </motion.div>
                </div>
            </div>

            {/* Level badge */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{
                    backgroundColor: `rgba(${level.rgb}, 0.08)`,
                    borderColor: `rgba(${level.rgb}, 0.2)`,
                }}
            >
                <Heart size={12} style={{ color: level.color }} />
                <span className="text-xs font-semibold" style={{ color: level.color }}>
                    {level.label}
                </span>
            </motion.div>

            {/* Score factors */}
            <div className="flex gap-4 mt-1">
                {factors.map((f, i) => {
                    const FIcon = f.icon;
                    return (
                        <motion.div
                            key={f.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 + i * 0.1 }}
                            className="flex items-center gap-1 group cursor-default"
                            title={`${f.label} — weighs ${f.weight} of the score`}
                        >
                            <FIcon size={11} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                            <span className="text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors">{f.weight}</span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

// ── Insight Tooltip ─────────────────────────────────
const InsightTooltip = ({ children, tip }) => {
    const [show, setShow] = useState(false);
    return (
        <div
            className="relative"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                            px-3 py-2 rounded-xl text-[11px] text-gray-300 leading-relaxed
                            backdrop-blur-[24px] bg-[rgba(10,10,20,0.95)]
                            border border-[rgba(255,255,255,0.1)]
                            shadow-2xl whitespace-nowrap
                            pointer-events-none"
                    >
                        {tip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 bg-[rgba(10,10,20,0.95)] border-r border-b border-[rgba(255,255,255,0.1)]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// ── Animated counter ────────────────────────────────
const AnimatedValue = ({ value, prefix = '$' }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const duration = 800;
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
    return <>{prefix}{display.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

// ── Donut chart ─────────────────────────────────────
const DonutChart = ({ data, size = 240 }) => {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let cumulative = 0;
    const segments = data.map(d => {
        const start = cumulative;
        const pct = (d.value / total) * 100;
        cumulative += pct;
        return { ...d, start, pct };
    });

    const gradient = segments
        .filter(s => s.pct > 0)
        .map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`)
        .join(', ');

    const hasData = data.some(d => d.value > 0);

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
        >
            {/* Outer glow ring */}
            <motion.div
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full opacity-20 blur-lg"
                style={{
                    background: hasData ? `conic-gradient(${gradient})` : 'none',
                    maskImage: `radial-gradient(transparent ${size * 0.26}px, black ${size * 0.32}px, transparent ${size * 0.5}px)`,
                    WebkitMaskImage: `radial-gradient(transparent ${size * 0.26}px, black ${size * 0.32}px, transparent ${size * 0.5}px)`,
                }}
            />
            {/* Main donut */}
            <motion.div
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute inset-2 rounded-full"
                style={{
                    background: hasData
                        ? `conic-gradient(${gradient})`
                        : 'conic-gradient(rgba(255,255,255,0.08) 0% 100%)',
                    maskImage: `radial-gradient(transparent ${size * 0.3}px, black ${size * 0.31}px)`,
                    WebkitMaskImage: `radial-gradient(transparent ${size * 0.3}px, black ${size * 0.31}px)`,
                }}
            />
            {/* Inner glass circle */}
            <div
                className="absolute rounded-full backdrop-blur-md bg-[rgba(10,10,20,0.6)] border border-[rgba(255,255,255,0.08)]"
                style={{ width: size * 0.58, height: size * 0.58 }}
            />
            {/* Center text */}
            <div className="relative text-center z-10">
                <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="text-2xl font-bold text-white leading-none"
                >
                    <AnimatedValue value={total} />
                </motion.p>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">Total Spend</p>
            </div>
        </motion.div>
    );
};

// ── Monthly comparison bar chart ────────────────────
const MonthlyComparison = ({ breakdowns }) => {
    // Get last 6 months of data
    const monthlyData = useMemo(() => {
        const months = {};
        breakdowns.forEach(bd => {
            const key = bd.period;
            if (!months[key]) {
                months[key] = { period: key, adSpend: 0, agencyFees: 0, toolsCost: 0, miscCost: 0, total: 0 };
            }
            months[key].adSpend += bd.adSpend || 0;
            months[key].agencyFees += bd.agencyFees || 0;
            months[key].toolsCost += bd.toolsCost || 0;
            months[key].miscCost += bd.miscCost || 0;
            months[key].total += bd.totalSpend || 0;
        });
        return Object.values(months)
            .sort((a, b) => a.period.localeCompare(b.period))
            .slice(-6);
    }, [breakdowns]);

    const maxTotal = Math.max(...monthlyData.map(m => m.total), 1);

    if (monthlyData.length < 2) {
        return (
            <div className="text-center py-8">
                <BarChart3 size={28} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">Add more periods to see monthly comparison</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
        >
            {monthlyData.map((month, i) => {
                const prevMonth = monthlyData[i - 1];
                const change = prevMonth ? ((month.total - prevMonth.total) / (prevMonth.total || 1)) * 100 : null;
                const barWidth = (month.total / maxTotal) * 100;

                return (
                    <motion.div variants={staggerItem} key={month.period} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-gray-300 font-medium">{month.period}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">{formatCurrency(month.total)}</span>
                                {change !== null && (
                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${change > 0
                                        ? 'text-red-400 bg-red-400/10'
                                        : change < 0
                                            ? 'text-emerald-400 bg-emerald-400/10'
                                            : 'text-gray-500 bg-gray-500/10'
                                        }`}>
                                        {change > 0 ? <ArrowUpRight size={10} /> : change < 0 ? <ArrowDownRight size={10} /> : null}
                                        {Math.abs(change).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Stacked bar */}
                        <div className="h-5 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                className="h-full rounded-full flex overflow-hidden"
                            >
                                {CATEGORIES.map(cat => {
                                    const catPct = month.total > 0 ? (month[cat.key] / month.total) * 100 : 0;
                                    return (
                                        <div
                                            key={cat.key}
                                            style={{ width: `${catPct}%`, backgroundColor: cat.color }}
                                            className="h-full opacity-80 group-hover:opacity-100 transition-opacity"
                                            title={`${cat.label}: ${formatCurrency(month[cat.key])}`}
                                        />
                                    );
                                })}
                            </motion.div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};

// ── Category summary card (with hover insight tooltip) ──
const CategoryCard = ({ cat, value, total, delay, periodCount }) => {
    const Icon = cat.icon;
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    const pctNum = parseFloat(pct);
    const avgPerPeriod = periodCount > 0 ? value / periodCount : 0;

    // Color-coded performance level for this category
    const catLevel = pctNum > 50 ? 'High concentration'
        : pctNum > 30 ? 'Moderate share'
            : pctNum > 10 ? 'Balanced share'
                : 'Minimal share';
    const catLevelColor = pctNum > 50 ? '#ff6b00' : pctNum > 30 ? '#ffc400' : '#00ff88';

    const tooltipText = `${catLevel} · Avg ${formatCompact(avgPerPeriod)}/period`;

    return (
        <InsightTooltip tip={tooltipText}>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay, duration: 0.5, ease: 'easeOut' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative group"
            >
                <div className={`
                    backdrop-blur-[24px] bg-gradient-to-br ${cat.gradient}
                    border border-[rgba(255,255,255,0.1)] rounded-2xl p-5
                    hover:border-[rgba(255,255,255,0.2)] transition-all duration-300
                    hover:shadow-[0_0_30px_rgba(${cat.rgb},0.12)]
                `}>
                    {/* Category dot + icon */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `rgba(${cat.rgb}, 0.15)` }}
                            >
                                <Icon size={18} style={{ color: cat.color }} />
                            </div>
                            <span className="text-sm text-gray-400 font-medium">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {/* Performance level dot */}
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: catLevelColor, boxShadow: `0 0 6px ${catLevelColor}66` }}
                            />
                            <span
                                className="text-[10px] font-bold px-2 py-1 rounded-full"
                                style={{ backgroundColor: `rgba(${cat.rgb}, 0.12)`, color: cat.color }}
                            >
                                {pct}%
                            </span>
                        </div>
                    </div>

                    {/* Value */}
                    <p className="text-2xl font-bold text-white mb-1">
                        <AnimatedValue value={value} />
                    </p>
                    <p className="text-[10px] text-gray-600 mb-3">
                        ~{formatCompact(avgPerPeriod)} / period
                    </p>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                                background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                                boxShadow: `0 0 10px ${cat.color}44`
                            }}
                        />
                    </div>

                    {/* Hover insight indicator */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity">
                        <Info size={12} className="text-gray-500" />
                    </div>
                </div>
            </motion.div>
        </InsightTooltip>
    );
};

// ── Add/Edit modal ──────────────────────────────────
const SpendModal = ({ isOpen, onClose, onSave, initialData, saving }) => {
    const [form, setForm] = useState({
        period: '', periodStart: '', periodEnd: '',
        adSpend: 0, agencyFees: 0, toolsCost: 0, miscCost: 0, notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                period: initialData.period || '',
                periodStart: initialData.periodStart ? new Date(initialData.periodStart).toISOString().split('T')[0] : '',
                periodEnd: initialData.periodEnd ? new Date(initialData.periodEnd).toISOString().split('T')[0] : '',
                adSpend: initialData.adSpend || 0,
                agencyFees: initialData.agencyFees || 0,
                toolsCost: initialData.toolsCost || 0,
                miscCost: initialData.miscCost || 0,
                notes: initialData.notes || ''
            });
        } else {
            const now = new Date();
            const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setForm({
                period: monthStr,
                periodStart: start.toISOString().split('T')[0],
                periodEnd: end.toISOString().split('T')[0],
                adSpend: 0, agencyFees: 0, toolsCost: 0, miscCost: 0, notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            adSpend: parseFloat(form.adSpend) || 0,
            agencyFees: parseFloat(form.agencyFees) || 0,
            toolsCost: parseFloat(form.toolsCost) || 0,
            miscCost: parseFloat(form.miscCost) || 0,
        });
    };

    const computedTotal = (parseFloat(form.adSpend) || 0) + (parseFloat(form.agencyFees) || 0) +
        (parseFloat(form.toolsCost) || 0) + (parseFloat(form.miscCost) || 0);

    // Donut for modal preview
    const previewData = CATEGORIES.map(c => ({
        label: c.label, value: parseFloat(form[c.key]) || 0, color: c.color
    }));

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
                    className="w-full max-w-lg backdrop-blur-[30px] bg-[rgba(15,15,25,0.85)] border border-[rgba(255,255,255,0.1)] rounded-3xl p-7 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-blue/10 flex items-center justify-center">
                                <Sparkles size={20} className="text-neon-cyan" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {initialData ? 'Edit Period' : 'New Spend Period'}
                                </h3>
                                <p className="text-[11px] text-gray-500">Track your spending breakdown</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10">
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Period row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Period Label', field: 'period', type: 'text', placeholder: '2026-02' },
                                { label: 'Start Date', field: 'periodStart', type: 'date' },
                                { label: 'End Date', field: 'periodEnd', type: 'date' },
                            ].map(f => (
                                <div key={f.field}>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={form[f.field]}
                                        onChange={e => handleChange(f.field, e.target.value)}
                                        placeholder={f.placeholder}
                                        required
                                        className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[rgba(0,255,249,0.3)] focus:shadow-[0_0_15px_rgba(0,255,249,0.08)] transition-all"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Spend fields */}
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORIES.map(cat => (
                                <div key={cat.key}>
                                    <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: cat.color }}>{cat.label}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form[cat.key]}
                                            onChange={e => handleChange(cat.key, e.target.value)}
                                            className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none transition-all"
                                            style={{ focusBorderColor: cat.color }}
                                            onFocus={e => e.target.style.borderColor = `rgba(${cat.rgb}, 0.4)`}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Computed total */}
                        <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-neon-cyan/5 to-transparent border border-neon-cyan/15">
                            <span className="text-sm text-gray-400 flex items-center gap-2">
                                <DollarSign size={16} className="text-neon-cyan" />
                                Total Spend
                            </span>
                            <span className="text-xl font-bold text-neon-cyan">${computedTotal.toFixed(2)}</span>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => handleChange('notes', e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[rgba(0,255,249,0.3)] transition-all resize-none"
                                placeholder="Any additional context…"
                            />
                        </div>

                        <GlassButton type="submit" className="w-full" disabled={saving}>
                            {saving
                                ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving…</>
                                : <><Plus size={16} className="mr-2" /> {initialData ? 'Update Period' : 'Add Period'}</>
                            }
                        </GlassButton>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Main page ───────────────────────────────────────
const SpendMeterPage = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [breakdowns, setBreakdowns] = useState([]);
    const [summary, setSummary] = useState({
        totalAdSpend: 0, totalAgencyFees: 0, totalToolsCost: 0,
        totalMiscCost: 0, totalSpend: 0, periodCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [activeView, setActiveView] = useState('overview'); // overview | periods

    // ── Fetch ───────────────────────────────────────
    const fetchAll = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                authFetch(`${API_BASE}/spend-breakdown`),
                authFetch(`${API_BASE}/spend-breakdown/summary`)
            ]);
            if (listRes.ok) {
                const data = await listRes.json();
                setBreakdowns(data.breakdowns || []);
            }
            if (summaryRes.ok) {
                setSummary(await summaryRes.json());
            }
        } catch (err) {
            console.error('Spend fetch error:', err);
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
                ? `${API_BASE}/spend-breakdown/${editingItem._id}`
                : `${API_BASE}/spend-breakdown`;
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
        if (!window.confirm('Delete this spend period?')) return;
        setDeleting(id);
        try {
            const res = await authFetch(`${API_BASE}/spend-breakdown/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAll();
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(null);
        }
    };

    const openEdit = (item) => { setEditingItem(item); setModalOpen(true); };
    const openAdd = () => { setEditingItem(null); setModalOpen(true); };

    // ── Donut data ──────────────────────────────────
    const donutData = CATEGORIES.map(cat => ({
        label: cat.label,
        value: summary[`total${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}`] || 0,
        color: cat.color
    }));

    const total = summary.totalSpend || 1;
    const pctOf = (v) => ((v / total) * 100).toFixed(1);

    // ── Month-over-month change ─────────────────────
    const monthChange = useMemo(() => {
        if (breakdowns.length < 2) return null;
        const sorted = [...breakdowns].sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
        const current = sorted[0]?.totalSpend || 0;
        const prev = sorted[1]?.totalSpend || 1;
        return ((current - prev) / prev * 100).toFixed(1);
    }, [breakdowns]);

    // ── Spend health score ──────────────────────────
    const healthScore = useMemo(
        () => computeHealthScore(summary, breakdowns),
        [summary, breakdowns]
    );
    const healthLevel = getHealthLevel(healthScore);

    // ── Render ───────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-600/10 flex items-center justify-center">
                            <PieChart className="text-emerald-400" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gradient-neon">Spend Transparency</h1>
                            <p className="text-gray-500 text-xs">Where your money goes, visualized</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 self-start">
                    {/* View toggle */}
                    <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-0.5">
                        {['overview', 'periods'].map(view => (
                            <button
                                key={view}
                                onClick={() => setActiveView(view)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeView === view
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {view === 'overview' ? 'Overview' : 'Periods'}
                            </button>
                        ))}
                    </div>
                    <GlassButton onClick={fetchAll} variant="secondary" className="!px-3">
                        <RefreshCw size={15} />
                    </GlassButton>
                    <GlassButton onClick={openAdd}>
                        <Plus size={15} className="mr-1.5" />
                        Add Period
                    </GlassButton>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                        <Loader2 size={36} className="text-neon-cyan" />
                    </motion.div>
                    <span className="mt-4 text-gray-500 text-sm">Loading spend data…</span>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {activeView === 'overview' ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* ── Row 1: Health Ring + Total card + Donut ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-6">
                                {/* Health Score Ring card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="md:col-span-1 lg:col-span-2"
                                >
                                    <div className={`
                                        backdrop-blur-[24px] bg-gradient-to-br ${healthLevel.bg}
                                        border rounded-2xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden
                                    `}
                                        style={{ borderColor: `rgba(${healthLevel.rgb}, 0.15)` }}
                                    >
                                        {/* Subtle glow orb */}
                                        <div
                                            className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20"
                                            style={{ backgroundColor: healthLevel.color }}
                                        />
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <Shield size={14} style={{ color: healthLevel.color }} />
                                            <p className="text-xs text-gray-500 uppercase tracking-[0.15em]">Spend Health</p>
                                        </div>
                                        <SpendHealthRing score={healthScore} size={180} />
                                    </div>
                                </motion.div>

                                {/* Total spend hero card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                    className="md:col-span-1 lg:col-span-2"
                                >
                                    <div className="backdrop-blur-[24px] bg-gradient-to-br from-[rgba(0,255,249,0.06)] to-[rgba(0,212,255,0.02)] border border-[rgba(0,255,249,0.15)] rounded-2xl p-6 h-full flex flex-col justify-between relative overflow-hidden">
                                        {/* Background orbs */}
                                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-neon-cyan/5 blur-3xl" />
                                        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-neon-blue/5 blur-3xl" />

                                        <div className="relative">
                                            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1">Total Spend</p>
                                            <p className="text-4xl font-bold text-white mb-1">
                                                <AnimatedValue value={summary.totalSpend} />
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-500">
                                                    {summary.periodCount || 0} period{summary.periodCount !== 1 ? 's' : ''} tracked
                                                </span>
                                                {monthChange !== null && (
                                                    <InsightTooltip tip={`Spending ${parseFloat(monthChange) > 0 ? 'increased' : 'decreased'} vs last period`}>
                                                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-default ${parseFloat(monthChange) > 0
                                                            ? 'text-red-400 bg-red-400/10 border border-red-400/20'
                                                            : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'
                                                            }`}>
                                                            {parseFloat(monthChange) > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                            {Math.abs(parseFloat(monthChange))}% MoM
                                                        </span>
                                                    </InsightTooltip>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mini breakdown bars */}
                                        <div className="relative mt-6 space-y-2">
                                            {CATEGORIES.map(cat => {
                                                const val = summary[`total${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}`] || 0;
                                                return (
                                                    <div key={cat.key} className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-500 w-20 truncate">{cat.label}</span>
                                                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${pctOf(val)}%` }}
                                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: cat.color }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-gray-600 w-12 text-right">{formatCompact(val)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Donut chart card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="md:col-span-2 lg:col-span-3"
                                >
                                    <div className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 h-full">
                                        <div className="flex flex-col sm:flex-row items-center gap-6 h-full">
                                            <DonutChart data={donutData} size={220} />

                                            {/* Legend */}
                                            <div className="flex-1 space-y-3 w-full">
                                                <p className="text-xs text-gray-500 uppercase tracking-[0.15em] mb-3">Breakdown</p>
                                                {CATEGORIES.map(cat => {
                                                    const val = summary[`total${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}`] || 0;
                                                    const CatIcon = cat.icon;
                                                    const catPct = pctOf(val);
                                                    return (
                                                        <InsightTooltip
                                                            key={cat.key}
                                                            tip={`${cat.label}: ${catPct}% of spend · ${formatCurrency(val)}`}
                                                        >
                                                            <motion.div
                                                                initial={{ opacity: 0, x: 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="flex items-center justify-between group hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors cursor-default"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <div
                                                                        className="w-3 h-3 rounded-full shadow-sm"
                                                                        style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}44` }}
                                                                    />
                                                                    <CatIcon size={14} className="text-gray-500" />
                                                                    <span className="text-sm text-gray-300">{cat.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs text-gray-600">{catPct}%</span>
                                                                    <span className="text-sm font-semibold text-white">{formatCurrency(val)}</span>
                                                                </div>
                                                            </motion.div>
                                                        </InsightTooltip>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* ── Row 2: Category cards ────────────── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {CATEGORIES.map((cat, i) => {
                                    const val = summary[`total${cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}`] || 0;
                                    return <CategoryCard key={cat.key} cat={cat} value={val} total={summary.totalSpend} delay={i * 0.1} periodCount={summary.periodCount || 1} />;
                                })}
                            </div>

                            {/* ── Row 3: Monthly comparison ────────── */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="backdrop-blur-[24px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 size={18} className="text-neon-cyan" />
                                            <h3 className="text-base font-semibold text-white">Monthly Comparison</h3>
                                        </div>
                                        {/* Legend mini */}
                                        <div className="hidden sm:flex items-center gap-3">
                                            {CATEGORIES.map(c => (
                                                <div key={c.key} className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                    <span className="text-[10px] text-gray-500">{c.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <MonthlyComparison breakdowns={breakdowns} />
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        /* ── Periods table view ─────────────── */
                        <motion.div
                            key="periods"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {breakdowns.length === 0 ? (
                                <GlassCard className="p-16 text-center">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                        <PieChart size={48} className="mx-auto mb-4 text-gray-600" />
                                    </motion.div>
                                    <p className="text-gray-400 mb-2 text-lg">No spend periods yet</p>
                                    <p className="text-gray-600 text-sm mb-6">Start tracking your spend by adding your first period</p>
                                    <GlassButton onClick={openAdd}>
                                        <Plus size={16} className="mr-2" /> Add First Period
                                    </GlassButton>
                                </GlassCard>
                            ) : (
                                <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-[rgba(255,255,255,0.1)]">
                                                    <th className="px-5 py-4 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                                                    {CATEGORIES.map(c => (
                                                        <th key={c.key} className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.color }}>{c.label}</th>
                                                    ))}
                                                    <th className="px-5 py-4 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                                    <th className="px-5 py-4 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {breakdowns.map((bd, i) => (
                                                    <motion.tr
                                                        key={bd._id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.04)] transition-colors group"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={14} className="text-gray-600" />
                                                                <div>
                                                                    <div className="font-medium text-white text-sm">{bd.period}</div>
                                                                    <div className="text-[10px] text-gray-600">
                                                                        {formatDate(bd.periodStart)} – {formatDate(bd.periodEnd)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {CATEGORIES.map(c => (
                                                            <td key={c.key} className="px-5 py-4 text-right text-sm font-medium" style={{ color: c.color }}>
                                                                {formatCurrency(bd[c.key])}
                                                            </td>
                                                        ))}
                                                        <td className="px-5 py-4 text-right text-sm font-bold text-white">
                                                            {formatCurrency(bd.totalSpend)}
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className="inline-flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => openEdit(bd)}
                                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(bd._id)}
                                                                    disabled={deleting === bd._id}
                                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                                                                    title="Delete"
                                                                >
                                                                    {deleting === bd._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
                    )}
                </AnimatePresence>
            )}

            {/* Modal */}
            <SpendModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingItem(null); }}
                onSave={handleSave}
                initialData={editingItem}
                saving={saving}
            />
        </div>
    );
};

export default SpendMeterPage;
