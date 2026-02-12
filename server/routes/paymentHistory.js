import express from 'express';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { generateInvoicePDF } from '../services/invoicePdf.js';

const router = express.Router();

/**
 * GET /api/payment-history
 * List payments for the authenticated user with filtering, sorting, pagination.
 *
 * Query params:
 *   status    – 'pending','processing','completed','failed','refunded'
 *   startDate – ISO date string (inclusive)
 *   endDate   – ISO date string (inclusive)
 *   sortBy    – 'amount' | 'date'  (default: 'date')
 *   sortOrder – 'asc' | 'desc'     (default: 'desc')
 *   page      – page number         (default: 1)
 *   limit     – items per page       (default: 10, max: 50)
 */
router.get('/', async (req, res) => {
    try {
        const {
            status,
            startDate,
            endDate,
            sortBy = 'date',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter
        const filter = { userId: req.user.id };

        if (status && ['pending', 'processing', 'completed', 'failed', 'refunded'].includes(status)) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Sort
        const sortField = sortBy === 'amount' ? 'amount' : 'createdAt';
        const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        const [payments, total] = await Promise.all([
            Payment.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
            Payment.countDocuments(filter)
        ]);

        res.json({
            payments,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (err) {
        console.error('Payment history fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch payment history.' });
    }
});

/**
 * GET /api/payment-history/stats
 * Aggregate stats for the authenticated user's payments.
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;

        const [totals] = await Payment.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    success: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    refunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] } },
                    totalAmount: { $sum: '$amount' },
                    successAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
                    refundedAmount: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } }
                }
            }
        ]);

        res.json(totals || {
            total: 0, success: 0, failed: 0, refunded: 0, pending: 0,
            totalAmount: 0, successAmount: 0, refundedAmount: 0
        });
    } catch (err) {
        console.error('Payment stats error:', err);
        res.status(500).json({ error: 'Failed to fetch payment stats.' });
    }
});

/**
 * GET /api/payment-history/:paymentId/invoice
 * Generate and stream an invoice PDF for a specific payment.
 * Secure: checks that the payment belongs to the authenticated user.
 */
router.get('/:paymentId/invoice', async (req, res) => {
    try {
        const userId = req.user.id;
        const { paymentId } = req.params;

        // Find payment & verify ownership
        const payment = await Payment.findOne({ paymentId, userId }).lean();
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found.' });
        }

        // Only allow invoice for completed or refunded payments
        if (!['completed', 'refunded'].includes(payment.status)) {
            return res.status(400).json({
                error: 'Invoice unavailable',
                message: 'Invoices can only be generated for completed or refunded payments.'
            });
        }

        // Lookup linked invoice (if any)
        const invoice = await Invoice.findOne({
            $or: [
                { paymentId: payment.paymentId },
                { paymentId: payment._id?.toString() }
            ],
            userId
        }).lean();

        // Lookup user for bill-to section
        const user = await User.findById(userId).select('name email').lean();

        // Stream PDF
        const filename = `invoice-${payment.paymentId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        generateInvoicePDF({
            payment,
            invoice,
            user: user || { name: 'Customer', email: '' },
            stream: res
        });

    } catch (err) {
        console.error('Invoice PDF error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate invoice PDF.' });
        }
    }
});

export default router;
