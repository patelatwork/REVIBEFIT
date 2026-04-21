import { performance } from "node:perf_hooks";
import { cacheDelete, cacheGet, cacheSet } from "../src/config/redis.js";

const REQUESTS = Number(process.env.BENCH_REQUESTS || 25);
const SIMULATED_DB_MS = Number(process.env.BENCH_DB_MS || 70);
const CACHE_KEY = "bench:trainers:approved";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const simulatedDbFetch = async () => {
  await sleep(SIMULATED_DB_MS);
  return [{ name: "Demo Trainer", specialization: "Strength" }];
};

const withTiming = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { ms: end - start, result };
};

const run = async () => {
  console.log("\nRedis Benchmark (RevibeFit)");
  console.log(`Requests: ${REQUESTS}`);
  console.log(`Simulated DB latency per miss: ${SIMULATED_DB_MS}ms\n`);

  // Baseline: no cache usage at all.
  let baselineTotal = 0;
  for (let i = 0; i < REQUESTS; i += 1) {
    const { ms } = await withTiming(simulatedDbFetch);
    baselineTotal += ms;
  }

  await cacheDelete(CACHE_KEY);

  // Verify cache availability (if Redis is down, benchmark is not meaningful).
  await cacheSet(CACHE_KEY, { warmup: true }, 60);
  const probe = await cacheGet(CACHE_KEY);
  if (!probe) {
    console.log("Redis does not appear reachable from this process.");
    console.log("Start Redis first (example): docker compose up -d redis");
    console.log("Then re-run: npm run benchmark:redis\n");
    return;
  }

  await cacheDelete(CACHE_KEY);

  let cachedTotal = 0;
  let cacheHits = 0;
  let cacheMisses = 0;

  for (let i = 0; i < REQUESTS; i += 1) {
    const { ms } = await withTiming(async () => {
      const cached = await cacheGet(CACHE_KEY);
      if (cached) {
        cacheHits += 1;
        return cached;
      }

      cacheMisses += 1;
      const data = await simulatedDbFetch();
      await cacheSet(CACHE_KEY, data, 300);
      return data;
    });

    cachedTotal += ms;
  }

  const baselineAvg = baselineTotal / REQUESTS;
  const cachedAvg = cachedTotal / REQUESTS;
  const speedupPercent = ((baselineAvg - cachedAvg) / baselineAvg) * 100;

  console.log("Results");
  console.log(`- Baseline total: ${baselineTotal.toFixed(2)}ms`);
  console.log(`- Cached total:   ${cachedTotal.toFixed(2)}ms`);
  console.log(`- Baseline avg:   ${baselineAvg.toFixed(2)}ms/request`);
  console.log(`- Cached avg:     ${cachedAvg.toFixed(2)}ms/request`);
  console.log(`- Cache hits:     ${cacheHits}`);
  console.log(`- Cache misses:   ${cacheMisses}`);
  console.log(`- Improvement:    ${speedupPercent.toFixed(2)}%\n`);

  console.log("Formula");
  console.log("improvement % = ((baselineAvg - cachedAvg) / baselineAvg) * 100\n");

  await cacheDelete(CACHE_KEY);
};

run().catch((err) => {
  console.error("Benchmark failed:", err.message);
  process.exitCode = 1;
});
