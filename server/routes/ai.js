import express from 'express';
import { generateResponse } from '../services/gemini.js';
import { SYSTEM_PROMPT, formatPrompt } from '../utils/prompts.js';

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

        // Get or create session
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                conversationHistory: [],
                userData: {
                    balance: 1250.50,
                    points: 500,
                    trustScore: 95,
                    transactions: [
                        { id: 1, type: 'purchase', amount: -45.00, merchant: 'Whole Foods Market', date: '2024-03-15', category: 'Groceries' },
                        { id: 2, type: 'purchase', amount: -12.50, merchant: 'Starbucks', date: '2024-03-14', category: 'Food & Drink' },
                        { id: 3, type: 'deposit', amount: 2000.00, merchant: 'Direct Deposit - Payroll', date: '2024-03-01', category: 'Income' },
                        { id: 4, type: 'purchase', amount: -120.00, merchant: 'Amazon', date: '2024-02-28', category: 'Shopping' },
                        { id: 5, type: 'subscription', amount: -15.99, merchant: 'Netflix', date: '2024-02-28', category: 'Entertainment' }
                    ]
                },
            });
        }

        const session = sessions.get(sessionId);

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
            userData: session.userData,
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

                    // Handle Intents
                    switch (intentData.intent) {
                        case 'CHECK_BALANCE':
                            finalResponse = intentData.response_text || `Your current balance is $${session.userData.balance.toFixed(2)}.`;
                            responseData = { balance: session.userData.balance };
                            break;

                        case 'REDEEM_POINTS':
                            // Mock redemption logic
                            const pointsToRedeem = intentData.parameters.amount || 100; // Default or extracted
                            if (session.userData.points >= pointsToRedeem) {
                                session.userData.points -= pointsToRedeem;
                                session.userData.balance += (pointsToRedeem / 10); // Mock conversion rate
                                finalResponse = `Success! I've redeemed ${pointsToRedeem} points for $${(pointsToRedeem / 10).toFixed(2)}. Your new balance is $${session.userData.balance.toFixed(2)}.`;
                            } else {
                                finalResponse = `I'm sorry, you only have ${session.userData.points} points, which isn't enough to redeem ${pointsToRedeem}.`;
                            }
                            responseData = {
                                success: true,
                                new_points: session.userData.points,
                                new_balance: session.userData.balance
                            };
                            break;

                        case 'VIEW_TRANSACTIONS':
                            finalResponse = intentData.response_text || "Here are your recent transactions.";
                            // In a real app, we might return a rich card here.
                            // For now, we append the text list if not already in the response_text
                            if (!finalResponse.includes(session.userData.transactions[0].merchant)) {
                                const txList = session.userData.transactions.slice(0, 3)
                                    .map(t => `- ${t.date}: ${t.merchant} ($${Math.abs(t.amount).toFixed(2)})`)
                                    .join('\n');
                                finalResponse += `\n\n${txList}`;
                            }
                            responseData = { transactions: session.userData.transactions };
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
