import { Router } from "express";
import { verifyManagerOrAdmin, verifyManager } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";
import {
    getManagerProfile,
    getManagerMe,
    updateManagerProfile,
    getPendingApprovals,
    claimApproval,
    releaseApproval,
    approveUser,
    rejectUser,
    getAllUsers,
    toggleUserSuspension,
    getUserStats,
    getUserActivity,
    getLabPartnersWithCommissionRates,
    suspendLabForNonPayment,
    unsuspendLab,
    requestCommissionRateChange,
    getMyCommissionRequests,
    getAllInvoices,
    getInvoiceById,
    generateMonthlyInvoice,
    markInvoiceAsPaid,
    enforceOverdueInvoices,
    getInvoiceRequests,
    getGracePeriodStatus,
    getDashboardAnalytics,
    getMonthlyGrowth,
    getUserDistribution,
    getLabEarningsOverTime,
    getTopLabPartners,
    getPlatformRevenue,
} from "../controllers/manager.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ─── Auth ─────────────────────────────────────────────────
// Manager login is handled by the unified /api/auth/login endpoint

// ─── Protected Routes ─────────────────────────────────────

/**
 * @swagger
 * /api/manager/me:
 *   get:
 *     summary: Get current manager profile
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager profile returned successfully
 */
// Profile
router.get("/me", verifyManager, getManagerMe);

/**
 * @swagger
 * /api/manager/profile:
 *   get:
 *     summary: Get manager profile details
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager profile details returned
 */
router.get("/profile", verifyManager, getManagerProfile);

/**
 * @swagger
 * /api/manager/profile:
 *   put:
 *     summary: Update manager profile
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/profile", verifyManager, upload.single("profilePhoto"), updateManagerProfile);

// ─── Onboarding & Approvals ──────────────────────────────

/**
 * @swagger
 * /api/manager/pending-approvals:
 *   get:
 *     summary: Get pending trainer/lab approvals
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending approvals list
 */
router.get("/pending-approvals", verifyManagerOrAdmin, getPendingApprovals);

/**
 * @swagger
 * /api/manager/claim/{userId}:
 *   post:
 *     summary: Claim a pending approval request
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approval claim recorded
 */
router.post("/claim/:userId", verifyManager, validateObjectId("userId"), claimApproval);

/**
 * @swagger
 * /api/manager/release/{userId}:
 *   post:
 *     summary: Release a claimed approval request
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approval claim released
 */
router.post("/release/:userId", verifyManager, validateObjectId("userId"), releaseApproval);

/**
 * @swagger
 * /api/manager/approve/{userId}:
 *   post:
 *     summary: Approve a pending user account
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User approved successfully
 */
router.post("/approve/:userId", verifyManagerOrAdmin, validateObjectId("userId"), approveUser);

/**
 * @swagger
 * /api/manager/reject/{userId}:
 *   post:
 *     summary: Reject a pending user account
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User rejected successfully
 */
router.post("/reject/:userId", verifyManagerOrAdmin, validateObjectId("userId"), rejectUser);

// ─── User Management ─────────────────────────────────────

/**
 * @swagger
 * /api/manager/users:
 *   get:
 *     summary: Get all users with filters/pagination
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users returned successfully
 */
router.get("/users", verifyManagerOrAdmin, getAllUsers);

/**
 * @swagger
 * /api/manager/users/{userId}/activity:
 *   get:
 *     summary: Get specific user activity details
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activity returned
 */
router.get("/users/:userId/activity", verifyManagerOrAdmin, validateObjectId("userId"), getUserActivity);

/**
 * @swagger
 * /api/manager/users/{userId}/suspend:
 *   patch:
 *     summary: Suspend or unsuspend a user
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               suspend:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User suspension state updated
 */
router.patch("/users/:userId/suspend", verifyManagerOrAdmin, validateObjectId("userId"), toggleUserSuspension);

/**
 * @swagger
 * /api/manager/stats:
 *   get:
 *     summary: Get manager dashboard stats
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats returned
 */
router.get("/stats", verifyManagerOrAdmin, getUserStats);

// ─── Lab Partner Management ──────────────────────────────

/**
 * @swagger
 * /api/manager/lab-partners/commission-rates:
 *   get:
 *     summary: Get lab partners with commission rates
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission rates returned
 */
router.get("/lab-partners/commission-rates", verifyManagerOrAdmin, getLabPartnersWithCommissionRates);

/**
 * @swagger
 * /api/manager/lab-partners/{labPartnerId}/suspend:
 *   patch:
 *     summary: Suspend a lab partner for non-payment
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labPartnerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lab partner suspended
 */
router.patch("/lab-partners/:labPartnerId/suspend", verifyManagerOrAdmin, validateObjectId("labPartnerId"), suspendLabForNonPayment);

/**
 * @swagger
 * /api/manager/lab-partners/{labPartnerId}/unsuspend:
 *   patch:
 *     summary: Unsuspend a lab partner
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labPartnerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab partner unsuspended
 */
router.patch("/lab-partners/:labPartnerId/unsuspend", verifyManagerOrAdmin, validateObjectId("labPartnerId"), unsuspendLab);

// ─── Commission Rate Change Requests ─────────────────────

/**
 * @swagger
 * /api/manager/commission-requests:
 *   post:
 *     summary: Create a commission rate change request
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               labPartnerId:
 *                 type: string
 *               requestedRate:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created
 */
router.post("/commission-requests", verifyManager, requestCommissionRateChange);

/**
 * @swagger
 * /api/manager/commission-requests/mine:
 *   get:
 *     summary: Get my commission rate requests
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests returned
 */
router.get("/commission-requests/mine", verifyManager, getMyCommissionRequests);

// ─── Invoice Management ──────────────────────────────────

/**
 * @swagger
 * /api/manager/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices returned
 */
router.get("/invoices", verifyManagerOrAdmin, getAllInvoices);

/**
 * @swagger
 * /api/manager/invoices/grace-period-status:
 *   get:
 *     summary: Get grace period status for invoices
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grace period status returned
 */
router.get("/invoices/grace-period-status", verifyManagerOrAdmin, getGracePeriodStatus);

/**
 * @swagger
 * /api/manager/invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice details by ID
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details returned
 */
router.get("/invoices/:invoiceId", verifyManagerOrAdmin, validateObjectId("invoiceId"), getInvoiceById);

/**
 * @swagger
 * /api/manager/invoices/generate/{labPartnerId}:
 *   post:
 *     summary: Generate monthly invoice for a lab partner
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labPartnerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Invoice generated
 */
router.post("/invoices/generate/:labPartnerId", verifyManagerOrAdmin, validateObjectId("labPartnerId"), generateMonthlyInvoice);

/**
 * @swagger
 * /api/manager/invoices/{invoiceId}/mark-paid:
 *   patch:
 *     summary: Mark an invoice as paid
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *               paymentReference:
 *                 type: string
 *               paymentNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice marked as paid
 */
router.patch("/invoices/:invoiceId/mark-paid", verifyManagerOrAdmin, validateObjectId("invoiceId"), markInvoiceAsPaid);

/**
 * @swagger
 * /api/manager/invoices/enforce-overdue:
 *   post:
 *     summary: Enforce overdue invoices (suspension workflow)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue enforcement completed
 */
router.post("/invoices/enforce-overdue", verifyManagerOrAdmin, enforceOverdueInvoices);

/**
 * @swagger
 * /api/manager/invoice-requests:
 *   get:
 *     summary: Get invoice-related requests/queue
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice requests returned
 */
router.get("/invoice-requests", verifyManagerOrAdmin, getInvoiceRequests);

// ─── Analytics ────────────────────────────────────────────

/**
 * @swagger
 * /api/manager/analytics/dashboard:
 *   get:
 *     summary: Get manager analytics dashboard summary
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics returned
 */
router.get("/analytics/dashboard", verifyManagerOrAdmin, getDashboardAnalytics);

/**
 * @swagger
 * /api/manager/analytics/monthly-growth:
 *   get:
 *     summary: Get monthly growth analytics
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly growth data returned
 */
router.get("/analytics/monthly-growth", verifyManagerOrAdmin, getMonthlyGrowth);

/**
 * @swagger
 * /api/manager/analytics/user-distribution:
 *   get:
 *     summary: Get user-type distribution analytics
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User distribution data returned
 */
router.get("/analytics/user-distribution", verifyManagerOrAdmin, getUserDistribution);

/**
 * @swagger
 * /api/manager/analytics/lab-earnings/over-time:
 *   get:
 *     summary: Get lab earnings over time
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [30days, 12months, all]
 *     responses:
 *       200:
 *         description: Lab earnings over time returned
 */
router.get("/analytics/lab-earnings/over-time", verifyManagerOrAdmin, getLabEarningsOverTime);

/**
 * @swagger
 * /api/manager/analytics/lab-earnings/top-partners:
 *   get:
 *     summary: Get top lab partners by earnings
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top partners returned
 */
router.get("/analytics/lab-earnings/top-partners", verifyManagerOrAdmin, getTopLabPartners);

/**
 * @swagger
 * /api/manager/analytics/platform-revenue:
 *   get:
 *     summary: Get platform revenue analytics
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform revenue data returned
 */
router.get("/analytics/platform-revenue", verifyManagerOrAdmin, getPlatformRevenue);

export default router;
