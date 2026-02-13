import React, { useState, useEffect, useCallback } from 'react';
import WalletCard from '../components/wallet/WalletCard';
import TransactionHistory from '../components/wallet/TransactionHistory';
import { AddFundsModal } from '../components/payment';
import { useAuth } from '../context/AuthContext';

const WalletPage = () => {
    const { authFetch, isAuthenticated } = useAuth();
    const [walletData, setWalletData] = useState({
        balance: 0,
        dodoPoints: 0,
        history: []
    });
    const [loading, setLoading] = useState(true);
    const [showAddFundsModal, setShowAddFundsModal] = useState(false);

    const fetchWallet = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await authFetch('/api/wallet');
            if (response.ok) {
                const data = await response.json();
                setWalletData(data);
            }
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        } finally {
            setLoading(false);
        }
    }, [authFetch, isAuthenticated]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const handleAddFunds = () => {
        // Open Razorpay payment modal
        setShowAddFundsModal(true);
    };

    const handlePaymentSuccess = (result) => {
        console.log('Payment successful:', result);
        // Refresh wallet data after successful payment
        fetchWallet();
    };

    const handleRedeem = async () => {
        if (!isAuthenticated) return;

        try {
            await authFetch('/api/wallet/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Wallet</h1>
                <p className="text-gray-400 text-sm sm:text-base">Manage your balance and rewards</p>
            </div>

            <WalletCard
                balance={walletData.balance}
                points={walletData.dodoPoints}
                onAddFunds={handleAddFunds}
                onRedeem={handleRedeem}
            />

            <TransactionHistory transactions={walletData.history.slice().reverse()} />

            {/* Add Funds Modal with Razorpay */}
            <AddFundsModal
                isOpen={showAddFundsModal}
                onClose={() => setShowAddFundsModal(false)}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default WalletPage;
