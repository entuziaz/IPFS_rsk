import { NextFunction, Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || "60000");
const MAX_REQUESTS = Number(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || "5");
const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getRetryAfterSeconds(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}

function pruneExpiredEntries() {
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(pruneExpiredEntries, WINDOW_MS).unref();

export function uploadRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const clientKey = getClientKey(req);
  const existingEntry = rateLimitStore.get(clientKey);

  if (!existingEntry || existingEntry.resetAt <= now) {
    rateLimitStore.set(clientKey, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return next();
  }

  if (existingEntry.count >= MAX_REQUESTS) {
    const retryAfter = getRetryAfterSeconds(existingEntry.resetAt);
    res.setHeader("Retry-After", retryAfter.toString());

    return res.status(429).json({
      error: `Too many upload attempts. Retry in ${retryAfter} second(s).`,
    });
  }

  existingEntry.count += 1;
  rateLimitStore.set(clientKey, existingEntry);
  return next();
}
