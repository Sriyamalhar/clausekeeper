// In-memory token-bucket rate limiter.
//
// NOTE: this works for a single serverless instance / dev environment. In a
// real multi-instance production deploy, swap the Map below for Redis
// (Upstash works well on Vercel) — the interface here is designed so that
// swap is a one-file change: replace `store` with a Redis-backed get/set.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Sweep expired buckets periodically so the Map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key Unique identifier, e.g. `login:${ip}:${email}`
 * @param limit Max attempts allowed within the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}
