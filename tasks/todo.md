# Manager Region Scope Change: State → Region-based

## Summary
Change manager region scope from individual Indian states to 6 broad regions.
Managers can be assigned multiple regions (checkbox system, not dropdown).

## Decisions
- **Data Model**: `assignedRegion` (String) → `assignedRegions` (Array of region names)
- **User State**: Keep `state` field as-is; backend maps state → region
- **Migration**: No existing managers — fresh start
- **Display**: Multiple colored badges/chips per region
- **Region Filter**: Multi-select checkbox filter on archive page
- **All Regions**: Yes, all 6 can be checked (all-India manager)
- **Validation**: At least one region required during creation
- **Edit Regions**: Admin can update regions post-creation

## 6 Regions
1. **Northern India**: Jammu & Kashmir, Himachal Pradesh, Punjab, Uttarakhand, Haryana, Delhi, Chandigarh, Ladakh, Rajasthan, Uttar Pradesh
2. **Southern India**: Andhra Pradesh, Karnataka, Kerala, Tamil Nadu, Telangana, Puducherry, Lakshadweep
3. **Eastern India**: Bihar, Jharkhand, Odisha, West Bengal, Andaman and Nicobar Islands
4. **Western India**: Gujarat, Maharashtra, Goa, Dadra and Nagar Haveli and Daman and Diu
5. **Central India**: Chhattisgarh, Madhya Pradesh
6. **North-Eastern India**: Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Tripura, Sikkim

## Tasks
- [x] Plan written
- [ ] Backend: Update `constants.js` — add INDIAN_REGIONS map + REGION_NAMES + getStatesForRegions helper
- [ ] Backend: Update `user.model.js` — assignedRegion → assignedRegions (Array)
- [ ] Backend: Update `admin.controller.js` — createManager, archive filter, updateManagerRegions endpoint
- [ ] Backend: Update `manager.controller.js` — getRegion → getRegionStates, all `state: region` → `state: { $in: states }`
- [ ] Backend: Update `auth.middleware.js` — assignedRegion → assignedRegions
- [ ] Backend: Update `activityLogger.middleware.js` — assignedRegion → assignedRegions
- [ ] Backend: Update `emailService.js` — region display
- [ ] Backend: Update `admin.routes.js` — add PATCH updateManagerRegions route
- [ ] Frontend: Update `AdminManagers.jsx` — checkbox UI for regions
- [ ] Frontend: Update `ManagerArchive.jsx` — multi-select region filter
- [ ] Frontend: Update `ManagerSidebar.jsx` — multiple badge display
- [ ] Frontend: Update all manager pages — assignedRegion → assignedRegions display
- [ ] Verify all references updated

---

# Inline Full Profile in Approval Cards

## Summary
Replaced the "View Full Profile" modal pattern with fully expanded inline cards on all approval pages. Reviewers no longer need to click to see applicant details.

## Changes Made
- [x] **Admin PendingApprovals.jsx** — Removed `ProfileModal` component, `profileUser` state, and "View Full Profile" button. All profile details (bio, social links, documents, operating hours, lab images) now render inline within each `ApprovalCard`.
- [x] **Manager ManagerPendingApprovals.jsx** — Extended `ApprovalCard` with full profile details (previously only showed summary). Added `normalisePath` helper, `DocEmbed` component, social links, operating hours table, and embedded document previews.
- [x] Both pages now use `DocEmbed` for inline document/image preview (images render as `<img>`, PDFs as `<iframe>`)
- [x] Operating hours shown as compact Mon–Sun table grid
- [x] Social links (Instagram, YouTube, X, Website) shown as colored icon buttons, hidden if empty
- [x] Action buttons remain in the right column, now with `sticky` positioning
- [x] Manager API URL now uses `VITE_API_URL` env variable instead of hardcoded localhost

---

# Manager Region Sync on Admin Change

## Summary
When admin changes a manager's assigned regions, the manager's UI automatically reflects the change on next page load. Trainers, lab partners, and all data shown are scoped to the updated regions without requiring re-login.

## Architecture
- **Backend**: New `GET /api/manager/me` lightweight endpoint returns fresh `assignedRegions`, `managerType`, `name`, `email`, `profilePhoto`
- **Backend**: `updateManagerRegions` (admin controller) now auto-releases claimed approval reviews for users in removed regions
- **Frontend**: New `useManagerProfile()` hook replaces all `localStorage.getItem('user')` reads across manager pages
- **Hook behavior**: On every page mount, calls `/api/manager/me`, compares regions with cached data, updates localStorage, sets `regionsChanged` flag
- **Data reload**: When `regionsChanged` is true, all page-level `useEffect` data fetches re-run (dashboard, users, approvals, invoices, earnings, commission requests, profile)
- **Sidebar**: Region badges update instantly via fresh `manager` object from the hook

## Changes Made
- [x] **Backend `manager.controller.js`** — Added `getManagerMe` controller (lightweight profile sync endpoint)
- [x] **Backend `manager.routes.js`** — Added `GET /me` route with `verifyManager` middleware
- [x] **Backend `admin.controller.js`** — `updateManagerRegions` now detects removed regions and auto-releases claimed reviews (`claimedBy` / `claimedAt` set to null) for pending users in those removed regions
- [x] **Frontend `hooks/useManagerProfile.js`** — New hook that syncs manager profile with server on every page mount, detects region changes, handles auth redirect
- [x] **Frontend `ManagerDashboard.jsx`** — Replaced localStorage reads with `useManagerProfile()`, data re-fetches on `regionsChanged`
- [x] **Frontend `ManagerUsers.jsx`** — Same integration, users list re-fetches on region change
- [x] **Frontend `ManagerPendingApprovals.jsx`** — Same integration, approvals re-fetch on region change
- [x] **Frontend `ManagerInvoices.jsx`** — Same integration, invoices re-fetch on region change
- [x] **Frontend `ManagerEarnings.jsx`** — Same integration, earnings data re-fetches on region change
- [x] **Frontend `ManagerCommissionRequests.jsx`** — Same integration, commission requests re-fetch on region change
- [x] **Frontend `ManagerProfile.jsx`** — Same integration, profile data re-fetches on region change
