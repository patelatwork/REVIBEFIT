import { Router } from "express";
import {
  getApprovedLabPartners,
  getLabPartnerById,
  addLabTest,
  getLabTestsByPartnerId,
  getMyLabTests,
  updateLabTest,
  deleteLabTest,
  createBooking,
  getMyBookings,
  getLabBookings,
  updateBookingStatus,
  cancelBooking,
  getOfferedTests,
  updateOfferedTests,
  uploadReport,
  deleteReport,
  getBookingReport,
  markUserPaymentReceived,
  getMyInvoices,
  getInvoiceById,
  getFinancialSummary,
  requestInvoice,
  updateLabPartnerProfile,
} from "../controllers/labPartner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Protected routes - Lab Partner operations (MUST come before /:id routes)
router.route("/tests/add").post(verifyJWT, addLabTest);
router.route("/tests/my-tests").get(verifyJWT, getMyLabTests);
router.route("/tests/:testId").put(verifyJWT, updateLabTest);
router.route("/tests/:testId").delete(verifyJWT, deleteLabTest);

// Protected routes - Offered tests management (MUST come before /:id routes)
router.route("/offered-tests").get(verifyJWT, getOfferedTests);
router.route("/offered-tests").put(verifyJWT, updateOfferedTests);

// Protected routes - Booking operations
router.route("/bookings/create").post(verifyJWT, createBooking);
router.route("/bookings/my-bookings").get(verifyJWT, getMyBookings);
router.route("/bookings/lab-bookings").get(verifyJWT, getLabBookings);
router.route("/bookings/:bookingId/status").put(verifyJWT, updateBookingStatus);
router.route("/bookings/:bookingId/cancel").put(verifyJWT, cancelBooking);
router.route("/bookings/:bookingId/upload-report").post(verifyJWT, upload.single("report"), uploadReport);
router.route("/bookings/:bookingId/report").get(verifyJWT, getBookingReport);
router.route("/bookings/:bookingId/report").delete(verifyJWT, deleteReport);
router.route("/bookings/:bookingId/user-payment-received").patch(verifyJWT, markUserPaymentReceived);

// Protected routes - Invoice and financial operations (MUST come before /:id routes)
router.route("/invoices").get(verifyJWT, getMyInvoices);
router.route("/invoices/:invoiceId").get(verifyJWT, getInvoiceById);
router.route("/request-invoice").post(verifyJWT, requestInvoice);
router.route("/financial-summary").get(verifyJWT, getFinancialSummary);

// Protected routes - Profile management
router.route("/profile").put(verifyJWT, updateLabPartnerProfile);

// Public routes - Get approved lab partners and their tests (/:id routes come LAST)
router.route("/").get(getApprovedLabPartners);
router.route("/:id").get(getLabPartnerById);
router.route("/:id/tests").get(getLabTestsByPartnerId);

export default router;
