import { Router } from "express";
import {
  adminLogin,
  getPendingApprovals,
  approveUser,
  rejectUser,
  getUserStats,
  getMonthlyGrowth,
  getUserDistribution,
  getAllUsers,
  toggleUserSuspension,
  generateMonthlyInvoice,
  generateAllMonthlyInvoices,
  getAllInvoices,
  getInvoiceById,
  suspendLabForNonPayment,
  unsuspendLab,
  markInvoiceAsPaid,
  enforceOverdueInvoices,
  getGracePeriodStatus,
  updateLabPartnerCommissionRate,
  getLabPartnersWithCommissionRates,
  generateFlexibleInvoice,
  getInvoiceRequests,
  getLabEarningsOverTime,
  getLabEarningsBreakdown,
  getTopLabPartners,
  getDashboardAnalytics,
  updateTrainerCommissionRate,
  getTrainersWithCommissionRates,
  getTrainerEarningsOverTime,
  getTrainerEarningsBreakdown,
  getPlatformRevenue,
  getUserActivity,
  createManager,
  getAllManagers,
  removeManager,
  getManagerActivityLog,
  getPendingCommissionRequests,
  handleCommissionRateRequest,
} from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin login successful — returns JWT token
 *       401:
 *         description: Invalid admin credentials
 *       429:
 *         description: Too many requests
 */
router.post("/login", authLimiter, adminLogin);

// ─── All routes below require admin authentication ────────
router.use(verifyAdmin);

// ─── Approval management ──────────────────────────────────

/**
 * @swagger
 * /api/admin/pending-approvals:
 *   get:
 *     summary: Get pending trainer/lab-partner approval requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending users
 */
router.get("/pending-approvals", getPendingApprovals);

/**
 * @swagger
 * /api/admin/approve/{userId}:
 *   post:
 *     summary: Approve a trainer or lab partner
 *     tags: [Admin]
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
 *       404:
 *         description: User not found
 */
router.post("/approve/:userId", approveUser);

/**
 * @swagger
 * /api/admin/reject/{userId}:
 *   post:
 *     summary: Reject a trainer or lab partner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User rejected
 */
router.post("/reject/:userId", rejectUser);

// ─── Dashboard statistics ─────────────────────────────────

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats (total users, active users, revenue, etc.)
 */
router.get("/stats", getUserStats);

/**
 * @swagger
 * /api/admin/dashboard-analytics:
 *   get:
 *     summary: Get comprehensive dashboard analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete dashboard analytics data
 */
router.get("/dashboard-analytics", getDashboardAnalytics);

// ─── Analytics ────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/analytics/monthly-growth:
 *   get:
 *     summary: Get monthly user growth data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly growth statistics
 */
router.get("/analytics/monthly-growth", getMonthlyGrowth);

/**
 * @swagger
 * /api/admin/analytics/user-distribution:
 *   get:
 *     summary: Get user type distribution
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Distribution of user types
 */
router.get("/analytics/user-distribution", getUserDistribution);

/**
 * @swagger
 * /api/admin/analytics/lab-earnings/over-time:
 *   get:
 *     summary: Get lab earnings over time
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lab earnings timeline data
 */
router.get("/analytics/lab-earnings/over-time", getLabEarningsOverTime);

/**
 * @swagger
 * /api/admin/analytics/lab-earnings/breakdown:
 *   get:
 *     summary: Get lab earnings breakdown
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lab earnings breakdown by partner
 */
router.get("/analytics/lab-earnings/breakdown", getLabEarningsBreakdown);

/**
 * @swagger
 * /api/admin/analytics/lab-earnings/top-partners:
 *   get:
 *     summary: Get top-earning lab partners
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranked list of top lab partners
 */
router.get("/analytics/lab-earnings/top-partners", getTopLabPartners);

// ─── Trainer commission management ────────────────────────

/**
 * @swagger
 * /api/admin/trainers/commission-rates:
 *   get:
 *     summary: Get all trainers with commission rates
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/trainers/commission-rates", getTrainersWithCommissionRates);

/**
 * @swagger
 * /api/admin/trainers/{trainerId}/commission-rate:
 *   patch:
 *     summary: Update trainer commission rate
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/trainers/:trainerId/commission-rate", updateTrainerCommissionRate);

// ─── Trainer earnings analytics ───────────────────────────

/**
 * @swagger
 * /api/admin/analytics/trainer-earnings/over-time:
 *   get:
 *     summary: Get trainer earnings over time
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/analytics/trainer-earnings/over-time", getTrainerEarningsOverTime);

/**
 * @swagger
 * /api/admin/analytics/trainer-earnings/breakdown:
 *   get:
 *     summary: Get trainer earnings breakdown by trainer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/analytics/trainer-earnings/breakdown", getTrainerEarningsBreakdown);

// ─── Platform revenue ─────────────────────────────────────

/**
 * @swagger
 * /api/admin/analytics/platform-revenue:
 *   get:
 *     summary: Get combined platform revenue from lab + trainer commissions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/analytics/platform-revenue", getPlatformRevenue);

// ─── User activity ────────────────────────────────────────

/**
 * @swagger
 * /api/admin/users/{userId}/activity:
 *   get:
 *     summary: Get detailed past activity for a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/users/:userId/activity", getUserActivity);

// ─── User management ─────────────────────────────────────

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (paginated, searchable)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [fitness-enthusiast, trainer, lab-partner]
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/suspend:
 *   patch:
 *     summary: Toggle user suspension
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User suspension toggled
 */
router.patch("/users/:userId/suspend", toggleUserSuspension);

// ─── Lab partner management ──────────────────────────────

/**
 * @swagger
 * /api/admin/lab-partners/{labPartnerId}/suspend-for-nonpayment:
 *   patch:
 *     summary: Suspend lab partner for non-payment
 *     tags: [Admin]
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
 *         description: Lab partner suspended
 */
router.patch("/lab-partners/:labPartnerId/suspend-for-nonpayment", suspendLabForNonPayment);

/**
 * @swagger
 * /api/admin/lab-partners/{labPartnerId}/unsuspend:
 *   patch:
 *     summary: Unsuspend a lab partner
 *     tags: [Admin]
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
router.patch("/lab-partners/:labPartnerId/unsuspend", unsuspendLab);

/**
 * @swagger
 * /api/admin/lab-partners/commission-rates:
 *   get:
 *     summary: Get all lab partners with their commission rates
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lab partners with commission rates
 */
router.get("/lab-partners/commission-rates", getLabPartnersWithCommissionRates);

/**
 * @swagger
 * /api/admin/lab-partners/{labPartnerId}/commission-rate:
 *   patch:
 *     summary: Update a lab partner's commission rate
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labPartnerId
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
 *               commissionRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Commission rate updated
 */
router.patch("/lab-partners/:labPartnerId/commission-rate", updateLabPartnerCommissionRate);

// ─── Invoice management ──────────────────────────────────

/**
 * @swagger
 * /api/admin/invoices/generate/{labPartnerId}:
 *   post:
 *     summary: Generate monthly invoice for a lab partner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labPartnerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Invoice generated
 */
router.post("/invoices/generate/:labPartnerId", generateMonthlyInvoice);

/**
 * @swagger
 * /api/admin/invoices/generate-flexible/{labPartnerId}:
 *   post:
 *     summary: Generate an invoice with custom date range
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labPartnerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Flexible invoice generated
 */
router.post("/invoices/generate-flexible/:labPartnerId", generateFlexibleInvoice);

/**
 * @swagger
 * /api/admin/invoices/generate-all:
 *   post:
 *     summary: Generate invoices for all lab partners
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All invoices generated
 */
router.post("/invoices/generate-all", generateAllMonthlyInvoices);

/**
 * @swagger
 * /api/admin/invoices:
 *   get:
 *     summary: Get all platform invoices
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get("/invoices", getAllInvoices);

/**
 * @swagger
 * /api/admin/invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Admin]
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
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get("/invoices/:invoiceId", getInvoiceById);

/**
 * @swagger
 * /api/admin/invoice-requests:
 *   get:
 *     summary: Get pending invoice generation requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoice requests
 */
router.get("/invoice-requests", getInvoiceRequests);

// ─── Invoice payment and enforcement ─────────────────────

/**
 * @swagger
 * /api/admin/invoices/{invoiceId}/mark-paid:
 *   patch:
 *     summary: Mark an invoice as paid
 *     tags: [Admin]
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
 *         description: Invoice marked as paid
 */
router.patch("/invoices/:invoiceId/mark-paid", markInvoiceAsPaid);

/**
 * @swagger
 * /api/admin/invoices/enforce-overdue:
 *   post:
 *     summary: Enforce penalties on overdue invoices
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue invoices enforced
 */
router.post("/invoices/enforce-overdue", enforceOverdueInvoices);

/**
 * @swagger
 * /api/admin/invoices/grace-period-status:
 *   get:
 *     summary: Get grace period status for invoices
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grace period statuses
 */
router.get("/invoices/grace-period-status", getGracePeriodStatus);

// ─── Manager Management (Admin-only) ─────────────────────

router.post("/managers", upload.single("profilePhoto"), createManager);
router.get("/managers", getAllManagers);
router.delete("/managers/:id", validateObjectId("id"), removeManager);
router.get("/managers/:id/activity-log", validateObjectId("id"), getManagerActivityLog);

// ─── Commission Rate Requests ────────────────────────────

router.get("/commission-requests", getPendingCommissionRequests);
router.patch("/commission-requests/:id/respond", validateObjectId("id"), handleCommissionRateRequest);

export default router;
