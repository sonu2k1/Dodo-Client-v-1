import React from 'react';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const WalletCard = ({ balance, points, onAddFunds, onRedeem }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Balance Card */}
            <GlassCard glowColor="blue" className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-neon-blue/20">
                        <CreditCard className="text-neon-blue" size={24} />
                    </div>
                    <GlassButton size="sm" variant="outline" onClick={onAddFunds}>
                        <ArrowUpRight size={16} className="mr-2" />
                        Add Funds
                    </GlassButton>
                </div>
                <div>
                    <p className="text-gray-400 text-sm mb-1">Total Balance</p>
                    <h2 className="text-4xl font-bold text-white">${balance?.toFixed(2) || '0.00'}</h2>
                </div>
            </GlassCard>

            {/* Points Card */}
            <GlassCard glowColor="purple" className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-neon-purple/20">
                        <Wallet className="text-neon-purple" size={24} />
                    </div>
                    <GlassButton size="sm" variant="outline" glowColor="purple" onClick={onRedeem}>
                        <ArrowDownLeft size={16} className="mr-2" />
                        Redeem
                    </GlassButton>
                </div>
                <div>
                    <p className="text-gray-400 text-sm mb-1">Dodo Points</p>
                    <h2 className="text-4xl font-bold text-white">{points || 0}</h2>
                </div>
            </GlassCard>
        </div>
    );
};

export default WalletCard;
