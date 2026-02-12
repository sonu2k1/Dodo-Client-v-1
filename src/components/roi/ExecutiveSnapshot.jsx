import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Shield,
    AlertTriangle,
    Target,
    Zap,
    Briefcase,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Lightbulb
} from 'lucide-react';
import useAnomalies from '../../hooks/useAnomalies';

const formatCurrency = (v) => `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatCompact = (v) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return formatCurrency(v);
};

// ── Animated counter ────────────────────────────────
const AnimatedValue = ({ value, prefix = '' }) => {
    return <>{prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>;
};

const ExecutiveSnapshot = ({ summary }) => {
    const { anomalies, riskLevel } = useAnomalies();

    // ── Compute Risk Score (0-100) ──────────────────
    // 100 = Perfect. Deduct for active flags.
    const riskScore = useMemo(() => {
        let score = 100;
        const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
        const warningCount = anomalies.filter(a => a.severity === 'warning').length;

        score -= (criticalCount * 20);
        score -= (warningCount * 5);

        return Math.max(0, Math.min(100, score));
    }, [anomalies]);

    const riskColor = riskScore >= 80 ? '#00ff88' // Green
        : riskScore >= 60 ? '#00d4ff' // Cyan
            : riskScore >= 40 ? '#ffc400' // Amber
                : '#ff3355'; // Red

    const riskLabel = riskScore >= 80 ? 'Low Risk'
        : riskScore >= 60 ? 'Moderate'
            : riskScore >= 40 ? 'Elevated'
                : 'Critical';

    // ── Top Recommendation ──────────────────────────
    const recommendation = useMemo(() => {
        if (anomalies.length === 0) {
            return {
                text: "No active risks detected. Operations are running smoothly within budget.",
                type: 'success'
            };
        }
        // Find highest severity flag
        const topFlag = anomalies.find(a => a.severity === 'critical') || anomalies[0];
        // Extract recommendation from AI explanation or use detail
        // AI explanation often has "Recommendation: ..." or just text.
        // We'll use the aiExplanation if available, else detail.
        return {
            text: topFlag.aiExplanation || topFlag.detail || "Review active anomalies.",
            type: 'warning'
        };
    }, [anomalies]);

    // ── Metrics Config ──────────────────────────────
    const metrics = [
        {
            label: 'Total Spend',
            value: summary.totalSpend,
            subval: 'Lifetime',
            icon: DollarSign,
            color: '#ff5050',
            bg: 'from-red-400/20 to-red-600/5'
        },
        {
            label: 'Total Revenue',
            value: summary.revenue,
            subval: 'Lifetime',
            icon: TrendingUp,
            color: '#00ff88',
            bg: 'from-emerald-400/20 to-emerald-600/5'
        },
        {
            label: 'ROI',
            value: summary.roi,
            subval: 'Average',
            icon: Target,
            color: summary.roi >= 0 ? '#00ff88' : '#ff5050',
            bg: summary.roi >= 0 ? 'from-emerald-400/20 to-emerald-600/5' : 'from-red-400/20 to-red-600/5',
            isPercent: true
        },
        {
            label: 'Risk Score',
            value: riskScore,
            subval: riskLabel,
            icon: Shield,
            color: riskColor,
            bg: `from-[${riskColor}]/20 to-[${riskColor}]/5`, // Dynamic bg might fail with Tailwind JIT if not safe-listed, simpler to use style
            isScore: true
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="backdrop-blur-[24px] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
                {/* Glass sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                <div className="p-6 sm:p-8 relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400/30 to-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(167,139,250,0.3)]">
                            <Briefcase size={16} className="text-indigo-300" />
                        </div>
                        <h2 className="text-lg font-semibold text-white tracking-wide">Executive Snapshot</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 relative">
                        {/* Divider lines (desktop) */}
                        <div className="hidden lg:block absolute top-2 bottom-2 left-1/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                        <div className="hidden lg:block absolute top-2 bottom-2 left-2/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                        <div className="hidden lg:block absolute top-2 bottom-2 left-3/4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                        {metrics.map((m, i) => (
                            <div key={m.label} className="flex flex-col relative px-2">
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-2">
                                    {m.label}
                                    {m.label === 'Risk Score' && (
                                        <span className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: m.color }} />
                                    )}
                                </span>
                                <div className="flex items-baseline gap-1 mt-auto">
                                    <span className="text-3xl font-bold text-white tracking-tight" style={{ textShadow: `0 0 20px ${m.color}33` }}>
                                        {m.isScore ? (
                                            <span style={{ color: m.color }}>{m.value}</span>
                                        ) : m.isPercent ? (
                                            <span style={{ color: m.color }}>{m.value > 0 ? '+' : ''}{m.value.toFixed(0)}%</span>
                                        ) : (
                                            formatCompact(m.value)
                                        )}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 mt-1 font-medium">{m.subval}</span>
                            </div>
                        ))}
                    </div>

                    {/* AI Insight Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-4 items-start sm:items-center">
                        <div className="shrink-0 p-2 rounded-full bg-gradient-to-br from-neon-cyan/20 to-blue-500/10 border border-neon-cyan/20">
                            <Lightbulb size={16} className="text-neon-cyan" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-neon-cyan uppercase tracking-widest font-bold mb-1">
                                {anomalies.length > 0 ? 'Priority Action' : 'System Status'}
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed font-light">
                                {recommendation.text}
                            </p>
                        </div>
                        {anomalies.length > 0 && (
                            <div className="hidden sm:block">
                                <button className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 group-hover/link:translate-x-1">
                                    View Details <ArrowUpRight size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ExecutiveSnapshot;
