import { Router } from "express";
import { verifyManagerOrAdmin, verifyManager } from "../middlewares/auth.middleware.js";
import { validateObjectId } from "../middlewares/validate.middleware.js";
import {
    getManagerProfile,
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
// Profile
router.get("/profile", verifyManager, getManagerProfile);
router.put("/profile", verifyManager, upload.single("profilePhoto"), updateManagerProfile);

// ─── Onboarding & Approvals ──────────────────────────────
router.get("/pending-approvals", verifyManagerOrAdmin, getPendingApprovals);
router.post("/claim/:userId", verifyManager, validateObjectId("userId"), claimApproval);
router.post("/release/:userId", verifyManager, validateObjectId("userId"), releaseApproval);
router.post("/approve/:userId", verifyManagerOrAdmin, validateObjectId("userId"), approveUser);
router.post("/reject/:userId", verifyManagerOrAdmin, validateObjectId("userId"), rejectUser);

// ─── User Management ─────────────────────────────────────
router.get("/users", verifyManagerOrAdmin, getAllUsers);
router.get("/users/:userId/activity", verifyManagerOrAdmin, validateObjectId("userId"), getUserActivity);
router.patch("/users/:userId/suspend", verifyManagerOrAdmin, validateObjectId("userId"), toggleUserSuspension);
router.get("/stats", verifyManagerOrAdmin, getUserStats);

// ─── Lab Partner Management ──────────────────────────────
router.get("/lab-partners/commission-rates", verifyManagerOrAdmin, getLabPartnersWithCommissionRates);
router.patch("/lab-partners/:labPartnerId/suspend", verifyManagerOrAdmin, validateObjectId("labPartnerId"), suspendLabForNonPayment);
router.patch("/lab-partners/:labPartnerId/unsuspend", verifyManagerOrAdmin, validateObjectId("labPartnerId"), unsuspendLab);

// ─── Commission Rate Change Requests ─────────────────────
router.post("/commission-requests", verifyManager, requestCommissionRateChange);
router.get("/commission-requests/mine", verifyManager, getMyCommissionRequests);

// ─── Invoice Management ──────────────────────────────────
router.get("/invoices", verifyManagerOrAdmin, getAllInvoices);
router.get("/invoices/grace-period-status", verifyManagerOrAdmin, getGracePeriodStatus);
router.get("/invoices/:invoiceId", verifyManagerOrAdmin, validateObjectId("invoiceId"), getInvoiceById);
router.post("/invoices/generate/:labPartnerId", verifyManagerOrAdmin, validateObjectId("labPartnerId"), generateMonthlyInvoice);
router.patch("/invoices/:invoiceId/mark-paid", verifyManagerOrAdmin, validateObjectId("invoiceId"), markInvoiceAsPaid);
router.post("/invoices/enforce-overdue", verifyManagerOrAdmin, enforceOverdueInvoices);
router.get("/invoice-requests", verifyManagerOrAdmin, getInvoiceRequests);

// ─── Analytics ────────────────────────────────────────────
router.get("/analytics/dashboard", verifyManagerOrAdmin, getDashboardAnalytics);
router.get("/analytics/monthly-growth", verifyManagerOrAdmin, getMonthlyGrowth);
router.get("/analytics/user-distribution", verifyManagerOrAdmin, getUserDistribution);
router.get("/analytics/lab-earnings/over-time", verifyManagerOrAdmin, getLabEarningsOverTime);
router.get("/analytics/lab-earnings/top-partners", verifyManagerOrAdmin, getTopLabPartners);
router.get("/analytics/platform-revenue", verifyManagerOrAdmin, getPlatformRevenue);

export default router;
