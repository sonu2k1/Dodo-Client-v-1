import express from 'express';
import { generateResponse } from '../services/gemini.js';
import { SYSTEM_PROMPT, formatPrompt } from '../utils/prompts.js';
import Wallet from '../models/Wallet.js';

const router = express.Router();

// In-memory session storage (replace with Redis/database in production)
const sessions = new Map();

/**
 * POST /api/ai/chat
 * Chat endpoint for AI conversations
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Message is required and must be a non-empty string',
            });
        }

        // Get user ID from header or use demo user
        const userId = req.headers['x-user-id'] || 'demo-user-001';

        // Fetch real wallet data from MongoDB
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            // Create wallet if it doesn't exist
            wallet = await Wallet.create({
                userId,
                balance: 1000,
                dodoPoints: 50
            });
        }

        // Get or create session with real wallet data
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                conversationHistory: [],
                userId,
            });
        }

        // Always update userData with fresh wallet data
        const userData = {
            balance: wallet.balance,
            points: wallet.dodoPoints,
            trustScore: 95,
            transactions: wallet.history.slice(-10).map((tx, i) => ({
                id: i + 1,
                type: tx.type.toLowerCase(),
                amount: tx.type === 'DEPOSIT' || tx.type === 'EARN' ? tx.amount : -tx.amount,
                merchant: tx.description || tx.type,
                date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : 'N/A',
                category: tx.type
            }))
        };

        const session = sessions.get(sessionId);
        session.wallet = wallet; // Store wallet reference for intent handling

        // Add user message to history
        session.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: Date.now(),
        });

        // Keep only last 10 messages for context
        if (session.conversationHistory.length > 10) {
            session.conversationHistory = session.conversationHistory.slice(-10);
        }

        // Format prompt with system instructions and context
        const fullPrompt = `${SYSTEM_PROMPT}\n\n${formatPrompt(message, {
            conversationHistory: session.conversationHistory.slice(0, -1), // Exclude current message
            userData: userData, // Use real wallet data
        })}`;

        // Generate AI response
        // Generate AI response
        const rawResponse = await generateResponse(fullPrompt);
        let finalResponse = rawResponse;
        let responseData = {};

        // Attempt to parse JSON intent
        try {
            // Clean code blocks if present (sometimes AI wraps JSON in ```json ... ```)
            const cleanJson = rawResponse.replace(/```json\n?|\n?```/g, '').trim();

            if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
                const intentData = JSON.parse(cleanJson);

                if (intentData.type === 'intent') {
                    console.log(`🤖 Detected Intent: ${intentData.intent}`);

                    // Handle Intents with real wallet data
                    switch (intentData.intent) {
                        case 'CHECK_BALANCE':
                            finalResponse = intentData.response_text || `Your current balance is $${userData.balance.toFixed(2)} and you have ${userData.points} DoDo Points.`;
                            responseData = { balance: userData.balance, points: userData.points };
                            break;

                        case 'REDEEM_POINTS':
                            // Real redemption logic using MongoDB wallet
                            const pointsToRedeem = intentData.parameters?.amount || 50;
                            if (session.wallet.dodoPoints >= pointsToRedeem) {
                                session.wallet.dodoPoints -= pointsToRedeem;
                                session.wallet.balance += (pointsToRedeem / 10); // 10 points = $1
                                session.wallet.history.push({
                                    type: 'REDEEM',
                                    amount: pointsToRedeem,
                                    description: 'Points redeemed via AI Concierge'
                                });
                                await session.wallet.save();
                                finalResponse = `Success! I've redeemed ${pointsToRedeem} points for $${(pointsToRedeem / 10).toFixed(2)}. Your new balance is $${session.wallet.balance.toFixed(2)}.`;
                            } else {
                                finalResponse = `I'm sorry, you only have ${session.wallet.dodoPoints} points, which isn't enough to redeem ${pointsToRedeem}.`;
                            }
                            responseData = {
                                success: true,
                                new_points: session.wallet.dodoPoints,
                                new_balance: session.wallet.balance
                            };
                            break;

                        case 'VIEW_TRANSACTIONS':
                            finalResponse = intentData.response_text || "Here are your recent transactions.";
                            // Use real transaction history from wallet
                            if (userData.transactions.length > 0) {
                                const txList = userData.transactions.slice(0, 5)
                                    .map(t => `- ${t.date}: ${t.merchant} ($${Math.abs(t.amount).toFixed(2)})`)
                                    .join('\n');
                                finalResponse += `\n\n${txList}`;
                            } else {
                                finalResponse = "You don't have any transactions yet.";
                            }
                            responseData = { transactions: userData.transactions };
                            break;

                        case 'EXPLAIN_CHARGE':
                            // In a real app, retrieve specific transaction details to enhance the explanation
                            finalResponse = intentData.response_text;
                            responseData = {
                                success: true,
                                action: 'lookup_transaction',
                                details: 'Transaction details retrieved'
                            };
                            break;

                        case 'GENERATE_INVOICE':
                            // Generate a mock PDF URL
                            const invoiceId = `INV-${Math.floor(Math.random() * 10000)}`;
                            finalResponse = intentData.response_text || `I've generated invoice #${invoiceId} for you. You can download it below.`;
                            responseData = {
                                success: true,
                                invoice_id: invoiceId,
                                invoice_url: `/api/documents/${invoiceId}.pdf` // Mock URL
                            };
                            break;

                        default:
                            finalResponse = intentData.response_text;
                    }
                }
            }
        } catch (e) {
            // Not JSON or failed to parse, use raw text
            console.log("ℹ️ No structured intent detected, using plain text.");
        }

        // Add AI response to history (save the final text version)
        session.conversationHistory.push({
            role: 'assistant',
            content: finalResponse,
            timestamp: Date.now(),
        });

        // Return response
        res.json({
            message: finalResponse,
            data: responseData, // Send structured data to frontend if it needs it later
            sessionId,
            timestamp: Date.now(),
        });

    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({
            error: 'Failed to process chat message',
            message: error.message,
        });
    }
});

/**
 * DELETE /api/ai/chat/session/:sessionId
 * Clear chat session
 */
router.delete('/chat/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (sessions.has(sessionId)) {
        sessions.delete(sessionId);
        res.json({ message: 'Session cleared successfully' });
    } else {
        res.status(404).json({ error: 'Session not found' });
    }
});

export default router;
