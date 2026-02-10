import express from 'express';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import Wallet from '../models/Wallet.js';
import { generateResponse } from '../services/gemini.js';

const router = express.Router();

// Get user ID from authenticated request
const getUserId = (req) => {
    return req.user?.id;
};

/**
 * Generate AI explanation for invoice
 */
const generateInvoiceExplanation = async (invoice) => {
    const prompt = `You are a helpful financial assistant. Analyze this invoice and provide clear, friendly explanations.

Invoice Details:
- Invoice ID: ${invoice.invoiceId}
- Subtotal: ₹${invoice.subtotal.toFixed(2)}
- Total Tax: ₹${invoice.totalTax.toFixed(2)}
- Total Discount: ₹${invoice.totalDiscount.toFixed(2)}
- Points Used: ${invoice.pointsUsed} (Value: ₹${invoice.pointsValue.toFixed(2)})
- Grand Total: ₹${invoice.grandTotal.toFixed(2)}

Line Items:
${invoice.items.map(item => `- ${item.name}: ₹${item.amount.toFixed(2)} (${item.quantity} x ₹${item.unitPrice.toFixed(2)})`).join('\n')}

Taxes Applied:
${invoice.taxes.map(tax => `- ${tax.name}: ${(tax.rate * 100).toFixed(1)}% = ₹${tax.amount.toFixed(2)}`).join('\n') || 'No taxes applied'}

Discounts Applied:
${invoice.discounts.map(disc => `- ${disc.name}: -₹${disc.amount.toFixed(2)}`).join('\n') || 'No discounts applied'}

Please provide a JSON response with the following structure:
{
    "summary": "A brief 1-2 sentence summary of the invoice",
    "chargeBreakdown": "A friendly explanation of each charge and why it's there",
    "taxExplanation": "Clear explanation of taxes applied and why (mention GST, service tax, etc.)",
    "discountExplanation": "Explanation of any discounts or points used and their value"
}

Keep explanations concise, friendly, and easy to understand. Use ₹ symbol for amounts.`;

    try {
        const response = await generateResponse(prompt);
        // Clean and parse JSON
        const cleanJson = response.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('AI explanation generation failed:', error);
        // Return default explanation
        return {
            summary: `Invoice for ₹${invoice.grandTotal.toFixed(2)} with ${invoice.items.length} item(s).`,
            chargeBreakdown: invoice.items.map(item => `${item.name}: ₹${item.amount.toFixed(2)}`).join('. '),
            taxExplanation: invoice.totalTax > 0
                ? `Total tax of ₹${invoice.totalTax.toFixed(2)} applied.`
                : 'No taxes applied to this invoice.',
            discountExplanation: invoice.totalDiscount > 0 || invoice.pointsValue > 0
                ? `You saved ₹${(invoice.totalDiscount + invoice.pointsValue).toFixed(2)} on this invoice.`
                : 'No discounts applied.'
        };
    }
};

/**
 * POST /api/invoices/generate
 * Generate a new invoice with AI explanation
 */
router.post('/generate', async (req, res) => {
    try {
        const userId = getUserId(req);
        const {
            title,
            description,
            items,
            taxes = [],
            discounts = [],
            pointsToUse = 0,
            transactionId,
            paymentId,
            notes,
            currency = 'INR'
        } = req.body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Invalid items',
                message: 'At least one line item is required'
            });
        }

        // Calculate item amounts
        const processedItems = items.map(item => ({
            name: item.name,
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            amount: (item.quantity || 1) * item.unitPrice,
            category: item.category || 'service'
        }));

        const subtotal = processedItems.reduce((sum, item) => sum + item.amount, 0);

        // Calculate taxes
        const processedTaxes = taxes.map(tax => ({
            name: tax.name,
            rate: tax.rate,
            amount: subtotal * tax.rate,
            description: tax.description || ''
        }));
        const totalTax = processedTaxes.reduce((sum, tax) => sum + tax.amount, 0);

        // Calculate discounts
        const processedDiscounts = discounts.map(disc => {
            let amount = 0;
            if (disc.type === 'percentage') {
                amount = subtotal * (disc.value / 100);
            } else {
                amount = disc.value;
            }
            return {
                name: disc.name,
                type: disc.type || 'fixed',
                value: disc.value,
                amount,
                description: disc.description || ''
            };
        });
        const totalDiscount = processedDiscounts.reduce((sum, disc) => sum + disc.amount, 0);

        // Handle points redemption
        let pointsValue = 0;
        let actualPointsUsed = 0;

        if (pointsToUse > 0) {
            const wallet = await Wallet.findOne({ userId });
            if (wallet && wallet.dodoPoints >= pointsToUse) {
                actualPointsUsed = pointsToUse;
                pointsValue = pointsToUse / 10; // 10 points = ₹1

                // Add points discount to discounts array
                processedDiscounts.push({
                    name: 'DoDo Points Redemption',
                    type: 'points',
                    value: actualPointsUsed,
                    amount: pointsValue,
                    description: `${actualPointsUsed} points redeemed (10 points = ₹1)`
                });
            }
        }

        // Calculate grand total
        const grandTotal = subtotal + totalTax - totalDiscount - pointsValue;

        // Create invoice
        const invoice = await Invoice.create({
            userId,
            title: title || 'Invoice',
            description,
            items: processedItems,
            subtotal,
            taxes: processedTaxes,
            totalTax,
            discounts: processedDiscounts,
            totalDiscount: totalDiscount + pointsValue,
            pointsUsed: actualPointsUsed,
            pointsValue,
            grandTotal: Math.max(0, grandTotal),
            balanceDue: Math.max(0, grandTotal),
            transactionId,
            paymentId,
            currency,
            notes
        });

        // Generate AI explanation
        const aiExplanation = await generateInvoiceExplanation(invoice);
        invoice.aiExplanation = {
            ...aiExplanation,
            generatedAt: new Date()
        };
        await invoice.save();

        res.status(201).json({
            success: true,
            invoice,
            message: 'Invoice generated successfully'
        });

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({
            error: 'Failed to generate invoice',
            message: error.message
        });
    }
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID with AI explanation
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = getUserId(req);
        const invoice = await Invoice.findOne({
            invoiceId: req.params.id,
            userId
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Regenerate AI explanation if not present
        if (!invoice.aiExplanation || !invoice.aiExplanation.summary) {
            const aiExplanation = await generateInvoiceExplanation(invoice);
            invoice.aiExplanation = {
                ...aiExplanation,
                generatedAt: new Date()
            };
            await invoice.save();
        }

        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

/**
 * GET /api/invoices
 * Get all invoices for user
 */
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { limit = 20, offset = 0, status } = req.query;

        const query = { userId };
        if (status) query.status = status;

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .select('-aiExplanation'); // Exclude detailed explanation in list

        const total = await Invoice.countDocuments(query);

        res.json({
            invoices,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

/**
 * POST /api/invoices/:id/explain
 * Regenerate AI explanation for an invoice
 */
router.post('/:id/explain', async (req, res) => {
    try {
        const userId = getUserId(req);
        const invoice = await Invoice.findOne({
            invoiceId: req.params.id,
            userId
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Generate fresh AI explanation
        const aiExplanation = await generateInvoiceExplanation(invoice);
        invoice.aiExplanation = {
            ...aiExplanation,
            generatedAt: new Date()
        };
        await invoice.save();

        res.json({
            success: true,
            aiExplanation: invoice.aiExplanation,
            message: 'Invoice explanation regenerated'
        });
    } catch (error) {
        console.error('Error explaining invoice:', error);
        res.status(500).json({ error: 'Failed to explain invoice' });
    }
});

/**
 * POST /api/invoices/:id/pay
 * Mark invoice as paid
 */
router.post('/:id/pay', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { paymentId, amountPaid } = req.body;

        const invoice = await Invoice.findOne({
            invoiceId: req.params.id,
            userId
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Update wallet to deduct points if any were used
        if (invoice.pointsUsed > 0) {
            const wallet = await Wallet.findOne({ userId });
            if (wallet && wallet.dodoPoints >= invoice.pointsUsed) {
                wallet.dodoPoints -= invoice.pointsUsed;
                wallet.history.push({
                    type: 'REDEEM',
                    amount: invoice.pointsUsed,
                    description: `Points used for invoice ${invoice.invoiceId}`
                });
                await wallet.save();
            }
        }

        // Update invoice
        invoice.status = 'paid';
        invoice.amountPaid = amountPaid || invoice.grandTotal;
        invoice.balanceDue = 0;
        invoice.paidAt = new Date();
        if (paymentId) invoice.paymentId = paymentId;
        await invoice.save();

        res.json({
            success: true,
            invoice,
            message: 'Invoice marked as paid'
        });
    } catch (error) {
        console.error('Error paying invoice:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

/**
 * POST /api/invoices/from-transaction
 * Generate invoice from a transaction
 */
router.post('/from-transaction', async (req, res) => {
    try {
        const userId = getUserId(req);
        const { transactionId } = req.body;

        // Find transaction
        const transaction = await Transaction.findOne({
            transactionId,
            userId
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Create invoice from transaction
        const invoiceData = {
            title: `Invoice for ${transaction.reason}`,
            items: [{
                name: transaction.reason,
                description: `Transaction ID: ${transaction.transactionId}`,
                quantity: 1,
                unitPrice: transaction.amount
            }],
            taxes: [
                { name: 'GST', rate: 0.18, description: 'Goods and Services Tax (18%)' }
            ],
            transactionId: transaction.transactionId,
            currency: 'INR'
        };

        // Use the generate endpoint logic
        req.body = invoiceData;

        // Create the invoice with same logic
        const processedItems = invoiceData.items.map(item => ({
            name: item.name,
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            amount: (item.quantity || 1) * item.unitPrice,
            category: 'service'
        }));

        const subtotal = processedItems.reduce((sum, item) => sum + item.amount, 0);

        const processedTaxes = invoiceData.taxes.map(tax => ({
            name: tax.name,
            rate: tax.rate,
            amount: subtotal * tax.rate,
            description: tax.description || ''
        }));
        const totalTax = processedTaxes.reduce((sum, tax) => sum + tax.amount, 0);

        const grandTotal = subtotal + totalTax;

        const invoice = await Invoice.create({
            userId,
            title: invoiceData.title,
            items: processedItems,
            subtotal,
            taxes: processedTaxes,
            totalTax,
            discounts: [],
            totalDiscount: 0,
            grandTotal,
            balanceDue: grandTotal,
            transactionId: transaction.transactionId,
            currency: 'INR',
            status: transaction.status === 'completed' ? 'paid' : 'pending'
        });

        // Generate AI explanation
        const aiExplanation = await generateInvoiceExplanation(invoice);
        invoice.aiExplanation = {
            ...aiExplanation,
            generatedAt: new Date()
        };
        await invoice.save();

        res.status(201).json({
            success: true,
            invoice,
            message: 'Invoice generated from transaction'
        });

    } catch (error) {
        console.error('Error generating invoice from transaction:', error);
        res.status(500).json({
            error: 'Failed to generate invoice',
            message: error.message
        });
    }
});

export default router;
