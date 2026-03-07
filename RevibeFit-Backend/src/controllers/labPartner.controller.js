import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { STATUS_CODES, USER_TYPES, BOOKING_STATUSES, SETTLEMENT_STATUSES } from "../constants.js";
import { User } from "../models/user.model.js";
import { LabTest } from "../models/labTest.model.js";
import { LabBooking } from "../models/labBooking.model.js";
import { PlatformInvoice } from "../models/platformInvoice.model.js";
import { Payment } from "../models/payment.model.js";
import { Settlement } from "../models/settlement.model.js";
import { calculateBookingFinancials } from "../utils/gstCalculator.js";
import razorpayService from "../utils/razorpayService.js";
import config from "../config/index.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { escapeRegex } from "../middlewares/validate.middleware.js";

// @desc    Get all approved lab partners
// @route   GET /api/lab-partners
// @access  Public (mainly for fitness enthusiasts)
const getApprovedLabPartners = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = {
    userType: USER_TYPES.LAB_PARTNER,
    isApproved: true,
    approvalStatus: "approved",
    isActive: true,
    isSuspended: false, // Exclude suspended labs from public listing
  };

  // Add search functionality
  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { laboratoryName: { $regex: safeSearch, $options: "i" } },
      { laboratoryAddress: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const labPartners = await User.find(query).select(
    "-password -refreshToken"
  );

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        labPartners,
        "Lab partners fetched successfully"
      )
    );
});

// @desc    Get a specific lab partner by ID
// @route   GET /api/lab-partners/:id
// @access  Public
const getLabPartnerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const labPartner = await User.findOne({
    _id: id,
    userType: USER_TYPES.LAB_PARTNER,
    isApproved: true,
    approvalStatus: "approved",
    isSuspended: false, // Exclude suspended labs from public viewing
  }).select("-password -refreshToken");

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        labPartner,
        "Lab partner fetched successfully"
      )
    );
});

// @desc    Add a new lab test (Lab Partner only)
// @route   POST /api/lab-partners/tests
// @access  Private (Lab Partner)
const addLabTest = asyncHandler(async (req, res) => {
  const {
    testName,
    description,
    price,
    duration,
    category,
    preparationInstructions,
  } = req.body;

  // Validate required fields
  if (!testName || !description || !price || !duration) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Test name, description, price, and duration are required"
    );
  }

  // Get lab partner ID from authenticated user
  const labPartnerId = req.user._id;

  // Verify the user is a lab partner
  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
  });

  if (!labPartner) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      "Only lab partners can add tests"
    );
  }

  const labTest = await LabTest.create({
    testName,
    description,
    price,
    duration,
    labPartnerId,
    category: category || "Other",
    preparationInstructions: preparationInstructions || "No special preparation required",
  });

  return res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(STATUS_CODES.CREATED, labTest, "Lab test added successfully")
    );
});

// @desc    Get all tests for a specific lab partner
// @route   GET /api/lab-partners/:id/tests
// @access  Public
const getLabTestsByPartnerId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, get the lab partner to check their offered tests
  const labPartner = await User.findById(id);
  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Get all active tests for this lab partner
  const allTests = await LabTest.find({
    labPartnerId: id,
    isActive: true,
  }).populate("labPartnerId", "name laboratoryName");

  // Filter to only show tests that are in the offeredTests array
  // If offeredTests is empty or undefined, show no tests
  const offeredTestIds = labPartner.offeredTests || [];
  const offeredTests = allTests.filter((test) =>
    offeredTestIds.some((offeredId) => offeredId.toString() === test._id.toString())
  );

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        offeredTests,
        "Lab tests fetched successfully"
      )
    );
});

// @desc    Get all tests for the authenticated lab partner
// @route   GET /api/lab-partners/my-tests
// @access  Private (Lab Partner)
const getMyLabTests = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;

  const tests = await LabTest.find({
    labPartnerId,
  }).sort({ createdAt: -1 });

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        tests,
        "Your lab tests fetched successfully"
      )
    );
});

// @desc    Update a lab test
// @route   PUT /api/lab-partners/tests/:testId
// @access  Private (Lab Partner)
const updateLabTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const labPartnerId = req.user._id;

  const test = await LabTest.findOne({
    _id: testId,
    labPartnerId,
  });

  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or you don't have permission to update it"
    );
  }

  // Update fields
  const allowedUpdates = [
    "testName",
    "description",
    "price",
    "duration",
    "category",
    "preparationInstructions",
    "isActive",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      test[field] = req.body[field];
    }
  });

  await test.save();

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(STATUS_CODES.SUCCESS, test, "Lab test updated successfully")
    );
});

// @desc    Delete a lab test
// @route   DELETE /api/lab-partners/tests/:testId
// @access  Private (Lab Partner)
const deleteLabTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const labPartnerId = req.user._id;

  const test = await LabTest.findOneAndDelete({
    _id: testId,
    labPartnerId,
  });

  if (!test) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Test not found or you don't have permission to delete it"
    );
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(STATUS_CODES.SUCCESS, {}, "Lab test deleted successfully")
    );
});

// @desc    Create a new booking
// @route   POST /api/lab-partners/bookings
// @access  Private (Fitness Enthusiast)
const createBooking = asyncHandler(async (req, res) => {
  const {
    labPartnerId,
    selectedTests,
    bookingDate,
    timeSlot,
    notes,
  } = req.body;

  // Validate required fields
  if (!labPartnerId || !selectedTests || selectedTests.length === 0 || !bookingDate || !timeSlot) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Lab partner, tests, booking date, and time slot are required"
    );
  }

  const fitnessEnthusiastId = req.user._id;

  // Verify lab partner exists and is approved
  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
    isApproved: true,
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found or not approved");
  }

  // Check if lab partner is suspended (non-payment to platform)
  if (labPartner.isSuspended) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      `This lab partner is currently suspended. Reason: ${labPartner.suspensionReason || "Non-payment"}. New bookings are not allowed.`
    );
  }

  // Verify all tests exist and calculate total
  let totalAmount = 0;
  const testDetails = [];

  for (const testItem of selectedTests) {
    const test = await LabTest.findById(testItem.testId);
    if (!test) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, `Test with ID ${testItem.testId} not found`);
    }
    totalAmount += test.price;
    testDetails.push({
      testId: test._id,
      testName: test.testName,
      price: test.price,
    });
  }

  // Create booking
  const booking = await LabBooking.create({
    fitnessEnthusiastId,
    labPartnerId,
    selectedTests: testDetails,
    bookingDate: new Date(bookingDate),
    timeSlot,
    totalAmount,
    notes: notes || "",
    contactPhone: req.user.phone,
    contactEmail: req.user.email,
    status: "pending",
    paymentStatus: "pending",
  });

  // Create Razorpay order for platform-mediated payment
  let razorpayOrderData = null;
  try {
    const commissionRate = labPartner.commissionRate || config.platform.commissionDefault;
    const financials = calculateBookingFinancials(
      totalAmount,
      commissionRate,
      labPartner.placeOfSupply || labPartner.state
    );

    const amountInPaise = Math.round(totalAmount * 100);
    const labSettlementInPaise = Math.round(financials.netSettlement * 100);

    const razorpayOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      receipt: booking._id.toString(),
      labLinkedAccountId: labPartner.razorpayLinkedAccountId,
      labSettlementAmount: labSettlementInPaise,
      notes: {
        bookingId: booking._id.toString(),
        labPartnerId: labPartner._id.toString(),
        fitnessEnthusiastId: fitnessEnthusiastId.toString(),
      },
    });

    // Create Payment document
    const payment = await Payment.create({
      bookingId: booking._id,
      fitnessEnthusiastId,
      labPartnerId: labPartner._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      status: "created",
      commissionAmount: financials.commissionAmount,
      gstOnCommission: financials.gstBreakdown.totalTax,
      labSettlementAmount: financials.netSettlement,
    });

    // Update booking with Razorpay references
    booking.razorpayOrderId = razorpayOrder.id;
    booking.paymentId = payment._id;
    await booking.save();

    razorpayOrderData = {
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: config.razorpay.keyId,
      amount: amountInPaise,
      currency: "INR",
    };
  } catch (error) {
    console.error("Razorpay order creation failed:", error.message);
    // Booking is still created — payment can be initiated separately via /api/payments/create-order
  }

  // Populate the booking with user and test details
  const populatedBooking = await LabBooking.findById(booking._id)
    .populate("fitnessEnthusiastId", "name email phone")
    .populate("labPartnerId", "name laboratoryName laboratoryAddress phone email")
    .populate("selectedTests.testId", "testName description duration");

  return res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        {
          booking: populatedBooking,
          payment: razorpayOrderData,
        },
        "Booking created successfully"
      )
    );
});

// @desc    Get bookings for fitness enthusiast (user side view)
// @route   GET /api/lab-partners/my-bookings
// @access  Private (Fitness Enthusiast)
const getMyBookings = asyncHandler(async (req, res) => {
  const fitnessEnthusiastId = req.user._id;
  const { includeReports } = req.query;

  // Fetch all bookings for the user
  const bookings = await LabBooking.find({ fitnessEnthusiastId })
    .populate({
      path: "labPartnerId",
      select: "name laboratoryName laboratoryAddress phone email isSuspended suspensionReason",
    })
    .populate("selectedTests.testId", "testName description duration")
    .sort({ createdAt: -1 });

  // Add additional metadata for each booking
  const enrichedBookings = bookings.map((booking) => {
    const bookingObj = booking.toObject();
    
    // Determine if user can access report
    // Users can ALWAYS access reports for bookings they paid for, even if lab is suspended
    bookingObj.canAccessReport = booking.userPaidToLab && booking.reportUrl;
    
    // Determine if booking is affected by lab suspension
    bookingObj.labSuspended = booking.labPartnerId?.isSuspended || false;
    
    // Show payment status from user's perspective
    bookingObj.userPaymentStatus = {
      paidToLab: booking.userPaidToLab,
      paymentDate: booking.userPaymentDate,
      paymentMethod: booking.userPaymentMethod,
      canViewReport: booking.userPaidToLab && booking.reportUrl,
    };
    
    return bookingObj;
  });

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        enrichedBookings,
        "Your bookings fetched successfully"
      )
    );
});

// @desc    Get bookings for lab partner
// @route   GET /api/lab-partners/lab-bookings
// @access  Private (Lab Partner)
const getLabBookings = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;

  const bookings = await LabBooking.find({ labPartnerId })
    .populate("fitnessEnthusiastId", "name email phone age")
    .populate("selectedTests.testId", "testName description duration")
    .sort({ createdAt: -1 }); // Sort by creation date - latest first (day-wise), with first-come first-served within each day

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        bookings,
        "Lab bookings fetched successfully"
      )
    );
});

// @desc    Update booking status (Lab Partner)
// @route   PUT /api/lab-partners/bookings/:bookingId/status
// @access  Private (Lab Partner)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { status, expectedReportDeliveryTime } = req.body;
  const labPartnerId = req.user._id;

  const validStatuses = Object.values(BOOKING_STATUSES);
  if (!validStatuses.includes(status)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const booking = await LabBooking.findOne({
    _id: bookingId,
    labPartnerId,
  });

  if (!booking) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Booking not found or you don't have permission"
    );
  }

  const previousStatus = booking.status;
  booking.status = status;

  // Update expected report delivery time if provided
  if (expectedReportDeliveryTime !== undefined) {
    booking.expectedReportDeliveryTime = expectedReportDeliveryTime;
  }

  await booking.save();

  // When booking is completed, release the payment hold and create settlement
  if (status === BOOKING_STATUSES.COMPLETED && previousStatus !== BOOKING_STATUSES.COMPLETED) {
    try {
      const payment = await Payment.findOne({
        bookingId: booking._id,
        status: "captured",
      });

      if (payment && payment.transferId) {
        // Release the held transfer to lab partner
        await razorpayService.releaseTransfer(payment.razorpayPaymentId, payment.transferId);
        payment.transferStatus = "released";
        await payment.save();

        // Fetch lab partner for GST calculation
        const labPartner = await User.findById(labPartnerId);
        const commissionRate = labPartner?.commissionRate || config.platform.commissionDefault;
        const financials = calculateBookingFinancials(
          booking.totalAmount,
          commissionRate,
          labPartner?.placeOfSupply || labPartner?.state
        );

        const now = new Date();
        // Create settlement record
        const settlement = await Settlement.create({
          bookingId: booking._id,
          paymentId: payment._id,
          labPartnerId,
          razorpayTransferId: payment.transferId,
          grossAmount: booking.totalAmount,
          commissionAmount: financials.commissionAmount,
          commissionRate,
          gstOnCommission: financials.gstBreakdown.totalTax,
          gstBreakdown: {
            type: financials.gstBreakdown.type,
            cgstRate: financials.gstBreakdown.cgstRate,
            cgstAmount: financials.gstBreakdown.cgst,
            sgstRate: financials.gstBreakdown.sgstRate,
            sgstAmount: financials.gstBreakdown.sgst,
            igstRate: financials.gstBreakdown.igstRate,
            igstAmount: financials.gstBreakdown.igst,
          },
          netSettlementAmount: financials.netSettlement,
          status: SETTLEMENT_STATUSES.HOLD_RELEASED,
          releasedAt: now,
          billingPeriod: {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        });

        // Update booking with settlement reference
        booking.settlementId = settlement._id;
        booking.commissionAmount = financials.commissionAmount;
        booking.commissionStatus = "paid";
        await booking.save();
      }
    } catch (error) {
      console.error("Settlement creation failed for booking", bookingId, ":", error.message);
      // Non-fatal: the reconciliation cron will catch this
    }
  }

  const populatedBooking = await LabBooking.findById(booking._id)
    .populate("fitnessEnthusiastId", "name email phone")
    .populate("labPartnerId", "name laboratoryName")
    .populate("selectedTests.testId", "testName");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        populatedBooking,
        "Booking status updated successfully"
      )
    );
});

// @desc    Cancel a booking (Fitness Enthusiast)
// @route   PUT /api/lab-partners/bookings/:bookingId/cancel
// @access  Private (Fitness Enthusiast)
const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const fitnessEnthusiastId = req.user._id;

  const booking = await LabBooking.findOne({
    _id: bookingId,
    fitnessEnthusiastId,
  });

  if (!booking) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Booking not found"
    );
  }

  if (booking.status === "completed") {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Cannot cancel a completed booking"
    );
  }

  booking.status = "cancelled";
  await booking.save();

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        booking,
        "Booking cancelled successfully"
      )
    );
});

// @desc    Get offered tests for authenticated lab partner
// @route   GET /api/lab-partners/offered-tests
// @access  Private (Lab Partner)
const getOfferedTests = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;

  const labPartner = await User.findById(labPartnerId).populate({
    path: "offeredTests",
    select: "testName description price duration category preparationInstructions isActive",
    match: { isActive: true }, // Only populate active tests
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Filter out null values (tests that were deleted)
  const validOfferedTests = (labPartner.offeredTests || []).filter(test => test !== null);

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        validOfferedTests,
        "Offered tests fetched successfully"
      )
    );
});

// @desc    Update offered tests for authenticated lab partner
// @route   PUT /api/lab-partners/offered-tests
// @access  Private (Lab Partner)
const updateOfferedTests = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;
  const { testIds } = req.body;

  if (!Array.isArray(testIds)) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "testIds must be an array"
    );
  }

  // Verify all test IDs belong to this lab partner
  const tests = await LabTest.find({
    _id: { $in: testIds },
    labPartnerId,
  });

  if (tests.length !== testIds.length) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Some tests do not belong to this lab partner or do not exist"
    );
  }

  // Update the lab partner's offered tests
  const labPartner = await User.findByIdAndUpdate(
    labPartnerId,
    { offeredTests: testIds },
    { new: true }
  ).populate({
    path: "offeredTests",
    select: "testName description price duration category preparationInstructions isActive",
  });

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        labPartner.offeredTests,
        "Offered tests updated successfully"
      )
    );
});

// @desc    Upload PDF report for a booking (Lab Partner only)
// @route   POST /api/lab-partners/bookings/:bookingId/upload-report
// @access  Private (Lab Partner)
const uploadReport = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const labPartnerId = req.user._id;

  // Check if file was uploaded
  if (!req.file) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "PDF report file is required");
  }

  // Find the booking and verify it belongs to this lab partner
  const booking = await LabBooking.findOne({
    _id: bookingId,
    labPartnerId,
  });

  if (!booking) {
    // Delete uploaded file if booking not found
    fs.unlinkSync(req.file.path);
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Booking not found or you don't have permission"
    );
  }

  // Delete old report file if it exists
  if (booking.reportUrl) {
    const oldFilePath = path.join(process.cwd(), "public", booking.reportUrl);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
  }

  // Save the report URL (relative path from public directory)
  const reportUrl = `/temp/${req.file.filename}`;
  booking.reportUrl = reportUrl;
  booking.reportUploadedAt = new Date();
  
  await booking.save();

  const populatedBooking = await LabBooking.findById(booking._id)
    .populate("fitnessEnthusiastId", "name email phone")
    .populate("labPartnerId", "name laboratoryName")
    .populate("selectedTests.testId", "testName");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        populatedBooking,
        "Report uploaded successfully"
      )
    );
});

// @desc    Delete uploaded report for a booking (Lab Partner only)
// @route   DELETE /api/lab-partners/bookings/:bookingId/report
// @access  Private (Lab Partner)
const deleteReport = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const labPartnerId = req.user._id;

  // Find the booking and verify it belongs to this lab partner
  const booking = await LabBooking.findOne({
    _id: bookingId,
    labPartnerId,
  });

  if (!booking) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Booking not found or you don't have permission"
    );
  }

  if (!booking.reportUrl) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "No report found for this booking");
  }

  // Delete the file from storage
  const filePath = path.join(process.cwd(), "public", booking.reportUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove report information from booking
  booking.reportUrl = undefined;
  booking.reportUploadedAt = undefined;
  await booking.save();

  const populatedBooking = await LabBooking.findById(booking._id)
    .populate("fitnessEnthusiastId", "name email phone")
    .populate("labPartnerId", "name laboratoryName")
    .populate("selectedTests.testId", "testName");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        populatedBooking,
        "Report deleted successfully"
      )
    );
});

// DEPRECATED - Commission is now automatically tracked when user payment is marked
// This function has been removed as commission tracking is now part of markUserPaymentReceived

// @desc    Get report for a booking (Fitness Enthusiast view)
// @route   GET /api/lab-partners/bookings/:bookingId/report
// @access  Private (Fitness Enthusiast)
const getBookingReport = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const fitnessEnthusiastId = req.user._id;

  // Find the booking and verify it belongs to this user
  const booking = await LabBooking.findOne({
    _id: bookingId,
    fitnessEnthusiastId,
  }).populate("labPartnerId", "name laboratoryName isSuspended");

  if (!booking) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Booking not found or you don't have permission"
    );
  }

  // Check if report exists
  if (!booking.reportUrl) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Report not yet uploaded for this booking"
    );
  }

  // CRITICAL: User verification - User can access report ONLY if they paid the lab
  // This is independent of lab's suspension status or platform payment status
  if (!booking.userPaidToLab) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      "You can only access the report after your payment to the lab has been verified"
    );
  }

  // If all checks pass, user can access report even if lab is suspended
  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          reportUrl: booking.reportUrl,
          reportUploadedAt: booking.reportUploadedAt,
          bookingDetails: {
            bookingDate: booking.bookingDate,
            timeSlot: booking.timeSlot,
            selectedTests: booking.selectedTests,
          },
          paymentVerified: booking.userPaidToLab,
          labSuspended: booking.labPartnerId?.isSuspended || false,
          accessNote: booking.labPartnerId?.isSuspended 
            ? "Lab is currently suspended, but you can access this report as your payment was verified."
            : "Report access granted",
        },
        "Report retrieved successfully"
      )
    );
});

// markUserPaymentReceived - REMOVED: P2P payment flow replaced by Razorpay platform-mediated payments

// @desc    Get all invoices for the authenticated lab partner
// @route   GET /api/lab-partners/invoices
// @access  Private (Lab Partner)
const getMyInvoices = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;
  const { status, year } = req.query;

  let query = { labPartnerId };

  if (status) {
    query.status = status;
  }

  if (year) {
    query["billingPeriod.year"] = parseInt(year);
  }

  const invoices = await PlatformInvoice.find(query)
    .sort({ "billingPeriod.year": -1, "billingPeriod.month": -1 })
    .populate("bookingIds", "totalAmount commissionAmount paymentReceivedDate");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        invoices,
        "Invoices fetched successfully"
      )
    );
});

// @desc    Get invoice by ID for the authenticated lab partner
// @route   GET /api/lab-partners/invoices/:invoiceId
// @access  Private (Lab Partner)
const getInvoiceById = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const labPartnerId = req.user._id;

  const invoice = await PlatformInvoice.findOne({
    _id: invoiceId,
    labPartnerId,
  }).populate("bookingIds", "totalAmount commissionAmount paymentReceivedDate fitnessEnthusiastId selectedTests");

  if (!invoice) {
    throw new ApiError(
      STATUS_CODES.NOT_FOUND,
      "Invoice not found or you don't have permission"
    );
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(STATUS_CODES.SUCCESS, invoice, "Invoice fetched successfully")
    );
});

// @desc    Get financial summary for lab partner dashboard (settlement-based)
// @route   GET /api/lab-partners/financial-summary
// @access  Private (Lab Partner)
const getFinancialSummary = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;

  const labPartner = await User.findById(labPartnerId).select(
    "commissionRate totalEarnings monthlyEarnings"
  );

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const labPartnerObjId = new mongoose.Types.ObjectId(labPartnerId);

  // Aggregate settlement data
  const [totalSettled, monthSettled, pendingSettlements] = await Promise.all([
    // Total settled to lab all time
    Settlement.aggregate([
      { $match: { labPartnerId: labPartnerObjId, status: SETTLEMENT_STATUSES.SETTLED } },
      { $group: { _id: null, total: { $sum: "$netSettlementAmount" }, count: { $sum: 1 } } },
    ]),
    // This month's settlements
    Settlement.aggregate([
      {
        $match: {
          labPartnerId: labPartnerObjId,
          status: SETTLEMENT_STATUSES.SETTLED,
          settledAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$netSettlementAmount" }, count: { $sum: 1 } } },
    ]),
    // Pending settlements (hold released but not yet settled)
    Settlement.aggregate([
      {
        $match: {
          labPartnerId: labPartnerObjId,
          status: { $in: [SETTLEMENT_STATUSES.PENDING, SETTLEMENT_STATUSES.HOLD_RELEASED, SETTLEMENT_STATUSES.PROCESSING] },
        },
      },
      { $group: { _id: null, total: { $sum: "$netSettlementAmount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const totalEarned = totalSettled[0]?.total || 0;
  const monthEarned = monthSettled[0]?.total || 0;
  const pendingAmount = pendingSettlements[0]?.total || 0;
  const pendingCount = pendingSettlements[0]?.count || 0;

  // Estimate next payout (Razorpay Route settles T+2 business days)
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(nextPayoutDate.getDate() + 3); // Rough T+2

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          totalEarned,
          thisMonthEarned: monthEarned,
          pendingPayout: {
            amount: pendingAmount,
            bookingsCount: pendingCount,
            estimatedDate: pendingCount > 0 ? nextPayoutDate : null,
          },
          commissionRate: labPartner.commissionRate,
        },
        "Financial summary fetched successfully"
      )
    );
});

// @desc    Get settlements for the authenticated lab partner
// @route   GET /api/lab-partners/settlements
// @access  Private (Lab Partner)
const getMySettlements = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;
  const { status, month, year, page = 1, limit = 20 } = req.query;

  const query = { labPartnerId };
  if (status) query.status = status;
  if (month) query["billingPeriod.month"] = parseInt(month);
  if (year) query["billingPeriod.year"] = parseInt(year);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [settlements, total] = await Promise.all([
    Settlement.find(query)
      .populate("bookingId", "selectedTests bookingDate totalAmount status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Settlement.countDocuments(query),
  ]);

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, {
      settlements,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, "Settlements fetched successfully")
  );
});

// @desc    Request invoice generation from admin
// @route   POST /api/lab-partners/request-invoice
// @access  Private (Lab Partner)
const requestInvoice = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;
  const { notes } = req.body;

  // Check if lab partner has unbilled commissions
  const labPartner = await User.findById(labPartnerId);
  
  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  if (labPartner.unbilledCommissions <= 0) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "No unbilled commissions to generate invoice for"
    );
  }

  // Count unbilled bookings
  const unbilledBookingsCount = await LabBooking.countDocuments({
    labPartnerId,
    paymentReceivedByLab: true,
    commissionStatus: "pending",
  });

  if (unbilledBookingsCount === 0) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "No unbilled bookings found"
    );
  }

  // Update lab partner with request information (or create a notification system)
  // For now, we'll send back confirmation that the request was logged
  
  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          laboratoryName: labPartner.laboratoryName,
          unbilledCommissions: labPartner.unbilledCommissions,
          unbilledBookingsCount,
          requestNotes: notes || null,
          requestedAt: new Date(),
        },
        "Invoice request submitted successfully. The admin will generate your invoice shortly."
      )
    );
});

// @desc    Update lab partner profile
// @route   PUT /api/lab-partners/profile
// @access  Private (Lab Partner only)
const updateLabPartnerProfile = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;

  // Fields that can be updated
  const { name, phone, laboratoryName, laboratoryAddress } = req.body;

  const labPartner = await User.findById(labPartnerId);

  if (!labPartner || labPartner.userType !== USER_TYPES.LAB_PARTNER) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Update fields if provided
  if (name) labPartner.name = name;
  if (phone) {
    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Phone number must be 10 digits");
    }
    labPartner.phone = phone;
  }
  if (laboratoryName) labPartner.laboratoryName = laboratoryName;
  if (laboratoryAddress) labPartner.laboratoryAddress = laboratoryAddress;

  await labPartner.save();

  // Update localStorage user data
  const updatedUser = {
    _id: labPartner._id,
    name: labPartner.name,
    email: labPartner.email,
    phone: labPartner.phone,
    age: labPartner.age,
    userType: labPartner.userType,
    laboratoryName: labPartner.laboratoryName,
    laboratoryAddress: labPartner.laboratoryAddress,
    licenseNumber: labPartner.licenseNumber,
    commissionRate: labPartner.commissionRate,
    isApproved: labPartner.isApproved,
    isSuspended: labPartner.isSuspended,
    approvalStatus: labPartner.approvalStatus,
    suspensionReason: labPartner.suspensionReason,
    createdAt: labPartner.createdAt,
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        updatedUser,
        "Profile updated successfully"
      )
    );
});

export {
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
};
