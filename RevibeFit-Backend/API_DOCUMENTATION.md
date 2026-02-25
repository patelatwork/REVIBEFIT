# RevibeFit API Documentation

> **Base URL**: `http://localhost:8000/api`

## Table of Contents

- [Authentication](#authentication)
- [Auth Routes](#auth-routes)
- [Admin Routes](#admin-routes)
- [Blog Routes](#blog-routes)
- [Lab Partner Routes](#lab-partner-routes)
- [Live Class Routes](#live-class-routes)
- [Nutrition Routes](#nutrition-routes)
- [Trainer Routes](#trainer-routes)
- [Workout Routes](#workout-routes)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header or an `accessToken` cookie:

```
Authorization: Bearer <token>
```

Tokens are obtained via the login endpoints and are valid for the duration specified by `JWT_EXPIRY` (default: 7 days).

### User Types (Roles)

| Role                 | Description                      |
| -------------------- | -------------------------------- |
| `fitness-enthusiast` | End user consuming fitness content |
| `trainer`            | Certified fitness trainer        |
| `lab-partner`        | Lab/diagnostic partner           |
| `admin`              | Platform administrator           |

---

## Auth Routes

**Prefix**: `/api/auth`

| Method | Endpoint  | Auth     | Rate Limited | Description                        |
| ------ | --------- | -------- | ------------ | ---------------------------------- |
| POST   | `/signup` | Public   | Yes (20/15m) | Register a new user                |
| POST   | `/login`  | Public   | Yes (20/15m) | Login and receive access token     |
| POST   | `/logout` | Required | No           | Logout and clear cookies           |

### POST `/signup`

**Body** (`multipart/form-data` for trainers with certification upload):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "userType": "fitness-enthusiast | trainer | lab-partner",
  "specialization": "Yoga",          // trainer only
  "experience": 5,                    // trainer only
  "laboratoryName": "HealthLab",      // lab-partner only
  "laboratoryAddress": "123 Main St", // lab-partner only
  "laboratoryPhone": "+911234567890"  // lab-partner only
}
```

**File**: `certifications` (PDF/image, trainers only)

### POST `/login`

**Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOi..."
  },
  "message": "Login successful"
}
```

---

## Admin Routes

**Prefix**: `/api/admin`

All routes (except login) require **admin JWT authentication**.

### Authentication

| Method | Endpoint | Auth   | Rate Limited | Description   |
| ------ | -------- | ------ | ------------ | ------------- |
| POST   | `/login` | Public | Yes (20/15m) | Admin login   |

### POST `/login`

**Body**:
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```

### User Management

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/pending-approvals`            | List pending user approvals |
| POST   | `/approve/:userId`              | Approve a user             |
| POST   | `/reject/:userId`               | Reject a user              |
| GET    | `/users?search=&userType=&page=&limit=` | List all users (paginated) |
| PATCH  | `/users/:userId/suspend`        | Toggle user suspension     |

### Analytics

| Method | Endpoint                                  | Description                |
| ------ | ----------------------------------------- | -------------------------- |
| GET    | `/stats`                                  | Dashboard stats overview   |
| GET    | `/analytics/monthly-growth`               | User growth over time      |
| GET    | `/analytics/user-distribution`            | User type distribution     |
| GET    | `/analytics/lab-earnings/over-time`       | Lab earnings timeline      |
| GET    | `/analytics/lab-earnings/breakdown`       | Lab earnings breakdown     |
| GET    | `/analytics/lab-earnings/top-partners`    | Top earning lab partners   |

### Lab Partner Management

| Method | Endpoint                                                | Description                        |
| ------ | ------------------------------------------------------- | ---------------------------------- |
| PATCH  | `/lab-partners/:labPartnerId/suspend-for-nonpayment`   | Suspend lab for non-payment        |
| PATCH  | `/lab-partners/:labPartnerId/unsuspend`                 | Unsuspend a lab partner            |
| GET    | `/lab-partners/commission-rates`                        | Get all commission rates           |
| PATCH  | `/lab-partners/:labPartnerId/commission-rate`           | Update commission rate             |

### Invoice Management

| Method | Endpoint                                      | Description                    |
| ------ | --------------------------------------------- | ------------------------------ |
| POST   | `/invoices/generate/:labPartnerId`            | Generate monthly invoice       |
| POST   | `/invoices/generate-flexible/:labPartnerId`   | Generate flexible-date invoice |
| POST   | `/invoices/generate-all`                      | Generate all monthly invoices  |
| GET    | `/invoices`                                   | List all invoices              |
| GET    | `/invoices/:invoiceId`                        | Get invoice details            |
| GET    | `/invoice-requests`                           | Get pending invoice requests   |
| PATCH  | `/invoices/:invoiceId/mark-paid`              | Mark invoice as paid           |
| POST   | `/invoices/enforce-overdue`                   | Enforce overdue invoices       |
| GET    | `/invoices/grace-period-status`               | Get grace period status        |

---

## Blog Routes

**Prefix**: `/api/blogs`

| Method | Endpoint                 | Auth        | Role              | Description             |
| ------ | ------------------------ | ----------- | ----------------- | ----------------------- |
| GET    | `/`                      | Public      | -                 | Get all published blogs |
| GET    | `/:id`                   | Public      | -                 | Get blog by ID          |
| POST   | `/`                      | Required    | trainer           | Create blog (with thumbnail) |
| GET    | `/trainer/my-blogs`      | Required    | trainer           | Get trainer's own blogs |
| PUT    | `/:id`                   | Required    | trainer           | Update blog             |
| DELETE | `/:id`                   | Required    | trainer           | Delete blog             |
| GET    | `/user/read-blogs`       | Required    | fitness-enthusiast | Get user's read history |
| POST   | `/:id/mark-read`         | Required    | fitness-enthusiast | Mark blog as read       |
| GET    | `/:id/read-status`       | Required    | fitness-enthusiast | Check read status       |

---

## Lab Partner Routes

**Prefix**: `/api/lab-partners`

### Public Endpoints

| Method | Endpoint       | Description                      |
| ------ | -------------- | -------------------------------- |
| GET    | `/`            | List approved lab partners       |
| GET    | `/:id`         | Get lab partner details          |
| GET    | `/:id/tests`   | Get lab partner's available tests |

### Lab Partner Only (Authenticated + role: lab-partner)

| Method | Endpoint                                  | Description                    |
| ------ | ----------------------------------------- | ------------------------------ |
| POST   | `/tests/add`                              | Add a new lab test             |
| GET    | `/tests/my-tests`                         | Get own tests                  |
| PUT    | `/tests/:testId`                          | Update a test                  |
| DELETE | `/tests/:testId`                          | Delete a test                  |
| GET    | `/offered-tests`                          | Get offered tests              |
| PUT    | `/offered-tests`                          | Update offered tests           |
| GET    | `/bookings/lab-bookings`                  | Get incoming bookings          |
| PUT    | `/bookings/:bookingId/status`             | Update booking status          |
| POST   | `/bookings/:bookingId/upload-report`      | Upload test report (file)      |
| DELETE | `/bookings/:bookingId/report`             | Delete test report             |
| PATCH  | `/bookings/:bookingId/user-payment-received` | Mark user payment received |
| GET    | `/invoices`                               | Get own invoices               |
| GET    | `/invoices/:invoiceId`                    | Get invoice details            |
| POST   | `/request-invoice`                        | Request invoice generation     |
| GET    | `/financial-summary`                      | Get financial overview         |
| PUT    | `/profile`                                | Update lab partner profile     |

### Fitness Enthusiast Only (Authenticated + role: fitness-enthusiast)

| Method | Endpoint                        | Description           |
| ------ | ------------------------------- | --------------------- |
| POST   | `/bookings/create`              | Book a lab test       |
| GET    | `/bookings/my-bookings`         | Get own bookings      |
| PUT    | `/bookings/:bookingId/cancel`   | Cancel a booking      |

### Both Roles (Authenticated)

| Method | Endpoint                        | Description           |
| ------ | ------------------------------- | --------------------- |
| GET    | `/bookings/:bookingId/report`   | View booking report   |

---

## Live Class Routes

**Prefix**: `/api/live-classes`

| Method | Endpoint                  | Auth     | Role              | Description             |
| ------ | ------------------------- | -------- | ----------------- | ----------------------- |
| GET    | `/`                       | Public   | -                 | List all live classes   |
| GET    | `/public/:id`             | Public   | -                 | Get class details       |
| POST   | `/`                       | Required | trainer           | Create live class       |
| PUT    | `/:id`                    | Required | trainer           | Update live class       |
| DELETE | `/:id`                    | Required | trainer           | Delete live class       |
| GET    | `/trainer/my-classes`     | Required | trainer           | Get trainer's classes   |
| GET    | `/trainer/earnings`       | Required | trainer           | Get class earnings      |
| POST   | `/:id/join`               | Required | fitness-enthusiast | Join live class        |
| GET    | `/my-bookings`            | Required | fitness-enthusiast | Get class bookings     |
| DELETE | `/bookings/:bookingId`    | Required | fitness-enthusiast | Cancel class booking   |

---

## Nutrition Routes

**Prefix**: `/api/nutrition`

All routes require authentication.

### Nutrition Profile

| Method | Endpoint   | Description                        |
| ------ | ---------- | ---------------------------------- |
| POST   | `/profile` | Create or update nutrition profile |
| GET    | `/profile` | Get current nutrition profile      |
| DELETE | `/profile` | Delete nutrition profile           |

### Meal Plans (AI-Generated)

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| POST   | `/meal-plan/generate`  | Generate AI meal plan    |
| GET    | `/meal-plans`          | List saved meal plans    |
| GET    | `/meal-plans/:id`      | Get meal plan details    |
| PUT    | `/meal-plans/:id`      | Update meal plan         |
| DELETE | `/meal-plans/:id`      | Delete meal plan         |

---

## Trainer Routes

**Prefix**: `/api/trainers`

| Method | Endpoint              | Auth     | Role    | Description                |
| ------ | --------------------- | -------- | ------- | -------------------------- |
| GET    | `/`                   | Public   | -       | List approved trainers     |
| GET    | `/:id`                | Public   | -       | Get trainer details        |
| GET    | `/dashboard/stats`    | Required | trainer | Dashboard statistics       |
| GET    | `/dashboard/clients`  | Required | trainer | List trainer's clients     |
| GET    | `/dashboard/schedule` | Required | trainer | Get class schedule         |
| GET    | `/dashboard/earnings` | Required | trainer | Get earnings breakdown     |
| PUT    | `/profile`            | Required | trainer | Update trainer profile     |

---

## Workout Routes

**Prefix**: `/api/workouts`

All routes require authentication.

| Method | Endpoint          | Description                    |
| ------ | ----------------- | ------------------------------ |
| POST   | `/complete`       | Save a completed workout       |
| GET    | `/completed`      | Get completed workout history  |
| DELETE | `/completed/:id`  | Delete a completed workout log |

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Descriptive error message",
  "errors": []
}
```

### Common Status Codes

| Code | Meaning                |
| ---- | ---------------------- |
| 200  | Success                |
| 201  | Created                |
| 400  | Bad Request            |
| 401  | Unauthorized           |
| 403  | Forbidden              |
| 404  | Not Found              |
| 429  | Too Many Requests      |
| 500  | Internal Server Error  |

---

## Rate Limiting

| Limiter      | Window  | Max Requests | Applied To                    |
| ------------ | ------- | ------------ | ----------------------------- |
| API Limiter  | 15 min  | 100          | All `/api` routes             |
| Auth Limiter | 15 min  | 20           | Login / signup routes         |

When rate limited, the response is:

```json
{
  "success": false,
  "message": "Too many requests, please try again after 15 minutes"
}
```

---

## Health Check

| Method | Endpoint  | Description       |
| ------ | --------- | ----------------- |
| GET    | `/health` | Server health check |

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```
