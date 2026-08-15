// middlewares/rateLimit.js
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../database/redis.js';

const loginLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:login',
    points: 500,        // 5 tentatives
    duration: 60,      // par fenêtre de 60 secondes
    blockDuration: 300, // bloque 5 minutes si dépassé
});

const registerLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:register',
    points: 3,
    duration: 60,
    blockDuration: 600,
});

const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'ratelimit:general',
    points: 500,
    duration: 60,
    blockDuration: 300,
});



function createRateLimitMiddleware(limiter) {
    return async (req, res, next) => {
        try {
            await limiter.consume(req.ip);
            next();
        } catch (rejRes) {
            const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 1;
            res.set('Retry-After', String(retrySecs));
            res.status(429).json({
                error: 'Too many requests, please try again later.',
                retryAfter: retrySecs,
            });
        }
    };
}

export const rateLimitLogin = createRateLimitMiddleware(loginLimiter);
export const rateLimitRegister = createRateLimitMiddleware(registerLimiter);
export const rateLimitGeneral = createRateLimitMiddleware(limiter);