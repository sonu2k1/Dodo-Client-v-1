import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import aiRoutes from './routes/ai.js';
import walletRoutes from './routes/wallet.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite dev server
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/wallet', walletRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 DoDo Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🤖 Gemini API configured: ${!!process.env.GEMINI_API_KEY ? '✅' : '❌'}\n`);

    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  WARNING: GEMINI_API_KEY not set in .env file');
        console.warn('   Please add your API key to server/.env\n');
    }
});
