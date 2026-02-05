import mongoose from 'mongoose';

/**
 * Invoice Schema - Stores generated invoices with detailed breakdown
 */
const InvoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: String,
        required: true,
        unique: true,
        default: () => `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    // Invoice details
    title: {
        type: String,
        default: 'Invoice'
    },
    description: String,

    // Line items with detailed breakdown
    items: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        quantity: {
            type: Number,
            default: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        category: String
    }],

    // Financial breakdown
    subtotal: {
        type: Number,
        required: true
    },

    // Tax details
    taxes: [{
        name: {
            type: String,
            required: true
        },
        rate: {
            type: Number,  // Percentage as decimal (e.g., 0.18 for 18%)
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: String
    }],
    totalTax: {
        type: Number,
        default: 0
    },

    // Discounts and points
    discounts: [{
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed', 'points'],
            default: 'fixed'
        },
        value: Number,  // Percentage or fixed amount
        amount: {
            type: Number,
            required: true
        },
        description: String
    }],
    totalDiscount: {
        type: Number,
        default: 0
    },

    // Points used
    pointsUsed: {
        type: Number,
        default: 0
    },
    pointsValue: {
        type: Number,
        default: 0
    },

    // Final amounts
    grandTotal: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    balanceDue: {
        type: Number,
        default: 0
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'pending', 'paid', 'cancelled', 'refunded'],
        default: 'pending'
    },

    // AI-generated explanation
    aiExplanation: {
        summary: String,
        chargeBreakdown: String,
        taxExplanation: String,
        discountExplanation: String,
        generatedAt: Date
    },

    // Related transaction
    transactionId: String,
    paymentId: String,

    // Metadata
    currency: {
        type: String,
        default: 'INR'
    },
    notes: String,

    // Timestamps
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    dueDate: Date,
    paidAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
InvoiceSchema.index({ userId: 1, createdAt: -1 });
InvoiceSchema.index({ invoiceId: 1 });
InvoiceSchema.index({ status: 1 });

// Update timestamp on save
InvoiceSchema.pre('save', function () {
    this.updatedAt = new Date();

    // Calculate totals
    if (this.items && this.items.length > 0) {
        this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    }

    if (this.taxes && this.taxes.length > 0) {
        this.totalTax = this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    }

    if (this.discounts && this.discounts.length > 0) {
        this.totalDiscount = this.discounts.reduce((sum, disc) => sum + disc.amount, 0);
    }

    this.grandTotal = this.subtotal + this.totalTax - this.totalDiscount - this.pointsValue;
    this.balanceDue = this.grandTotal - this.amountPaid;
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);

export default Invoice;
