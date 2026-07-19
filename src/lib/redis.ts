/**
 * Redis client for BullMQ job queues + Redis-backed rate limiting.
 * Uses ioredis for connection management.
 */
import Redis from 'ioredis'

let redisConnection: Redis | null = null
let redisSub: Redis | null = null

function createConnection(): Redis {
  const host = process.env.REDIS_HOST || '127.0.0.1'
  const port = parseInt(process.env.REDIS_PORT || '6379', 10)
  const password = process.env.REDIS_PASSWORD || undefined
  const db = parseInt(process.env.REDIS_DB || '0', 10)

  return new Redis({
    host,
    port,
    password,
    db,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 500, 2000),
    lazyConnect: false,
  })
}

/** Get the shared Redis connection (singleton). */
export function getRedis(): Redis {
  if (!redisConnection) {
    redisConnection = createConnection()
    redisConnection.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message)
    })
  }
  return redisConnection
}

/** Get a new Redis connection for subscribers (BullMQ requires separate connections). */
export function getRedisSubscriber(): Redis {
  if (!redisSub) {
    redisSub = createConnection()
  }
  return redisSub
}

/** Check if Redis is available. */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const r = getRedis()
    const pong = await r.ping()
    return pong === 'PONG'
  } catch {
    return false
  }
}

/** Redis-backed rate limiter (sliding window). */
export async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = getRedis()
  const now = Date.now()
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`

  const pipeline = redis.pipeline()
  pipeline.incr(windowKey)
  pipeline.expire(windowKey, Math.ceil(windowMs / 1000) + 1)
  const results = await pipeline.exec()

  const count = results?.[0]?.[1] as number
  const allowed = count <= limit
  const remaining = Math.max(0, limit - count)
  const resetAt = now + windowMs

  return { allowed, remaining, resetAt }
}

/** Close all Redis connections (for graceful shutdown). */
export async function closeRedis(): Promise<void> {
  await Promise.allSettled([
    redisConnection?.quit(),
    redisSub?.quit(),
  ])
  redisConnection = null
  redisSub = null
}
