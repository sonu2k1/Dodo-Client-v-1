import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import AuditLog from '../models/AuditLog.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    authenticate,
    loginRateLimiter
} from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email, password, and name are required'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                error: 'Email already registered',
                message: 'An account with this email already exists'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'Password must be at least 6 characters'
            });
        }

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            name,
            phone,
            role: 'user',
            status: 'active'
        });

        // Create wallet for new user
        await Wallet.create({
            userId: user._id.toString(),
            balance: 0,
            dodoPoints: 100 // Welcome bonus
        });

        // Generate tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        // Create audit log
        await AuditLog.create({
            userId: user._id.toString(),
            action: 'OTHER',
            category: 'account',
            description: 'New user account created',
            details: { email: user.email },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            message: 'Registration successful',
            user: user.toPublicJSON(),
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                error: 'Validation failed',
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration'
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', loginRateLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }

        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            return res.status(423).json({
                error: 'Account locked',
                message: `Too many failed attempts. Try again in ${remainingTime} minutes`
            });
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Account suspended',
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            await user.incLoginAttempts();
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Update last login
        user.lastLogin = new Date();
        user.lastLoginIP = req.ip;

        // Generate tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        // Create audit log
        await AuditLog.create({
            userId: user._id.toString(),
            action: 'LOGIN',
            category: 'security',
            description: 'User logged in successfully',
            details: { ip: req.ip },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            message: 'Login successful',
            user: user.toPublicJSON(),
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'An error occurred during login'
        });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Missing refresh token',
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);

        if (!decoded || decoded.type !== 'refresh') {
            return res.status(401).json({
                error: 'Invalid refresh token',
                message: 'Refresh token is invalid or expired'
            });
        }

        // Find user with refresh token
        const user = await User.findById(decoded.userId).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                error: 'Invalid refresh token',
                message: 'Refresh token has been revoked'
            });
        }

        // Check if refresh token is expired
        if (user.refreshTokenExpires && user.refreshTokenExpires < Date.now()) {
            return res.status(401).json({
                error: 'Refresh token expired',
                message: 'Please login again'
            });
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Account suspended',
                message: 'Your account has been suspended'
            });
        }

        // Generate new tokens (token rotation)
        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        // Save new refresh token
        user.refreshToken = newRefreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
            message: 'An error occurred while refreshing token'
        });
    }
});

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.refreshToken = undefined;
            user.refreshTokenExpires = undefined;
            await user.save();

            // Create audit log
            await AuditLog.create({
                userId: user._id.toString(),
                action: 'OTHER',
                category: 'security',
                description: 'User logged out',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        }

        res.json({ message: 'Logout successful' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: 'An error occurred during logout'
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        res.json({
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: 'An error occurred while fetching profile'
        });
    }
});

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Missing passwords',
                message: 'Current and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Weak password',
                message: 'New password must be at least 6 characters'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid password',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        // Invalidate all refresh tokens
        user.refreshToken = undefined;
        user.refreshTokenExpires = undefined;
        await user.save();

        // Create audit log
        await AuditLog.create({
            userId: user._id.toString(),
            action: 'SETTINGS_CHANGED',
            category: 'security',
            description: 'User changed password',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Generate new tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        res.json({
            message: 'Password changed successfully',
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Password change failed',
            message: 'An error occurred while changing password'
        });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account no longer exists'
            });
        }

        // Update allowed fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Profile update failed',
            message: 'An error occurred while updating profile'
        });
    }
});

export default router;
