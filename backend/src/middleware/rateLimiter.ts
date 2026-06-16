import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetAt: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const { maxRequests, windowMs, message = 'Muitas requisicoes. Tente novamente em instantes.' } = options;
  const requests = new Map<string, RequestRecord>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now > record.resetAt) requests.delete(key);
    }
  }, 5 * 60 * 1000);

  return function (req: Request, res: Response, next: NextFunction): void {
    // Usa userId autenticado como chave; fallback para IP (nunca bypassa o limite)
    const identifier = req.userId ?? req.ip ?? 'unknown';

    const now = Date.now();
    const record = requests.get(identifier);

    if (!record || now > record.resetAt) {
      requests.set(identifier, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({ error: message, retryAfterSeconds: retryAfterSec });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
    next();
  };
}
