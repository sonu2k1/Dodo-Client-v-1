import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Filter, RefreshCw } from 'lucide-react';
import GlassTable from '../components/ui/GlassTable';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCredits: 0,
        totalDebits: 0,
        netBalance: 0
    });
    const [filter, setFilter] = useState('all'); // all, credit, debit

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const typeParam = filter !== 'all' ? `?type=${filter}` : '';
            const response = await fetch(`http://localhost:3001/api/transactions${typeParam}`, {
                headers: { 'x-user-id': 'demo-user-001' }
            });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/transactions/stats/summary', {
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
        fetchTransactions();
        fetchStats();
    }, [filter]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
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
            header: 'Reason',
            accessor: 'reason',
            render: (value) => (
                <span className="text-gray-300">{value}</span>
            )
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
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Transaction Ledger</h1>
                    <p className="text-gray-400">Complete history of all transactions</p>
                </div>
                <GlassButton onClick={() => { fetchTransactions(); fetchStats(); }} variant="secondary">
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
            <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter size={16} />
                    <span>Filter:</span>
                </div>
                {['all', 'credit', 'debit'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 capitalize ${filter === type
                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Transactions Table */}
            <GlassTable
                columns={columns}
                data={transactions}
                loading={loading}
                emptyMessage="No transactions found. Start by adding funds or making purchases!"
            />
        </div>
    );
};

export default TransactionsPage;
