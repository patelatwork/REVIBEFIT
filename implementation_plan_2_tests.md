# RevibeFit Backend — 200+ Test Suite Implementation Plan

## Background

The RevibeFit backend currently has **3 test files** with ~16 tests in `src/__tests__/`. The project is configured with **Vitest** (not Jest) — it uses `"type": "module"` (ESM) in `package.json`, and vitest is already installed with a working `vitest.config.js`. Since you mentioned "Jest," we'll use **Vitest** which is already set up and is functionally identical in API (`describe`, `it`, `expect`, `vi.mock`, `beforeEach`, etc.) — no new packages needed.

## User Review Required

> [!IMPORTANT]
> The project uses **Vitest** (not Jest). Both have the same `describe/it/expect` API, and Vitest is already installed. Switching to Jest would require replacing the existing config, installing different packages, and re-writing the mock patterns. I strongly recommend keeping Vitest — the test syntax is identical to what you'd write in Jest. Please confirm if you still want Jest specifically, or if Vitest is fine.

> [!NOTE]
> All tests will be **pure unit tests** — no database connection required. Model schemas are tested through Mongoose's schema `validate()` API (without connecting to MongoDB), and controller/middleware logic is tested with mocked `req`/`res`/`next` objects.

## Test File Plan (~208 tests across 10 files)

### 1. `src/__tests__/apiUtils.test.js` — ~25 tests
Tests `ApiError`, `ApiResponse`, `asyncHandler`, and `escapeRegex`.

- **ApiError**: constructor shape, default message, statusCode, success=false, errors array, stack capture
- **ApiResponse**: statusCode, data, message, success=true for 2xx, success=false for 4xx+
- **asyncHandler**: passes req/res/next, catches async errors and calls next(err)
- **escapeRegex**: escapes `.`, `*`, `+`, `?`, `^`, `$`, `{`, `(`, `|`, `[`, `\`, null/undefined passthrough

### 2. `src/__tests__/constants.test.js` — ~20 tests
Tests `constants.js` pure functions and data shapes.

- `USER_TYPES`: all 5 values present
- `MANAGER_TYPES`: trainer_manager, lab_manager
- `INDIAN_STATES`: is an array, length=36, includes known states
- `REGION_NAMES`: 6 regions present
- `getStatesForRegions`: single region, multiple regions, deduplication, empty array, non-array input
- `getRegionForState`: known state → correct region, unknown state → null, every Indian state maps to a region
- `STATUS_CODES`: all 8 code values correct

### 3. `src/__tests__/validate.middleware.test.js` — ~20 tests
Tests `validateObjectId`, `validateRequiredFields`.

- **validateObjectId**: valid ObjectId → calls next, invalid string → throws ApiError 400, multiple params, missing param skipped
- **validateRequiredFields**: all present → next, one missing → ApiError 400, empty string treated as missing, null treated as missing, multiple missing listed

### 4. `src/__tests__/auth.middleware.test.js` — ~25 tests
Tests middleware logic with mocked JWT & User model.

- **verifyJWT**: no token → 401, invalid token → 401, user not found → 401, inactive user → 403, suspended user → 403, valid user → sets req.user and calls next
- **verifyAdmin**: no token → 401, non-admin token → 403, valid admin → sets req.adminUser
- **verifyUserType**: no req.user → 401, wrong type → 403, correct type → calls next
- **verifyTrainerManager**: not trainer_manager → 403, adminUser present → bypasses, correct → calls next
- **verifyLabManager**: not lab_manager → 403, adminUser bypasses, correct → calls next

### 5. `src/__tests__/schema.user.test.js` — ~30 tests
Tests User Mongoose schema validation (no DB connection).

- Name: required, minlength 2
- Email: required, regex format
- Phone: 10-digit regex
- Password: minlength 8
- UserType: must be in enum
- Age: required for non-manager, min 13, max 100
- State: must be valid Indian state
- Trainer fields: specialization, certifications required for trainer type
- Lab Partner fields: laboratoryName, laboratoryAddress, licenseNumber required
- Manager fields: managerType required, assignedRegions must have ≥1
- Default fields: isVerified=false, isActive=true, isSuspended=false, approvalStatus logic
- commissionRate defaults & ranges (0-100)

### 6. `src/__tests__/schema.blog.test.js` — ~15 tests
Tests Blog, Challenge, and CommunityPost schemas.

- Blog: title minlength 5/maxlength 200, content minlength 50, category enum, thumbnail required
- Challenge: category enum, goalType enum, goalTarget min 1, difficulty defaults to beginner
- CommunityPost: content required, category enum, maxlength 5000, reactions default 0, isPinned defaults false

### 7. `src/__tests__/schema.liveClass.test.js` — ~20 tests
Tests LiveClass schema and instance methods.

- Schema: title 3-100 chars, classType enum, scheduledTime HH:MM format, duration 15-180, cost 0-10000, maxParticipants 1-200
- `isFull()`: true when currentParticipants >= maxParticipants
- `canJoin()`: false when cancelled, full, or past
- `hasStarted()`: correct boolean based on time
- `isCompleted()`: true when status=completed or past end time
- ClassBooking `calculateRefundAmount()`: 100% for 24+hrs, 50% for 2-24hrs, 0% within 2hrs
- ClassBooking `canBeCancelled()`: false for terminal statuses

### 8. `src/__tests__/auth.tokens.test.js` — ~15 tests
Advanced JWT edge cases.

- Access token payload contains _id, email, userType, name
- Refresh token contains only _id
- Admin token contains isAdmin=true, userType=admin
- Expired tokens throw correctly
- Tampered tokens throw JsonWebTokenError
- Wrong secret throws

### 9. `src/__tests__/commission.test.js` — ~20 tests
Tests commission and financial business logic.

- Trainer commission at 15%: amounts 0, 100, 1000, 9999.99
- Lab partner commission at 10%: various amounts
- Payout = amount - commission
- Commission when rate is 0
- Monthly earnings calculations
- Refund + commission interaction
- Platform fee retention

### 10. `src/__tests__/errorHandler.test.js` — ~18 tests
Tests error handling middleware.

- ApiError passed through unchanged → correct statusCode and JSON
- Non-ApiError converted to 500
- Mongoose-like error → 400
- Stack omitted in production mode
- Stack included in dev mode
- Error response has success=false, message, errors fields

---

## Proposed Changes

### New Test Files

#### [NEW] `src/__tests__/apiUtils.test.js`
#### [NEW] `src/__tests__/constants.test.js`
#### [NEW] `src/__tests__/validate.middleware.test.js`
#### [NEW] `src/__tests__/auth.middleware.test.js`
#### [NEW] `src/__tests__/schema.user.test.js`
#### [NEW] `src/__tests__/schema.blog.test.js`
#### [NEW] `src/__tests__/schema.liveClass.test.js`
#### [NEW] `src/__tests__/auth.tokens.test.js`
#### [NEW] `src/__tests__/commission.test.js`
#### [NEW] `src/__tests__/errorHandler.test.js`

Existing files (`auth.test.js`, `cache.test.js`, `utils.test.js`) are kept as-is.

---

## Verification Plan

### Automated Tests
```bash
cd RevibeFit-Backend
npm test
npm run test:coverage
```
Expected: **200+ passing tests**, 0 failures, coverage report for utils, models, middleware.
