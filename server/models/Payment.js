import mongoose from 'mongoose';

/**
 * Payment Schema - Tracks payment orders with idempotency support
 * Integrates with Razorpay/Stripe for secure payment processing
 */
const PaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        default: () => `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1  // Amount in smallest currency unit (paise/cents)
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // Idempotency key to prevent duplicate payments
    idempotencyKey: {
        type: String,
        required: true,
        index: true
    },
    // Payment gateway details
    gateway: {
        type: String,
        enum: ['razorpay', 'stripe'],
        default: 'razorpay'
    },
    gatewayOrderId: {
        type: String,
        index: true
    },
    gatewayPaymentId: String,
    gatewaySignature: String,

    // Verification status
    clientVerified: {
        type: Boolean,
        default: false
    },
    webhookVerified: {
        type: Boolean,
        default: false
    },

    // Wallet update tracking
    walletUpdated: {
        type: Boolean,
        default: false
    },

    // Error tracking
    errorCode: String,
    errorMessage: String,

    // Additional metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
});

// Compound index for idempotency check
PaymentSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

// Index for gateway order lookup
PaymentSchema.index({ gatewayOrderId: 1 });

// Update timestamp on save
PaymentSchema.pre('save', function () {
    this.updatedAt = new Date();
    if (this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
});

const Payment = mongoose.model('Payment', PaymentSchema);

export default Payment;
