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
  getTopLabPartners
} from "../controllers/admin.controller.js";

const router = Router();

// Admin login route
router.post("/login", adminLogin);

// Get pending approval requests
router.get("/pending-approvals", getPendingApprovals);

// Approve user
router.post("/approve/:userId", approveUser);

// Reject user
router.post("/reject/:userId", rejectUser);

// Get user statistics
router.get("/stats", getUserStats);

// Analytics routes
router.get("/analytics/monthly-growth", getMonthlyGrowth);
router.get("/analytics/user-distribution", getUserDistribution);
router.get("/analytics/lab-earnings/over-time", getLabEarningsOverTime);
router.get("/analytics/lab-earnings/breakdown", getLabEarningsBreakdown);
router.get("/analytics/lab-earnings/top-partners", getTopLabPartners);

// User management routes
router.get("/users", getAllUsers);
router.patch("/users/:userId/suspend", toggleUserSuspension);

// Lab partner suspension for non-payment
router.patch("/lab-partners/:labPartnerId/suspend-for-nonpayment", suspendLabForNonPayment);
router.patch("/lab-partners/:labPartnerId/unsuspend", unsuspendLab);

// Lab partner commission rate management
router.get("/lab-partners/commission-rates", getLabPartnersWithCommissionRates);
router.patch("/lab-partners/:labPartnerId/commission-rate", updateLabPartnerCommissionRate);

// Invoice management routes
router.post("/invoices/generate/:labPartnerId", generateMonthlyInvoice);
router.post("/invoices/generate-flexible/:labPartnerId", generateFlexibleInvoice);
router.post("/invoices/generate-all", generateAllMonthlyInvoices);
router.get("/invoices", getAllInvoices);
router.get("/invoices/:invoiceId", getInvoiceById);
router.get("/invoice-requests", getInvoiceRequests);

// Invoice payment and enforcement routes
router.patch("/invoices/:invoiceId/mark-paid", markInvoiceAsPaid);
router.post("/invoices/enforce-overdue", enforceOverdueInvoices);
router.get("/invoices/grace-period-status", getGracePeriodStatus);

export default router;
