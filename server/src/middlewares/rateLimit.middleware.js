// middlewares/rateLimit.js
import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../database/redis.js';

// Reads an integer from an ENV var, falling back to `fallback` when unset/invalid.
function envInt(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

// Builds a rate-limit middleware for `keyPrefix`, configured from ENV vars
// prefixed with `envPrefix`. Setting `<envPrefix>_POINTS=-1` disables rate
// limiting for that route entirely (middleware just calls next()).
function createRateLimitMiddleware(keyPrefix, envPrefix, defaults) {
    const points = envInt(`${envPrefix}_POINTS`, defaults.points);

    if (points === -1) {
        return async (req, res, next) => next();
    }

    const limiter = new RateLimiterRedis({
        storeClient: redis,
        keyPrefix,
        points,
        duration: envInt(`${envPrefix}_DURATION`, defaults.duration),
        blockDuration: envInt(`${envPrefix}_BLOCK_DURATION`, defaults.blockDuration),
    });

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

export const rateLimitLogin = createRateLimitMiddleware('ratelimit:login', 'RATE_LIMIT_LOGIN', {
    points: 500,        // 5 tentatives
    duration: 60,      // par fenêtre de 60 secondes
    blockDuration: 300, // bloque 5 minutes si dépassé
});

export const rateLimitRegister = createRateLimitMiddleware('ratelimit:register', 'RATE_LIMIT_REGISTER', {
    points: 300,
    duration: 60,
    blockDuration: 600,
});

export const rateLimitGeneral = createRateLimitMiddleware('ratelimit:general', 'RATE_LIMIT_GENERAL', {
    points: 500,
    duration: 60,
    blockDuration: 300,
});