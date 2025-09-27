import type { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const points = Number(process.env.RATE_LIMIT_POINTS ?? 60);
const duration = Number(process.env.RATE_LIMIT_DURATION ?? 60);

const limiter = new RateLimiterMemory({
  points,
  duration
});

export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip ?? 'unknown'}:${req.user?.uid ?? 'anon'}`;
  try {
    await limiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'RATE_LIMITED',
      message: 'Too many requests, please slow down.'
    });
  }
}
