import React, { useState, useEffect } from 'react';
import { Shield, Search, MessageCircle, Clock, AlertCircle, CheckCircle, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import GlassTable from '../components/ui/GlassTable';

const TrustLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalLogs: 0, byCategory: {} });
    const [showAskModal, setShowAskModal] = useState(false);
    const [question, setQuestion] = useState('');
    const [explanation, setExplanation] = useState(null);
    const [explaining, setExplaining] = useState(false);
    const [filter, setFilter] = useState('all');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const categoryParam = filter !== 'all' ? `?category=${filter}` : '';
            const response = await fetch(`http://localhost:3001/api/audit${categoryParam}`, {
                headers: { 'x-user-id': 'demo-user-001' }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/audit/summary/stats', {
                headers: { 'x-user-id': 'demo-user-001' }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [filter]);

    const askWhyCharged = async () => {
        if (!question.trim()) return;
        setExplaining(true);
        try {
            const response = await fetch('http://localhost:3001/api/audit/explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify({ question })
            });
            if (response.ok) {
                const data = await response.json();
                setExplanation(data.explanation);
                // Refresh logs to show the AI query
                fetchLogs();
            }
        } catch (error) {
            console.error('Failed to get explanation:', error);
            setExplanation('Sorry, I could not generate an explanation at this time. Please try again.');
        } finally {
            setExplaining(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'FUNDS_ADDED':
            case 'POINTS_EARNED':
                return <CheckCircle className="text-neon-green" size={16} />;
            case 'CHARGE_APPLIED':
            case 'FUNDS_WITHDRAWN':
                return <AlertCircle className="text-neon-pink" size={16} />;
            case 'AI_QUERY':
                return <MessageCircle className="text-neon-cyan" size={16} />;
            default:
                return <Clock className="text-gray-400" size={16} />;
        }
    };

    const columns = [
        {
            header: 'Log ID',
            accessor: 'logId',
            render: (value) => (
                <span className="font-mono text-xs text-gray-400">{value}</span>
            )
        },
        {
            header: 'Action',
            accessor: 'action',
            render: (value) => (
                <div className="flex items-center gap-2">
                    {getActionIcon(value)}
                    <span className="text-white text-sm">{value.replace(/_/g, ' ')}</span>
                </div>
            )
        },
        {
            header: 'Description',
            accessor: 'description',
            render: (value) => (
                <span className="text-gray-300 text-sm">{value}</span>
            )
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (value) => (
                <span className={`px-2 py-1 rounded-lg text-xs capitalize ${value === 'financial' ? 'bg-neon-green/20 text-neon-green' :
                        value === 'security' ? 'bg-neon-pink/20 text-neon-pink' :
                            value === 'ai' ? 'bg-neon-cyan/20 text-neon-cyan' :
                                'bg-white/10 text-gray-300'
                    }`}>
                    {value}
                </span>
            )
        },
        {
            header: 'Proof',
            accessor: 'proof',
            render: (value) => (
                <span className="text-gray-400 text-xs">
                    {value?.source || 'system'}
                </span>
            )
        },
        {
            header: 'Timestamp',
            accessor: 'timestamp',
            render: (value) => (
                <span className="text-gray-400 text-xs">{formatDate(value)}</span>
            )
        }
    ];

    const categories = ['all', 'financial', 'account', 'security', 'ai', 'system'];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Shield className="text-neon-cyan" /> Trust & Audit Logs
                    </h1>
                    <p className="text-gray-400">Immutable record of all account activities with proof</p>
                </div>
                <GlassButton onClick={() => setShowAskModal(true)} glowColor="cyan">
                    <MessageCircle size={16} className="mr-2" />
                    Why Was I Charged?
                </GlassButton>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <GlassCard className="p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Logs</div>
                    <div className="text-2xl font-bold text-white">{stats.totalLogs}</div>
                </GlassCard>
                <GlassCard className="p-4" glowColor="green">
                    <div className="text-gray-400 text-sm mb-1">Financial</div>
                    <div className="text-2xl font-bold text-neon-green">{stats.byCategory?.financial || 0}</div>
                </GlassCard>
                <GlassCard className="p-4" glowColor="pink">
                    <div className="text-gray-400 text-sm mb-1">Security</div>
                    <div className="text-2xl font-bold text-neon-pink">{stats.byCategory?.security || 0}</div>
                </GlassCard>
                <GlassCard className="p-4" glowColor="cyan">
                    <div className="text-gray-400 text-sm mb-1">AI Queries</div>
                    <div className="text-2xl font-bold text-neon-cyan">{stats.byCategory?.ai || 0}</div>
                </GlassCard>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 capitalize text-sm ${filter === cat
                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Logs Table */}
            <GlassTable
                columns={columns}
                data={logs}
                loading={loading}
                emptyMessage="No audit logs yet. Activity will be recorded as you use the platform."
            />

            {/* Ask Why Modal */}
            <AnimatePresence>
                {showAskModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => { setShowAskModal(false); setExplanation(null); setQuestion(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] rounded-2xl p-6 max-w-xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Search className="text-neon-cyan" size={20} />
                                    Ask About Charges
                                </h2>
                                <button
                                    onClick={() => { setShowAskModal(false); setExplanation(null); setQuestion(''); }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {!explanation ? (
                                <>
                                    <p className="text-gray-400 mb-4">
                                        Ask about any charge or transaction and our AI will explain with proof.
                                    </p>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            placeholder="Why was I charged $50?"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                                            onKeyDown={(e) => e.key === 'Enter' && askWhyCharged()}
                                        />
                                        <GlassButton
                                            onClick={askWhyCharged}
                                            disabled={explaining || !question.trim()}
                                            glowColor="cyan"
                                        >
                                            {explaining ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-neon-cyan" />
                                            ) : (
                                                <Send size={18} />
                                            )}
                                        </GlassButton>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Why was I charged?', 'Show my recent fees', 'Explain my last debit'].map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setQuestion(q)}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="text-neon-cyan" size={16} />
                                            <span className="text-neon-cyan text-sm font-medium">AI Explanation</span>
                                        </div>
                                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                            {explanation}
                                        </p>
                                    </div>
                                    <GlassButton
                                        onClick={() => { setExplanation(null); setQuestion(''); }}
                                        variant="secondary"
                                        fullWidth
                                    >
                                        Ask Another Question
                                    </GlassButton>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrustLogsPage;
