import React from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const TransactionHistory = ({ transactions = [] }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'DEPOSIT':
            case 'EARN':
                return <ArrowDownLeft className="text-neon-green" size={20} />;
            case 'REDEEM':
            case 'PURCHASE':
                return <ArrowUpRight className="text-neon-pink" size={20} />;
            default:
                return <RefreshCcw className="text-gray-400" size={20} />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>

            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No transactions yet</p>
                ) : (
                    transactions.map((tx, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${tx.type === 'DEPOSIT' || tx.type === 'EARN'
                                        ? 'bg-neon-green/10'
                                        : 'bg-neon-pink/10'
                                    }`}>
                                    {getIcon(tx.type)}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{tx.description}</p>
                                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                                </div>
                            </div>
                            <div className={`font-bold ${tx.type === 'DEPOSIT' || tx.type === 'EARN'
                                    ? 'text-neon-green'
                                    : 'text-white'
                                }`}>
                                {tx.type === 'DEPOSIT' || tx.type === 'EARN' ? '+' : '-'}
                                {tx.type === 'EARN' || tx.type === 'REDEEM'
                                    ? `${tx.amount} pts`
                                    : `$${tx.amount.toFixed(2)}`
                                }
                            </div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
};

export default TransactionHistory;
