# Manager Type Split: Trainer Manager & Lab Manager

Split the single generic "manager" role into two scoped types — **Trainer Manager** and **Lab Manager** — with distinct access control, dashboards, and BI-ready activity logging.

## User Review Required

> [!IMPORTANT]
> **Fitness Enthusiast visibility**: FEs with no trainer bookings or lab bookings are visible to **neither** manager type — only admin sees them. Both manager types can see FEs who are associated with their domain (via bookings), but each only sees domain-relevant data.

> [!WARNING]
> **Cross-domain suspension**: When any manager suspends a fitness enthusiast, it's a full account suspension affecting both domains. This was chosen for simplicity — it's the user's explicit preference.

> [!IMPORTANT]
> **`department` field removal**: The `department` field is being replaced by `managerType`. Since no existing managers exist in the database, no migration is needed.

---

## Proposed Changes

### Constants & Data Models

#### [MODIFY] [constants.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/constants.js)
Add `MANAGER_TYPES` enum:
```js
export const MANAGER_TYPES = {
  TRAINER_MANAGER: "trainer_manager",
  LAB_MANAGER: "lab_manager",
};
```

---

#### [MODIFY] [user.model.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/models/user.model.js)
1. **Replace** `department` field with `managerType`:
```js
managerType: {
  type: String,
  enum: ["trainer_manager", "lab_manager"],
  required: function() { return this.userType === USER_TYPES.MANAGER; },
  default: null,
},
```
2. **Add** `reportsTo` field (for future hierarchy):
```js
reportsTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
```
3. **Enhance** `approvedBy` from `String` to `mongoose.Schema.Types.ObjectId` (ref: "User"). Keep `String` for backward compat but add new `approvedByRef` field with ObjectId.

---

#### [MODIFY] [managerActivityLog.model.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/models/managerActivityLog.model.js)
Upgrade to BI-standard event schema:
```js
managerType: { type: String, enum: ["trainer_manager", "lab_manager"], required: true },
region: { type: String, required: true },
targetUserType: { type: String, default: null },
```
- Add `SUSPEND_TRAINER`, `UNSUSPEND_TRAINER`, `REQUEST_TRAINER_COMMISSION_CHANGE` to action enum
- Add index: `{ managerType: 1, region: 1, createdAt: -1 }`
- **Remove** TTL index (immutable historical logs per BI requirement)

---

### Auth & Middleware

#### [MODIFY] [auth.middleware.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/middlewares/auth.middleware.js)
- In `verifyManager` and `verifyManagerOrAdmin`, attach `managerType` to `req.managerUser`:
```diff
 req.managerUser = {
   email: user.email,
   name: user.name,
   userType: "manager",
+  managerType: user.managerType,
   assignedRegion: user.assignedRegion,
 };
```
- Add two new middleware helpers:
```js
export const verifyTrainerManager = asyncHandler(async (req, res, next) => {
  // Runs after verifyManager, checks req.user.managerType === "trainer_manager"
});
export const verifyLabManager = asyncHandler(async (req, res, next) => {
  // Runs after verifyManager, checks req.user.managerType === "lab_manager"
});
```

---

#### [MODIFY] [activityLogger.middleware.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/middlewares/activityLogger.middleware.js)
Enrich log entries with `managerType` and `region`:
```diff
 await ManagerActivityLog.create({
   managerId,
+  managerType: req.user?.managerType,
+  region: req.user?.assignedRegion,
   action,
   targetModel,
   targetId,
-  details,
+  details: { ...details, targetUserType: details.userType || null },
   ipAddress: ...
 });
```

---

### Manager Controller (Major Changes)

#### [MODIFY] [manager.controller.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/controllers/manager.controller.js)

**Helper — get allowed user types by manager type:**
```js
const getAllowedUserTypes = (managerType) => {
  if (managerType === "trainer_manager") return [USER_TYPES.TRAINER];
  if (managerType === "lab_manager") return [USER_TYPES.LAB_PARTNER];
  return [];
};
```

**`getPendingApprovals` (line 101):** Filter `userType` by `getAllowedUserTypes(req.user.managerType)` instead of both.

**`claimApproval` (line 116):** Add check: target user's type must be in `getAllowedUserTypes`.

**`approveUser` (line 161) / `rejectUser` (line 195):** Add guard — target user type must match manager's scope.

**`getAllUsers` (line 223):** 
- Trainer Manager: default filter to `userType: { $in: [TRAINER] }`. If FE filter selected, query FEs who have ClassBookings with trainers in this region.
- Lab Manager: default filter to `userType: { $in: [LAB_PARTNER] }`. If FE filter selected, query FEs who have LabBookings with lab partners in this region.

**`toggleUserSuspension` (line 253):**
- Trainer Manager: can only suspend `trainer` or `fitness-enthusiast` types
- Lab Manager: can only suspend `lab-partner` or `fitness-enthusiast` types

**`getUserStats` (line 278):** Return only relevant counts per manager type.

**`getUserActivity` (line 295):** 
- For FE viewed by Trainer Manager: return only `classBookings`, `workouts`, `blogReadings` — omit `labBookings`
- For FE viewed by Lab Manager: return only `labBookings` — omit `classBookings`, `workouts`
- For trainers: only Trainer Manager can view
- For lab partners: only Lab Manager can view

**`requestCommissionRateChange` (line 407):** Scope `targetUserType` filter by manager type.

**Lab-specific endpoints** (lines 346–675: `getLabPartnersWithCommissionRates`, `suspendLabForNonPayment`, `unsuspendLab`, all invoice management, `getInvoiceRequests`, `getGracePeriodStatus`): Add guard at top — `if (req.user.managerType !== "lab_manager") throw 403`.

**`getDashboardAnalytics` (line 679):** Return different dashboard payload per manager type.
- **Trainer Manager dashboard:** user counts (trainers + associated FEs), class stats, class-related bookings, pending trainer approvals, trainer earnings overview.
- **Lab Manager dashboard:** user counts (lab partners + associated FEs), lab booking stats, invoices, commission stats, pending lab partner approvals.

**Analytics endpoints** (lines 739–834): Scope each by manager type — `getMonthlyGrowth` shows only relevant user types, `getUserDistribution` shows only scope-relevant types, `getLabEarningsOverTime`/`getTopLabPartners` are lab-manager-only, `getPlatformRevenue` returns only the relevant commission type.

---

### Admin Controller

#### [MODIFY] [admin.controller.js](file:///Users/krxna/main/revibefit/RevibeFit-Backend/src/controllers/admin.controller.js)

**`createManager` (line 2537):**
```diff
- const { name, email, password, phone, age, assignedRegion, department } = req.body;
+ const { name, email, password, phone, age, assignedRegion, managerType } = req.body;

- if (!name || !email || !password) {
+ if (!name || !email || !password || !managerType || !age) {
+   throw new ApiError(STATUS_CODES.BAD_REQUEST, "Name, email, password, age, and manager type are required");

+ if (!["trainer_manager", "lab_manager"].includes(managerType)) {
+   throw new ApiError(STATUS_CODES.BAD_REQUEST, "Manager type must be 'trainer_manager' or 'lab_manager'");
+ }

  const manager = await User.create({
    ...
-   department: department || null,
+   managerType,
    ...
  });
```

---

### Frontend Changes

#### [MODIFY] [AdminManagers.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/admin/pages/AdminManagers.jsx)
1. Replace `department` text field with `managerType` dropdown (two options: "Trainer Manager", "Lab Manager")
2. Add mandatory [age](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerUsers.jsx#9-210) number input field
3. Update form state: replace `department` key with `managerType`, add [age](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerUsers.jsx#9-210)
4. Show manager type badge on each manager card (color-coded)
5. Update `createForm` reset to include  `managerType` and [age](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerUsers.jsx#9-210)

---

#### [MODIFY] [ManagerSidebar.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/components/ManagerSidebar.jsx)
Accept `managerType` prop and conditionally filter `navItems`:
- **Trainer Manager sidebar:** Dashboard, Approvals, Users, Commission Requests, Profile
- **Lab Manager sidebar:** Dashboard, Approvals, Users, Invoices, Earnings, Commission Requests, Profile
- Display manager type badge below region badge

---

#### [MODIFY] [ManagerDashboard.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerDashboard.jsx)
Read `managerType` from localStorage user object and render type-specific content:
- **Trainer Manager:** Stats → Total Trainers, Pending Trainer Approvals, Active Trainers, Class Bookings. Breakdown → Trainers only. Quick Actions → Review Trainer Approvals, Manage Trainers.
- **Lab Manager:** Stats → Total Lab Partners, Pending Lab Approvals, Overdue Invoices, Active Labs. Breakdown → Lab Partners, Invoice Summary. Quick Actions → Review Lab Approvals, Manage Invoices, Manage Labs.

---

#### [MODIFY] [ManagerUsers.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerUsers.jsx)
Update userType filter dropdown:
- **Trainer Manager:** "All Types" → only "Trainers" and "Fitness Enthusiasts" options
- **Lab Manager:** "All Types" → only "Lab Partners" and "Fitness Enthusiasts" options

---

#### [MODIFY] [ManagerPendingApprovals.jsx](file:///Users/krxna/main/revibefit/RevibeFit-Frontend/src/features/manager/pages/ManagerPendingApprovals.jsx)
No changes needed — backend filters by manager type. The frontend already shows generic user data.

---

## Verification Plan

### Browser Tests
1. **Admin creates a Trainer Manager:**
   - Open `http://localhost:5173/admin/managers`
   - Click "Add Manager" → fill form with managerType = "Trainer Manager"
   - Verify the new manager card shows "Trainer Manager" badge
   - Log in as the new Trainer Manager
   - Verify sidebar shows: Dashboard, Approvals, Users, Commission Requests, Profile (no Invoices/Earnings)
   - Verify dashboard shows trainer-focused stats (no Invoice Summary)
   - Navigate to Pending Approvals → only trainer approvals should appear
   - Navigate to Users → filter dropdown only shows "Trainers" and "Fitness Enthusiasts"

2. **Admin creates a Lab Manager:**
   - Same flow but with managerType = "Lab Manager"
   - Verify sidebar includes Invoices and Earnings
   - Verify dashboard shows lab-focused stats with Invoice Summary
   - Pending Approvals shows only lab partner approvals
   - Users filter shows only "Lab Partners" and "Fitness Enthusiasts"

3. **Cross-domain denial:**
   - As Trainer Manager, attempt to navigate to `/manager/invoices` → page should be empty or show access denied
   - As Lab Manager, verify no trainer-specific data appears

### API Verification
Use `curl` or browser dev tools to verify:
1. Trainer Manager calls `GET /api/manager/pending-approvals` → only trainers returned
2. Lab Manager calls `GET /api/manager/pending-approvals` → only lab partners returned
3. Trainer Manager calls `POST /api/manager/approve/:labPartnerId` → rejected with 403
4. Lab Manager calls `PATCH /api/manager/users/:trainerId/suspend` → rejected with 403
