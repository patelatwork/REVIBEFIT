import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { STATUS_CODES, USER_TYPES } from "../constants.js";
import { User } from "../models/user.model.js";
import { LabBooking } from "../models/labBooking.model.js";
import { PlatformInvoice } from "../models/platformInvoice.model.js";
import { sendApprovalEmail, sendRejectionEmail } from "../utils/emailService.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { escapeRegex } from "../middlewares/validate.middleware.js";

/**
 * @desc    Admin Login
 * @route   POST /api/admin/login
 * @access  Public
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Email and password are required"
    );
  }

  // Verify against environment-based admin credentials
  if (email !== config.admin.email || password !== config.admin.password) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid admin credentials");
  }

  // Generate JWT for admin session
  const adminData = {
    email: config.admin.email,
    name: config.admin.name,
    userType: USER_TYPES.ADMIN,
    isAdmin: true,
  };

  const accessToken = jwt.sign(
    { email: adminData.email, userType: USER_TYPES.ADMIN, isAdmin: true },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          admin: adminData,
          accessToken,
        },
        "Admin logged in successfully"
      )
    );
});

// @desc    Get pending approval requests
// @route   GET /api/admin/pending-approvals
// @access  Admin
const getPendingApprovals = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({
    approvalStatus: "pending",
    userType: { $in: [USER_TYPES.TRAINER, USER_TYPES.LAB_PARTNER] }
  }).select("-password -refreshToken");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        pendingUsers,
        "Pending approvals fetched successfully"
      )
    );
});

// @desc    Approve user
// @route   POST /api/admin/approve/:userId
// @access  Admin
const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const adminEmail = req.adminUser?.email || config.admin.email;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");
  }

  if (user.approvalStatus === "approved") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "User is already approved");
  }

  // Update user status first
  user.approvalStatus = "approved";
  user.isApproved = true;
  user.approvedBy = adminEmail;
  user.approvedAt = new Date();
  await user.save();

  // Only send email to trainers and lab partners
  // Don't let email failures prevent the approval from succeeding
  if (user.userType === USER_TYPES.TRAINER || user.userType === USER_TYPES.LAB_PARTNER) {
    try {
      const emailResult = await sendApprovalEmail(user);
      if (!emailResult.success) {
        console.error('Failed to send approval email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error during approval email sending process:', emailError);
      // Continue with success response even if email fails
    }
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        user,
        "User approved successfully"
      )
    );
});

// @desc    Reject user
// @route   POST /api/admin/reject/:userId
// @access  Admin
const rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body; // Optional rejection reason

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");
  }

  if (user.approvalStatus === "rejected") {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "User has already been rejected");
  }

  user.approvalStatus = "rejected";
  user.isApproved = false;
  await user.save();

  // Send rejection email to trainers and lab partners
  // Don't let email failures prevent the rejection from succeeding
  if (user.userType === USER_TYPES.TRAINER || user.userType === USER_TYPES.LAB_PARTNER) {
    try {
      const emailResult = await sendRejectionEmail(user, reason);
      if (!emailResult.success) {
        console.error('Failed to send rejection email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error during email sending process:', emailError);
      // Continue with success response even if email fails
    }
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        user,
        "User rejected successfully"
      )
    );
});

// @desc    Get all users statistics
// @route   GET /api/admin/stats
// @access  Admin
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const fitnessEnthusiasts = await User.countDocuments({ userType: USER_TYPES.FITNESS_ENTHUSIAST });
  const trainers = await User.countDocuments({ userType: USER_TYPES.TRAINER });
  const labPartners = await User.countDocuments({ userType: USER_TYPES.LAB_PARTNER });
  const pendingApprovals = await User.countDocuments({ approvalStatus: "pending" });

  const stats = {
    totalUsers,
    fitnessEnthusiasts,
    trainers,
    labPartners,
    pendingApprovals
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        stats,
        "User statistics fetched successfully"
      )
    );
});

// @desc    Get monthly user growth analytics
// @route   GET /api/admin/analytics/monthly-growth
// @access  Admin
const getMonthlyGrowth = asyncHandler(async (req, res) => {
  // Get current date and date 12 months ago
  const now = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(now.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  // Aggregate users by month
  const monthlyData = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 },
        fitnessEnthusiasts: {
          $sum: { $cond: [{ $eq: ["$userType", USER_TYPES.FITNESS_ENTHUSIAST] }, 1, 0] }
        },
        trainers: {
          $sum: { $cond: [{ $eq: ["$userType", USER_TYPES.TRAINER] }, 1, 0] }
        },
        labPartners: {
          $sum: { $cond: [{ $eq: ["$userType", USER_TYPES.LAB_PARTNER] }, 1, 0] }
        }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);

  // Format data for charts
  const formattedData = monthlyData.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    total: item.count,
    fitnessEnthusiasts: item.fitnessEnthusiasts,
    trainers: item.trainers,
    labPartners: item.labPartners
  }));

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, formattedData, "Monthly growth data retrieved successfully")
  );
});

// @desc    Get user type distribution for pie chart
// @route   GET /api/admin/analytics/user-distribution
// @access  Admin
const getUserDistribution = asyncHandler(async (req, res) => {
  const distribution = await User.aggregate([
    {
      $group: {
        _id: "$userType",
        count: { $sum: 1 }
      }
    }
  ]);

  // Format for pie chart
  const formattedData = distribution.map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('-', ' '),
    value: item.count,
    type: item._id
  }));

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, formattedData, "User distribution data retrieved successfully")
  );
});

// @desc    Get all users for management
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const userType = req.query.userType || '';

  // Build filter query
  let filter = {};
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } }
    ];
  }
  if (userType) {
    filter.userType = userType;
  }

  const users = await User.find(filter)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / limit);

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, "Users retrieved successfully")
  );
});

// @desc    Suspend/Unsuspend user account
// @route   PATCH /api/admin/users/:userId/suspend
// @access  Admin
const toggleUserSuspension = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { suspend, reason } = req.body;

  if (typeof suspend !== 'boolean') {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Suspend field must be a boolean");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");
  }

  // Prevent suspending admin users (if they exist in DB)
  if (user.userType === USER_TYPES.ADMIN) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Cannot suspend admin accounts");
  }

  user.isSuspended = suspend;
  user.suspensionReason = suspend ? (reason || 'No reason provided') : null;
  user.suspendedAt = suspend ? new Date() : null;

  await user.save();

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, {
      userId: user._id,
      isSuspended: user.isSuspended,
      reason: user.suspensionReason
    }, `User ${suspend ? 'suspended' : 'unsuspended'} successfully`)
  );
});

// @desc    Generate monthly invoice for a specific lab partner
// @route   POST /api/admin/invoices/generate/:labPartnerId
// @access  Private (Admin)
const generateMonthlyInvoice = asyncHandler(async (req, res) => {
  const { labPartnerId } = req.params;
  const { month, year, dueDay } = req.body;

  // Validate required fields
  if (!month || !year) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Month and year are required"
    );
  }

  // Validate month and year
  if (month < 1 || month > 12) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Month must be between 1 and 12");
  }

  if (year < 2020 || year > new Date().getFullYear() + 1) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid year");
  }

  // Verify lab partner exists
  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Step 1: Find unbilled bookings for the specified month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const unbilledBookings = await LabBooking.find({
    labPartnerId,
    paymentReceivedByLab: true,
    commissionStatus: "pending",
    paymentReceivedDate: {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate("fitnessEnthusiastId", "name email")
    .populate("selectedTests", "testName");

  if (unbilledBookings.length === 0) {
    // Check if there are ANY bookings for this lab partner
    const totalBookings = await LabBooking.countDocuments({ labPartnerId });
    const paidBookings = await LabBooking.countDocuments({ labPartnerId, paymentReceivedByLab: true });
    const pendingCommission = await LabBooking.countDocuments({ labPartnerId, commissionStatus: "pending" });

    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      `No unbilled commissions found for this period. Stats: Total bookings: ${totalBookings}, Paid bookings: ${paidBookings}, Pending commission: ${pendingCommission}`
    );
  }

  // Step 2: Sum all commissions and build detailed breakdown
  let totalCommission = 0;
  let totalBookingValue = 0;
  const bookingIds = [];
  const commissionBreakdown = [];

  unbilledBookings.forEach((booking) => {
    totalCommission += booking.commissionAmount;
    totalBookingValue += booking.totalAmount;
    bookingIds.push(booking._id);

    // Build commission breakdown
    commissionBreakdown.push({
      bookingId: booking._id,
      fitnessEnthusiastId: booking.fitnessEnthusiastId._id,
      fitnessEnthusiastName: booking.fitnessEnthusiastId.name,
      testNames: booking.selectedTests.map(test => test.testName),
      bookingDate: booking.paymentReceivedDate,
      totalAmount: booking.totalAmount,
      commissionAmount: booking.commissionAmount,
      commissionRate: booking.commissionRate || labPartner.commissionRate || 10,
    });
  });

  // Calculate due date (default to 5th of next month)
  const dueDayOfMonth = dueDay || 5;
  const dueDate = new Date(year, month, dueDayOfMonth); // Next month, 5th day

  // Generate invoice number
  const invoiceNumber = await PlatformInvoice.generateInvoiceNumber(
    labPartnerId,
    year,
    month
  );

  // Create Platform Commission Invoice
  const invoice = await PlatformInvoice.create({
    labPartnerId,
    invoiceNumber,
    billingPeriod: {
      month,
      year,
      startDate,
      endDate,
      type: "monthly",
    },
    totalCommission,
    numberOfBookings: unbilledBookings.length,
    totalBookingValue,
    commissionRate: labPartner.commissionRate || 10,
    status: "payment_due",
    dueDate,
    generatedDate: new Date(),
    bookingIds,
    commissionBreakdown,
    generatedBy: req.adminUser?.email || config.admin.email,
  });

  // Update all bookings to mark them as billed
  await LabBooking.updateMany(
    {
      _id: { $in: bookingIds },
    },
    {
      $set: {
        commissionStatus: "billed",
        billedInvoiceId: invoice._id,
        "billingPeriod.month": month,
        "billingPeriod.year": year,
      },
    }
  );

  // Step 3: Reset Counters
  // Deduct the billed amount from unbilledCommissions
  labPartner.unbilledCommissions = Math.max(0, labPartner.unbilledCommissions - totalCommission);

  // Reset current month liability (as it's now billed)
  labPartner.currentMonthLiability = 0;

  await labPartner.save();

  // Populate invoice for response
  const populatedInvoice = await PlatformInvoice.findById(invoice._id)
    .populate("labPartnerId", "name laboratoryName email phone laboratoryAddress")
    .populate("commissionBreakdown.fitnessEnthusiastId", "name email");

  return res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        {
          invoice: populatedInvoice,
          summary: {
            totalCommission,
            numberOfBookings: unbilledBookings.length,
            totalBookingValue,
            billingPeriod: `${month}/${year}`,
            dateRange: {
              startDate,
              endDate,
            },
            dueDate,
            invoiceNumber,
          },
        },
        "Monthly invoice generated successfully"
      )
    );
});

// @desc    Generate monthly invoices for all lab partners
// @route   POST /api/admin/invoices/generate-all
// @access  Private (Admin)
const generateAllMonthlyInvoices = asyncHandler(async (req, res) => {
  const { month, year, dueDay, labPartnerIds } = req.body;

  // Validate required fields
  if (!month || !year) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Month and year are required"
    );
  }

  // Build query for lab partners
  let query = {
    userType: USER_TYPES.LAB_PARTNER,
    isApproved: true,
    approvalStatus: "approved",
  };

  // If specific lab partners are selected, filter by IDs
  if (labPartnerIds && Array.isArray(labPartnerIds) && labPartnerIds.length > 0) {
    query._id = { $in: labPartnerIds };
  }

  // Get lab partners based on query
  const labPartners = await User.find(query);

  const results = {
    success: [],
    failed: [],
    skipped: [],
  };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  for (const labPartner of labPartners) {
    try {
      // Find unbilled bookings (skip existence check - just check if there are unbilled bookings)
      const unbilledBookings = await LabBooking.find({
        labPartnerId: labPartner._id,
        paymentReceivedByLab: true,
        commissionStatus: "pending",
        paymentReceivedDate: {
          $gte: startDate,
          $lte: endDate,
        },
      }).populate("fitnessEnthusiastId", "name email")
        .populate("selectedTests", "testName");

      if (unbilledBookings.length === 0) {
        results.skipped.push({
          labPartnerId: labPartner._id,
          laboratoryName: labPartner.laboratoryName,
          reason: "No unbilled commissions",
        });
        continue;
      }

      // Calculate totals and build breakdown
      let totalCommission = 0;
      let totalBookingValue = 0;
      const bookingIds = [];
      const commissionBreakdown = [];

      unbilledBookings.forEach((booking) => {
        totalCommission += booking.commissionAmount;
        totalBookingValue += booking.totalAmount;
        bookingIds.push(booking._id);

        commissionBreakdown.push({
          bookingId: booking._id,
          fitnessEnthusiastId: booking.fitnessEnthusiastId._id,
          fitnessEnthusiastName: booking.fitnessEnthusiastId.name,
          testNames: booking.selectedTests.map(test => test.testName),
          bookingDate: booking.paymentReceivedDate,
          totalAmount: booking.totalAmount,
          commissionAmount: booking.commissionAmount,
          commissionRate: booking.commissionRate || labPartner.commissionRate || 10,
        });
      });

      // Generate invoice
      const dueDayOfMonth = dueDay || 5;
      const dueDate = new Date(year, month, dueDayOfMonth);
      const invoiceNumber = await PlatformInvoice.generateInvoiceNumber(
        labPartner._id,
        year,
        month
      );

      const invoice = await PlatformInvoice.create({
        labPartnerId: labPartner._id,
        invoiceNumber,
        billingPeriod: {
          month,
          year,
          startDate,
          endDate,
          type: "monthly",
        },
        totalCommission,
        numberOfBookings: unbilledBookings.length,
        totalBookingValue,
        commissionRate: labPartner.commissionRate || 10,
        status: "payment_due",
        dueDate,
        generatedDate: new Date(),
        bookingIds,
        commissionBreakdown,
        generatedBy: req.adminUser?.email || config.admin.email,
      });

      // Update bookings
      await LabBooking.updateMany(
        { _id: { $in: bookingIds } },
        {
          $set: {
            commissionStatus: "billed",
            billedInvoiceId: invoice._id,
            "billingPeriod.month": month,
            "billingPeriod.year": year,
          },
        }
      );

      // Reset lab partner counters
      labPartner.unbilledCommissions = Math.max(0, labPartner.unbilledCommissions - totalCommission);
      labPartner.currentMonthLiability = 0;
      await labPartner.save();

      results.success.push({
        labPartnerId: labPartner._id,
        laboratoryName: labPartner.laboratoryName,
        invoiceNumber,
        totalCommission,
        numberOfBookings: unbilledBookings.length,
      });
    } catch (error) {
      results.failed.push({
        labPartnerId: labPartner._id,
        laboratoryName: labPartner.laboratoryName,
        error: error.message,
      });
    }
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          summary: {
            total: labPartners.length,
            generated: results.success.length,
            skipped: results.skipped.length,
            failed: results.failed.length,
          },
          results,
        },
        `Invoices generated for ${results.success.length} lab partners`
      )
    );
});

// @desc    Get all invoices
// @route   GET /api/admin/invoices
// @access  Private (Admin)
const getAllInvoices = asyncHandler(async (req, res) => {
  const { status, month, year, labPartnerId } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (month && year) {
    query["billingPeriod.month"] = parseInt(month);
    query["billingPeriod.year"] = parseInt(year);
  }

  if (labPartnerId) {
    query.labPartnerId = labPartnerId;
  }

  const invoices = await PlatformInvoice.find(query)
    .populate("labPartnerId", "name laboratoryName email phone")
    .sort({ generatedDate: -1 });

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

// @desc    Get invoice by ID
// @route   GET /api/admin/invoices/:invoiceId
// @access  Private (Admin)
const getInvoiceById = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const invoice = await PlatformInvoice.findById(invoiceId)
    .populate("labPartnerId", "name laboratoryName email phone laboratoryAddress")
    .populate("bookingIds", "totalAmount commissionAmount paymentReceivedDate fitnessEnthusiastId");

  if (!invoice) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Invoice not found");
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(STATUS_CODES.SUCCESS, invoice, "Invoice fetched successfully")
    );
});

// @desc    Suspend lab partner for non-payment
// @route   PATCH /api/admin/lab-partners/:labPartnerId/suspend-for-nonpayment
// @access  Private (Admin)
const suspendLabForNonPayment = asyncHandler(async (req, res) => {
  const { labPartnerId } = req.params;
  const { invoiceIds, notes } = req.body;

  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  // Get overdue invoice details for suspension reason
  let suspensionReason = "Suspended for non-payment of platform commissions";

  if (invoiceIds && invoiceIds.length > 0) {
    const overdueInvoices = await PlatformInvoice.find({
      _id: { $in: invoiceIds },
      labPartnerId,
      status: { $in: ["payment_due", "overdue"] },
    });

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + inv.totalCommission,
      0
    );

    suspensionReason = `Suspended for non-payment: ${overdueInvoices.length} overdue invoice(s) totaling ₹${totalOverdue}`;
  }

  if (notes) {
    suspensionReason += `. ${notes}`;
  }

  labPartner.isSuspended = true;
  labPartner.suspensionReason = suspensionReason;
  labPartner.suspendedAt = new Date();

  await labPartner.save();

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          labPartnerId: labPartner._id,
          laboratoryName: labPartner.laboratoryName,
          isSuspended: true,
          suspensionReason,
          suspendedAt: labPartner.suspendedAt,
          impact: "New bookings are blocked. Existing users can still access their paid reports.",
        },
        "Lab partner suspended for non-payment"
      )
    );
});

// @desc    Unsuspend lab partner (after payment received)
// @route   PATCH /api/admin/lab-partners/:labPartnerId/unsuspend
// @access  Private (Admin)
const unsuspendLab = asyncHandler(async (req, res) => {
  const { labPartnerId } = req.params;

  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  if (!labPartner.isSuspended) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Lab partner is not currently suspended"
    );
  }

  labPartner.isSuspended = false;
  labPartner.suspensionReason = null;
  labPartner.suspendedAt = null;

  await labPartner.save();

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          labPartnerId: labPartner._id,
          laboratoryName: labPartner.laboratoryName,
          isSuspended: false,
        },
        "Lab partner unsuspended successfully. New bookings are now allowed."
      )
    );
});

// @desc    Mark invoice as paid
// @route   PATCH /api/admin/invoices/:invoiceId/mark-paid
// @access  Private (Admin)
const markInvoiceAsPaid = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { paymentMethod, paymentReference, paymentNotes } = req.body;

  const invoice = await PlatformInvoice.findById(invoiceId);

  if (!invoice) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Invoice not found");
  }

  if (invoice.status === "paid") {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Invoice is already marked as paid"
    );
  }

  // Update invoice status
  invoice.status = "paid";
  invoice.paidDate = new Date();
  invoice.paymentMethod = paymentMethod || null;
  invoice.paymentReference = paymentReference || null;
  invoice.paymentNotes = paymentNotes || null;

  await invoice.save();

  // Update all related bookings commission status to "paid"
  await LabBooking.updateMany(
    { billedInvoiceId: invoice._id },
    { $set: { commissionStatus: "paid" } }
  );

  // AUTOMATIC RESTORATION: Unsuspend lab if it was suspended for non-payment
  const labPartner = await User.findById(invoice.labPartnerId);

  if (labPartner && labPartner.isSuspended) {
    // Check if there are any other unpaid/overdue invoices
    const overdueInvoices = await PlatformInvoice.find({
      labPartnerId: invoice.labPartnerId,
      status: { $in: ["payment_due", "overdue"] },
      _id: { $ne: invoice._id }, // Exclude current invoice
    });

    // If no other overdue invoices, unsuspend the lab
    if (overdueInvoices.length === 0) {
      labPartner.isSuspended = false;
      labPartner.suspensionReason = null;
      labPartner.suspendedAt = null;
      await labPartner.save();

      return res
        .status(STATUS_CODES.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODES.SUCCESS,
            {
              invoice: await PlatformInvoice.findById(invoice._id).populate(
                "labPartnerId",
                "name laboratoryName email phone isSuspended"
              ),
              labPartnerRestored: true,
              message: "Lab partner account automatically reactivated",
            },
            "Invoice marked as paid and lab partner unsuspended successfully"
          )
        );
    }
  }

  const populatedInvoice = await PlatformInvoice.findById(invoice._id).populate(
    "labPartnerId",
    "name laboratoryName email phone"
  );

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          invoice: populatedInvoice,
          labPartnerRestored: false,
        },
        "Invoice marked as paid successfully"
      )
    );
});

// @desc    Enforce overdue invoices - Suspend labs with unpaid invoices past due date
// @route   POST /api/admin/invoices/enforce-overdue
// @access  Private (Admin)
const enforceOverdueInvoices = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find all invoices that are overdue (due date passed and status is payment_due or overdue)
  const overdueInvoices = await PlatformInvoice.find({
    dueDate: { $lt: now },
    status: { $in: ["payment_due", "overdue"] },
  }).populate("labPartnerId", "name laboratoryName email isSuspended");

  if (overdueInvoices.length === 0) {
    return res
      .status(STATUS_CODES.SUCCESS)
      .json(
        new ApiResponse(
          STATUS_CODES.SUCCESS,
          {
            enforcedCount: 0,
            message: "No overdue invoices found",
          },
          "No enforcement actions taken"
        )
      );
  }

  // Update invoice status to "overdue"
  await PlatformInvoice.updateMany(
    {
      dueDate: { $lt: now },
      status: "payment_due",
    },
    {
      $set: { status: "overdue" },
    }
  );

  // Group invoices by lab partner
  const labPartnerInvoices = {};
  overdueInvoices.forEach((invoice) => {
    const labId = invoice.labPartnerId._id.toString();
    if (!labPartnerInvoices[labId]) {
      labPartnerInvoices[labId] = {
        labPartner: invoice.labPartnerId,
        invoices: [],
        totalOverdue: 0,
      };
    }
    labPartnerInvoices[labId].invoices.push(invoice);
    labPartnerInvoices[labId].totalOverdue += invoice.totalCommission;
  });

  const enforcementResults = {
    suspended: [],
    alreadySuspended: [],
  };

  // Suspend each lab partner with overdue invoices
  for (const labId in labPartnerInvoices) {
    const { labPartner, invoices, totalOverdue } = labPartnerInvoices[labId];

    // Check if already suspended
    if (labPartner.isSuspended) {
      enforcementResults.alreadySuspended.push({
        labPartnerId: labPartner._id,
        laboratoryName: labPartner.laboratoryName,
        overdueCount: invoices.length,
        totalOverdue,
      });
      continue;
    }

    // Suspend the lab
    const suspensionReason = `Automated suspension for non-payment: ${invoices.length} overdue invoice(s) totaling ₹${totalOverdue}. Due date(s) passed: ${invoices.map((inv) => new Date(inv.dueDate).toLocaleDateString()).join(", ")}`;

    const lab = await User.findById(labPartner._id);
    lab.isSuspended = true;
    lab.suspensionReason = suspensionReason;
    lab.suspendedAt = new Date();
    await lab.save();

    enforcementResults.suspended.push({
      labPartnerId: lab._id,
      laboratoryName: lab.laboratoryName,
      overdueCount: invoices.length,
      totalOverdue,
      invoiceNumbers: invoices.map((inv) => inv.invoiceNumber),
      suspensionReason,
    });
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          enforcedCount: enforcementResults.suspended.length,
          suspended: enforcementResults.suspended,
          alreadySuspended: enforcementResults.alreadySuspended,
          summary: {
            totalOverdueInvoices: overdueInvoices.length,
            newSuspensions: enforcementResults.suspended.length,
            alreadySuspended: enforcementResults.alreadySuspended.length,
          },
        },
        `Enforcement complete: ${enforcementResults.suspended.length} lab(s) suspended for non-payment`
      )
    );
});

// @desc    Update lab partner commission rate
// @route   PATCH /api/admin/lab-partners/:labPartnerId/commission-rate
// @access  Private (Admin)
const updateLabPartnerCommissionRate = asyncHandler(async (req, res) => {
  const { labPartnerId } = req.params;
  const { commissionRate } = req.body;

  // Validate commission rate
  if (commissionRate === undefined || commissionRate === null) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Commission rate is required"
    );
  }

  if (commissionRate < 0 || commissionRate > 100) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Commission rate must be between 0 and 100"
    );
  }

  // Find and update lab partner
  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  const oldRate = labPartner.commissionRate;
  labPartner.commissionRate = commissionRate;
  await labPartner.save();

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          labPartnerId: labPartner._id,
          laboratoryName: labPartner.laboratoryName,
          oldCommissionRate: oldRate,
          newCommissionRate: commissionRate,
        },
        `Commission rate updated from ${oldRate}% to ${commissionRate}%`
      )
    );
});

// @desc    Get all lab partners with their commission rates
// @route   GET /api/admin/lab-partners/commission-rates
// @access  Private (Admin)
const getLabPartnersWithCommissionRates = asyncHandler(async (req, res) => {
  const labPartners = await User.find({
    userType: USER_TYPES.LAB_PARTNER,
    isApproved: true,
    approvalStatus: "approved",
  }).select("name laboratoryName email phone commissionRate unbilledCommissions currentMonthLiability isSuspended");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        labPartners,
        "Lab partners with commission rates fetched successfully"
      )
    );
});

// @desc    Get grace period status for all labs
// @route   GET /api/admin/invoices/grace-period-status
// @access  Private (Admin)
const getGracePeriodStatus = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find all payment_due invoices
  const pendingInvoices = await PlatformInvoice.find({
    status: "payment_due",
  }).populate("labPartnerId", "name laboratoryName email");

  const gracePeriodStatus = pendingInvoices.map((invoice) => {
    const daysUntilDue = Math.ceil(
      (new Date(invoice.dueDate) - now) / (1000 * 60 * 60 * 24)
    );
    const isInGracePeriod = daysUntilDue >= 0;
    const isOverdue = daysUntilDue < 0;

    return {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      labPartner: {
        id: invoice.labPartnerId._id,
        name: invoice.labPartnerId.laboratoryName,
        email: invoice.labPartnerId.email,
      },
      totalCommission: invoice.totalCommission,
      dueDate: invoice.dueDate,
      daysUntilDue,
      status: isOverdue
        ? "overdue"
        : isInGracePeriod && daysUntilDue <= 5
          ? "grace_period"
          : "normal",
      requiresAction: isOverdue,
    };
  });

  // Categorize
  const categorized = {
    overdue: gracePeriodStatus.filter((s) => s.status === "overdue"),
    gracePeriod: gracePeriodStatus.filter((s) => s.status === "grace_period"),
    normal: gracePeriodStatus.filter((s) => s.status === "normal"),
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          summary: {
            overdue: categorized.overdue.length,
            inGracePeriod: categorized.gracePeriod.length,
            normal: categorized.normal.length,
          },
          invoices: categorized,
        },
        "Grace period status retrieved successfully"
      )
    );
});

// @desc    Generate invoice with flexible time window (weekly, monthly, or custom date range)
// @route   POST /api/admin/invoices/generate-flexible/:labPartnerId
// @access  Private (Admin)
const generateFlexibleInvoice = asyncHandler(async (req, res) => {
  const { labPartnerId } = req.params;
  const { timeWindow, startDate, endDate, month, year, dueDay } = req.body;

  // Validate time window type
  if (!timeWindow || !["weekly", "monthly", "custom"].includes(timeWindow)) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Time window must be 'weekly', 'monthly', or 'custom'"
    );
  }

  // Verify lab partner exists
  const labPartner = await User.findOne({
    _id: labPartnerId,
    userType: USER_TYPES.LAB_PARTNER,
  });

  if (!labPartner) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found");
  }

  let billingStartDate, billingEndDate, billingPeriodData;

  // Determine date range based on time window
  if (timeWindow === "monthly") {
    if (!month || !year) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Month and year are required for monthly invoices");
    }
    billingStartDate = new Date(year, month - 1, 1);
    billingEndDate = new Date(year, month, 0, 23, 59, 59, 999);
    billingPeriodData = {
      month,
      year,
      startDate: billingStartDate,
      endDate: billingEndDate,
      type: "monthly",
    };
  } else if (timeWindow === "weekly") {
    if (!startDate) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Start date is required for weekly invoices");
    }
    billingStartDate = new Date(startDate);
    billingEndDate = new Date(billingStartDate);
    billingEndDate.setDate(billingEndDate.getDate() + 6);
    billingEndDate.setHours(23, 59, 59, 999);
    billingPeriodData = {
      startDate: billingStartDate,
      endDate: billingEndDate,
      type: "weekly",
    };
  } else if (timeWindow === "custom") {
    if (!startDate || !endDate) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Start date and end date are required for custom invoices");
    }
    billingStartDate = new Date(startDate);
    billingEndDate = new Date(endDate);
    billingEndDate.setHours(23, 59, 59, 999);

    if (billingStartDate >= billingEndDate) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "End date must be after start date");
    }

    billingPeriodData = {
      startDate: billingStartDate,
      endDate: billingEndDate,
      type: "custom",
    };
  }

  // Find unbilled bookings in the date range
  const unbilledBookings = await LabBooking.find({
    labPartnerId,
    paymentReceivedByLab: true,
    commissionStatus: "pending",
    paymentReceivedDate: {
      $gte: billingStartDate,
      $lte: billingEndDate,
    },
  }).populate("fitnessEnthusiastId", "name email")
    .populate("selectedTests", "testName");

  if (unbilledBookings.length === 0) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "No unbilled commissions found for this period"
    );
  }

  // Calculate totals and build commission breakdown
  let totalCommission = 0;
  let totalBookingValue = 0;
  const bookingIds = [];
  const commissionBreakdown = [];

  unbilledBookings.forEach((booking) => {
    totalCommission += booking.commissionAmount;
    totalBookingValue += booking.totalAmount;
    bookingIds.push(booking._id);

    // Add to commission breakdown
    commissionBreakdown.push({
      bookingId: booking._id,
      fitnessEnthusiastId: booking.fitnessEnthusiastId._id,
      fitnessEnthusiastName: booking.fitnessEnthusiastId.name,
      testNames: booking.selectedTests.map(test => test.testName),
      bookingDate: booking.paymentReceivedDate,
      totalAmount: booking.totalAmount,
      commissionAmount: booking.commissionAmount,
      commissionRate: booking.commissionRate || labPartner.commissionRate || 10,
    });
  });

  // Calculate due date (default to 5 days from generation)
  const dueDayOffset = dueDay || 5;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDayOffset);

  // Generate invoice number (use current date for custom/weekly)
  const now = new Date();
  const invoiceNumber = await PlatformInvoice.generateInvoiceNumber(
    labPartnerId,
    billingPeriodData.year || now.getFullYear(),
    billingPeriodData.month || now.getMonth() + 1
  );

  // Create invoice
  const invoice = await PlatformInvoice.create({
    labPartnerId,
    invoiceNumber,
    billingPeriod: billingPeriodData,
    totalCommission,
    numberOfBookings: unbilledBookings.length,
    totalBookingValue,
    commissionRate: labPartner.commissionRate || 10,
    status: "payment_due",
    dueDate,
    generatedDate: new Date(),
    bookingIds,
    commissionBreakdown,
    generatedBy: req.adminUser?.email || config.admin.email,
  });

  // Update bookings to mark them as billed
  await LabBooking.updateMany(
    { _id: { $in: bookingIds } },
    {
      $set: {
        commissionStatus: "billed",
        billedInvoiceId: invoice._id,
      },
    }
  );

  // Reset lab partner counters
  labPartner.unbilledCommissions = Math.max(0, labPartner.unbilledCommissions - totalCommission);
  if (timeWindow === "monthly") {
    labPartner.currentMonthLiability = 0;
  }
  await labPartner.save();

  // Populate invoice for response
  const populatedInvoice = await PlatformInvoice.findById(invoice._id)
    .populate("labPartnerId", "name laboratoryName email phone laboratoryAddress")
    .populate("commissionBreakdown.fitnessEnthusiastId", "name email");

  return res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        {
          invoice: populatedInvoice,
          summary: {
            totalCommission,
            numberOfBookings: unbilledBookings.length,
            totalBookingValue,
            timeWindow,
            dateRange: {
              startDate: billingStartDate,
              endDate: billingEndDate,
            },
            dueDate,
            invoiceNumber,
          },
        },
        "Invoice generated successfully"
      )
    );
});

// @desc    Get pending invoice requests from lab partners
// @route   GET /api/admin/invoice-requests
// @access  Private (Admin)
const getInvoiceRequests = asyncHandler(async (req, res) => {
  // Find lab partners who have unbilled commissions and might need invoices
  const labPartnersWithRequests = await User.find({
    userType: USER_TYPES.LAB_PARTNER,
    isApproved: true,
    approvalStatus: "approved",
    unbilledCommissions: { $gt: 0 },
  }).select("name laboratoryName email phone unbilledCommissions currentMonthLiability");

  // Get any pending bookings that need billing
  const requestData = [];

  for (const labPartner of labPartnersWithRequests) {
    const unbilledBookings = await LabBooking.countDocuments({
      labPartnerId: labPartner._id,
      paymentReceivedByLab: true,
      commissionStatus: "pending",
    });

    if (unbilledBookings > 0) {
      requestData.push({
        labPartnerId: labPartner._id,
        laboratoryName: labPartner.laboratoryName,
        email: labPartner.email,
        phone: labPartner.phone,
        unbilledCommissions: labPartner.unbilledCommissions,
        unbilledBookingsCount: unbilledBookings,
      });
    }
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        requestData,
        "Invoice requests fetched successfully"
      )
    );
});

// @desc    Get lab earnings over time (Line Chart)
// @route   GET /api/admin/analytics/lab-earnings/over-time
// @access  Admin
const getLabEarningsOverTime = asyncHandler(async (req, res) => {
  const { period = '12months' } = req.query;

  let startDate = new Date();
  let groupBy;

  if (period === '30days') {
    startDate.setDate(startDate.getDate() - 30);
    groupBy = {
      year: { $year: "$paymentReceivedDate" },
      month: { $month: "$paymentReceivedDate" },
      day: { $dayOfMonth: "$paymentReceivedDate" }
    };
  } else if (period === '12months') {
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    groupBy = {
      year: { $year: "$paymentReceivedDate" },
      month: { $month: "$paymentReceivedDate" }
    };
  } else if (period === 'all') {
    startDate = new Date(0); // Beginning of time
    groupBy = {
      year: { $year: "$paymentReceivedDate" },
      month: { $month: "$paymentReceivedDate" }
    };
  }

  const earnings = await LabBooking.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'confirmed'] },
        paymentReceivedByLab: true,
        paymentReceivedDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        totalEarnings: { $sum: "$totalAmount" },
        platformCommission: { $sum: "$commissionAmount" },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
    }
  ]);

  const formattedData = earnings.map(item => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let dateLabel;

    if (period === '30days' && item._id.day) {
      dateLabel = `${monthNames[item._id.month - 1]} ${item._id.day}`;
    } else {
      dateLabel = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    }

    return {
      date: dateLabel,
      totalEarnings: item.totalEarnings,
      platformCommission: item.platformCommission,
      bookings: item.count
    };
  });

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, formattedData, "Lab earnings over time fetched successfully")
  );
});

// @desc    Get lab earnings breakdown (Stacked Bar Chart by Time Period)
// @route   GET /api/admin/analytics/lab-earnings/breakdown
// @access  Admin
const getLabEarningsBreakdown = asyncHandler(async (req, res) => {
  const { period = '12months' } = req.query;

  let startDate = new Date();
  let groupBy;

  if (period === '30days') {
    startDate.setDate(startDate.getDate() - 30);
    groupBy = {
      year: { $year: "$paymentReceivedDate" },
      month: { $month: "$paymentReceivedDate" },
      day: { $dayOfMonth: "$paymentReceivedDate" }
    };
  } else if (period === '12months') {
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    groupBy = {
      year: { $year: "$paymentReceivedDate" },
      month: { $month: "$paymentReceivedDate" }
    };
  } else {
    startDate = new Date(0);
    groupBy = {
      year: { $year: "$paymentReceivedDate" },
      month: { $month: "$paymentReceivedDate" }
    };
  }

  // First, get all bookings grouped by time period AND partner
  const breakdown = await LabBooking.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'confirmed'] },
        paymentReceivedByLab: true,
        paymentReceivedDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          timePeriod: groupBy,
          labPartnerId: "$labPartnerId"
        },
        totalCommission: { $sum: "$commissionAmount" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.labPartnerId",
        foreignField: "_id",
        as: "partner"
      }
    },
    { $unwind: "$partner" },
    {
      $sort: {
        "_id.timePeriod.year": 1,
        "_id.timePeriod.month": 1,
        "_id.timePeriod.day": 1
      }
    }
  ]);

  // Transform data into the format needed for stacked bar chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dataMap = new Map();
  const partnerSet = new Set();

  breakdown.forEach(item => {
    const timePeriod = item._id.timePeriod;
    let periodLabel;

    if (period === '30days' && timePeriod.day) {
      periodLabel = `${monthNames[timePeriod.month - 1]} ${timePeriod.day}`;
    } else {
      periodLabel = `${monthNames[timePeriod.month - 1]} ${timePeriod.year}`;
    }

    const partnerName = item.partner.laboratoryName || item.partner.name;
    partnerSet.add(partnerName);

    if (!dataMap.has(periodLabel)) {
      dataMap.set(periodLabel, { period: periodLabel });
    }

    dataMap.get(periodLabel)[partnerName] = item.totalCommission;
  });

  const formattedData = Array.from(dataMap.values());
  const partners = Array.from(partnerSet);

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, { data: formattedData, partners }, "Lab earnings breakdown fetched successfully")
  );
});

// @desc    Get top lab partners (Horizontal Bar Chart)
// @route   GET /api/admin/analytics/lab-earnings/top-partners
// @access  Admin
const getTopLabPartners = asyncHandler(async (req, res) => {
  const topPartners = await LabBooking.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'confirmed'] },
        paymentReceivedByLab: true
      }
    },
    {
      $group: {
        _id: "$labPartnerId",
        totalCommission: { $sum: "$commissionAmount" },
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "partner"
      }
    },
    { $unwind: "$partner" },
    {
      $project: {
        name: "$partner.laboratoryName",
        email: "$partner.email",
        totalCommission: 1,
        totalBookings: 1,
        totalRevenue: 1
      }
    },
    { $sort: { totalCommission: -1 } },
    { $limit: 10 }
  ]);

  return res.status(STATUS_CODES.SUCCESS).json(
    new ApiResponse(STATUS_CODES.SUCCESS, topPartners, "Top lab partners fetched successfully")
  );
});

export {
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
};