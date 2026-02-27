import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { USER_TYPES } from "../constants.js";
import { LiveClass } from "../models/liveClass.model.js";
import { ClassBooking } from "../models/classBooking.model.js";
import { Blog } from "../models/blog.model.js";
import mongoose from "mongoose";

/**
 * @desc    Get all approved trainers
 * @route   GET /api/trainers
 * @access  Public
 */
export const getAllApprovedTrainers = asyncHandler(async (req, res) => {
  // Find all trainers who are approved and active
  const trainers = await User.find({
    userType: USER_TYPES.TRAINER,
    isApproved: true,
    isActive: true,
    approvalStatus: "approved",
  }).select("-password -refreshToken -__v");

  // If no trainers found
  if (!trainers || trainers.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "No approved trainers found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, trainers, "Approved trainers retrieved successfully")
  );
});

/**
 * @desc    Get single trainer by ID
 * @route   GET /api/trainers/:id
 * @access  Public
 */
export const getTrainerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trainer = await User.findOne({
    _id: id,
    userType: USER_TYPES.TRAINER,
    isApproved: true,
    isActive: true,
    approvalStatus: "approved",
  }).select("-password -refreshToken -__v");

  if (!trainer) {
    throw new ApiError(404, "Trainer not found or not approved");
  }

  return res.status(200).json(
    new ApiResponse(200, trainer, "Trainer retrieved successfully")
  );
});

/**
 * @desc    Get trainer dashboard stats
 * @route   GET /api/trainers/dashboard/stats
 * @access  Private (Trainer only)
 */
export const getTrainerDashboardStats = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can access this endpoint");
  }

  const trainerId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total clients (unique users who booked classes)
  const totalClients = await ClassBooking.distinct("userId", {
    trainerId: trainerId,
    bookingStatus: { $in: ["active", "completed"] },
  });

  // Get active bookings count (upcoming classes)
  const activeBookings = await ClassBooking.countDocuments({
    trainerId: trainerId,
    bookingStatus: "active",
  });

  // Get total classes
  const totalClasses = await LiveClass.countDocuments({
    trainerId: trainerId,
    isActive: true,
  });

  // Get upcoming classes
  const upcomingClasses = await LiveClass.countDocuments({
    trainerId: trainerId,
    status: "scheduled",
    isActive: true,
  });

  // Get completed classes
  const completedClasses = await LiveClass.countDocuments({
    trainerId: trainerId,
    status: "completed",
    isActive: true,
  });

  // Get total blogs
  const totalBlogs = await Blog.countDocuments({
    author: trainerId,
  });

  // Get monthly earnings
  const monthlyEarnings = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        bookingStatus: { $in: ["active", "completed"] },
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amountPaid" },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get trainer info
  const trainer = await User.findById(trainerId).select("totalEarnings monthlyEarnings");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalClients: totalClients.length,
        activeBookings,
        totalClasses,
        upcomingClasses,
        completedClasses,
        totalBlogs,
        totalEarnings: trainer.totalEarnings || 0,
        monthlyEarnings: monthlyEarnings.length > 0 ? monthlyEarnings[0].total : 0,
        monthlyBookings: monthlyEarnings.length > 0 ? monthlyEarnings[0].count : 0,
      },
      "Dashboard stats retrieved successfully"
    )
  );
});

/**
 * @desc    Get trainer's clients
 * @route   GET /api/trainers/dashboard/clients
 * @access  Private (Trainer only)
 */
export const getTrainerClients = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can access this endpoint");
  }

  const trainerId = req.user._id;

  // Get all unique clients with their booking info
  const clients = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        bookingStatus: { $in: ["active", "completed"] },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: "$amountPaid" },
        lastBooking: { $max: "$createdAt" },
        firstBooking: { $min: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $project: {
        _id: 1,
        name: "$userInfo.name",
        email: "$userInfo.email",
        phone: "$userInfo.phone",
        fitnessGoal: "$userInfo.fitnessGoal",
        totalBookings: 1,
        totalSpent: 1,
        lastBooking: 1,
        firstBooking: 1,
      },
    },
    {
      $sort: { lastBooking: -1 },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, clients, "Clients retrieved successfully")
  );
});

/**
 * @desc    Get trainer's schedule
 * @route   GET /api/trainers/dashboard/schedule
 * @access  Private (Trainer only)
 */
export const getTrainerSchedule = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can access this endpoint");
  }

  const trainerId = req.user._id;
  const { startDate, endDate } = req.query;

  // Update class statuses
  await LiveClass.updateClassStatuses();

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      scheduledDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  } else {
    // Default to next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    dateFilter = {
      scheduledDate: {
        $gte: now,
        $lte: thirtyDaysLater,
      },
    };
  }

  const schedule = await LiveClass.find({
    trainerId: trainerId,
    isActive: true,
    status: { $in: ["scheduled", "ongoing"] },
    ...dateFilter,
  }).sort({ scheduledDate: 1, scheduledTime: 1 });

  // Get booking counts for each class
  const scheduleWithBookings = await Promise.all(
    schedule.map(async (classItem) => {
      const bookingCount = await ClassBooking.countDocuments({
        classId: classItem._id,
        bookingStatus: "active",
      });

      const bookings = await ClassBooking.find({
        classId: classItem._id,
        bookingStatus: "active",
      })
        .populate("userId", "name email phone")
        .select("userId amountPaid createdAt");

      return {
        ...classItem.toObject(),
        currentParticipants: bookingCount,
        participants: bookings.map((b) => ({
          _id: b.userId._id,
          name: b.userId.name,
          email: b.userId.email,
          phone: b.userId.phone,
          bookedAt: b.createdAt,
        })),
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, scheduleWithBookings, "Schedule retrieved successfully")
  );
});

/**
 * @desc    Get trainer's earnings breakdown
 * @route   GET /api/trainers/dashboard/earnings
 * @access  Private (Trainer only)
 */
export const getTrainerEarnings = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can access this endpoint");
  }

  const trainerId = req.user._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get trainer info including commission rate
  const trainer = await User.findById(trainerId).select("totalEarnings monthlyEarnings lastEarningsUpdate commissionRate");

  // Get monthly earnings breakdown with commission details
  const monthlyEarnings = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        bookingStatus: { $in: ["active", "completed"] },
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalBookingValue: { $sum: "$amountPaid" },
        totalCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } },
        totalPayout: { $sum: { $ifNull: ["$trainerPayout", "$amountPaid"] } },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get all-time commission summary
  const allTimeSummary = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        bookingStatus: { $in: ["active", "completed"] },
      },
    },
    {
      $group: {
        _id: null,
        totalBookingValue: { $sum: "$amountPaid" },
        totalCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } },
        totalPayout: { $sum: { $ifNull: ["$trainerPayout", "$amountPaid"] } },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get earnings by date (last 30 days) with commission breakdown
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const earningsByDate = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        bookingStatus: { $in: ["active", "completed"] },
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        dailyEarnings: { $sum: { $ifNull: ["$trainerPayout", "$amountPaid"] } },
        dailyBookingValue: { $sum: "$amountPaid" },
        dailyCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } },
        bookings: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get earnings by class with commission breakdown
  const earningsByClass = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        bookingStatus: { $in: ["active", "completed"] },
      },
    },
    {
      $group: {
        _id: "$classId",
        totalEarnings: { $sum: { $ifNull: ["$trainerPayout", "$amountPaid"] } },
        totalBookingValue: { $sum: "$amountPaid" },
        totalCommission: { $sum: { $ifNull: ["$commissionAmount", 0] } },
        bookings: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "liveclasses",
        localField: "_id",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    {
      $unwind: "$classInfo",
    },
    {
      $project: {
        classTitle: "$classInfo.title",
        classType: "$classInfo.classType",
        totalEarnings: 1,
        totalBookingValue: 1,
        totalCommission: 1,
        bookings: 1,
      },
    },
    {
      $sort: { totalEarnings: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Get recent transactions with commission data
  const recentTransactions = await ClassBooking.find({
    trainerId: trainerId,
    bookingStatus: { $in: ["active", "completed"] },
  })
    .populate("userId", "name email")
    .populate("classId", "title classType")
    .sort({ createdAt: -1 })
    .limit(10)
    .select("userId classId amountPaid commissionRate commissionAmount trainerPayout createdAt bookingStatus");

  const monthlyData = monthlyEarnings.length > 0 ? monthlyEarnings[0] : {};
  const allTimeData = allTimeSummary.length > 0 ? allTimeSummary[0] : {};

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalEarnings: trainer.totalEarnings || 0,
        commissionRate: trainer.commissionRate || 15,
        monthlyEarnings: monthlyData.totalPayout || 0,
        monthlyBookingValue: monthlyData.totalBookingValue || 0,
        monthlyCommission: monthlyData.totalCommission || 0,
        monthlyBookings: monthlyData.count || 0,
        allTime: {
          totalBookingValue: allTimeData.totalBookingValue || 0,
          totalCommission: allTimeData.totalCommission || 0,
          totalPayout: allTimeData.totalPayout || 0,
          totalBookings: allTimeData.count || 0,
        },
        lastUpdate: trainer.lastEarningsUpdate,
        earningsByDate,
        earningsByClass,
        recentTransactions,
      },
      "Earnings data retrieved successfully"
    )
  );
});

// @desc    Update trainer profile
// @route   PUT /api/trainers/profile
// @access  Private (Trainer only)
export const updateTrainerProfile = asyncHandler(async (req, res) => {
  const trainerId = req.user._id;

  // Fields that can be updated
  const { name, phone, specialization } = req.body;

  const trainer = await User.findById(trainerId);

  if (!trainer || trainer.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(404, "Trainer not found");
  }

  // Update fields if provided
  if (name) trainer.name = name;
  if (phone) {
    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(400, "Phone number must be 10 digits");
    }
    trainer.phone = phone;
  }
  if (specialization) trainer.specialization = specialization;

  await trainer.save();

  // Update localStorage user data
  const updatedUser = {
    _id: trainer._id,
    name: trainer.name,
    email: trainer.email,
    phone: trainer.phone,
    age: trainer.age,
    userType: trainer.userType,
    specialization: trainer.specialization,
    isApproved: trainer.isApproved,
    approvalStatus: trainer.approvalStatus,
    createdAt: trainer.createdAt,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "Profile updated successfully"
      )
    );
});
