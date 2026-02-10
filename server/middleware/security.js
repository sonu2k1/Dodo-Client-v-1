import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';

/**
 * Global Rate Limiter
 * Limits requests from same IP to 100 per 15 minutes
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

/**
 * Auth Rate Limiter
 * Stricter limits for authentication routes (login/register)
 * 5 requests per hour to prevent brute force
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/register requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later'
    }
});

/**
 * API Rate Limiter
 * General API endpoints limits
 * 300 requests per hour
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'You have exceeded the API request limit'
    }
});

/**
 * Security Headers Middleware (Helmet)
 * Configures various HTTP headers for security
 */
export const securityHeaders = helmet();

/**
 * Data Sanitization Middleware
 * Prevents NoSQL injection by sanitizing user input
 */
export const dataSanitization = mongoSanitize();

/**
 * XSS Clean (Custom basic implementation as xss-clean is deprecated/unmaintained)
 * Basic mitigation for XSS in JSON bodies
 */
export const xssSanitization = (req, res, next) => {
    if (req.body) {
        // Simple recursive function to escape HTML characters in strings
        const sanitize = (obj) => {
            for (let key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key]
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#x27;')
                        .replace(/\//g, '&#x2F;');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitize(obj[key]);
                }
            }
        };
        sanitize(req.body);
    }
    next();
};
