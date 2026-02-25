import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { STATUS_CODES, USER_TYPES } from "../constants.js";
import { User } from "../models/user.model.js";
import { LabTest } from "../models/labTest.model.js";
import { LabBooking } from "../models/labBooking.model.js";
import { PlatformInvoice } from "../models/platformInvoice.model.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

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
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { laboratoryName: { $regex: search, $options: "i" } },
      { laboratoryAddress: { $regex: search, $options: "i" } },
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
        populatedBooking,
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

  if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid status");
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

  booking.status = status;
  
  // Update expected report delivery time if provided
  if (expectedReportDeliveryTime !== undefined) {
    booking.expectedReportDeliveryTime = expectedReportDeliveryTime;
  }
  
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

// @desc    Mark user payment as received (fitness enthusiast paid lab)
// @route   PATCH /api/lab-partners/bookings/:bookingId/user-payment-received
// @access  Private (Lab Partner)
const markUserPaymentReceived = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { paymentMethod } = req.body;
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

  // Check if user payment already marked as received
  if (booking.userPaidToLab) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "User payment already marked as received for this booking"
    );
  }

  // Validate payment method if provided
  const validPaymentMethods = ["cash", "card", "online", "upi"];
  if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `Invalid payment method. Valid options: ${validPaymentMethods.join(", ")}`
    );
  }

  // Get lab partner to access commission rate
  const labPartner = await User.findById(labPartnerId);
  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Calculate commission (default 10% of booking price)
  const bookingPrice = booking.totalAmount;
  const commissionRate = labPartner.commissionRate || 10;
  const commissionAmount = (bookingPrice * commissionRate) / 100;

  // Update booking with user payment information AND commission tracking
  booking.userPaidToLab = true;
  booking.userPaymentDate = new Date();
  booking.userPaymentMethod = paymentMethod || null;
  booking.userPaymentVerifiedBy = req.user.email;
  booking.paymentStatus = "paid"; // Update overall payment status
  
  // Automatically track commission (lab receives full amount, but owes commission to platform)
  booking.paymentReceivedByLab = true;
  booking.paymentReceivedDate = new Date();
  booking.commissionAmount = commissionAmount;
  booking.commissionStatus = "pending"; // Will be billed at end of month
  
  await booking.save();

  // Update lab partner financial tracking
  labPartner.unbilledCommissions += commissionAmount;
  labPartner.currentMonthLiability += commissionAmount;
  labPartner.totalEarnings += bookingPrice;
  labPartner.monthlyEarnings += bookingPrice;
  labPartner.lastEarningsUpdate = new Date();
  
  await labPartner.save();

  // Populate booking for response
  const populatedBooking = await LabBooking.findById(booking._id)
    .populate("fitnessEnthusiastId", "name email phone")
    .populate("labPartnerId", "name laboratoryName unbilledCommissions currentMonthLiability")
    .populate("selectedTests.testId", "testName");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          booking: populatedBooking,
          userPayment: {
            userPaidToLab: true,
            userPaymentDate: booking.userPaymentDate,
            userPaymentMethod: booking.userPaymentMethod,
            paymentStatus: "paid",
          },
          revenue: {
            bookingPrice,
            labCash: bookingPrice,
            commissionAmount,
            commissionRate,
            unbilledCommissions: labPartner.unbilledCommissions,
            currentMonthLiability: labPartner.currentMonthLiability,
          },
        },
        "User payment received and commission tracked successfully"
      )
    );
});

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

// @desc    Get financial summary for lab partner dashboard
// @route   GET /api/lab-partners/financial-summary
// @access  Private (Lab Partner)
const getFinancialSummary = asyncHandler(async (req, res) => {
  const labPartnerId = req.user._id;

  // Get lab partner data
  const labPartner = await User.findById(labPartnerId).select(
    "unbilledCommissions currentMonthLiability totalEarnings monthlyEarnings commissionRate"
  );

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Get current month's stats
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);

  // Count pending commissions (payments received but not yet billed)
  const pendingCommissionsData = await LabBooking.aggregate([
    {
      $match: {
        labPartnerId: new mongoose.Types.ObjectId(labPartnerId),
        paymentReceivedByLab: true,
        commissionStatus: "pending",
      },
    },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: "$commissionAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const pendingCommissions = pendingCommissionsData[0] || { totalCommission: 0, count: 0 };

  // Get invoice statistics
  const invoiceStats = await PlatformInvoice.aggregate([
    {
      $match: {
        labPartnerId: new mongoose.Types.ObjectId(labPartnerId),
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$totalCommission" },
        count: { $sum: 1 },
      },
    },
  ]);

  const invoiceSummary = {
    payment_due: { total: 0, count: 0 },
    paid: { total: 0, count: 0 },
    overdue: { total: 0, count: 0 },
  };

  invoiceStats.forEach((stat) => {
    if (invoiceSummary[stat._id]) {
      invoiceSummary[stat._id] = { total: stat.total, count: stat.count };
    }
  });

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          currentBalance: {
            totalEarnings: labPartner.totalEarnings,
            monthlyEarnings: labPartner.monthlyEarnings,
            unbilledCommissions: labPartner.unbilledCommissions,
            currentMonthLiability: labPartner.currentMonthLiability,
            netMonthlyRevenue: labPartner.monthlyEarnings - labPartner.currentMonthLiability,
          },
          pendingCommissions: {
            amount: pendingCommissions.totalCommission,
            bookingsCount: pendingCommissions.count,
          },
          invoices: invoiceSummary,
          commissionRate: labPartner.commissionRate,
        },
        "Financial summary fetched successfully"
      )
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
  markUserPaymentReceived,
  getMyInvoices,
  getInvoiceById,
  getFinancialSummary,
  requestInvoice,
  updateLabPartnerProfile,
};
