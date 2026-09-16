import { Redis } from "@upstash/redis";

let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
}

export async function cacheGet(key) {
  if (!redis) return null;
  return redis.get(key);
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  if (!redis) return null;
  return redis.set(key, value, { ex: ttlSeconds });
}

export async function cacheDel(key) {
  if (!redis) return null;
  return redis.del(key);
}
