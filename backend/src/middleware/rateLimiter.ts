import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for image generation endpoint
 * Prevents abuse and server overload
 */
export const generationRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5, // Max 5 generations per minute per user
  message: {
    error: 'Too many generation requests',
    message: 'Please wait a moment before generating another portrait. Maximum 5 generations per minute.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use user ID as key (if authenticated)
  keyGenerator: (req: any) => {
    return req.userId || req.ip; // Use user ID if authenticated, otherwise IP
  },
  // Skip successful requests from counting if needed
  skipSuccessfulRequests: false,
  // Skip failed requests (don't count errors against limit)
  skipFailedRequests: true,
});

/**
 * General API rate limiter
 * Prevents spam on all API endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute per IP
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.userId || req.ip;
  },
});

/**
 * Strict rate limiter for sensitive operations
 * Like password reset, email verification, etc.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes
  message: {
    error: 'Too many attempts',
    message: 'Too many attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.userId || req.ip;
  },
});

