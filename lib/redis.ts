import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val as T | null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttl: number = 30): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch {
    // silently fail on cache miss
  }
}

export async function rateLimitCheck(userId: string, action: string, max: number, window: number): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}:${Math.floor(Date.now() / (window * 1000))}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  return current <= max;
}
