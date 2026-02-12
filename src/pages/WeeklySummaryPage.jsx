import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    RefreshCw,
    Loader2,
    ListTodo,
    DollarSign,
    Users,
    Zap,
    ShieldAlert,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Trophy,
    XCircle,
    Brain,
    Eye,
    CalendarClock,
    Target
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

/**
 * WeeklySummaryPage — Premium glassmorphism executive summary dashboard
 */
const WeeklySummaryPage = () => {
    const { authFetch } = useAuth();
    const [summary, setSummary] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatedAt, setGeneratedAt] = useState(null);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE}/ai/weekly-summary`);
            if (!res.ok) throw new Error(`Failed to fetch summary (${res.status})`);
            const data = await res.json();
            setSummary(data.summary);
            setRawData(data.rawData);
            setGeneratedAt(data.generatedAt);
        } catch (err) {
            console.error('Weekly summary fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // ─── Skeleton Loader ───
    const SkeletonCard = ({ className = '', lines = 3 }) => (
        <div className={`glass-card p-6 animate-pulse ${className}`}>
            <div className="h-5 w-1/3 bg-white/10 rounded mb-4" />
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="h-3 bg-white/5 rounded mb-2" style={{ width: `${85 - i * 15}%` }} />
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-72 bg-white/10 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
                </div>
                <SkeletonCard lines={2} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard lines={4} />
                    <SkeletonCard lines={4} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard lines={3} />
                    <SkeletonCard lines={3} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-4xl font-bold text-gradient-neon">Weekly Summary</h1>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 text-center"
                >
                    <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button onClick={fetchSummary} className="btn-glass-primary px-6 py-2 flex items-center gap-2 mx-auto">
                        <RefreshCw size={16} /> Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    if (!summary) return null;

    const trendIcon = summary.financial?.trend === 'up'
        ? <TrendingUp size={18} className="text-green-400" />
        : summary.financial?.trend === 'down'
            ? <TrendingDown size={18} className="text-red-400" />
            : <Minus size={18} className="text-gray-400" />;

    const priorityColors = {
        LOW: 'text-gray-400 border-gray-400/30',
        MEDIUM: 'text-blue-400 border-blue-400/30',
        HIGH: 'text-amber-400 border-amber-400/30',
        URGENT: 'text-red-400 border-red-400/30'
    };

    const severityColors = {
        low: 'border-gray-500/30 bg-gray-500/5',
        medium: 'border-amber-500/30 bg-amber-500/5',
        high: 'border-red-500/30 bg-red-500/5',
        critical: 'border-red-600/40 bg-red-600/10'
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* ─── Header ─── */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gradient-neon flex items-center gap-3">
                        <BarChart3 size={36} className="text-neon-cyan" />
                        Weekly Summary
                    </h1>
                    {generatedAt && (
                        <p className="text-sm text-gray-500 mt-1">
                            Generated {new Date(generatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <button
                    onClick={fetchSummary}
                    disabled={loading}
                    className="btn-glass px-5 py-2.5 flex items-center gap-2 text-sm font-medium hover:border-neon-cyan/40 transition-all"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Refresh
                </button>
            </motion.div>

            {/* ─── Overview Card ─── */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl border border-[rgba(0,212,255,0.2)] bg-gradient-to-br from-[rgba(0,212,255,0.08)] to-[rgba(180,0,255,0.05)] backdrop-blur-[24px] p-8"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />
                <div className="relative">
                    <h2 className="text-lg font-semibold text-neon-cyan mb-3 flex items-center gap-2">
                        <Activity size={20} /> Executive Overview
                    </h2>
                    <p className="text-gray-200 text-base leading-relaxed">{summary.overview}</p>
                </div>
            </motion.div>

            {/* ─── Stats Row ─── */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Tasks Completed"
                    value={rawData?.tasks?.completedThisWeek ?? 0}
                    subtitle={`of ${rawData?.tasks?.newThisWeek ?? 0} new`}
                    icon={<CheckCircle2 size={22} />}
                    color="green"
                />
                <StatCard
                    label="In Progress"
                    value={rawData?.tasks?.statusCounts?.IN_PROGRESS ?? 0}
                    subtitle="active tasks"
                    icon={<Clock size={22} />}
                    color="blue"
                />
                <StatCard
                    label="Net Cash Flow"
                    value={`$${(summary.financial?.netFlow ?? 0).toFixed(0)}`}
                    subtitle={summary.financial?.trend === 'up' ? '↑ Positive' : summary.financial?.trend === 'down' ? '↓ Negative' : '— Stable'}
                    icon={summary.financial?.netFlow >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                    color={summary.financial?.netFlow >= 0 ? 'cyan' : 'pink'}
                />
                <StatCard
                    label="Transactions"
                    value={rawData?.transactions?.count ?? 0}
                    subtitle="this week"
                    icon={<DollarSign size={22} />}
                    color="purple"
                />
            </motion.div>

            {/* ─── Tasks & Financial ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks Section */}
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-neon-green flex items-center gap-2">
                        <ListTodo size={20} /> Tasks
                    </h3>
                    <p className="text-gray-300 text-sm">{summary.tasks?.summary}</p>

                    {/* Completion Rate Bar */}
                    <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Completion Rate</span>
                            <span>{summary.tasks?.completionRate ?? 0}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${summary.tasks?.completionRate ?? 0}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan"
                            />
                        </div>
                    </div>

                    {/* Highlights */}
                    {summary.tasks?.highlights?.length > 0 && (
                        <ul className="space-y-2">
                            {summary.tasks.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-green shrink-0" />
                                    {h}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Recommendations */}
                    {summary.tasks?.recommendations?.length > 0 && (
                        <div className="pt-3 border-t border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recommendations</p>
                            {summary.tasks.recommendations.map((r, i) => (
                                <p key={i} className="text-sm text-gray-400 flex items-start gap-2 mb-1">
                                    <Zap size={14} className="text-neon-cyan mt-0.5 shrink-0" /> {r}
                                </p>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Financial Section */}
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-neon-blue flex items-center gap-2">
                        <DollarSign size={20} /> Financial Overview
                    </h3>
                    <p className="text-gray-300 text-sm">{summary.financial?.summary}</p>

                    {/* Credit / Debit Bars */}
                    <div className="space-y-3">
                        <MetricBar label="Credits" value={summary.financial?.totalCredits ?? 0} color="from-green-500 to-emerald-400" />
                        <MetricBar label="Debits" value={summary.financial?.totalDebits ?? 0} color="from-red-500 to-rose-400" />
                    </div>

                    {/* Net Flow */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Net Flow:</span>
                        <span className={summary.financial?.netFlow >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                            ${(summary.financial?.netFlow ?? 0).toFixed(2)}
                        </span>
                        {trendIcon}
                    </div>

                    {/* Highlights */}
                    {summary.financial?.highlights?.length > 0 && (
                        <ul className="space-y-2 pt-2">
                            {summary.financial.highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-blue shrink-0" />
                                    {h}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Top Categories */}
                    {summary.financial?.topCategories?.length > 0 && (
                        <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2">
                            {summary.financial.topCategories.map((cat, i) => (
                                <span key={i} className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ─── Client Insights ─── */}
            <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-neon-purple flex items-center gap-2">
                    <Users size={20} /> Client Insights
                </h3>
                <p className="text-gray-300 text-sm">{summary.clientInsights?.summary}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <MiniStat label="Engagement" value={summary.clientInsights?.engagementLevel || '—'} />
                    <MiniStat label="Spending" value={summary.clientInsights?.spendingPattern || '—'} />
                    <MiniStat label="Decisions" value={summary.clientInsights?.keyDecisions?.length ?? 0} />
                </div>

                {summary.clientInsights?.highlights?.length > 0 && (
                    <ul className="space-y-2">
                        {summary.clientInsights.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-purple shrink-0" />
                                {h}
                            </li>
                        ))}
                    </ul>
                )}
            </motion.div>
            {/* ─── AI Insights: Successes, Failures, Reasoning ─── */}
            {summary.insights && (
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Section Header */}
                    <h2 className="text-2xl font-bold text-gradient-neon flex items-center gap-3">
                        <Brain size={24} className="text-neon-cyan" />
                        AI-Driven Insights
                    </h2>

                    {/* Successes */}
                    {summary.insights.successes?.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                                <Trophy size={20} /> Successes
                            </h3>
                            <div className="space-y-3">
                                {summary.insights.successes.map((s, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/8 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-green-300 text-sm">{s.title}</span>
                                            {s.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/30 text-green-400">
                                                    {s.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-300 mb-2">{s.description}</p>
                                        <div className="flex items-start gap-2 text-xs text-green-400/80 bg-green-500/5 rounded-lg px-3 py-2">
                                            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                            <span className="italic">{s.evidence}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Failures */}
                    {summary.insights.failures?.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                                <XCircle size={20} /> Failures & Issues
                            </h3>
                            <div className="space-y-4">
                                {summary.insights.failures.map((f, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 rounded-xl border border-red-500/20 bg-red-500/5"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-red-300 text-sm">{f.title}</span>
                                            {f.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full border border-red-500/30 text-red-400">
                                                    {f.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-300 mb-3">{f.description}</p>

                                        <div className="space-y-2">
                                            {f.rootCause && (
                                                <div className="text-xs bg-red-500/5 rounded-lg px-3 py-2">
                                                    <span className="text-red-400 font-semibold">Root Cause: </span>
                                                    <span className="text-gray-400">{f.rootCause}</span>
                                                </div>
                                            )}
                                            {f.impact && (
                                                <div className="text-xs bg-amber-500/5 rounded-lg px-3 py-2">
                                                    <span className="text-amber-400 font-semibold">Impact: </span>
                                                    <span className="text-gray-400">{f.impact}</span>
                                                </div>
                                            )}
                                            {f.suggestedFix && (
                                                <div className="text-xs bg-blue-500/5 rounded-lg px-3 py-2">
                                                    <span className="text-blue-400 font-semibold">Suggested Fix: </span>
                                                    <span className="text-gray-400">{f.suggestedFix}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Strategic Reasoning */}
                    {summary.insights.reasoning?.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-neon-cyan flex items-center gap-2">
                                <Brain size={20} /> Strategic Reasoning
                            </h3>
                            <div className="space-y-4">
                                {summary.insights.reasoning.map((r, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.15 }}
                                        className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5"
                                    >
                                        <span className="font-medium text-cyan-300 text-sm">{r.title}</span>

                                        <div className="mt-3 space-y-2 ml-1 border-l-2 border-cyan-500/20 pl-4">
                                            <div className="text-xs">
                                                <span className="text-gray-500 uppercase tracking-wider">Observation</span>
                                                <p className="text-gray-300 mt-0.5">{r.observation}</p>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-gray-500 uppercase tracking-wider">Reasoning</span>
                                                <p className="text-gray-300 mt-0.5">{r.reasoning}</p>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-gray-500 uppercase tracking-wider">Recommendation</span>
                                                <p className="text-cyan-400 mt-0.5 font-medium">{r.recommendation}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
            {/* ─── Predictive Insights ─── */}
            {summary.predictions && (
                <motion.div variants={itemVariants} className="space-y-6">
                    <h2 className="text-2xl font-bold text-gradient-neon flex items-center gap-3">
                        <Eye size={24} className="text-neon-purple" />
                        Predictive Outlook
                    </h2>

                    {/* Key Risks */}
                    {summary.predictions.keyRisks?.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                                <AlertTriangle size={20} /> Key Risks
                            </h3>
                            <div className="space-y-3">
                                {summary.predictions.keyRisks.map((r, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-200 text-sm">{r.risk}</span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${r.likelihood === 'high' ? 'border-red-500/30 text-red-400' :
                                                    r.likelihood === 'medium' ? 'border-amber-500/30 text-amber-400' :
                                                        'border-gray-500/30 text-gray-400'
                                                    }`}>{r.likelihood}</span>
                                                <span className="text-xs text-gray-500">{r.timeframe}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-1.5">
                                            <span className="text-amber-400/80">Based on:</span> {r.basedOn}
                                        </div>
                                        <div className="text-xs bg-amber-500/5 rounded-lg px-3 py-2">
                                            <span className="text-amber-400 font-semibold">Mitigation: </span>
                                            <span className="text-gray-400">{r.mitigation}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Next-Week Actions */}
                    {summary.predictions.nextWeekActions?.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-neon-green flex items-center gap-2">
                                <CalendarClock size={20} /> Next-Week Actions
                            </h3>
                            <div className="space-y-3">
                                {summary.predictions.nextWeekActions.map((a, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-200 text-sm">{a.action}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full border border-neon-green/30 text-neon-green shrink-0">
                                                {a.timeline}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-2">{a.why}</p>
                                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <CheckCircle2 size={12} className="text-green-500" />
                                            <span className="italic">{a.expectedOutcome}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Recommended Priorities */}
                    {summary.predictions.recommendedPriorities?.length > 0 && (
                        <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-neon-cyan flex items-center gap-2">
                                <Target size={20} /> Recommended Priorities
                            </h3>
                            <div className="space-y-3">
                                {summary.predictions.recommendedPriorities.map((p, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.12 }}
                                        className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex gap-4"
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-lg shrink-0">
                                            {p.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-cyan-300 text-sm">{p.title}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[p.urgency] || priorityColors.MEDIUM
                                                    }`}>{p.urgency}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-1">{p.rationale}</p>
                                            <p className="text-xs text-gray-500">
                                                <span className="text-gray-400">Current:</span> {p.currentStatus}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* ─── Action Items & Risk Alerts ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Action Items */}
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-neon-cyan flex items-center gap-2">
                        <Zap size={20} /> Action Items
                    </h3>
                    {summary.actionItems?.length > 0 ? (
                        <div className="space-y-3">
                            {summary.actionItems.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-200 text-sm">{item.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[item.priority] || priorityColors.MEDIUM}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No action items this week. 🎉</p>
                    )}
                </motion.div>

                {/* Risk Alerts */}
                <motion.div variants={itemVariants} className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                        <ShieldAlert size={20} /> Risk Alerts
                    </h3>
                    {summary.riskAlerts?.length > 0 ? (
                        <div className="space-y-3">
                            {summary.riskAlerts.map((alert, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`p-4 rounded-xl border ${severityColors[alert.severity] || severityColors.medium}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle size={14} className={
                                            alert.severity === 'critical' ? 'text-red-400' :
                                                alert.severity === 'high' ? 'text-red-400' :
                                                    alert.severity === 'medium' ? 'text-amber-400' : 'text-gray-400'
                                        } />
                                        <span className="font-medium text-gray-200 text-sm">{alert.title}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 ml-6">{alert.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No risk alerts. All systems healthy. ✅</p>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

// ─── Helper Components ───

const StatCard = ({ label, value, subtitle, icon, color }) => {
    const colorMap = {
        green: { bg: 'from-green-500/10 to-green-500/5', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(0,255,136,0.1)]' },
        blue: { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(0,212,255,0.1)]' },
        cyan: { bg: 'from-cyan-400/10 to-cyan-400/5', border: 'border-cyan-400/20', text: 'text-cyan-400', glow: 'shadow-[0_0_20px_rgba(0,255,249,0.1)]' },
        purple: { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(180,0,255,0.1)]' },
        pink: { bg: 'from-pink-500/10 to-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-400', glow: 'shadow-[0_0_20px_rgba(255,0,229,0.1)]' },
    };
    const c = colorMap[color] || colorMap.cyan;

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            className={`rounded-2xl border ${c.border} bg-gradient-to-br ${c.bg} backdrop-blur-[20px] p-5 ${c.glow} transition-shadow`}
        >
            <div className={`${c.text} mb-2`}>{icon}</div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </motion.div>
    );
};

const MetricBar = ({ label, value, color }) => {
    const maxVal = Math.max(value, 1);
    return (
        <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{label}</span>
                <span>${value.toFixed(2)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${color}`}
                    style={{ maxWidth: '100%' }}
                />
            </div>
        </div>
    );
};

const MiniStat = ({ label, value }) => (
    <div className="p-3 rounded-xl border border-white/8 bg-white/[0.02] text-center">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-200 capitalize">{value}</p>
    </div>
);

export default WeeklySummaryPage;
