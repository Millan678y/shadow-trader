// Redis caching layer using Upstash REST API
// Works in Vercel edge + serverless environments

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

interface CacheResult<T> {
  data: T | null
  fromCache: boolean
}

async function redisFetch<T>(path: string, body?: object): Promise<T> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('Redis not configured')
  }
  const res = await fetch(`${UPSTASH_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Redis error: ${res.status}`)
  return res.json()
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  try {
    const res = await redisFetch<{ result: string | null }>(
      '/get/' + encodeURIComponent(key)
    )
    if (!res.result) return null
    return JSON.parse(res.result) as T
  } catch {
    return null
  }
}

export async function setCached<T>(
  key: string,
  data: T,
  options?: { ex?: number }
): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return
  try {
    await redisFetch('/set/' + encodeURIComponent(key), {
      value: JSON.stringify(data),
      ...(options?.ex ? { ex: options.ex } : {}),
    })
  } catch {
    // Cache failures are non-fatal
  }
}

export async function deleteCached(key: string): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return
  try {
    await redisFetch('/del/' + encodeURIComponent(key))
  } catch {
    // Non-fatal
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return
  try {
    // Upstash doesn't support KEYS in serverless — scan instead
    const { elements } = await redisFetch<{ elements: string[] }>('/keys', {
      pattern,
      cursor: 0,
      count: 100,
    })
    if (elements?.length) {
      await redisFetch('/del', elements)
    }
  } catch {
    // Non-fatal
  }
}

// Rate limiting using sliding window
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSec * 1000 }
  }
  try {
    const now = Date.now()
    const windowStart = now - windowSec * 1000

    // Use a sorted set for sliding window
    const redisKey = `ratelimit:${key}`

    // Add current request
    await redisFetch('/zadd/' + encodeURIComponent(redisKey), {
      score: now,
      member: `${now}-${Math.random()}`,
    })

    // Remove old entries
    await redisFetch('/zremrangebyscore/' + encodeURIComponent(redisKey), {
      min: '-inf',
      max: windowStart,
    })

    // Count remaining
    const { score } = await redisFetch<{ score: number }>(
      '/zcount/' + encodeURIComponent(redisKey),
      { min: windowStart, max: now }
    )

    const remaining = Math.max(0, limit - score)
    const resetAt = now + windowSec * 1000

    return { allowed: remaining > 0, remaining, resetAt }
  } catch {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSec * 1000 }
  }
}

// Invalidate old rate limit keys
export async function invalidateRateLimit(key: string): Promise<void> {
  await deleteCached(`ratelimit:${key}`)
}