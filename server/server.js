import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Route imports
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import walletRoutes from './routes/wallet.js';
import transactionRoutes from './routes/transactions.js';
import auditRoutes from './routes/audit.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';
import taskRoutes from './routes/tasks.js';
import weeklySummaryRoutes from './routes/weeklySummary.js';
import clientNotesRoutes from './routes/clientNotes.js';
import paymentHistoryRoutes from './routes/paymentHistory.js';
import spendBreakdownRoutes from './routes/spendBreakdown.js';
import adCampaignSpendRoutes from './routes/adCampaignSpend.js';
import recurringCostRoutes from './routes/recurringCosts.js';
import roiRoutes from './routes/roi.js';

// Middleware imports
import { authenticate, authorize } from './middleware/authMiddleware.js';
import {
    globalLimiter,
    authLimiter,
    apiLimiter,
    securityHeaders,
    dataSanitization,
    xssSanitization
} from './middleware/security.js';
import { errorHandler, AppError } from './middleware/error.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(securityHeaders); // Helmet
app.use(globalLimiter); // Rate limiting
app.use(dataSanitization); // NoSQL injection prevention
app.use(xssSanitization); // XSS prevention

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Apply API Rate Limiting to all API routes
app.use('/api', apiLimiter);

// ============================================
// Public Routes
// ============================================
// Apply stricter rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);

// ============================================
// Protected Routes (Authentication required)
// ============================================

// User-level routes (user, admin, moderator can access)
app.use('/api/ai', authenticate, aiRoutes);
app.use('/api/wallet', authenticate, walletRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/tasks', authenticate, taskRoutes);
app.use('/api/ai/weekly-summary', authenticate, weeklySummaryRoutes);
app.use('/api/client-notes', authenticate, clientNotesRoutes);
app.use('/api/payment-history', authenticate, paymentHistoryRoutes);
app.use('/api/spend-breakdown', authenticate, spendBreakdownRoutes);
app.use('/api/ad-spend', authenticate, adCampaignSpendRoutes);
app.use('/api/recurring-costs', authenticate, recurringCostRoutes);
app.use('/api/roi', authenticate, roiRoutes);

// Admin-level routes (admin and moderator only)
app.use('/api/audit', authenticate, authorize('admin', 'moderator'), auditRoutes);

// ============================================
// MongoDB Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Health check endpoint (public)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        jwtConfigured: !!process.env.JWT_SECRET,
    });
});

// Error handling middleware
// Error handling middleware
app.use(errorHandler);

// 404 handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 DoDo Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🤖 Gemini API configured: ${!!process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
    console.log(`🔐 JWT configured: ${!!process.env.JWT_SECRET ? '✅' : '❌'}\n`);

    if (!process.env.JWT_SECRET) {
        console.warn('⚠️  WARNING: JWT_SECRET not set in .env file');
        console.warn('   Authentication will not work without it!\n');
    }
});
