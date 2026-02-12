import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Clock,
    Filter,
    ArrowUpDown,
    RefreshCw,
    Loader2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    DollarSign,
    TrendingUp,
    Download,
    FileText
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassTable from '../components/ui/GlassTable';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';

const STATUS_CONFIG = {
    completed: { label: 'Success', icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/15', border: 'border-neon-green/30' },
    failed: { label: 'Failed', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/15', border: 'border-red-400/30' },
    refunded: { label: 'Refunded', icon: RotateCcw, color: 'text-amber-400', bg: 'bg-amber-400/15', border: 'border-amber-400/30' },
    pending: { label: 'Pending', icon: Clock, color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' },
    processing: { label: 'Processing', icon: Loader2, color: 'text-neon-blue', bg: 'bg-neon-blue/15', border: 'border-neon-blue/30' },
};

const PaymentHistoryPage = () => {
    const { authFetch } = useAuth();

    // Data
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & sorting
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const limit = 10;

    // Download state
    const [downloading, setDownloading] = useState(null); // paymentId being downloaded

    // ─── Fetch payments ───
    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, limit, sortBy, sortOrder });
            if (statusFilter) params.set('status', statusFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await authFetch(`${API_BASE}/payment-history?${params}`);
            if (!res.ok) throw new Error(`Failed to fetch payments (${res.status})`);
            const data = await res.json();
            setPayments(data.payments);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Payment history error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authFetch, page, limit, sortBy, sortOrder, statusFilter, startDate, endDate]);

    // ─── Fetch stats ───
    const fetchStats = useCallback(async () => {
        try {
            const res = await authFetch(`${API_BASE}/payment-history/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Stats error:', err);
        }
    }, [authFetch]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [statusFilter, startDate, endDate, sortBy, sortOrder]);

    // ─── Helpers ───
    const formatCurrency = (amount, currency = 'INR') => {
        const display = amount >= 100 ? (amount / 100).toFixed(2) : amount.toFixed(2);
        const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
        return `${symbol}${display}`;
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    const toggleSort = () => {
        if (sortBy === 'amount') {
            setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy('amount');
            setSortOrder('desc');
        }
    };

    const toggleDateSort = () => {
        if (sortBy === 'date') {
            setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy('date');
            setSortOrder('desc');
        }
    };

    // ─── Invoice Download ───
    const handleDownloadInvoice = async (paymentId) => {
        setDownloading(paymentId);
        try {
            const res = await authFetch(`${API_BASE}/payment-history/${paymentId}/invoice`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || 'Download failed');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${paymentId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Invoice download error:', err);
            alert(err.message || 'Failed to download invoice.');
        } finally {
            setDownloading(null);
        }
    };

    // ─── Status badge ───
    const StatusBadge = ({ status }) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
                <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
                {cfg.label}
            </span>
        );
    };

    // ─── Table columns ───
    const columns = [
        {
            header: 'Payment ID',
            accessor: 'paymentId',
            render: (val) => <span className="font-mono text-xs text-gray-400">{val}</span>
        },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (val, row) => (
                <span className="font-semibold text-white">
                    {formatCurrency(val, row.currency)}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (val) => <StatusBadge status={val} />
        },
        {
            header: 'Gateway',
            accessor: 'gateway',
            render: (val) => (
                <span className="capitalize text-gray-300 text-sm">{val || '—'}</span>
            )
        },
        {
            header: 'Reference ID',
            accessor: 'gatewayPaymentId',
            render: (val) => (
                <span className="font-mono text-xs text-gray-500">{val || '—'}</span>
            )
        },
        {
            header: 'Date',
            accessor: 'createdAt',
            render: (val) => <span className="text-gray-400 text-xs">{formatDate(val)}</span>
        },
        {
            header: '',
            accessor: '_id',
            render: (_val, row) => {
                const canDownload = ['completed', 'refunded'].includes(row.status);
                if (!canDownload) return null;

                const isLoading = downloading === row.paymentId;
                return (
                    <button
                        onClick={() => handleDownloadInvoice(row.paymentId)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20
                            hover:bg-neon-cyan/20 hover:border-neon-cyan/40
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all whitespace-nowrap"
                        title="Download Invoice PDF"
                    >
                        {isLoading
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Download size={12} />
                        }
                        <span className="hidden sm:inline">Invoice</span>
                    </button>
                );
            }
        }
    ];

    // ─── Animation ───
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    // ─── Error state ───
    if (error && payments.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-neon">Payment History</h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                    <p className="text-gray-300 mb-4">{error}</p>
                    <button onClick={fetchPayments} className="btn-glass-primary px-6 py-2 flex items-center gap-2 mx-auto">
                        <RefreshCw size={16} /> Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
            {/* ─── Header ─── */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-neon flex items-center gap-2 sm:gap-3">
                        <CreditCard size={28} className="text-neon-cyan sm:hidden" />
                        <CreditCard size={36} className="text-neon-cyan hidden sm:block" />
                        Payment History
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {pagination.total} payment{pagination.total !== 1 ? 's' : ''} total
                    </p>
                </div>
                <button
                    onClick={() => { fetchPayments(); fetchStats(); }}
                    disabled={loading}
                    className="btn-glass px-5 py-2.5 flex items-center gap-2 text-sm font-medium hover:border-neon-cyan/40 transition-all self-start"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Refresh
                </button>
            </motion.div>

            {/* ─── Stats Cards ─── */}
            {stats && (
                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <GlassCard className="p-4 sm:p-5" hover>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-neon-cyan" />
                            <span className="text-gray-400 text-xs sm:text-sm">Total</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-white">{stats.total || 0}</p>
                    </GlassCard>
                    <GlassCard className="p-4 sm:p-5" glowColor="green" hover>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 size={18} className="text-neon-green" />
                            <span className="text-gray-400 text-xs sm:text-sm">Success</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-neon-green">{stats.success || 0}</p>
                    </GlassCard>
                    <GlassCard className="p-4 sm:p-5" glowColor="pink" hover>
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle size={18} className="text-red-400" />
                            <span className="text-gray-400 text-xs sm:text-sm">Failed</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-red-400">{stats.failed || 0}</p>
                    </GlassCard>
                    <GlassCard className="p-4 sm:p-5" hover>
                        <div className="flex items-center gap-2 mb-2">
                            <RotateCcw size={18} className="text-amber-400" />
                            <span className="text-gray-400 text-xs sm:text-sm">Refunded</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-amber-400">{stats.refunded || 0}</p>
                    </GlassCard>
                </motion.div>
            )}

            {/* ─── Filters ─── */}
            <motion.div variants={itemVariants} className="glass-card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters & Sorting</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Status filter */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-neon-cyan/40 transition-colors cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">✅ Success</option>
                            <option value="failed">❌ Failed</option>
                            <option value="refunded">🔄 Refunded</option>
                            <option value="pending">⏳ Pending</option>
                        </select>
                    </div>

                    {/* Start date */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-colors"
                        />
                    </div>

                    {/* End date */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-colors"
                        />
                    </div>

                    {/* Sort toggles */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Sort By</label>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleDateSort}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border transition-all ${sortBy === 'date'
                                    ? 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Calendar size={14} />
                                Date
                                {sortBy === 'date' && (
                                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                                )}
                            </button>
                            <button
                                onClick={toggleSort}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm border transition-all ${sortBy === 'amount'
                                    ? 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan'
                                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <TrendingUp size={14} />
                                Amount
                                {sortBy === 'amount' && (
                                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active filter chips */}
                {(statusFilter || startDate || endDate) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                        {statusFilter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                Status: {statusFilter}
                                <button onClick={() => setStatusFilter('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        {startDate && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                From: {startDate}
                                <button onClick={() => setStartDate('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        {endDate && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                                To: {endDate}
                                <button onClick={() => setEndDate('')} className="ml-1 hover:text-white">×</button>
                            </span>
                        )}
                        <button
                            onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); }}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </motion.div>

            {/* ─── Table ─── */}
            <motion.div variants={itemVariants}>
                <GlassTable
                    columns={columns}
                    data={payments}
                    loading={loading}
                    emptyMessage="No payments found. Try adjusting your filters."
                />
            </motion.div>

            {/* ─── Pagination ─── */}
            {pagination.totalPages > 1 && (
                <motion.div variants={itemVariants} className="flex items-center justify-between glass-card px-4 sm:px-6 py-3">
                    <p className="text-xs sm:text-sm text-gray-500">
                        Page {pagination.page} of {pagination.totalPages}
                        <span className="hidden sm:inline"> · {pagination.total} results</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Page number buttons */}
                        <div className="hidden sm:flex gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${pageNum === page
                                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile page display */}
                        <span className="sm:hidden text-xs text-gray-400">
                            {page} / {pagination.totalPages}
                        </span>

                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages}
                            className="p-2 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default PaymentHistoryPage;
