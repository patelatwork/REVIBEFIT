# Manager Pages, Change Password & Forgot Password Implementation

Build 4 missing Lab Manager frontend pages, 2 missing Trainer Manager frontend pages, implement Change Password across all user profiles, and fully implement Forgot Password with email-based reset.

## User Review Required

> [!IMPORTANT]
> **Scope is large** — 6 new frontend pages, 4 new backend endpoints, modifications to 5 existing files. This will be done in phases: first backend API additions, then frontend pages, then cross-cutting password features.

> [!WARNING]
> **Forgot Password sends real emails** via the Gmail SMTP already configured in [.env](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/.env). The reset link will point to `http://localhost:5173/reset-password/:token` (dev only).

---

## Proposed Changes

### Backend — Password APIs

#### [MODIFY] [auth.controller.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/controllers/auth.controller.js)

Add 3 new endpoints:

1. **`changePassword`** — Requires auth. Takes `currentPassword` and `newPassword`. Verifies current password with [comparePassword()](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/models/user.model.js#291-299), then updates and saves (triggering the pre-save hash hook).

2. **`forgotPassword`** — Public. Takes `email`. Generates a crypto random token, hashes it, stores `passwordResetToken` + `passwordResetExpires` (1 hour) on the user, and calls `sendPasswordResetEmail()` with the reset link.

3. **`resetPassword`** — Public. Takes `token` and `newPassword`. Hashes the token, finds user by `passwordResetToken` where `passwordResetExpires > now`, sets new password, clears reset fields.

#### [MODIFY] [auth.routes.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/routes/auth.routes.js)

Add 3 routes:
- `POST /api/auth/change-password` (protected with `verifyJWT`)
- `POST /api/auth/forgot-password` (public, rate-limited)
- `POST /api/auth/reset-password/:token` (public, rate-limited)

#### [MODIFY] [user.model.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/models/user.model.js)

Add 2 fields:
- `passwordResetToken` (String, select: false)
- `passwordResetExpires` (Date, select: false)

#### [MODIFY] [emailService.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/utils/emailService.js)

Add `sendPasswordResetEmail(user, resetUrl)` — HTML email with a branded reset link button, matching existing email template style.

---

### Frontend — Manager Pages

#### [NEW] [ManagerInvoices.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerInvoices.jsx)

**Lab Manager only.** Full invoice management page:
- **Filters bar:** Status dropdown (all/payment_due/paid/overdue/cancelled), Lab Partner search, Billing Period (month/year), Sort by (due date, amount, generated date)
- **Invoice table:** Invoice #, Lab Partner name, Billing Period, Amount, Commission, Status badge, Due Date, Actions
- **Expandable rows:** Click to see commission breakdown (each booking: enthusiast name, test names, booking date, amounts)
- **Action buttons:** "Mark as Paid" (with confirmation dialog), view details
- **Generate Invoice modal:** Select lab partner dropdown (pre-loaded from `/api/manager/lab-partners/commission-rates`), pick month/year, set due day, submit
- **Enforce Overdue button:** Batch enforcement of all overdue invoices with confirmation
- **Grace Period Status:** Section showing labs near grace period expiry
- Uses [ManagerSidebar](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/components/ManagerSidebar.jsx#30-171), `framer-motion`, `lucide-react` — consistent with dashboard design

#### [NEW] [ManagerEarnings.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerEarnings.jsx)

**Lab Manager only.** Analytics dashboard:
- **Revenue Over Time chart:** Line/area chart using pure SVG (no charting library) showing monthly lab earnings for the region. Time period filter (last 6 months, last year, custom)
- **Top Lab Partners table:** Ranked list from `/api/manager/analytics/lab-earnings/top-partners` with lab name, total revenue, commission earned, bookings count
- **Platform Revenue Summary cards:** Total revenue, total commission collected, avg commission rate, active lab partners  
- **Time period filter:** Dropdown to switch between 30 days, 90 days, 6 months, 1 year
- Consistent manager dashboard design

#### [NEW] [ManagerCommissionRequests.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerCommissionRequests.jsx)

**Both Lab Manager & Trainer Manager.** Two-section layout:

**Section 1 — My Commission Requests:**
- Table showing all past requests: target user name/type, current rate, proposed rate, reason, status badge (pending/approved/denied), admin response if any, submitted date
- All requests shown (no time limit)

**Section 2 — New Request Form:**
- User dropdown pre-filtered by manager type (lab partners for Lab Manager, trainers for Trainer Manager) — loaded from `/api/manager/lab-partners/commission-rates` or `/api/manager/users?type=trainer`
- Shows current commission rate when user selected
- Proposed rate input (number, 0-100)
- Reason textarea (required)
- Submit button

#### [NEW] [ManagerProfile.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerProfile.jsx)

**Both Lab Manager & Trainer Manager.** Follows manager dashboard design:

**Profile Header:**
- Profile photo (with upload support via `PUT /api/manager/profile` with `profilePhoto` multipart)
- Name, role badge, region badge

**Profile Details Grid:**
- **Editable fields:** Phone, Age, Profile Photo
- **Read-only fields:** Name, Email, Assigned Region, Manager Type, City, State

**Read-Only Stats Section:**
- Member since date
- Total approvals handled (from existing activity data)
- Commission requests submitted count

**Change Password Section:**
- Current password, New password, Confirm new password inputs
- Password requirements display (min 8 chars)
- Submit calls `POST /api/auth/change-password`

---

### Frontend — Password Pages

#### [NEW] [ForgotPassword.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/auth/ForgotPassword.jsx)

Simple centered card (matching login page design):
- Email input field
- Submit button → calls `POST /api/auth/forgot-password`
- Success message: "If an account exists with this email, a reset link has been sent."
- Back to Login link

#### [NEW] [ResetPassword.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/auth/ResetPassword.jsx)

Centered card:
- Reads `:token` from URL params
- New Password + Confirm Password inputs
- Submit → calls `POST /api/auth/reset-password/:token`
- On success: redirect to `/login` with success message
- On error: show "Invalid or expired reset link. Please request a new one."

---

### Frontend — Add Change Password to Existing Profiles

#### [MODIFY] [TrainerProfile.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/trainer/pages/TrainerProfile.jsx)

Add a "Change Password" collapsible section below the profile form with current/new/confirm password fields.

#### [MODIFY] [LabProfile.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/lab-partner/pages/LabProfile.jsx)

Same — add "Change Password" collapsible section.

---

### Routing

#### [MODIFY] [App.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/App.jsx)

Add routes:
- `/manager/invoices` → `ManagerInvoices`
- `/manager/earnings` → `ManagerEarnings`
- `/manager/commission-requests` → `ManagerCommissionRequests`
- `/manager/profile` → `ManagerProfile`
- `/forgot-password` → `ForgotPassword`
- `/reset-password/:token` → `ResetPassword`

---

## Verification Plan

### Browser Testing

Since there are no existing automated tests in this project, we will verify all changes via browser testing:

1. **Manager Profile (both types):** Navigate to `/manager/profile` as both trainer_manager and lab_manager accounts → verify profile loads, editable fields work, photo upload works, change password works
2. **Manager Commission Requests:** Navigate to `/manager/commission-requests` → verify request list loads, new request form pre-filters by manager type, submission works
3. **Manager Invoices (lab_manager only):** Navigate to `/manager/invoices` → verify invoice list, filters, expandable breakdown, generate invoice modal, mark as paid
4. **Manager Earnings (lab_manager only):** Navigate to `/manager/earnings` → verify charts render, time filter works, top partners table loads
5. **Forgot Password flow:** Click "Forgot Password?" on login → enter email → verify email is sent → click reset link → set new password → login with new password
6. **Change Password on TrainerProfile:** Login as trainer → go to profile → change password → logout → login with new password
7. **Change Password on LabProfile:** Same flow for lab partner
8. **Sidebar navigation:** Verify all sidebar links navigate to correct pages, active states work
