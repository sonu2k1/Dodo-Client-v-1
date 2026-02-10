import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generate Access Token (short-lived)
 */
export const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
};

/**
 * Generate Refresh Token (long-lived)
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

/**
 * Verify JWT Token
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please provide a valid access token'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Token is invalid or expired'
            });
        }

        // Check if it's not a refresh token being used as access token
        if (decoded.type === 'refresh') {
            return res.status(401).json({
                error: 'Invalid token type',
                message: 'Please use an access token'
            });
        }

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                error: 'User not found',
                message: 'The user associated with this token no longer exists'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Account suspended',
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // Attach user to request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            message: 'An error occurred during authentication'
        });
    }
};

/**
 * Authorization Middleware
 * Checks if user has required role(s)
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please login first'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Optional Authentication Middleware
 * Allows both authenticated and anonymous requests
 * If token is provided and valid, attaches user to request
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue as anonymous
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded && decoded.type !== 'refresh') {
            const user = await User.findById(decoded.userId);
            if (user && user.status === 'active') {
                req.user = {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status
                };
            }
        }

        next();
    } catch (error) {
        // On error, continue as anonymous
        req.user = null;
        next();
    }
};

/**
 * Rate Limiting for Login Attempts
 * Simple in-memory implementation (use Redis in production)
 */
const loginAttempts = new Map();

export const loginRateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `login:${ip}`;

    const attempts = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };

    // Reset after 15 minutes
    if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
        loginAttempts.delete(key);
        return next();
    }

    // Block after 10 attempts in 15 minutes
    if (attempts.count >= 10) {
        const remainingTime = Math.ceil((15 * 60 * 1000 - (Date.now() - attempts.firstAttempt)) / 1000 / 60);
        return res.status(429).json({
            error: 'Too many login attempts',
            message: `Please try again in ${remainingTime} minutes`
        });
    }

    // Track this attempt
    attempts.count++;
    if (attempts.count === 1) {
        attempts.firstAttempt = Date.now();
    }
    loginAttempts.set(key, attempts);

    next();
};

// Clean up old login attempts periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, attempts] of loginAttempts.entries()) {
        if (now - attempts.firstAttempt > 15 * 60 * 1000) {
            loginAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

export default {
    authenticate,
    authorize,
    optionalAuth,
    loginRateLimiter,
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
