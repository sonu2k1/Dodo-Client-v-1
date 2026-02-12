import PDFDocument from 'pdfkit';

/**
 * Generates a professional invoice PDF and pipes it to a writable stream.
 *
 * @param {Object} opts
 * @param {Object} opts.payment   – Payment document (lean)
 * @param {Object} opts.invoice   – Invoice document (lean, optional)
 * @param {Object} opts.user      – { name, email }
 * @param {import('stream').Writable} opts.stream – writable (usually res)
 */
export function generateInvoicePDF({ payment, invoice, user, stream }) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(stream);

    const CYAN = '#00d4ff';
    const WHITE = '#ffffff';
    const GRAY = '#9ca3af';
    const DARK = '#111827';

    // ── helpers ──────────────────────────────────────────
    const currency = (amt, cur = 'INR') => {
        const sym = cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '£';
        // Amounts stored in smallest unit (paise/cents)
        const display = amt >= 100 ? (amt / 100).toFixed(2) : Number(amt).toFixed(2);
        return `${sym}${display}`;
    };

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const drawLine = (y, color = '#e5e7eb') => {
        doc.moveTo(50, y).lineTo(545, y).strokeColor(color).lineWidth(0.5).stroke();
    };

    // ── Header ──────────────────────────────────────────
    doc.fontSize(24).fillColor(CYAN).text('INVOICE', 50, 50, { align: 'left' });
    doc.fontSize(10).fillColor(GRAY).text('Dodo Point Client Concierge', 50, 80);
    doc.text('support@dodopoint.app', 50, 94);

    // Invoice ID (right-aligned)
    const invId = invoice?.invoiceId || payment.paymentId;
    doc.fontSize(10).fillColor(DARK).text(invId, 350, 50, { align: 'right', width: 195 });
    doc.fillColor(GRAY).text(`Date: ${fmtDate(payment.createdAt)}`, 350, 66, { align: 'right', width: 195 });

    if (payment.completedAt) {
        doc.text(`Paid: ${fmtDate(payment.completedAt)}`, 350, 80, { align: 'right', width: 195 });
    }

    drawLine(115);

    // ── Bill To ─────────────────────────────────────────
    doc.fontSize(10).fillColor(GRAY).text('BILL TO', 50, 125);
    doc.fontSize(12).fillColor(DARK).text(user.name || 'Customer', 50, 140);
    doc.fontSize(10).fillColor(GRAY).text(user.email || '', 50, 156);

    // Payment status badge
    const statusLabel = (payment.status || 'pending').toUpperCase();
    const badgeColors = {
        COMPLETED: '#22c55e', FAILED: '#ef4444', REFUNDED: '#f59e0b',
        PENDING: '#9ca3af', PROCESSING: '#3b82f6'
    };
    const badgeColor = badgeColors[statusLabel] || GRAY;
    doc.roundedRect(430, 125, 115, 24, 4).fillAndStroke(badgeColor, badgeColor);
    doc.fontSize(10).fillColor('#fff').text(statusLabel, 435, 131, { width: 105, align: 'center' });

    drawLine(180);

    // ── Line Items Table ────────────────────────────────
    let y = 195;

    // Table header
    doc.fontSize(9).fillColor(GRAY);
    doc.text('DESCRIPTION', 50, y, { width: 250 });
    doc.text('QTY', 310, y, { width: 40, align: 'center' });
    doc.text('UNIT PRICE', 355, y, { width: 80, align: 'right' });
    doc.text('AMOUNT', 445, y, { width: 100, align: 'right' });
    y += 18;
    drawLine(y);
    y += 10;

    const cur = payment.currency || invoice?.currency || 'INR';

    if (invoice?.items?.length) {
        for (const item of invoice.items) {
            doc.fontSize(10).fillColor(DARK);
            doc.text(item.name, 50, y, { width: 250 });
            doc.text(String(item.quantity || 1), 310, y, { width: 40, align: 'center' });
            doc.text(currency(item.unitPrice, cur), 355, y, { width: 80, align: 'right' });
            doc.text(currency(item.amount, cur), 445, y, { width: 100, align: 'right' });

            if (item.description) {
                y += 16;
                doc.fontSize(8).fillColor(GRAY).text(item.description, 50, y, { width: 250 });
            }
            y += 20;
        }
    } else {
        // No invoice – generate a single line from payment
        const desc = payment.metadata?.get?.('description') || `Payment ${payment.paymentId}`;
        doc.fontSize(10).fillColor(DARK);
        doc.text(desc, 50, y, { width: 250 });
        doc.text('1', 310, y, { width: 40, align: 'center' });
        doc.text(currency(payment.amount, cur), 355, y, { width: 80, align: 'right' });
        doc.text(currency(payment.amount, cur), 445, y, { width: 100, align: 'right' });
        y += 20;
    }

    drawLine(y);
    y += 12;

    // ── Totals ──────────────────────────────────────────
    const rightLabel = (label, value, bold = false) => {
        doc.fontSize(10).fillColor(GRAY).text(label, 350, y, { width: 95, align: 'right' });
        doc.fillColor(bold ? CYAN : DARK);
        if (bold) doc.font('Helvetica-Bold');
        doc.text(value, 445, y, { width: 100, align: 'right' });
        if (bold) doc.font('Helvetica');
        y += 18;
    };

    const subtotal = invoice?.subtotal ?? payment.amount;
    rightLabel('Subtotal', currency(subtotal, cur));

    if (invoice?.totalTax) {
        rightLabel('Tax', `+ ${currency(invoice.totalTax, cur)}`);
    } else {
        // Default 18% GST estimate
        const tax = subtotal * 0.18;
        rightLabel('GST (18%)', `+ ${currency(tax, cur)}`);
    }

    if (invoice?.totalDiscount) {
        rightLabel('Discount', `- ${currency(invoice.totalDiscount, cur)}`);
    }

    drawLine(y);
    y += 6;

    const total = invoice?.grandTotal ?? payment.amount;
    rightLabel('Total', currency(total, cur), true);

    // ── Gateway Info ────────────────────────────────────
    y += 20;
    drawLine(y);
    y += 12;

    doc.fontSize(9).fillColor(GRAY).text('PAYMENT DETAILS', 50, y);
    y += 16;
    doc.fontSize(9).fillColor(DARK);
    doc.text(`Gateway:  ${(payment.gateway || '—').toUpperCase()}`, 50, y);
    y += 14;
    doc.text(`Reference ID:  ${payment.gatewayPaymentId || payment.gatewayOrderId || '—'}`, 50, y);
    y += 14;
    doc.text(`Payment ID:  ${payment.paymentId}`, 50, y);

    // ── Footer ──────────────────────────────────────────
    const footerY = 760;
    drawLine(footerY);
    doc.fontSize(8).fillColor(GRAY)
        .text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 8, { align: 'center', width: 495 })
        .text('Dodo Point Client Concierge · dodopoint.app', 50, footerY + 20, { align: 'center', width: 495 });

    doc.end();
}
