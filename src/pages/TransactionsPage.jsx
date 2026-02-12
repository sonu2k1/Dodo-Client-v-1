import React, { useState, useEffect, useCallback } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    RefreshCw,
    FileText,
    Loader2,
    ChevronDown,
    ChevronRight,
    CreditCard,
    RotateCcw,
    Wrench,
    ArrowRightLeft,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    StickyNote,
    Zap,
    Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassTable from '../components/ui/GlassTable';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { InvoiceModal } from '../components/invoice';
import { useInvoice } from '../hooks/useInvoice';
import { useAuth } from '../context/AuthContext';

// ── Config objects ──────────────────────────────────────
const EVENT_TYPE_CONFIG = {
    payment: { label: 'Payment', icon: CreditCard, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/25' },
    refund: { label: 'Refund', icon: RotateCcw, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/25' },
    manual_adjustment: { label: 'Adjustment', icon: Wrench, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/25' },
    points_transfer: { label: 'Points', icon: ArrowRightLeft, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/25' },
};

const SOURCE_CONFIG = {
    stripe: { label: 'Stripe', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/25' },
    razorpay: { label: 'Razorpay', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/25' },
    admin: { label: 'Admin', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/25' },
    system: { label: 'System', color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' },
    ai_concierge: { label: 'AI Concierge', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/25' },
};

const AUDIT_ACTION_CONFIG = {
    created: { icon: Zap, color: 'text-neon-cyan', dotColor: 'bg-neon-cyan' },
    processing: { icon: Loader2, color: 'text-blue-400', dotColor: 'bg-blue-400' },
    completed: { icon: CheckCircle2, color: 'text-neon-green', dotColor: 'bg-neon-green' },
    failed: { icon: XCircle, color: 'text-red-400', dotColor: 'bg-red-400' },
    reversed: { icon: RotateCcw, color: 'text-amber-400', dotColor: 'bg-amber-400' },
    flagged: { icon: AlertTriangle, color: 'text-orange-400', dotColor: 'bg-orange-400' },
    note_added: { icon: StickyNote, color: 'text-gray-400', dotColor: 'bg-gray-400' },
};

// ── Component ───────────────────────────────────────────
const TransactionsPage = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalCredits: 0, totalDebits: 0, netBalance: 0 });
    const [filter, setFilter] = useState('all');
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [generatingInvoice, setGeneratingInvoice] = useState(null);

    const {
        currentInvoice,
        generateFromTransaction,
        regenerateExplanation,
        loading: invoiceLoading
    } = useInvoice();

    // ─── Fetch ──────────────────────────────────────────
    const fetchTransactions = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('type', filter);
            if (eventTypeFilter) params.set('eventType', eventTypeFilter);
            if (sourceFilter) params.set('source', sourceFilter);

            const qs = params.toString();
            const response = await authFetch(`http://localhost:3001/api/transactions${qs ? `?${qs}` : ''}`);
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    }, [authFetch, isAuthenticated, filter, eventTypeFilter, sourceFilter]);

    const fetchStats = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await authFetch('http://localhost:3001/api/transactions/stats/summary');
            if (response.ok) setStats(await response.json());
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, [authFetch, isAuthenticated]);

    useEffect(() => { fetchTransactions(); fetchStats(); }, [fetchTransactions, fetchStats]);

    // ─── Handlers ───────────────────────────────────────
    const handleGenerateInvoice = async (transactionId) => {
        setGeneratingInvoice(transactionId);
        try {
            await generateFromTransaction(transactionId);
            setShowInvoiceModal(true);
        } catch (error) {
            console.error('Failed to generate invoice:', error);
        } finally {
            setGeneratingInvoice(null);
        }
    };

    const toggleExpand = (rowIndex) => {
        setExpandedRow(prev => prev === rowIndex ? null : rowIndex);
    };

    // ─── Helpers ────────────────────────────────────────
    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const formatTime = (dateString) =>
        new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

    // ─── Badges ─────────────────────────────────────────
    const EventTypeBadge = ({ eventType }) => {
        const cfg = EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.payment;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                <Icon size={11} />
                {cfg.label}
            </span>
        );
    };

    const SourceBadge = ({ source }) => {
        const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.system;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                <Server size={10} />
                {cfg.label}
            </span>
        );
    };

    // ─── Table columns ──────────────────────────────────
    const columns = [
        {
            header: '',
            accessor: '_id',
            render: (_val, _row, rowIndex) => (
                <button
                    onClick={() => toggleExpand(rowIndex)}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    title="Expand details"
                >
                    {expandedRow === rowIndex
                        ? <ChevronDown size={16} />
                        : <ChevronRight size={16} />}
                </button>
            )
        },
        {
            header: 'Transaction ID',
            accessor: 'transactionId',
            render: (value) => (
                <span className="font-mono text-sm text-gray-300">{value}</span>
            )
        },
        {
            header: 'Type',
            accessor: 'type',
            render: (value) => (
                <div className={`flex items-center gap-2 ${value === 'credit' ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {value === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    <span className="capitalize font-medium">{value}</span>
                </div>
            )
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (value, row) => (
                <span className={`font-bold ${row.type === 'credit' ? 'text-neon-green' : 'text-white'}`}>
                    {row.type === 'credit' ? '+' : '-'}${value.toFixed(2)}
                </span>
            )
        },
        {
            header: 'Event',
            accessor: 'eventType',
            render: (value) => <EventTypeBadge eventType={value || 'payment'} />
        },
        {
            header: 'Source',
            accessor: 'source',
            render: (value) => <SourceBadge source={value || 'system'} />
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (value) => (
                <span className="px-2 py-1 rounded-lg bg-white/10 text-xs text-gray-300 capitalize">
                    {value?.replace('_', ' ') || 'Other'}
                </span>
            )
        },
        {
            header: 'Timestamp',
            accessor: 'createdAt',
            render: (value) => (
                <span className="text-gray-400 text-sm">{formatDate(value)}</span>
            )
        },
        {
            header: 'Invoice',
            accessor: 'transactionId',
            render: (value) => (
                <button
                    onClick={() => handleGenerateInvoice(value)}
                    disabled={generatingInvoice === value}
                    className="p-2 hover:bg-indigo-500/20 rounded-lg transition-colors
                             text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                    title="Generate Invoice"
                >
                    {generatingInvoice === value
                        ? <Loader2 size={16} className="animate-spin" />
                        : <FileText size={16} />}
                </button>
            )
        }
    ];

    // ─── Expanded row content ───────────────────────────
    const renderExpandedRow = (row) => {
        const trail = row.auditTrail || [];

        return (
            <div className="bg-[rgba(255,255,255,0.02)] border-t border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Detail badges */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Details</h4>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Reason</span>
                                <span className="text-sm text-gray-200">{row.reason}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Event Type</span>
                                <EventTypeBadge eventType={row.eventType || 'payment'} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Source</span>
                                <SourceBadge source={row.source || 'system'} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Status</span>
                                <span className={`text-sm font-medium capitalize ${row.status === 'completed' ? 'text-neon-green'
                                        : row.status === 'failed' ? 'text-red-400'
                                            : 'text-gray-400'
                                    }`}>
                                    {row.status}
                                </span>
                            </div>
                            {row.auditRefId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Audit Ref ID</span>
                                    <span className="font-mono text-xs text-neon-cyan">{row.auditRefId}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Audit Trail Timeline */}
                    <div className="lg:col-span-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Audit Trail
                            <span className="ml-2 text-gray-600">({trail.length} event{trail.length !== 1 ? 's' : ''})</span>
                        </h4>

                        {trail.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm">
                                <Clock size={20} className="mx-auto mb-2 opacity-50" />
                                No audit trail entries yet
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-neon-cyan/40 via-white/10 to-transparent" />

                                <div className="space-y-4">
                                    {trail.map((entry, i) => {
                                        const cfg = AUDIT_ACTION_CONFIG[entry.action] || AUDIT_ACTION_CONFIG.note_added;
                                        const Icon = cfg.icon;
                                        const isLast = i === trail.length - 1;
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="flex items-start gap-3 relative"
                                            >
                                                {/* Dot */}
                                                <div className={`relative z-10 w-[19px] h-[19px] rounded-full flex items-center justify-center shrink-0 ${isLast ? cfg.dotColor : 'bg-white/10'
                                                    } ${isLast ? 'ring-2 ring-offset-1 ring-offset-transparent ring-white/20' : ''}`}>
                                                    <Icon size={10} className={isLast ? 'text-white' : cfg.color} />
                                                </div>

                                                {/* Content */}
                                                <div className={`flex-1 pb-1 ${isLast ? '' : 'opacity-80'}`}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-sm font-medium capitalize ${cfg.color}`}>
                                                            {entry.action.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                                                            {entry.actor}
                                                        </span>
                                                        <span className="text-[10px] text-gray-600 ml-auto">
                                                            {entry.timestamp ? formatTime(entry.timestamp) : ''}
                                                        </span>
                                                    </div>
                                                    {entry.status && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{entry.status}</p>
                                                    )}
                                                    {entry.note && (
                                                        <p className="text-xs text-gray-500 mt-0.5 italic">"{entry.note}"</p>
                                                    )}
                                                    {entry.timestamp && (
                                                        <p className="text-[10px] text-gray-600 mt-0.5">
                                                            {formatDate(entry.timestamp)}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Transaction Ledger</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Complete history of all transactions</p>
                </div>
                <GlassButton onClick={() => { fetchTransactions(); fetchStats(); }} variant="secondary" className="self-start">
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                </GlassButton>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <GlassCard glowColor="green" className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <ArrowDownLeft className="text-neon-green" size={20} />
                        <span className="text-gray-400">Total Credits</span>
                    </div>
                    <h3 className="text-2xl font-bold text-neon-green">${stats.totalCredits?.toFixed(2) || '0.00'}</h3>
                </GlassCard>

                <GlassCard glowColor="pink" className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <ArrowUpRight className="text-neon-pink" size={20} />
                        <span className="text-gray-400">Total Debits</span>
                    </div>
                    <h3 className="text-2xl font-bold text-neon-pink">${stats.totalDebits?.toFixed(2) || '0.00'}</h3>
                </GlassCard>

                <GlassCard glowColor="cyan" className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-400">Net Balance</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-neon-cyan' : 'text-neon-pink'}`}>
                        ${stats.netBalance?.toFixed(2) || '0.00'}
                    </h3>
                </GlassCard>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Type filter */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Type</label>
                        <div className="flex gap-2">
                            {['all', 'credit', 'debit'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm border transition-all capitalize ${filter === type
                                        ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Event type filter */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Event Type</label>
                        <select
                            value={eventTypeFilter}
                            onChange={e => setEventTypeFilter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-neon-cyan/40 transition-colors cursor-pointer"
                        >
                            <option value="">All Events</option>
                            <option value="payment">💳 Payment</option>
                            <option value="refund">🔄 Refund</option>
                            <option value="manual_adjustment">🔧 Manual Adjustment</option>
                            <option value="points_transfer">💠 Points Transfer</option>
                        </select>
                    </div>

                    {/* Source filter */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Source</label>
                        <select
                            value={sourceFilter}
                            onChange={e => setSourceFilter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-neon-cyan/40 transition-colors cursor-pointer"
                        >
                            <option value="">All Sources</option>
                            <option value="stripe">Stripe</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="admin">Admin</option>
                            <option value="system">System</option>
                            <option value="ai_concierge">AI Concierge</option>
                        </select>
                    </div>
                </div>

                {/* Active filter chips */}
                {(filter !== 'all' || eventTypeFilter || sourceFilter) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                        {filter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                Type: {filter}
                                <button onClick={() => setFilter('all')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        {eventTypeFilter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                Event: {eventTypeFilter}
                                <button onClick={() => setEventTypeFilter('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        {sourceFilter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                Source: {sourceFilter}
                                <button onClick={() => setSourceFilter('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        <button
                            onClick={() => { setFilter('all'); setEventTypeFilter(''); setSourceFilter(''); }}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Transactions Table */}
            <GlassTable
                columns={columns}
                data={transactions}
                loading={loading}
                emptyMessage="No transactions found. Start by adding funds or making purchases!"
                expandedRowIndex={expandedRow}
                renderExpandedRow={renderExpandedRow}
            />

            {/* Invoice Modal */}
            <InvoiceModal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                invoice={currentInvoice}
                onRegenerateExplanation={regenerateExplanation}
                loading={invoiceLoading}
            />
        </div>
    );
};

export default TransactionsPage;
