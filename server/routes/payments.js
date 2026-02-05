import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get user ID from header (same pattern as other routes)
const getUserId = (req) => {
    return req.headers['x-user-id'] || 'demo-user-001';
};

/**
 * Generate unique idempotency key if not provided
 */
const generateIdempotencyKey = () => {
    return `IDEM-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (body, signature, secret) => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
};

/**
 * Verify Razorpay payment signature (for client callback)
 */
const verifyPaymentSignature = (orderId, paymentId, signature, secret) => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return expectedSignature === signature;
};

/**
 * Update wallet balance after successful payment
 */
const updateWalletBalance = async (userId, amount, paymentId) => {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        throw new Error('Wallet not found');
    }

    // Amount is in paise, convert to rupees for wallet
    const amountInRupees = amount / 100;

    wallet.balance += amountInRupees;
    wallet.history.push({
        type: 'PAYMENT',
        amount: amountInRupees,
        description: `Payment received via Razorpay`,
        metadata: new Map([['paymentId', paymentId]])
    });

    await wallet.save();
    return wallet;
};

/**
 * Create transaction record
 */
const createTransactionRecord = async (userId, amount, paymentId) => {
    const amountInRupees = amount / 100;

    return await Transaction.create({
        userId,
        amount: amountInRupees,
        type: 'credit',
        reason: 'Payment received via Razorpay',
        category: 'payment',
        status: 'completed',
        metadata: new Map([['paymentId', paymentId]])
    });
};

/**
 * Create audit log entry
 */
const createAuditLog = async (userId, action, description, details, req) => {
    return await AuditLog.create({
        userId,
        action,
        category: 'financial',
        description,
        details,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent'],
        proof: {
            source: 'payment_gateway',
            reference: details?.paymentId || details?.orderId
        }
    });
};

// ============================================
// Routes
// ============================================

/**
 * POST /api/payments/create-order
 * Create a new payment order with idempotency support
 */
router.post('/create-order', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { amount, currency = 'INR', idempotencyKey, notes = {} } = req.body;

        // Validate amount (minimum 1 INR = 100 paise)
        if (!amount || amount < 100) {
            return res.status(400).json({
                error: 'Invalid amount',
                message: 'Amount must be at least 100 paise (1 INR)'
            });
        }

        // Check Razorpay configuration
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                error: 'Payment gateway not configured',
                message: 'Razorpay credentials are missing'
            });
        }

        // Use provided idempotency key or generate one
        const finalIdempotencyKey = idempotencyKey || generateIdempotencyKey();

        // Check for existing payment with same idempotency key
        const existingPayment = await Payment.findOne({
            userId,
            idempotencyKey: finalIdempotencyKey
        });

        if (existingPayment) {
            // Return existing payment if already created
            console.log(`Idempotent request detected for key: ${finalIdempotencyKey}`);
            return res.json({
                payment: existingPayment,
                orderId: existingPayment.gatewayOrderId,
                keyId: process.env.RAZORPAY_KEY_ID,
                idempotent: true
            });
        }

        // Create Razorpay order
        const orderOptions = {
            amount: Math.round(amount), // Amount in paise
            currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId,
                ...notes
            }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // Create payment record
        const payment = await Payment.create({
            userId,
            amount,
            currency,
            idempotencyKey: finalIdempotencyKey,
            gateway: 'razorpay',
            gatewayOrderId: razorpayOrder.id,
            status: 'pending',
            metadata: new Map(Object.entries(notes))
        });

        // Create audit log
        await createAuditLog(
            userId,
            'PAYMENT_INITIATED',
            `Payment order created for ${amount / 100} ${currency}`,
            {
                amount,
                orderId: razorpayOrder.id,
                paymentId: payment.paymentId
            },
            req
        );

        res.json({
            payment,
            orderId: razorpayOrder.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount,
            currency,
            idempotent: false
        });

    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({
            error: 'Failed to create payment order',
            message: error.message
        });
    }
});

/**
 * POST /api/payments/verify
 * Verify payment after client-side callback
 */
router.post('/verify', async (req, res) => {
    try {
        const userId = getUserId(req);
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                error: 'Missing payment details',
                message: 'Order ID, Payment ID, and Signature are required'
            });
        }

        // Find the payment record
        const payment = await Payment.findOne({
            gatewayOrderId: razorpay_order_id
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            process.env.RAZORPAY_KEY_SECRET
        );

        if (!isValid) {
            payment.status = 'failed';
            payment.errorMessage = 'Invalid signature';
            await payment.save();

            await createAuditLog(
                userId,
                'PAYMENT_FAILED',
                'Payment verification failed - invalid signature',
                { orderId: razorpay_order_id },
                req
            );

            return res.status(400).json({
                error: 'Invalid signature',
                message: 'Payment verification failed'
            });
        }

        // Update payment record
        payment.gatewayPaymentId = razorpay_payment_id;
        payment.gatewaySignature = razorpay_signature;
        payment.clientVerified = true;
        payment.status = 'processing';
        await payment.save();

        // If webhook hasn't verified yet, update wallet now (less secure but functional)
        // In production, prefer webhook verification
        if (!payment.webhookVerified && !payment.walletUpdated) {
            try {
                await updateWalletBalance(userId, payment.amount, payment.paymentId);
                await createTransactionRecord(userId, payment.amount, payment.paymentId);

                payment.walletUpdated = true;
                payment.status = 'completed';
                await payment.save();

                await createAuditLog(
                    userId,
                    'PAYMENT_COMPLETED',
                    `Payment of ${payment.amount / 100} ${payment.currency} completed via client verification`,
                    {
                        amount: payment.amount,
                        paymentId: payment.paymentId,
                        orderId: razorpay_order_id
                    },
                    req
                );
            } catch (walletError) {
                console.error('Error updating wallet:', walletError);
                // Payment verified but wallet update failed - log for manual resolution
            }
        }

        res.json({
            success: true,
            payment,
            message: 'Payment verified successfully'
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            error: 'Failed to verify payment',
            message: error.message
        });
    }
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook endpoint for payment events
 * This is the authoritative source for payment confirmation
 */
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.warn('Webhook secret not configured');
            return res.status(500).json({ error: 'Webhook not configured' });
        }

        // Get raw body for signature verification
        const rawBody = typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);

        // Verify webhook signature
        const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { event: eventType, payload } = event;

        console.log(`Received webhook event: ${eventType}`);

        // Handle payment.captured event
        if (eventType === 'payment.captured') {
            const paymentData = payload.payment.entity;
            const orderId = paymentData.order_id;
            const razorpayPaymentId = paymentData.id;
            const amount = paymentData.amount;

            // Find payment record
            const payment = await Payment.findOne({ gatewayOrderId: orderId });

            if (!payment) {
                console.error(`Payment not found for order: ${orderId}`);
                return res.status(404).json({ error: 'Payment not found' });
            }

            // Update payment record
            payment.gatewayPaymentId = razorpayPaymentId;
            payment.webhookVerified = true;
            payment.status = 'completed';

            // Update wallet if not already done
            if (!payment.walletUpdated) {
                try {
                    await updateWalletBalance(payment.userId, amount, payment.paymentId);
                    await createTransactionRecord(payment.userId, amount, payment.paymentId);
                    payment.walletUpdated = true;

                    await createAuditLog(
                        payment.userId,
                        'PAYMENT_COMPLETED',
                        `Payment of ${amount / 100} ${payment.currency} completed via webhook`,
                        {
                            amount,
                            paymentId: payment.paymentId,
                            orderId,
                            source: 'webhook'
                        },
                        req
                    );
                } catch (walletError) {
                    console.error('Webhook: Error updating wallet:', walletError);
                    payment.errorMessage = 'Wallet update failed';
                }
            }

            await payment.save();

            // Log webhook received
            await createAuditLog(
                payment.userId,
                'PAYMENT_WEBHOOK_RECEIVED',
                `Webhook received for payment ${razorpayPaymentId}`,
                {
                    eventType,
                    orderId,
                    paymentId: razorpayPaymentId
                },
                req
            );
        }

        // Handle payment.failed event
        if (eventType === 'payment.failed') {
            const paymentData = payload.payment.entity;
            const orderId = paymentData.order_id;

            const payment = await Payment.findOne({ gatewayOrderId: orderId });

            if (payment) {
                payment.status = 'failed';
                payment.webhookVerified = true;
                payment.errorCode = paymentData.error_code;
                payment.errorMessage = paymentData.error_description;
                await payment.save();

                await createAuditLog(
                    payment.userId,
                    'PAYMENT_FAILED',
                    `Payment failed: ${paymentData.error_description}`,
                    {
                        orderId,
                        errorCode: paymentData.error_code,
                        errorMessage: paymentData.error_description
                    },
                    req
                );
            }
        }

        // Acknowledge receipt
        res.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * GET /api/payments/:id
 * Get payment details by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = getUserId(req);
        const payment = await Payment.findOne({
            paymentId: req.params.id,
            userId
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: 'Failed to fetch payment' });
    }
});

/**
 * GET /api/payments
 * Get all payments for user
 */
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 20, offset = 0, status } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        res.json({
            payments,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

/**
 * GET /api/payments/config
 * Get payment gateway configuration (public key only)
 */
router.get('/config/razorpay', (req, res) => {
    res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        currency: 'INR',
        configured: !!process.env.RAZORPAY_KEY_ID
    });
});

export default router;
