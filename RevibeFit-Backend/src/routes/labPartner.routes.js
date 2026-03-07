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

  getMyInvoices,
  getInvoiceById,
  getFinancialSummary,
  getMySettlements,
  requestInvoice,
  updateLabPartnerProfile,
} from "../controllers/labPartner.controller.js";
import { verifyJWT, verifyUserType } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import mongoose from "mongoose";

const router = Router();

// Middleware to validate :id param is a valid ObjectId.
// If not, skip this route so named routes (e.g. /offered-tests) can match.
const validateObjectIdParam = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next("route");
  }
  next();
};

// ─── Public routes ────────────────────────────────────────

/**
 * @swagger
 * /api/lab-partners:
 *   get:
 *     summary: List all approved lab partners
 *     tags: [Lab Partners]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of approved lab partners
 */
router.get("/", getApprovedLabPartners);

/**
 * @swagger
 * /api/lab-partners/{id}:
 *   get:
 *     summary: Get lab partner details
 *     tags: [Lab Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab partner details
 *       404:
 *         description: Not found
 */
router.get("/:id", validateObjectIdParam, getLabPartnerById);

/**
 * @swagger
 * /api/lab-partners/{id}/tests:
 *   get:
 *     summary: Get tests offered by a lab partner
 *     tags: [Lab Partners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of lab tests
 */
router.get("/:id/tests", validateObjectIdParam, getLabTestsByPartnerId);

// ─── All routes below require authentication ─────────────
router.use(verifyJWT);

// ─── Lab Partner only — test management ──────────────────

/**
 * @swagger
 * /api/lab-partners/tests/add:
 *   post:
 *     summary: Add a new lab test (lab partner only)
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LabTest'
 *     responses:
 *       201:
 *         description: Test created
 */
router.post("/tests/add", verifyUserType("lab-partner"), addLabTest);

/**
 * @swagger
 * /api/lab-partners/tests/my-tests:
 *   get:
 *     summary: Get lab partner's own tests
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of own tests
 */
router.get("/tests/my-tests", verifyUserType("lab-partner"), getMyLabTests);

/**
 * @swagger
 * /api/lab-partners/tests/{testId}:
 *   put:
 *     summary: Update a lab test
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test updated
 *   delete:
 *     summary: Delete a lab test
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test deleted
 */
router.put("/tests/:testId", verifyUserType("lab-partner"), updateLabTest);
router.delete("/tests/:testId", verifyUserType("lab-partner"), deleteLabTest);

// ─── Lab Partner only — offered tests ────────────────────

/**
 * @swagger
 * /api/lab-partners/offered-tests:
 *   get:
 *     summary: Get offered tests configuration
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offered tests
 *   put:
 *     summary: Update offered tests configuration
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offered tests updated
 */
router.get("/offered-tests", verifyUserType("lab-partner"), getOfferedTests);
router.put("/offered-tests", verifyUserType("lab-partner"), updateOfferedTests);

// ─── Fitness Enthusiast — booking management ─────────────

/**
 * @swagger
 * /api/lab-partners/bookings/create:
 *   post:
 *     summary: Create a lab test booking (fitness enthusiast)
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LabBooking'
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post("/bookings/create", verifyUserType("fitness-enthusiast"), createBooking);

/**
 * @swagger
 * /api/lab-partners/bookings/my-bookings:
 *   get:
 *     summary: Get current user's lab bookings
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get("/bookings/my-bookings", verifyUserType("fitness-enthusiast"), getMyBookings);

/**
 * @swagger
 * /api/lab-partners/bookings/{bookingId}/cancel:
 *   put:
 *     summary: Cancel a booking (fitness enthusiast)
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.put("/bookings/:bookingId/cancel", verifyUserType("fitness-enthusiast"), cancelBooking);

// ─── Lab Partner only — manage bookings ──────────────────

/**
 * @swagger
 * /api/lab-partners/bookings/lab-bookings:
 *   get:
 *     summary: Get all bookings for the lab partner
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of lab bookings
 */
router.get("/bookings/lab-bookings", verifyUserType("lab-partner"), getLabBookings);

/**
 * @swagger
 * /api/lab-partners/bookings/{bookingId}/status:
 *   put:
 *     summary: Update booking status (lab partner)
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, sample-collected, report-ready, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/bookings/:bookingId/status", verifyUserType("lab-partner"), updateBookingStatus);

/**
 * @swagger
 * /api/lab-partners/bookings/{bookingId}/upload-report:
 *   post:
 *     summary: Upload test report PDF (lab partner)
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               report:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Report uploaded
 */
router.post("/bookings/:bookingId/upload-report", verifyUserType("lab-partner"), upload.single("report"), uploadReport);

/**
 * @swagger
 * /api/lab-partners/bookings/{bookingId}/report:
 *   delete:
 *     summary: Delete an uploaded report (lab partner)
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted
 *   get:
 *     summary: Download/view a booking report
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report file
 */
router.delete("/bookings/:bookingId/report", verifyUserType("lab-partner"), deleteReport);

router.get("/bookings/:bookingId/report", getBookingReport);

// ─── Lab Partner only — financial ────────────────────────

/**
 * @swagger
 * /api/lab-partners/invoices:
 *   get:
 *     summary: Get lab partner's invoices
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get("/invoices", verifyUserType("lab-partner"), getMyInvoices);

/**
 * @swagger
 * /api/lab-partners/invoices/{invoiceId}:
 *   get:
 *     summary: Get a specific invoice
 *     tags: [Lab Partners]
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
 */
router.get("/invoices/:invoiceId", verifyUserType("lab-partner"), getInvoiceById);

// Invoice PDF download for lab partner
router.get("/invoices/:invoiceId/download-pdf", verifyUserType("lab-partner"), async (req, res, next) => {
  try {
    const { PlatformInvoice } = await import("../models/platformInvoice.model.js");
    const path = await import("path");
    const fs = await import("fs");
    const { fileURLToPath } = await import("url");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const invoice = await PlatformInvoice.findOne({
      _id: req.params.invoiceId,
      labPartnerId: req.user._id,
    });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    if (!invoice.pdfPath) {
      return res.status(404).json({ success: false, message: "PDF not yet generated" });
    }
    const filePath = path.join(__dirname, "../../public", invoice.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "PDF file not found" });
    }
    res.download(filePath, `${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/lab-partners/request-invoice:
 *   post:
 *     summary: Request invoice generation
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice request submitted
 */
router.post("/request-invoice", verifyUserType("lab-partner"), requestInvoice);

/**
 * @swagger
 * /api/lab-partners/financial-summary:
 *   get:
 *     summary: Get financial summary for the lab partner
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial overview
 */
router.get("/financial-summary", verifyUserType("lab-partner"), getFinancialSummary);

// Settlement routes
router.get("/settlements", verifyUserType("lab-partner"), getMySettlements);

// ─── Lab Partner only — profile ──────────────────────────

/**
 * @swagger
 * /api/lab-partners/profile:
 *   put:
 *     summary: Update lab partner profile
 *     tags: [Lab Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               labName:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/profile", verifyUserType("lab-partner"), updateLabPartnerProfile);

export default router;
