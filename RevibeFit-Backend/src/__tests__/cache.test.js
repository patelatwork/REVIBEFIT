import { describe, it, expect, vi, beforeEach } from "vitest";

// Shared in-memory store across all mock calls
const store = new Map();

vi.mock("ioredis", () => ({
  default: class MockRedis {
    get(key) { return Promise.resolve(store.get(key) ?? null); }
    set(key, value) { store.set(key, value); return Promise.resolve("OK"); }
    del(...keys) { keys.forEach((k) => store.delete(k)); return Promise.resolve(keys.length); }
    keys(pattern) {
      const prefix = pattern.replace("*", "");
      return Promise.resolve([...store.keys()].filter((k) => k.startsWith(prefix)));
    }
    on() {}
    info() { return Promise.resolve("# Stats\r\nkeyspace_hits:5\r\n"); }
  },
}));

beforeEach(() => {
  store.clear();
  vi.resetModules();
});

describe("Redis caching helpers", () => {
  it("should return null on cache miss", async () => {
    const { cacheGet } = await import("../config/redis.js");
    const result = await cacheGet("nonexistent-key");
    expect(result).toBeNull();
  });

  it("should store and retrieve cached data", async () => {
    const { cacheGet, cacheSet } = await import("../config/redis.js");
    const data = { trainers: [{ name: "Alice" }] };
    await cacheSet("trainers:test", data, 300);
    const result = await cacheGet("trainers:test");
    expect(result).toEqual(data);
  });

  it("should delete keys matching a pattern", async () => {
    const { cacheSet, cacheDelete, cacheGet } = await import("../config/redis.js");
    await cacheSet("trainers:approved:{}", [{ name: "Bob" }], 300);
    await cacheDelete("trainers:approved:*");
    const result = await cacheGet("trainers:approved:{}");
    expect(result).toBeNull();
  });

  it("should handle cache miss gracefully without throwing", async () => {
    const { cacheGet } = await import("../config/redis.js");
    await expect(cacheGet("missing")).resolves.toBeNull();
  });
});
