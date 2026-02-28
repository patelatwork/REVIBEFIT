import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { STATUS_CODES, USER_TYPES } from "../constants.js";
import { User } from "../models/user.model.js";
import { LabBooking } from "../models/labBooking.model.js";
import { PlatformInvoice } from "../models/platformInvoice.model.js";
import { LiveClass } from "../models/liveClass.model.js";
import { ClassBooking } from "../models/classBooking.model.js";
import CompletedWorkout from "../models/completedWorkout.model.js";
import { MealLog } from "../models/mealLog.model.js";
import { Blog } from "../models/blog.model.js";
import { BlogReading } from "../models/blogReading.model.js";
import { NutritionProfile } from "../models/nutritionProfile.model.js";
import { LabTest } from "../models/labTest.model.js";
import { CommissionChangeRequest } from "../models/commissionChangeRequest.model.js";
import { logManagerActivity } from "../middlewares/activityLogger.middleware.js";
import { sendApprovalEmail, sendRejectionEmail } from "../utils/emailService.js";
import { escapeRegex } from "../middlewares/validate.middleware.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

// ─── Helpers ──────────────────────────────────────────────

/** Get the assigned region from the manager on req.user */
const getRegion = (req) => {
    const region = req.user?.assignedRegion;
    if (!region) {
        throw new ApiError(STATUS_CODES.FORBIDDEN, "Manager has no assigned region");
    }
    return region;
};

const CLAIM_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ─── Manager Login ────────────────────────────────────────

const managerLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(STATUS_CODES.BAD_REQUEST, "Email and password are required");
    }

    const user = await User.findOne({ email, userType: USER_TYPES.MANAGER }).select("+password");
    if (!user) throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
    if (!user.isActive) throw new ApiError(STATUS_CODES.FORBIDDEN, "Account deactivated");
    if (user.isSuspended) throw new ApiError(STATUS_CODES.FORBIDDEN, `Account suspended: ${user.suspensionReason}`);

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedIn = await User.findById(user._id).select("-password -refreshToken");

    const opts = { httpOnly: true, secure: config.isProduction, sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 };

    return res
        .status(STATUS_CODES.SUCCESS)
        .cookie("accessToken", accessToken, opts)
        .cookie("refreshToken", refreshToken, opts)
        .json(new ApiResponse(STATUS_CODES.SUCCESS, { user: loggedIn, accessToken, refreshToken }, "Manager logged in successfully"));
});

// ─── Profile ──────────────────────────────────────────────

const getManagerProfile = asyncHandler(async (req, res) => {
    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, req.user, "Profile fetched")
    );
});

const updateManagerProfile = asyncHandler(async (req, res) => {
    const { name, phone, email } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) throw new ApiError(STATUS_CODES.CONFLICT, "Email already in use");
        user.email = email;
    }
    if (req.file) user.profilePhoto = `temp/${req.file.filename}`;

    await user.save();
    await logManagerActivity(req, "UPDATE_PROFILE", "User", user._id, { name, phone, email });

    const updated = await User.findById(user._id).select("-password -refreshToken");
    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, updated, "Profile updated")
    );
});

// ─── Pending Approvals (region-scoped) ────────────────────

const getPendingApprovals = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const pendingUsers = await User.find({
        approvalStatus: "pending",
        userType: { $in: [USER_TYPES.TRAINER, USER_TYPES.LAB_PARTNER] },
        state: region,
    }).select("-password -refreshToken");

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, pendingUsers, "Pending approvals fetched")
    );
});

// ─── Claim / Lock System ──────────────────────────────────

const claimApproval = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const region = getRegion(req);

    const user = await User.findOne({ _id: userId, approvalStatus: "pending", state: region });
    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "Pending user not found in your region");

    // Check existing claim
    if (user.claimedBy && user.claimedAt && (Date.now() - user.claimedAt.getTime() < CLAIM_EXPIRY_MS)) {
        if (user.claimedBy.toString() !== req.user._id.toString()) {
            throw new ApiError(STATUS_CODES.CONFLICT, "This application is currently being reviewed by another manager");
        }
    }

    user.claimedBy = req.user._id;
    user.claimedAt = new Date();
    await user.save();
    await logManagerActivity(req, "CLAIM_APPROVAL", "User", userId, { userName: user.name });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { userId, claimedUntil: new Date(Date.now() + CLAIM_EXPIRY_MS) }, "Application claimed")
    );
});

const releaseApproval = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");

    if (user.claimedBy?.toString() !== req.user._id.toString()) {
        throw new ApiError(STATUS_CODES.FORBIDDEN, "You have not claimed this application");
    }

    user.claimedBy = null;
    user.claimedAt = null;
    await user.save();
    await logManagerActivity(req, "RELEASE_APPROVAL", "User", userId, { userName: user.name });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, null, "Claim released")
    );
});

// ─── Approve / Reject (region-scoped) ─────────────────────

const approveUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const region = getRegion(req);

    const user = await User.findOne({ _id: userId, state: region });
    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found in your region");
    if (user.approvalStatus === "approved") throw new ApiError(STATUS_CODES.BAD_REQUEST, "Already approved");

    // Verify claim
    if (user.claimedBy && user.claimedAt && (Date.now() - user.claimedAt.getTime() < CLAIM_EXPIRY_MS)) {
        if (user.claimedBy.toString() !== req.user._id.toString()) {
            throw new ApiError(STATUS_CODES.CONFLICT, "This application is claimed by another manager");
        }
    }

    user.approvalStatus = "approved";
    user.isApproved = true;
    user.approvedBy = "RevibeFit";
    user.approvedAt = new Date();
    user.claimedBy = null;
    user.claimedAt = null;
    await user.save();

    await logManagerActivity(req, "APPROVE_USER", "User", userId, { userName: user.name, userType: user.userType });

    if (user.userType === USER_TYPES.TRAINER || user.userType === USER_TYPES.LAB_PARTNER) {
        try { await sendApprovalEmail(user); } catch (e) { console.error("Approval email failed:", e); }
    }

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, user, "User approved")
    );
});

const rejectUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    const region = getRegion(req);

    const user = await User.findOne({ _id: userId, state: region });
    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found in your region");
    if (user.approvalStatus === "rejected") throw new ApiError(STATUS_CODES.BAD_REQUEST, "Already rejected");

    user.approvalStatus = "rejected";
    user.isApproved = false;
    user.claimedBy = null;
    user.claimedAt = null;
    await user.save();

    await logManagerActivity(req, "REJECT_USER", "User", userId, { userName: user.name, reason });

    if (user.userType === USER_TYPES.TRAINER || user.userType === USER_TYPES.LAB_PARTNER) {
        try { await sendRejectionEmail(user, reason); } catch (e) { console.error("Rejection email failed:", e); }
    }

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, user, "User rejected")
    );
});

// ─── User Management (region-scoped) ──────────────────────

const getAllUsers = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const userType = req.query.userType || "";

    let filter = { state: region };
    if (search) {
        const safe = escapeRegex(search);
        filter.$or = [
            { name: { $regex: safe, $options: "i" } },
            { email: { $regex: safe, $options: "i" } },
        ];
    }
    if (userType) filter.userType = userType;

    const users = await User.find(filter).select("-password -refreshToken").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, {
            users,
            pagination: { currentPage: page, totalPages, totalUsers, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
        }, "Users retrieved")
    );
});

const toggleUserSuspension = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { suspend, reason } = req.body;
    const region = getRegion(req);

    if (typeof suspend !== "boolean") throw new ApiError(STATUS_CODES.BAD_REQUEST, "suspend must be boolean");

    const user = await User.findOne({ _id: userId, state: region });
    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found in your region");
    if (user.userType === USER_TYPES.ADMIN || user.userType === USER_TYPES.MANAGER) {
        throw new ApiError(STATUS_CODES.FORBIDDEN, "Cannot suspend admin or manager accounts");
    }

    user.isSuspended = suspend;
    user.suspensionReason = suspend ? (reason || "No reason provided") : null;
    user.suspendedAt = suspend ? new Date() : null;
    await user.save();

    await logManagerActivity(req, suspend ? "SUSPEND_USER" : "UNSUSPEND_USER", "User", userId, { userName: user.name, reason });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { userId: user._id, isSuspended: user.isSuspended, reason: user.suspensionReason }, `User ${suspend ? "suspended" : "unsuspended"}`)
    );
});

const getUserStats = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const f = { state: region };

    const [total, fe, tr, lp, pending] = await Promise.all([
        User.countDocuments(f),
        User.countDocuments({ ...f, userType: USER_TYPES.FITNESS_ENTHUSIAST }),
        User.countDocuments({ ...f, userType: USER_TYPES.TRAINER }),
        User.countDocuments({ ...f, userType: USER_TYPES.LAB_PARTNER }),
        User.countDocuments({ ...f, approvalStatus: "pending" }),
    ]);

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { totalUsers: total, fitnessEnthusiasts: fe, trainers: tr, labPartners: lp, pendingApprovals: pending, region }, "Stats fetched")
    );
});

const getUserActivity = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const region = getRegion(req);

    const user = await User.findOne({ _id: userId, state: region }).select("-password -refreshToken");
    if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found in your region");

    const activity = { user };

    if (user.userType === USER_TYPES.FITNESS_ENTHUSIAST) {
        const [workouts, classBookings, labBookings, mealLogs, blogReadings, nutritionProfile] = await Promise.all([
            CompletedWorkout.find({ userId }).sort({ completedAt: -1 }).limit(50),
            ClassBooking.find({ userId }).populate("classId", "title classType scheduledDate cost").populate("trainerId", "name").sort({ createdAt: -1 }).limit(50),
            LabBooking.find({ userId }).populate("labPartnerId", "name laboratoryName").sort({ createdAt: -1 }).limit(50),
            MealLog.find({ userId }).sort({ date: -1 }).limit(30),
            BlogReading.find({ userId }).populate("blogId", "title category").sort({ readAt: -1 }).limit(30),
            NutritionProfile.findOne({ userId }),
        ]);
        const totalSpent = classBookings.reduce((s, b) => s + (b.amountPaid || 0), 0) + labBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
        Object.assign(activity, { workouts, classBookings, labBookings, mealLogs, blogReadings, nutritionProfile, summary: { totalWorkouts: workouts.length, totalClassBookings: classBookings.length, totalLabBookings: labBookings.length, totalMealLogs: mealLogs.length, totalBlogReads: blogReadings.length, totalSpent } });
    } else if (user.userType === USER_TYPES.TRAINER) {
        const [classes, bookingsReceived, blogs, earningsAgg] = await Promise.all([
            LiveClass.find({ trainerId: userId }).sort({ createdAt: -1 }).limit(50),
            ClassBooking.find({ trainerId: userId }).populate("userId", "name email").populate("classId", "title classType").sort({ createdAt: -1 }).limit(50),
            Blog.find({ author: userId }).sort({ createdAt: -1 }).limit(30),
            ClassBooking.aggregate([
                { $match: { trainerId: new mongoose.Types.ObjectId(userId), bookingStatus: { $in: ["active", "completed"] } } },
                { $group: { _id: null, totalBookingValue: { $sum: "$amountPaid" }, totalCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } }, totalPayout: { $sum: { $ifNull: ["$trainerPayout", 0] } }, bookings: { $sum: 1 } } },
            ]),
        ]);
        Object.assign(activity, { classes, bookingsReceived, blogs, earnings: earningsAgg[0] || { totalBookingValue: 0, totalCommission: 0, totalPayout: 0, bookings: 0 }, summary: { totalClasses: classes.length, totalBookingsReceived: bookingsReceived.length, totalBlogs: blogs.length, totalEarnings: user.totalEarnings || 0, commissionRate: user.commissionRate || 15 } });
    } else if (user.userType === USER_TYPES.LAB_PARTNER) {
        const [labBookings, invoices, tests, earningsAgg] = await Promise.all([
            LabBooking.find({ labPartnerId: userId }).populate("userId", "name email").sort({ createdAt: -1 }).limit(50),
            PlatformInvoice.find({ labPartnerId: userId }).sort({ createdAt: -1 }).limit(20),
            LabTest.find({ _id: { $in: user.offeredTests || [] } }),
            LabBooking.aggregate([
                { $match: { labPartnerId: new mongoose.Types.ObjectId(userId), paymentStatus: "completed" } },
                { $group: { _id: null, totalBookingValue: { $sum: "$totalAmount" }, totalCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } }, bookings: { $sum: 1 } } },
            ]),
        ]);
        Object.assign(activity, { labBookings, invoices, tests, earnings: earningsAgg[0] || { totalBookingValue: 0, totalCommission: 0, bookings: 0 }, summary: { totalBookings: labBookings.length, totalInvoices: invoices.length, totalTests: tests.length, totalEarnings: user.totalEarnings || 0, commissionRate: user.commissionRate || 10 } });
    }

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, activity, "User activity fetched")
    );
});

// ─── Lab Partner Management (region-scoped) ───────────────

const getLabPartnersWithCommissionRates = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartners = await User.find({
        userType: USER_TYPES.LAB_PARTNER, isApproved: true, approvalStatus: "approved", state: region,
    }).select("name laboratoryName email phone commissionRate unbilledCommissions currentMonthLiability isSuspended");

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, labPartners, "Lab partners fetched")
    );
});

const suspendLabForNonPayment = asyncHandler(async (req, res) => {
    const { labPartnerId } = req.params;
    const { invoiceIds, notes } = req.body;
    const region = getRegion(req);

    const labPartner = await User.findOne({ _id: labPartnerId, userType: USER_TYPES.LAB_PARTNER, state: region });
    if (!labPartner) throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found in your region");

    let suspensionReason = "Suspended for non-payment of platform commissions";
    if (invoiceIds?.length) {
        const overdueInvoices = await PlatformInvoice.find({ _id: { $in: invoiceIds }, labPartnerId, status: { $in: ["payment_due", "overdue"] } });
        const total = overdueInvoices.reduce((sum, inv) => sum + inv.totalCommission, 0);
        suspensionReason = `Suspended for non-payment: ${overdueInvoices.length} overdue invoice(s) totaling ₹${total}`;
    }
    if (notes) suspensionReason += `. ${notes}`;

    labPartner.isSuspended = true;
    labPartner.suspensionReason = suspensionReason;
    labPartner.suspendedAt = new Date();
    await labPartner.save();

    await logManagerActivity(req, "SUSPEND_LAB_NONPAYMENT", "User", labPartnerId, { laboratoryName: labPartner.laboratoryName, suspensionReason });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { labPartnerId: labPartner._id, isSuspended: true, suspensionReason }, "Lab suspended")
    );
});

const unsuspendLab = asyncHandler(async (req, res) => {
    const { labPartnerId } = req.params;
    const region = getRegion(req);

    const labPartner = await User.findOne({ _id: labPartnerId, userType: USER_TYPES.LAB_PARTNER, state: region });
    if (!labPartner) throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found in your region");
    if (!labPartner.isSuspended) throw new ApiError(STATUS_CODES.BAD_REQUEST, "Not currently suspended");

    labPartner.isSuspended = false;
    labPartner.suspensionReason = null;
    labPartner.suspendedAt = null;
    await labPartner.save();

    await logManagerActivity(req, "UNSUSPEND_LAB", "User", labPartnerId, { laboratoryName: labPartner.laboratoryName });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { labPartnerId: labPartner._id, isSuspended: false }, "Lab unsuspended")
    );
});

// ─── Commission Rate Change Request ──────────────────────

const requestCommissionRateChange = asyncHandler(async (req, res) => {
    const { targetUserId, proposedRate, reason } = req.body;
    const region = getRegion(req);

    if (!targetUserId || proposedRate === undefined || !reason) {
        throw new ApiError(STATUS_CODES.BAD_REQUEST, "targetUserId, proposedRate, and reason are required");
    }

    const target = await User.findOne({
        _id: targetUserId,
        userType: { $in: [USER_TYPES.TRAINER, USER_TYPES.LAB_PARTNER] },
        state: region,
    });
    if (!target) throw new ApiError(STATUS_CODES.NOT_FOUND, "Target user not found in your region");

    // Check for existing pending request
    const existing = await CommissionChangeRequest.findOne({ targetUserId, status: "pending" });
    if (existing) throw new ApiError(STATUS_CODES.CONFLICT, "A pending request already exists for this user");

    const request = await CommissionChangeRequest.create({
        requestedBy: req.user._id,
        targetUserId,
        targetUserType: target.userType,
        currentRate: target.commissionRate,
        proposedRate,
        reason,
    });

    await logManagerActivity(req, "REQUEST_COMMISSION_CHANGE", "CommissionChangeRequest", request._id, {
        targetUserId, currentRate: target.commissionRate, proposedRate, reason,
    });

    return res.status(STATUS_CODES.CREATED).json(
        new ApiResponse(STATUS_CODES.CREATED, request, "Commission rate change requested")
    );
});

const getMyCommissionRequests = asyncHandler(async (req, res) => {
    const requests = await CommissionChangeRequest.find({ requestedBy: req.user._id })
        .populate("targetUserId", "name email userType laboratoryName")
        .sort({ createdAt: -1 });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, requests, "Commission requests fetched")
    );
});

// ─── Invoice Management (region-scoped) ───────────────────

/** Get lab partner IDs in manager's region */
const getRegionLabPartnerIds = async (region) => {
    const partners = await User.find({ userType: USER_TYPES.LAB_PARTNER, state: region }).select("_id");
    return partners.map((p) => p._id);
};

const getAllInvoices = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);
    const { status, month, year, labPartnerId } = req.query;

    let query = { labPartnerId: { $in: labPartnerIds } };
    if (status) query.status = status;
    if (month && year) { query["billingPeriod.month"] = parseInt(month); query["billingPeriod.year"] = parseInt(year); }
    if (labPartnerId) query.labPartnerId = labPartnerId;

    const invoices = await PlatformInvoice.find(query).populate("labPartnerId", "name laboratoryName email phone").sort({ generatedDate: -1 });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, invoices, "Invoices fetched")
    );
});

const getInvoiceById = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);

    const invoice = await PlatformInvoice.findOne({ _id: invoiceId, labPartnerId: { $in: labPartnerIds } })
        .populate("labPartnerId", "name laboratoryName email phone laboratoryAddress")
        .populate("bookingIds", "totalAmount commissionAmount paymentReceivedDate fitnessEnthusiastId");

    if (!invoice) throw new ApiError(STATUS_CODES.NOT_FOUND, "Invoice not found in your region");

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, invoice, "Invoice fetched")
    );
});

const generateMonthlyInvoice = asyncHandler(async (req, res) => {
    const { labPartnerId } = req.params;
    const { month, year, dueDay } = req.body;
    const region = getRegion(req);

    if (!month || !year) throw new ApiError(STATUS_CODES.BAD_REQUEST, "Month and year required");

    const labPartner = await User.findOne({ _id: labPartnerId, userType: USER_TYPES.LAB_PARTNER, state: region });
    if (!labPartner) throw new ApiError(STATUS_CODES.NOT_FOUND, "Lab partner not found in your region");

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const unbilledBookings = await LabBooking.find({
        labPartnerId, paymentReceivedByLab: true, commissionStatus: "pending",
        paymentReceivedDate: { $gte: startDate, $lte: endDate },
    }).populate("fitnessEnthusiastId", "name email").populate("selectedTests", "testName");

    if (!unbilledBookings.length) throw new ApiError(STATUS_CODES.BAD_REQUEST, "No unbilled commissions for this period");

    let totalCommission = 0, totalBookingValue = 0;
    const bookingIds = [], commissionBreakdown = [];
    unbilledBookings.forEach((b) => {
        totalCommission += b.commissionAmount;
        totalBookingValue += b.totalAmount;
        bookingIds.push(b._id);
        commissionBreakdown.push({
            bookingId: b._id, fitnessEnthusiastId: b.fitnessEnthusiastId._id, fitnessEnthusiastName: b.fitnessEnthusiastId.name,
            testNames: b.selectedTests.map((t) => t.testName), bookingDate: b.paymentReceivedDate,
            totalAmount: b.totalAmount, commissionAmount: b.commissionAmount, commissionRate: b.commissionRate || labPartner.commissionRate || 10,
        });
    });

    const dueDate = new Date(year, month, dueDay || 5);
    const invoiceNumber = await PlatformInvoice.generateInvoiceNumber(labPartnerId, year, month);

    const invoice = await PlatformInvoice.create({
        labPartnerId, invoiceNumber,
        billingPeriod: { month, year, startDate, endDate, type: "monthly" },
        totalCommission, numberOfBookings: unbilledBookings.length, totalBookingValue,
        commissionRate: labPartner.commissionRate || 10, status: "payment_due", dueDate,
        generatedDate: new Date(), bookingIds, commissionBreakdown,
        generatedBy: req.user?.email || req.adminUser?.email,
    });

    await LabBooking.updateMany({ _id: { $in: bookingIds } }, { $set: { commissionStatus: "billed", billedInvoiceId: invoice._id, "billingPeriod.month": month, "billingPeriod.year": year } });
    labPartner.unbilledCommissions = Math.max(0, labPartner.unbilledCommissions - totalCommission);
    labPartner.currentMonthLiability = 0;
    await labPartner.save();

    await logManagerActivity(req, "GENERATE_INVOICE", "PlatformInvoice", invoice._id, { invoiceNumber, totalCommission, labPartnerId });

    const populated = await PlatformInvoice.findById(invoice._id).populate("labPartnerId", "name laboratoryName email phone laboratoryAddress");

    return res.status(STATUS_CODES.CREATED).json(
        new ApiResponse(STATUS_CODES.CREATED, { invoice: populated, summary: { totalCommission, numberOfBookings: unbilledBookings.length, totalBookingValue, billingPeriod: `${month}/${year}`, dueDate, invoiceNumber } }, "Invoice generated")
    );
});

const markInvoiceAsPaid = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const { paymentMethod, paymentReference, paymentNotes } = req.body;
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);

    const invoice = await PlatformInvoice.findOne({ _id: invoiceId, labPartnerId: { $in: labPartnerIds } });
    if (!invoice) throw new ApiError(STATUS_CODES.NOT_FOUND, "Invoice not found in your region");
    if (invoice.status === "paid") throw new ApiError(STATUS_CODES.BAD_REQUEST, "Already paid");

    invoice.status = "paid";
    invoice.paidDate = new Date();
    invoice.paymentMethod = paymentMethod || null;
    invoice.paymentReference = paymentReference || null;
    invoice.paymentNotes = paymentNotes || null;
    await invoice.save();

    await LabBooking.updateMany({ billedInvoiceId: invoice._id }, { $set: { commissionStatus: "paid" } });

    const labPartner = await User.findById(invoice.labPartnerId);
    let labPartnerRestored = false;
    if (labPartner?.isSuspended) {
        const otherOverdue = await PlatformInvoice.countDocuments({ labPartnerId: invoice.labPartnerId, status: { $in: ["payment_due", "overdue"] }, _id: { $ne: invoice._id } });
        if (otherOverdue === 0) {
            labPartner.isSuspended = false;
            labPartner.suspensionReason = null;
            labPartner.suspendedAt = null;
            await labPartner.save();
            labPartnerRestored = true;
        }
    }

    await logManagerActivity(req, "MARK_INVOICE_PAID", "PlatformInvoice", invoiceId, { invoiceNumber: invoice.invoiceNumber, labPartnerRestored });

    const populated = await PlatformInvoice.findById(invoice._id).populate("labPartnerId", "name laboratoryName email phone isSuspended");
    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { invoice: populated, labPartnerRestored }, "Invoice marked as paid")
    );
});

const enforceOverdueInvoices = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);
    const now = new Date();

    const overdueInvoices = await PlatformInvoice.find({
        dueDate: { $lt: now }, status: { $in: ["payment_due", "overdue"] }, labPartnerId: { $in: labPartnerIds },
    }).populate("labPartnerId", "name laboratoryName email isSuspended");

    if (!overdueInvoices.length) {
        return res.status(STATUS_CODES.SUCCESS).json(new ApiResponse(STATUS_CODES.SUCCESS, { enforcedCount: 0 }, "No overdue invoices"));
    }

    await PlatformInvoice.updateMany({ dueDate: { $lt: now }, status: "payment_due", labPartnerId: { $in: labPartnerIds } }, { $set: { status: "overdue" } });

    const results = { suspended: [], alreadySuspended: [] };
    const labMap = {};
    overdueInvoices.forEach((inv) => {
        const lid = inv.labPartnerId._id.toString();
        if (!labMap[lid]) labMap[lid] = { labPartner: inv.labPartnerId, invoices: [], totalOverdue: 0 };
        labMap[lid].invoices.push(inv);
        labMap[lid].totalOverdue += inv.totalCommission;
    });

    for (const lid in labMap) {
        const { labPartner, invoices, totalOverdue } = labMap[lid];
        if (labPartner.isSuspended) { results.alreadySuspended.push({ labPartnerId: labPartner._id, laboratoryName: labPartner.laboratoryName }); continue; }
        const reason = `Automated suspension: ${invoices.length} overdue invoice(s) totaling ₹${totalOverdue}`;
        const lab = await User.findById(labPartner._id);
        lab.isSuspended = true; lab.suspensionReason = reason; lab.suspendedAt = new Date();
        await lab.save();
        results.suspended.push({ labPartnerId: lab._id, laboratoryName: lab.laboratoryName, totalOverdue });
    }

    await logManagerActivity(req, "ENFORCE_OVERDUE", "PlatformInvoice", null, { suspended: results.suspended.length });

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { enforcedCount: results.suspended.length, results }, "Enforcement complete")
    );
});

const getInvoiceRequests = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartners = await User.find({ userType: USER_TYPES.LAB_PARTNER, isApproved: true, approvalStatus: "approved", state: region, unbilledCommissions: { $gt: 0 } })
        .select("name laboratoryName email phone unbilledCommissions currentMonthLiability");

    const data = [];
    for (const lp of labPartners) {
        const count = await LabBooking.countDocuments({ labPartnerId: lp._id, paymentReceivedByLab: true, commissionStatus: "pending" });
        if (count > 0) data.push({ labPartnerId: lp._id, laboratoryName: lp.laboratoryName, email: lp.email, unbilledCommissions: lp.unbilledCommissions, unbilledBookingsCount: count });
    }

    return res.status(STATUS_CODES.SUCCESS).json(new ApiResponse(STATUS_CODES.SUCCESS, data, "Invoice requests fetched"));
});

const getGracePeriodStatus = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);
    const now = new Date();

    const pending = await PlatformInvoice.find({ status: "payment_due", labPartnerId: { $in: labPartnerIds } }).populate("labPartnerId", "name laboratoryName email");

    const statuses = pending.map((inv) => {
        const daysUntilDue = Math.ceil((new Date(inv.dueDate) - now) / (1000 * 60 * 60 * 24));
        return {
            invoiceId: inv._id, invoiceNumber: inv.invoiceNumber,
            labPartner: { id: inv.labPartnerId._id, name: inv.labPartnerId.laboratoryName, email: inv.labPartnerId.email },
            totalCommission: inv.totalCommission, dueDate: inv.dueDate, daysUntilDue,
            status: daysUntilDue < 0 ? "overdue" : daysUntilDue <= 5 ? "grace_period" : "normal",
        };
    });

    const categorized = {
        overdue: statuses.filter((s) => s.status === "overdue"),
        gracePeriod: statuses.filter((s) => s.status === "grace_period"),
        normal: statuses.filter((s) => s.status === "normal"),
    };

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, { summary: { overdue: categorized.overdue.length, inGracePeriod: categorized.gracePeriod.length, normal: categorized.normal.length }, invoices: categorized }, "Grace period status fetched")
    );
});

// ─── Analytics (region-scoped) ────────────────────────────

const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const regionFilter = { state: region };
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // User stats (region-scoped)
    const [totalUsers, fe, tr, lp, pending, activeUsers, suspendedUsers, newThisMonth, newThisWeek] = await Promise.all([
        User.countDocuments(regionFilter),
        User.countDocuments({ ...regionFilter, userType: USER_TYPES.FITNESS_ENTHUSIAST }),
        User.countDocuments({ ...regionFilter, userType: USER_TYPES.TRAINER }),
        User.countDocuments({ ...regionFilter, userType: USER_TYPES.LAB_PARTNER }),
        User.countDocuments({ ...regionFilter, approvalStatus: "pending" }),
        User.countDocuments({ ...regionFilter, isActive: true, isSuspended: false }),
        User.countDocuments({ ...regionFilter, isSuspended: true }),
        User.countDocuments({ ...regionFilter, createdAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ ...regionFilter, createdAt: { $gte: sevenDaysAgo } }),
    ]);

    // Region lab partner IDs for booking queries
    const labPartnerIds = await getRegionLabPartnerIds(region);
    const trainerIds = (await User.find({ ...regionFilter, userType: USER_TYPES.TRAINER }).select("_id")).map((t) => t._id);

    // Lab booking stats
    const [totalLabBookings, labBookingsThisMonth] = await Promise.all([
        LabBooking.countDocuments({ labPartnerId: { $in: labPartnerIds } }),
        LabBooking.countDocuments({ labPartnerId: { $in: labPartnerIds }, createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Invoice stats
    const [totalInvoices, paidInvoices, overdueInvoices, pendingInvoices] = await Promise.all([
        PlatformInvoice.countDocuments({ labPartnerId: { $in: labPartnerIds } }),
        PlatformInvoice.countDocuments({ labPartnerId: { $in: labPartnerIds }, status: "paid" }),
        PlatformInvoice.countDocuments({ labPartnerId: { $in: labPartnerIds }, status: "overdue" }),
        PlatformInvoice.countDocuments({ labPartnerId: { $in: labPartnerIds }, status: "payment_due" }),
    ]);

    // Class stats
    const [totalClasses, totalClassBookings] = await Promise.all([
        LiveClass.countDocuments({ trainerId: { $in: trainerIds } }),
        ClassBooking.countDocuments({ trainerId: { $in: trainerIds } }),
    ]);

    // Recent registrations
    const recentRegistrations = await User.find(regionFilter).sort({ createdAt: -1 }).limit(10).select("name email userType createdAt isApproved isSuspended");

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, {
            region,
            overview: { totalUsers, activeUsers, suspendedUsers, pendingApprovals: pending, newUsersThisMonth: newThisMonth, newUsersThisWeek: newThisWeek },
            userBreakdown: { fitnessEnthusiasts: fe, trainers: tr, labPartners: lp },
            labs: { totalBookings: totalLabBookings, bookingsThisMonth: labBookingsThisMonth },
            invoices: { total: totalInvoices, paid: paidInvoices, overdue: overdueInvoices, pending: pendingInvoices },
            liveClasses: { total: totalClasses, totalBookings: totalClassBookings },
            recentRegistrations,
        }, "Dashboard analytics fetched")
    );
});

const getMonthlyGrowth = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const now = new Date();
    const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(now.getMonth() - 11); twelveMonthsAgo.setDate(1); twelveMonthsAgo.setHours(0, 0, 0, 0);

    const data = await User.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo }, state: region } },
        {
            $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 },
                fitnessEnthusiasts: { $sum: { $cond: [{ $eq: ["$userType", USER_TYPES.FITNESS_ENTHUSIAST] }, 1, 0] } },
                trainers: { $sum: { $cond: [{ $eq: ["$userType", USER_TYPES.TRAINER] }, 1, 0] } },
                labPartners: { $sum: { $cond: [{ $eq: ["$userType", USER_TYPES.LAB_PARTNER] }, 1, 0] } },
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formatted = data.map((i) => ({ month: `${i._id.year}-${String(i._id.month).padStart(2, "0")}`, total: i.count, fitnessEnthusiasts: i.fitnessEnthusiasts, trainers: i.trainers, labPartners: i.labPartners }));

    return res.status(STATUS_CODES.SUCCESS).json(new ApiResponse(STATUS_CODES.SUCCESS, formatted, "Monthly growth fetched"));
});

const getUserDistribution = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const dist = await User.aggregate([
        { $match: { state: region } },
        { $group: { _id: "$userType", count: { $sum: 1 } } },
    ]);
    const formatted = dist.map((i) => ({ name: i._id.charAt(0).toUpperCase() + i._id.slice(1).replace("-", " "), value: i.count, type: i._id }));
    return res.status(STATUS_CODES.SUCCESS).json(new ApiResponse(STATUS_CODES.SUCCESS, formatted, "Distribution fetched"));
});

const getLabEarningsOverTime = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);
    const { period = "12months" } = req.query;

    let startDate = new Date();
    if (period === "30days") startDate.setDate(startDate.getDate() - 30);
    else if (period === "12months") { startDate.setMonth(startDate.getMonth() - 11); startDate.setDate(1); startDate.setHours(0, 0, 0, 0); }
    else startDate = new Date(0);

    const earnings = await LabBooking.aggregate([
        { $match: { status: { $in: ["completed", "confirmed"] }, paymentReceivedByLab: true, paymentReceivedDate: { $gte: startDate }, labPartnerId: { $in: labPartnerIds } } },
        { $group: { _id: { year: { $year: "$paymentReceivedDate" }, month: { $month: "$paymentReceivedDate" } }, totalEarnings: { $sum: "$totalAmount" }, platformCommission: { $sum: "$commissionAmount" }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formatted = earnings.map((i) => ({ date: `${monthNames[i._id.month - 1]} ${i._id.year}`, totalEarnings: i.totalEarnings, platformCommission: i.platformCommission, bookings: i.count }));

    return res.status(STATUS_CODES.SUCCESS).json(new ApiResponse(STATUS_CODES.SUCCESS, formatted, "Lab earnings over time fetched"));
});

const getTopLabPartners = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);

    const top = await LabBooking.aggregate([
        { $match: { status: { $in: ["completed", "confirmed"] }, paymentReceivedByLab: true, labPartnerId: { $in: labPartnerIds } } },
        { $group: { _id: "$labPartnerId", totalCommission: { $sum: "$commissionAmount" }, totalBookings: { $sum: 1 }, totalRevenue: { $sum: "$totalAmount" } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "partner" } },
        { $unwind: "$partner" },
        { $project: { name: "$partner.laboratoryName", email: "$partner.email", totalCommission: 1, totalBookings: 1, totalRevenue: 1 } },
        { $sort: { totalCommission: -1 } },
        { $limit: 10 },
    ]);

    return res.status(STATUS_CODES.SUCCESS).json(new ApiResponse(STATUS_CODES.SUCCESS, top, "Top lab partners fetched"));
});

const getPlatformRevenue = asyncHandler(async (req, res) => {
    const region = getRegion(req);
    const labPartnerIds = await getRegionLabPartnerIds(region);
    const trainerIds = (await User.find({ state: region, userType: USER_TYPES.TRAINER }).select("_id")).map((t) => t._id);

    const trainerComm = await ClassBooking.aggregate([
        { $match: { bookingStatus: { $in: ["active", "completed"] }, paymentStatus: "completed", trainerId: { $in: trainerIds } } },
        { $group: { _id: null, totalClassBookingValue: { $sum: "$amountPaid" }, totalTrainerCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } }, bookings: { $sum: 1 } } },
    ]);
    const labComm = await LabBooking.aggregate([
        { $match: { paymentReceivedByLab: true, labPartnerId: { $in: labPartnerIds } } },
        { $group: { _id: null, totalLabBookingValue: { $sum: "$totalAmount" }, totalLabCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } }, bookings: { $sum: 1 } } },
    ]);

    const tc = trainerComm[0] || { totalClassBookingValue: 0, totalTrainerCommission: 0, bookings: 0 };
    const lc = labComm[0] || { totalLabBookingValue: 0, totalLabCommission: 0, bookings: 0 };

    return res.status(STATUS_CODES.SUCCESS).json(
        new ApiResponse(STATUS_CODES.SUCCESS, {
            region,
            summary: { totalPlatformRevenue: tc.totalTrainerCommission + lc.totalLabCommission, trainerCommissionTotal: tc.totalTrainerCommission, labCommissionTotal: lc.totalLabCommission },
        }, "Platform revenue fetched")
    );
});

export {
    managerLogin,
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
};
