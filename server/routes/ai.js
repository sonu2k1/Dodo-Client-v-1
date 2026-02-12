import express from 'express';
import { generateResponse } from '../services/gemini.js';
import { SYSTEM_PROMPT, formatPrompt } from '../utils/prompts.js';
import Wallet from '../models/Wallet.js';
import { convertToKanbanTask } from '../services/taskService.js';
import { executeDataQuery } from '../services/dataQueryService.js';
import { formatQueryDataPrompt } from '../utils/queryDataPrompts.js';
import { gatherEvidence } from '../services/askWhyService.js';
import { formatAskWhyPrompt } from '../utils/askWhyPrompts.js';
import { loadClientContext, buildUnifiedContext } from '../services/contextService.js';
import { formatContextSection } from '../utils/contextPrompts.js';

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

        // Get user ID from authenticated request
        const userId = req.user?.id;

        // Fetch real wallet data from MongoDB
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            // Create wallet if it doesn't exist
            wallet = await Wallet.create({
                userId,
                balance: 0,
                dodoPoints: 100
            });
        }

        // Get or create session with real wallet data
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                conversationHistory: [],
                userId,
                contextHints: [],
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

        // Load persistent client context from MongoDB
        const { ctx: persistentCtx, clientNotes } = await loadClientContext(userId);
        const unifiedContext = buildUnifiedContext(persistentCtx, session, clientNotes);
        const contextSection = formatContextSection(unifiedContext);

        // Format prompt with system instructions, client context, and user data
        const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextSection}${formatPrompt(message, {
            conversationHistory: session.conversationHistory.slice(0, -1), // Exclude current message
            userData: userData, // Use real wallet data
            clientContext: unifiedContext,
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

                    // Extract analysis data
                    const urgency = intentData.urgencyScore || 1;
                    const intentType = intentData.intentType || 'GENERAL';

                    // Log high urgency interactions
                    if (urgency >= 7 || intentType === 'URGENT_ISSUE') {
                        console.warn(`🚨 URGENT INTERACTION (${urgency}/10): ${intentType} - User: ${userId}`);
                    }

                    // Add analysis to response data
                    responseData = {
                        ...responseData,
                        urgencyScore: urgency,
                        intentType: intentType
                    };

                    // Handle Intents with real wallet data
                    switch (intentData.intent) {
                        case 'CHECK_BALANCE':
                            finalResponse = intentData.response_text || `Your current balance is $${userData.balance.toFixed(2)} and you have ${userData.points} DoDo Points.`;
                            responseData = { ...responseData, balance: userData.balance, points: userData.points };
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
                                ...responseData,
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
                            responseData = { ...responseData, transactions: userData.transactions };
                            break;

                        case 'EXPLAIN_CHARGE':
                            // In a real app, retrieve specific transaction details to enhance the explanation
                            finalResponse = intentData.response_text;
                            responseData = {
                                ...responseData,
                                success: true,
                                action: 'lookup_transaction',
                                details: 'Transaction details retrieved'
                            };
                            break;

                        case 'GENERATE_INVOICE':
                            // Signal frontend to show invoice generation UI
                            finalResponse = intentData.response_text || `I can help you generate an invoice! Please go to the Transactions page and click the invoice icon next to any transaction, or tell me which transaction you'd like an invoice for.`;
                            responseData = {
                                ...responseData,
                                success: true,
                                action: 'show_invoice_ui',
                                transactionId: intentData.parameters?.transactionId || null
                            };
                            break;

                        case 'EXPLAIN_INVOICE':
                            // Provide detailed invoice explanation
                            finalResponse = intentData.response_text || `Let me break down your invoice:

**Base Charges**: These are the core service or product costs.

**Taxes (GST)**: Goods and Services Tax is a government-mandated tax applied at 18% on most services.

**Discounts**: Any promotional offers or special rates applied to your purchase.

**DoDo Points**: Points you've earned can be redeemed at a rate of 10 points = ₹1. These are applied as discounts on your invoices.

Would you like me to explain a specific invoice in more detail?`;
                            responseData = {
                                ...responseData,
                                success: true,
                                action: 'explain_invoice',
                                invoiceId: intentData.parameters?.invoiceId || null
                            };
                            break;

                        case 'ASK_WHY': {
                            // Gather evidence from multiple data sources
                            const whyParams = intentData.parameters || {};
                            try {
                                const evidence = await gatherEvidence(userId, whyParams);
                                // Build a reasoning-chain prompt with the evidence
                                const whyPrompt = formatAskWhyPrompt(message, evidence);
                                // Ask Gemini to trace cause → effect
                                finalResponse = await generateResponse(whyPrompt);
                                responseData = { ...responseData, askWhy: true, subject: whyParams.subject || 'general' };
                            } catch (whyError) {
                                console.error('ASK_WHY error:', whyError);
                                finalResponse = intentData.response_text || "I'm sorry, I couldn't trace the reasoning for that right now. Please try again later.";
                                responseData = { ...responseData, askWhy: true, error: whyError.message };
                            }
                            break;
                        }

                        case 'QUERY_DATA': {
                            // Fetch real data from MongoDB based on queryType
                            const queryType = intentData.parameters?.queryType || 'RECENT_TRANSACTIONS';
                            const queryParams = intentData.parameters || {};
                            try {
                                const queryResults = await executeDataQuery(userId, queryType, queryParams);
                                // Build a follow-up prompt with the fetched data
                                const dataPrompt = formatQueryDataPrompt(message, queryType, queryResults);
                                // Ask Gemini to summarise the data in natural language
                                finalResponse = await generateResponse(dataPrompt);
                                responseData = { ...responseData, queryType, results: queryResults };
                            } catch (queryError) {
                                console.error('QUERY_DATA error:', queryError);
                                finalResponse = intentData.response_text || "I'm sorry, I couldn't retrieve that data right now. Please try again later.";
                                responseData = { ...responseData, queryType, error: queryError.message };
                            }
                            break;
                        }

                        case 'CREATE_TASK': {
                            const taskParams = intentData.parameters || {};
                            try {
                                const userName = req.user?.name || '';
                                const kanbanTask = await convertToKanbanTask(userId, taskParams, message, userName);
                                const dueDateStr = kanbanTask.dueDate
                                    ? new Date(kanbanTask.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                    : 'No due date';
                                finalResponse = intentData.response_text || `I've created a task: "${kanbanTask.title}"\n\n📌 **Priority:** ${kanbanTask.priority} (score: ${kanbanTask.priorityScore}/100)\n👤 **Owner:** ${kanbanTask.owner}\n📅 **Due:** ${dueDateStr}\n📋 **Column:** ${kanbanTask.column}`;
                                responseData = {
                                    ...responseData,
                                    success: true,
                                    action: 'task_created',
                                    task: kanbanTask,
                                };
                            } catch (taskError) {
                                console.error('CREATE_TASK error:', taskError);
                                finalResponse = "I'm sorry, I couldn't create that task right now. Please try again.";
                                responseData = { ...responseData, success: false, error: taskError.message };
                            }
                            break;
                        }

                        case 'GENERAL_RESPONSE':
                            finalResponse = intentData.response_text;
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

        // Store short-term context hint for this session
        const hint = `User asked about: "${message.substring(0, 80)}"`;
        if (!session.contextHints) session.contextHints = [];
        session.contextHints.push(hint);
        if (session.contextHints.length > 10) {
            session.contextHints = session.contextHints.slice(-10);
        }

        // Return response
        res.json({
            message: finalResponse,
            data: responseData, // Send structured data to frontend if it needs it later
            sessionId,
            timestamp: Date.now(),
        });

    } catch (error) {
        console.error('Chat endpoint error:', error);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);

        // Graceful degradation for ANY AI error (Quota, Network, Model Not Found)
        // Check if user is trying to create a task
        const lowerMsg = (req.body.message || '').toLowerCase();
        if (lowerMsg.includes('task') || lowerMsg.includes('todo') || lowerMsg.includes('remind')) {
            try {
                const userName = req.user?.name || '';
                console.log(`Fallback: Creating task for ${userName} with message: "${req.body.message}"`);

                // Create task using raw message as title
                const kanbanTask = await convertToKanbanTask(req.user.id, { title: req.body.message }, req.body.message, userName);

                return res.json({
                    message: `I'm having trouble connecting to my brain right now, but I've created a task for you based on your message.\n\nCreated: "${kanbanTask.title}"`,
                    data: {
                        success: true,
                        action: 'task_created',
                        task: kanbanTask,
                        fallback: true
                    },
                    sessionId: req.body.sessionId,
                    timestamp: Date.now(),
                });
            } catch (fallbackError) {
                console.error('Fallback task creation failed:', fallbackError);
            }
        }

        // If not a task or fallback failed, check for 429 specifically for other queries
        if (error.message.includes('429') || error.message.includes('Too Many Requests') || error.message.includes('Quota exceeded') || error.status === 429) {
            return res.status(429).json({
                error: 'AI Busy',
                message: 'I am currently experiencing high traffic. Please try again in a minute.',
                data: { urgencyScore: 1, intentType: 'GENERAL' }
            });
        }

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
