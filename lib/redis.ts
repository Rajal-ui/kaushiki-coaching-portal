import Redis from 'ioredis';
import { RedisFallback } from '@/lib/redis-fallback';

const globalForRedis = globalThis as unknown as { redis: Redis | RedisFallback | undefined };

function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

// Fallback instance always exists
const fallback = new RedisFallback();

let realRedis: Redis | null = null;

function tryConnect(): void {
  try {
    const client = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy() { return null; },
    });

    client.connect()
      .then(() => client.ping())
      .then(() => {
        realRedis = client;
        console.log('[Redis] Connected to', getRedisUrl());
      })
      .catch(() => {
        console.warn('[Redis] Unavailable — using in-memory fallback (no TTL across restarts)');
      });
  } catch {
    console.warn('[Redis] Init error — using in-memory fallback');
  }
}

tryConnect();

export const redis = new Proxy(fallback, {
  get(_target, prop: string | symbol) {
    return (...args: unknown[]) => {
      if (realRedis) {
        const fn = (realRedis as any)[prop];
        if (typeof fn === 'function') {
          try {
            const result = fn.apply(realRedis, args);
            if (result instanceof Promise) return result.catch(() => fallbackMethod());
            return result;
          } catch { return fallbackMethod(); }
        }
        return fn;
      }
      return fallbackMethod();

      function fallbackMethod() {
        const fbFn = (fallback as any)[prop];
        if (typeof fbFn === 'function') return fbFn.apply(fallback, args);
        return fbFn;
      }
    };
  },
}) as unknown as RedisFallback & Redis;

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
