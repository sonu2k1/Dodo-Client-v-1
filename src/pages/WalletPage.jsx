import React, { useState, useEffect } from 'react';
import WalletCard from '../components/wallet/WalletCard';
import TransactionHistory from '../components/wallet/TransactionHistory';

const WalletPage = () => {
    const [walletData, setWalletData] = useState({
        balance: 0,
        dodoPoints: 0,
        history: []
    });
    const [loading, setLoading] = useState(true);

    const fetchWallet = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/wallet', {
                headers: {
                    'x-user-id': 'demo-user-001' // Mock ID matching backend
                }
            });
            if (response.ok) {
                const data = await response.json();
                setWalletData(data);
            }
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleAddFunds = async () => {
        // Demo functionality
        try {
            await fetch('http://localhost:3001/api/wallet/earn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify({
                    type: 'balance',
                    amount: 100,
                    description: 'Demo Deposit'
                })
            });
            fetchWallet();
        } catch (error) {
            console.error('Error adding funds:', error);
        }
    };

    const handleRedeem = async () => {
        // Demo functionality
        try {
            await fetch('http://localhost:3001/api/wallet/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user-001'
                },
                body: JSON.stringify({
                    points: 50,
                    description: 'Demo Reward'
                })
            });
            fetchWallet();
        } catch (error) {
            console.error('Error redeeming:', error);
        }
    };

    if (loading) {
        return <div className="text-white text-center mt-20">Loading Wallet...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
                <p className="text-gray-400">Manage your balance and rewards</p>
            </div>

            <WalletCard
                balance={walletData.balance}
                points={walletData.dodoPoints}
                onAddFunds={handleAddFunds}
                onRedeem={handleRedeem}
            />

            <TransactionHistory transactions={walletData.history.slice().reverse()} />
        </div>
    );
};

export default WalletPage;
