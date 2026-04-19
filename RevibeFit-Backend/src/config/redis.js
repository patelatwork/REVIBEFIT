import Redis from "ioredis";
import config from "./index.js";

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    redisClient.on("connect", () => console.log("✅ Redis connected"));
    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });
  }
  return redisClient;
};

export const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch { /* ignore */ }
};

export const cacheDelete = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
  } catch { /* ignore */ }
};
