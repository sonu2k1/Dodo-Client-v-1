import express from 'express';
import Wallet from '../models/Wallet.js';

const router = express.Router();

// Middleware to simulate user authentication for demo
// In production, this would use actual auth middleware
const getUserId = (req) => {
    // For now, consistent demo user
    return req.headers['x-user-id'] || 'demo-user-001';
};

// Get Wallet Details
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            // Create initial wallet if not exists
            wallet = await Wallet.create({
                userId,
                balance: 1000, // Initial demo balance
                dodoPoints: 50 // Initial demo points
            });
        }

        res.json(wallet);
    } catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ error: 'Failed to fetch wallet details' });
    }
});

// Earn Points/Money (Demo Endpoint)
router.post('/earn', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { type, amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        if (type === 'points') {
            wallet.dodoPoints += amount;
            wallet.history.push({
                type: 'EARN',
                amount,
                description: description || 'Points Earned'
            });
        } else if (type === 'balance') {
            wallet.balance += amount;
            wallet.history.push({
                type: 'DEPOSIT',
                amount,
                description: description || 'Funds Added'
            });
        } else {
            return res.status(400).json({ error: 'Invalid earn type' });
        }

        await wallet.save();
        res.json(wallet);

    } catch (error) {
        console.error('Error adding funds:', error);
        res.status(500).json({ error: 'Failed to process transaction' });
    }
});

// Redeem Points
router.post('/redeem', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { points, description } = req.body;

        if (!points || points <= 0) {
            return res.status(400).json({ error: 'Invalid points amount' });
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

        if (wallet.dodoPoints < points) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        wallet.dodoPoints -= points;
        wallet.history.push({
            type: 'REDEEM',
            amount: points,
            description: description || 'Points Redeemed'
        });

        await wallet.save();
        res.json(wallet);

    } catch (error) {
        console.error('Error redeeming points:', error);
        res.status(500).json({ error: 'Failed to redeem points' });
    }
});

export default router;
