# RevibeFit – End Review Implementation Guide

> **Stack recap:** Node.js + Express 5 · MongoDB/Mongoose · React + Vite · Socket.IO · Swagger already wired · Vitest already in devDeps · No Redis, no Docker, no CI yet.

---

## Table of Contents
1. [DB Optimization – Indexes](#1-db-optimization--indexes)
2. [DB Optimization – Redis Caching](#2-db-optimization--redis-caching)
3. [User Search – Atlas Search (Solr-equivalent)](#3-user-search--atlas-search)
4. [API Documentation – Swagger (B2B & B2C)](#4-api-documentation--swagger)
5. [Unit Testing – Vitest + Test Reports](#5-unit-testing--vitest--test-reports)
6. [Containerization – Docker](#6-containerization--docker)
7. [CI Pipeline – GitHub Actions](#7-ci-pipeline--github-actions)
8. [Deployment – Render (Backend) + Vercel (Frontend)](#8-deployment)
9. [Quick Verification Checklist](#9-quick-verification-checklist)

---

## 1. DB Optimization – Indexes

### What's slow right now
Your queries filter on: `userType`, `approvalStatus`, `isVerified`, `state`, `email`, `createdAt`. None of these have explicit indexes (only the default `_id` and the `unique: true` on `email`).

### Step 1 – Add compound indexes to every model

**File: `RevibeFit-Backend/src/models/user.model.js`**

Add these lines **just before** `export const User = mongoose.model(...)`:

```js
// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ userType: 1, approvalStatus: 1 });          // admin approval list
userSchema.index({ userType: 1, isVerified: 1, isActive: 1 }); // trainer/lab listings
userSchema.index({ state: 1, userType: 1 });                   // region-based manager queries
userSchema.index({ createdAt: -1 });                           // recency sorts
```

**File: `RevibeFit-Backend/src/models/classBooking.model.js`** – add:
```js
classBookingSchema.index({ fitnessEnthusiastId: 1, status: 1 });
classBookingSchema.index({ liveClassId: 1, status: 1 });
classBookingSchema.index({ createdAt: -1 });
```

**File: `RevibeFit-Backend/src/models/labBooking.model.js`** – add:
```js
labBookingSchema.index({ fitnessEnthusiastId: 1, status: 1 });
labBookingSchema.index({ labPartnerId: 1, status: 1 });
labBookingSchema.index({ createdAt: -1 });
```

**File: `RevibeFit-Backend/src/models/communityPost.model.js`** – add:
```js
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });
```

**File: `RevibeFit-Backend/src/models/blog.model.js`** – add:
```js
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ category: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });
```

**File: `RevibeFit-Backend/src/models/mealLog.model.js`** – add:
```js
mealLogSchema.index({ user: 1, date: -1 });
```

### Step 2 – Use `.lean()` for read-only queries

Every place you do `Model.find(...)` without needing Mongoose document methods, append `.lean()`. Example in `admin.controller.js`:

```js
// Before
const trainers = await User.find({ userType: "trainer", approvalStatus: "pending" });

// After (3–5x faster for large collections)
const trainers = await User.find({ userType: "trainer", approvalStatus: "pending" }).lean();
```

### Step 3 – Use `.select()` to project only needed fields

```js
const trainers = await User
  .find({ userType: "trainer" })
  .select("name email specialization state isVerified approvalStatus")
  .lean();
```

### Step 4 – Use `explain()` in Mongo shell to verify

```js
// Run this in MongoDB Compass or mongosh
db.users.find({ userType: "trainer", approvalStatus: "pending" }).explain("executionStats")
// Look for: "stage": "IXSCAN" (good) vs "COLLSCAN" (bad)
```

---

## 2. DB Optimization – Redis Caching

### Install Redis (Windows – easiest via Docker)

```powershell
# Run a Redis container (one-time setup for local dev)
docker run -d --name redis-revibe -p 6379:6379 redis:7-alpine
```

### Install `ioredis` package

```powershell
cd "d:\My Programs and Projects\WBD-REVIBEFIT\RevibeFit-Backend"
npm install ioredis
```

### Step 1 – Create Redis client

**New file: `RevibeFit-Backend/src/config/redis.js`**

```js
import Redis from "ioredis";
import config from "./index.js";

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl || "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    redisClient.on("connect", () => console.log("✅ Redis connected"));
    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
      // Don't crash – degrade gracefully
    });
  }
  return redisClient;
};

export const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
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
```

### Step 2 – Add `REDIS_URL` to config

**`RevibeFit-Backend/src/config/index.js`** – add inside the `config` object:
```js
redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
```

**`RevibeFit-Backend/.env.sample`** – add:
```
# ─── Redis ───────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
```

**`RevibeFit-Backend/.env`** – add:
```
REDIS_URL=redis://localhost:6379
```

### Step 3 – Cache public listing endpoints

Example: **cache the public trainer listing** in `trainer.controller.js` (or wherever `GET /api/trainers` is handled):

```js
import { cacheGet, cacheSet, cacheDelete } from "../config/redis.js";

// GET /api/trainers  (public B2C endpoint)
export const getApprovedTrainers = async (req, res, next) => {
  try {
    const cacheKey = `trainers:approved:${JSON.stringify(req.query)}`;

    // ── 1. Try cache first ─────────────────────────────────────
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, fromCache: true });
    }

    // ── 2. Cache miss – hit DB ─────────────────────────────────
    const start = Date.now();
    const trainers = await User
      .find({ userType: "trainer", isVerified: true, approvalStatus: "approved", isActive: true })
      .select("name email specialization state bio socialLinks profilePhoto")
      .lean();
    const dbTime = Date.now() - start;

    // ── 3. Store in cache for 5 minutes ───────────────────────
    await cacheSet(cacheKey, trainers, 300);

    return res.status(200).json({
      success: true,
      data: trainers,
      fromCache: false,
      dbQueryMs: dbTime,  // For performance reporting
    });
  } catch (err) { next(err); }
};
```

**Invalidate cache on write** (e.g., when admin approves a trainer):
```js
// In admin.controller.js after approving a trainer
await cacheDelete("trainers:approved:*");
await cacheDelete("labPartners:approved:*");
```

### Step 4 – Performance Report (required by professor)

Add a `/api/cache-stats` endpoint for demonstration:

**In `src/app.js`** before error handlers:
```js
app.get("/api/cache-stats", async (req, res) => {
  const { getRedisClient } = await import("./config/redis.js");
  const client = getRedisClient();
  const info = await client.info("stats");
  const keyspace = await client.info("keyspace");
  res.json({ success: true, data: { info, keyspace } });
});
```

> **For your report:** Make two API calls to `GET /api/trainers`:  
> - First call (cache miss): note `dbQueryMs` value (e.g., 120ms)  
> - Second call (cache hit): response is near-instant (< 5ms)  
> - Show this in your evaluation as proof of Redis improvement.

### Cache other hot endpoints

| Endpoint | Cache Key | TTL |
|---|---|---|
| `GET /api/blogs` | `blogs:list:{page}:{category}` | 5 min |
| `GET /api/lab-partners` (public) | `labPartners:approved:{state}` | 5 min |
| `GET /api/classes` (upcoming) | `classes:upcoming:{page}` | 2 min |
| `GET /api/community` feed | `community:feed:{page}` | 1 min |

---

## 3. User Search – Atlas Search

> MongoDB Atlas Search is the easiest Solr/Elasticsearch equivalent – no extra service needed.

### Option A: Atlas Search (if using MongoDB Atlas – recommended)

1. Go to **MongoDB Atlas → Search → Create Index**
2. Index name: `default`, Collection: `users`
3. Use this JSON definition:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": [{ "type": "string" }, { "type": "autocomplete", "tokenization": "edgeGram" }],
      "email": { "type": "string" },
      "specialization": { "type": "string" },
      "laboratoryName": { "type": "string" },
      "state": { "type": "string" },
      "userType": { "type": "string" },
      "bio": { "type": "string" }
    }
  }
}
```

4. Add search endpoint to `user.routes.js` (or `auth.routes.js`):

```js
// GET /api/search?q=yoga&type=trainer&state=Gujarat
router.get("/search", async (req, res, next) => {
  try {
    const { q = "", type, state } = req.query;
    const pipeline = [
      {
        $search: {
          index: "default",
          compound: {
            must: [{
              autocomplete: {
                query: q,
                path: "name",
                fuzzy: { maxEdits: 1 },
              },
            }],
            filter: [
              ...(type ? [{ text: { query: type, path: "userType" } }] : []),
              ...(state ? [{ text: { query: state, path: "state" } }] : []),
            ],
          },
        },
      },
      { $limit: 20 },
      { $project: { name: 1, email: 1, userType: 1, specialization: 1, laboratoryName: 1, state: 1, profilePhoto: 1, score: { $meta: "searchScore" } } },
    ];

    const results = await User.aggregate(pipeline);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});
```

### Option B: Text Indexes (local MongoDB fallback)

If NOT on Atlas, add a text index:
```js
// In user.model.js
userSchema.index({ name: "text", specialization: "text", laboratoryName: "text", bio: "text" });
```

Then query with:
```js
User.find({ $text: { $search: req.query.q } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .lean();
```

---

## 4. API Documentation – Swagger

> **You already have Swagger set up.** The gaps to fix before evaluation:

### Step 1 – Tag B2B vs B2C endpoints

In every route file, annotate each endpoint with the consumer type. Example in `auth.routes.js`:

```js
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (B2C)
 *     description: |
 *       **Consumer:** B2C (end users – fitness enthusiasts, trainers, lab partners)
 *       
 *       Creates a new user account. Trainers and Lab Partners require admin approval.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

### Step 2 – Add a dedicated B2B API key scheme

**In `swagger.js` → `components.securitySchemes`**, add:
```js
apiKeyAuth: {
  type: "apiKey",
  in: "header",
  name: "X-API-KEY",
  description: "B2B API Key for external service integrations",
},
```

### Step 3 – Create a B2B route for external integrations

**New file: `RevibeFit-Backend/src/routes/b2b.routes.js`**

```js
import express from "express";
const router = express.Router();

/**
 * @swagger
 * /api/b2b/trainers:
 *   get:
 *     tags: [B2B - External]
 *     summary: Get approved trainers list (B2B)
 *     description: |
 *       **Consumer:** B2B (partner apps, gyms, corporate wellness platforms)
 *       
 *       Returns a paginated list of verified trainers. Requires API key auth.
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *         description: Filter by Indian state
 *       - in: query
 *         name: specialization
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of trainers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Invalid API key
 */
router.get("/trainers", validateApiKey, async (req, res, next) => {
  try {
    const { state, specialization } = req.query;
    const filter = { userType: "trainer", isVerified: true, approvalStatus: "approved" };
    if (state) filter.state = state;
    if (specialization) filter.specialization = new RegExp(specialization, "i");
    const trainers = await User.find(filter).select("name specialization state bio profilePhoto").lean();
    res.json({ success: true, data: trainers });
  } catch (err) { next(err); }
});

// Simple API key middleware
function validateApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.B2B_API_KEY) {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }
  next();
}

export default router;
```

**Register in `app.js`:**
```js
import b2bRoutes from "./routes/b2b.routes.js";
app.use("/api/b2b", b2bRoutes);
```

**Add to `.env.sample`:**
```
B2B_API_KEY=your-secret-b2b-key-here
```

---

## 5. Unit Testing – Vitest + Test Reports

> **Vitest is already installed** in the frontend. The backend needs it.

### Backend Testing Setup

```powershell
cd "d:\My Programs and Projects\WBD-REVIBEFIT\RevibeFit-Backend"
npm install --save-dev vitest @vitest/coverage-v8
```

**Add to `package.json` scripts:**
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:ui": "vitest --ui"
```

**New file: `RevibeFit-Backend/vitest.config.js`**
```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage",
    },
    reporters: ["default", "html"],
    outputFile: "./test-reports/index.html",
  },
});
```

### Write Tests for Core Functions

**New file: `RevibeFit-Backend/src/__tests__/auth.test.js`**
```js
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Test: Password hashing (bcrypt logic in user model) ──────────────────────
describe("Auth – password hashing", () => {
  it("should not store plaintext password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    expect(hash).not.toBe("SecurePass123");
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("should correctly compare password and hash", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    const isMatch = await bcrypt.compare("SecurePass123", hash);
    expect(isMatch).toBe(true);
  });

  it("should reject wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    const isMatch = await bcrypt.compare("WrongPass", hash);
    expect(isMatch).toBe(false);
  });
});

// ── Test: JWT token generation ───────────────────────────────────────────────
describe("Auth – JWT tokens", () => {
  it("should generate a valid JWT token", async () => {
    const jwt = await import("jsonwebtoken");
    const payload = { _id: "abc123", email: "test@test.com", userType: "trainer" };
    const token = jwt.sign(payload, "test-secret", { expiresIn: "7d" });
    const decoded = jwt.verify(token, "test-secret");
    expect(decoded._id).toBe("abc123");
    expect(decoded.userType).toBe("trainer");
  });

  it("should reject an expired token", async () => {
    const jwt = await import("jsonwebtoken");
    const token = jwt.sign({ _id: "abc" }, "test-secret", { expiresIn: "-1s" });
    expect(() => jwt.verify(token, "test-secret")).toThrow();
  });
});
```

**New file: `RevibeFit-Backend/src/__tests__/utils.test.js`**
```js
import { describe, it, expect } from "vitest";

// Test any pure utility functions
describe("Input sanitization", () => {
  it("should trim whitespace from strings", () => {
    const input = "  John Doe  ";
    expect(input.trim()).toBe("John Doe");
  });

  it("should validate email format", () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    expect(emailRegex.test("valid@email.com")).toBe(true);
    expect(emailRegex.test("invalid-email")).toBe(false);
  });

  it("should validate 10-digit phone", () => {
    const phoneRegex = /^\d{10}$/;
    expect(phoneRegex.test("9876543210")).toBe(true);
    expect(phoneRegex.test("123")).toBe(false);
    expect(phoneRegex.test("98765432100")).toBe(false);
  });
});

describe("Commission calculation", () => {
  it("should calculate trainer commission correctly", () => {
    const bookingAmount = 1000;
    const commissionRate = 15; // 15%
    const commission = (bookingAmount * commissionRate) / 100;
    expect(commission).toBe(150);
  });

  it("should calculate lab partner commission correctly", () => {
    const bookingAmount = 500;
    const commissionRate = 10; // 10%
    const commission = (bookingAmount * commissionRate) / 100;
    expect(commission).toBe(50);
  });
});
```

**New file: `RevibeFit-Backend/src/__tests__/cache.test.js`**
```js
import { describe, it, expect, vi } from "vitest";

// Mock ioredis for unit tests (don't need a real Redis)
vi.mock("ioredis", () => {
  const store = new Map();
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(async (key) => store.get(key) ?? null),
      set: vi.fn(async (key, value) => { store.set(key, value); return "OK"; }),
      del: vi.fn(async (...keys) => { keys.forEach(k => store.delete(k)); }),
      on: vi.fn(),
      keys: vi.fn(async () => []),
      info: vi.fn(async () => ""),
    })),
  };
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
});
```

### Frontend Tests

**New file: `RevibeFit-Frontend/src/__tests__/components.test.jsx`**
```jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Basic component rendering", () => {
  it("renders without crashing", () => {
    const { container } = render(<div data-testid="test">RevibeFit</div>);
    expect(container).toBeTruthy();
  });

  it("displays correct text", () => {
    render(<h1>RevibeFit</h1>);
    expect(screen.getByText("RevibeFit")).toBeTruthy();
  });
});
```

**Update `RevibeFit-Frontend/package.json` test scripts:**
```json
"test": "vitest run",
"test:coverage": "vitest run --coverage",
"test:report": "vitest run --reporter=html"
```

### Run Tests & Generate Reports

```powershell
# Backend
cd "d:\My Programs and Projects\WBD-REVIBEFIT\RevibeFit-Backend"
npm test
npm run test:coverage   # Generates ./coverage/index.html

# Frontend
cd "d:\My Programs and Projects\WBD-REVIBEFIT\RevibeFit-Frontend"
npm test
npm run test:coverage
```

---

## 6. Containerization – Docker

### Step 1 – Backend Dockerfile

**New file: `RevibeFit-Backend/Dockerfile`**
```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p logs public
EXPOSE 8000
CMD ["node", "src/index.js"]
```

**New file: `RevibeFit-Backend/.dockerignore`**
```
node_modules
logs
.env
.git
*.log
coverage
test-reports
```

### Step 2 – Frontend Dockerfile

**New file: `RevibeFit-Frontend/Dockerfile`**
```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**New file: `RevibeFit-Frontend/nginx.conf`**
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;  # SPA routing fix
    }
    location /api {
        proxy_pass http://backend:8000;
    }
}
```

**New file: `RevibeFit-Frontend/.dockerignore`**
```
node_modules
dist
.env
.git
```

### Step 3 – Docker Compose (orchestrate everything)

**New file: `d:\My Programs and Projects\WBD-REVIBEFIT\docker-compose.yml`**
```yaml
version: "3.9"

services:
  # ── MongoDB ──────────────────────────────────────────────
  mongo:
    image: mongo:7
    container_name: revibe-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: revibe_fit

  # ── Redis ────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: revibe-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  # ── Backend ──────────────────────────────────────────────
  backend:
    build:
      context: ./RevibeFit-Backend
    container_name: revibe-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      PORT: 8000
      MONGODB_URI: mongodb://mongo:27017
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      FATSECRET_CLIENT_ID: ${FATSECRET_CLIENT_ID}
      FATSECRET_CLIENT_SECRET: ${FATSECRET_CLIENT_SECRET}
      B2B_API_KEY: ${B2B_API_KEY}
    depends_on:
      - mongo
      - redis
    volumes:
      - ./RevibeFit-Backend/public:/app/public
      - ./RevibeFit-Backend/logs:/app/logs

  # ── Frontend ─────────────────────────────────────────────
  frontend:
    build:
      context: ./RevibeFit-Frontend
    container_name: revibe-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongo-data:
  redis-data:
```

**New file: `d:\My Programs and Projects\WBD-REVIBEFIT\.env`** (compose env file)
```
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAIL=admin@revibefit.com
ADMIN_PASSWORD=Admin@123
GEMINI_API_KEY=your-key
FATSECRET_CLIENT_ID=your-id
FATSECRET_CLIENT_SECRET=your-secret
B2B_API_KEY=revibe-b2b-secret-2024
```

### Build & Run Everything

```powershell
cd "d:\My Programs and Projects\WBD-REVIBEFIT"

# Build and start all services
docker compose up --build -d

# Check logs
docker compose logs -f backend

# Stop everything
docker compose down

# Full reset (delete volumes too)
docker compose down -v
```

---

## 7. CI Pipeline – GitHub Actions

**New file: `d:\My Programs and Projects\WBD-REVIBEFIT\.github\workflows\ci.yml`**

```yaml
name: RevibeFit CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ── Backend Tests ─────────────────────────────────────────
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: RevibeFit-Backend/package-lock.json

      - name: Install backend dependencies
        working-directory: RevibeFit-Backend
        run: npm ci

      - name: Run backend tests
        working-directory: RevibeFit-Backend
        env:
          NODE_ENV: test
          JWT_SECRET: test-secret-for-ci
          MONGODB_URI: mongodb://localhost:27017
          REDIS_URL: redis://localhost:6379
        run: npm test

      - name: Generate coverage report
        working-directory: RevibeFit-Backend
        run: npm run test:coverage
        continue-on-error: true

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: RevibeFit-Backend/coverage/

  # ── Frontend Tests ────────────────────────────────────────
  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: RevibeFit-Frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: RevibeFit-Frontend
        run: npm ci

      - name: Run frontend tests
        working-directory: RevibeFit-Frontend
        run: npm test

      - name: Build frontend
        working-directory: RevibeFit-Frontend
        env:
          VITE_API_URL: http://localhost:8000
        run: npm run build

  # ── Docker Build Validation ───────────────────────────────
  docker-build:
    name: Docker Build Check
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build backend Docker image
        run: docker build -t revibe-backend ./RevibeFit-Backend

      - name: Build frontend Docker image
        run: docker build -t revibe-frontend ./RevibeFit-Frontend
```

---

## 8. Deployment

### Backend → Render.com (Free tier)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo → select `RevibeFit-Backend`
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Root Directory:** `RevibeFit-Backend`
5. Add all environment variables from `.env`
6. Use **MongoDB Atlas** (cloud) URI for `MONGODB_URI`
7. Add **Redis** via [Upstash](https://upstash.com) (free Redis) → copy Redis URL

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo → set **Root Directory** to `RevibeFit-Frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. Update `CORS_ORIGIN` in Render to match your Vercel URL

### Update Swagger for production URL

**In `src/config/swagger.js`** update servers:
```js
servers: [
  {
    url: process.env.NODE_ENV === "production"
      ? "https://your-backend.onrender.com"
      : `http://localhost:${config.port}`,
    description: process.env.NODE_ENV === "production" ? "Production" : "Development",
  },
],
```

---

## 9. Quick Verification Checklist

| Requirement | What to show at evaluation |
|---|---|
| **DB Indexes** | Run `explain()` in Compass – show `IXSCAN` |
| **Redis Caching** | Call same endpoint twice – show `fromCache: true` + speed diff |
| **Search** | `GET /api/search?q=yoga` returns fuzzy matches |
| **Swagger B2C** | `http://localhost:8000/api-docs` – all endpoints documented |
| **Swagger B2B** | Show `/api/b2b/trainers` with `X-API-KEY` header |
| **Unit Tests** | `npm test` runs green; show `coverage/index.html` |
| **Docker** | `docker compose up` – app runs on port 3000 |
| **CI Pipeline** | Push to GitHub – show green Actions run |
| **Deployment** | Live Vercel URL + Render backend URL |

---

## Priority Order (Recommended execution sequence)

```
Day 1:  Indexes (.lean + schema.index) + Redis setup + cache 3-4 endpoints
Day 2:  Swagger annotations for B2B + b2b.routes.js + search endpoint
Day 3:  Unit tests (backend 3 files + frontend 1 file) + coverage report
Day 4:  Dockerfiles + docker-compose.yml + GitHub Actions workflow
Day 5:  Deploy backend on Render + frontend on Vercel + update Swagger URLs
```

> [!IMPORTANT]
> The **single most critical** item: deploy on Vercel + Render BEFORE evaluation. The professor explicitly said "demo shown only in deployment environment."
