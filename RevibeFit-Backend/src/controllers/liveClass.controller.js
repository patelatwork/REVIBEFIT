import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { LiveClass } from "../models/liveClass.model.js";
import { ClassBooking } from "../models/classBooking.model.js";
import { User } from "../models/user.model.js";
import { USER_TYPES } from "../constants.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new live class
 * @route   POST /api/classes
 * @access  Private (Trainer only)
 */
export const createLiveClass = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    classType,
    otherClassType,
    scheduledDate,
    scheduledTime,
    duration,
    cost,
    maxParticipants,
    requirements,
    equipment,
    difficultyLevel,
  } = req.body;

  // Verify user is a trainer
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can create live classes");
  }

  // Validate scheduled date and time
  const classDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
  const now = new Date();

  if (classDateTime <= now) {
    throw new ApiError(400, "Class must be scheduled for a future date and time");
  }

  // Check for conflicting classes for the same trainer
  const conflictingClass = await LiveClass.findOne({
    trainerId: req.user._id,
    scheduledDate: new Date(scheduledDate),
    scheduledTime: scheduledTime,
    status: { $in: ["scheduled", "ongoing"] },
    isActive: true,
  });

  if (conflictingClass) {
    throw new ApiError(409, "You already have a class scheduled at this time");
  }

  const liveClass = await LiveClass.create({
    trainerId: req.user._id,
    title,
    description,
    classType,
    otherClassType,
    scheduledDate,
    scheduledTime,
    duration,
    cost,
    maxParticipants,
    requirements,
    equipment,
    difficultyLevel,
  });

  const populatedClass = await LiveClass.findById(liveClass._id).populate(
    "trainerId",
    "name email specialization"
  );

  return res.status(201).json(
    new ApiResponse(201, populatedClass, "Live class created successfully")
  );
});

/**
 * @desc    Get all live classes
 * @route   GET /api/classes
 * @access  Public
 */
export const getAllLiveClasses = asyncHandler(async (req, res) => {
  const { status, classType, trainerId, upcoming, page = 1, limit = 10 } = req.query;

  // Update class statuses before fetching
  await LiveClass.updateClassStatuses();

  const query = { isActive: true };

  if (status) {
    query.status = status;
  }

  if (classType && classType !== "all") {
    query.classType = classType;
  }

  if (trainerId) {
    query.trainerId = trainerId;
  }

  if (upcoming === "true") {
    query.status = { $in: ["scheduled", "ongoing"] };
    // Don't filter by date here - let updateClassStatuses handle status updates
    // This ensures classes scheduled for today are included
  }

  const skip = (page - 1) * limit;

  const classes = await LiveClass.find(query)
    .populate("trainerId", "name email specialization")
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await LiveClass.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        classes,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
      "Live classes retrieved successfully"
    )
  );
});

/**
 * @desc    Get trainer's live classes
 * @route   GET /api/classes/trainer/my-classes
 * @access  Private (Trainer only)
 */
export const getTrainerClasses = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can access this endpoint");
  }

  await LiveClass.updateClassStatuses();

  const classes = await LiveClass.find({
    trainerId: req.user._id,
    isActive: true,
  })
    .populate("trainerId", "name email specialization")
    .sort({ scheduledDate: 1, scheduledTime: 1 });

  // Get booking counts for each class
  const classesWithBookings = await Promise.all(
    classes.map(async (classItem) => {
      const bookingCount = await ClassBooking.countDocuments({
        classId: classItem._id,
        bookingStatus: "active",
      });
      
      return {
        ...classItem.toObject(),
        currentParticipants: bookingCount,
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(200, classesWithBookings, "Trainer classes retrieved successfully")
  );
});

/**
 * @desc    Update live class
 * @route   PUT /api/classes/:id
 * @access  Private (Trainer - own classes only)
 */
export const updateLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  // Check if user is the trainer who created this class
  if (liveClass.trainerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own classes");
  }

  // Prevent updates to ongoing or completed classes
  if (liveClass.status === "ongoing" || liveClass.status === "completed") {
    throw new ApiError(400, "Cannot update ongoing or completed classes");
  }

  // Check if there are existing bookings and prevent major changes
  const bookingCount = await ClassBooking.countDocuments({
    classId: id,
    bookingStatus: "active",
  });

  if (bookingCount > 0) {
    // Only allow minor updates if there are bookings
    const allowedUpdates = ["description", "requirements", "equipment"];
    const requestedUpdates = Object.keys(req.body);
    const hasRestrictedUpdate = requestedUpdates.some(
      (update) => !allowedUpdates.includes(update)
    );

    if (hasRestrictedUpdate) {
      throw new ApiError(
        400,
        "Cannot make major changes to class with existing bookings. Only description, requirements, and equipment can be updated."
      );
    }
  }

  // Validate scheduled date and time if being updated
  if (req.body.scheduledDate || req.body.scheduledTime) {
    const newDate = req.body.scheduledDate || liveClass.scheduledDate;
    const newTime = req.body.scheduledTime || liveClass.scheduledTime;
    const classDateTime = new Date(`${newDate}T${newTime}:00`);

    if (classDateTime <= new Date()) {
      throw new ApiError(400, "Class must be scheduled for a future date and time");
    }
  }

  const updatedClass = await LiveClass.findByIdAndUpdate(
    id,
    { ...req.body },
    { new: true, runValidators: true }
  ).populate("trainerId", "name email specialization");

  return res.status(200).json(
    new ApiResponse(200, updatedClass, "Live class updated successfully")
  );
});

/**
 * @desc    Delete/Cancel live class
 * @route   DELETE /api/classes/:id
 * @access  Private (Trainer - own classes only)
 */
export const deleteLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const liveClass = await LiveClass.findById(id);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  // Check if user is the trainer who created this class
  if (liveClass.trainerId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own classes");
  }

  // Prevent deletion of ongoing or completed classes
  if (liveClass.status === "ongoing" || liveClass.status === "completed") {
    throw new ApiError(400, "Cannot delete ongoing or completed classes");
  }

  // Check for existing bookings
  const activeBookings = await ClassBooking.find({
    classId: id,
    bookingStatus: "active",
  });

  if (activeBookings.length > 0) {
    // Cancel all bookings and process refunds
    try {
      // Calculate total refund amount
      const totalRefund = activeBookings.reduce((sum, booking) => sum + booking.amountPaid, 0);

      // Update all active bookings to cancelled
      for (const booking of activeBookings) {
        await ClassBooking.findByIdAndUpdate(booking._id, {
          bookingStatus: "cancelled",
          cancellationReason: "Class cancelled by trainer",
          cancelledAt: new Date(),
          refundAmount: booking.amountPaid,
          paymentStatus: "refunded",
          refundedAt: new Date(),
        });
      }

      // Update trainer earnings
      await User.findByIdAndUpdate(
        liveClass.trainerId,
        { 
          $inc: { 
            totalEarnings: -totalRefund,
            monthlyEarnings: -totalRefund 
          } 
        }
      );

      // Mark class as cancelled
      await LiveClass.findByIdAndUpdate(
        id,
        { 
          status: "cancelled",
          isActive: false 
        }
      );

      return res.status(200).json(
        new ApiResponse(
          200, 
          null, 
          `Class cancelled successfully. ${activeBookings.length} participants have been refunded.`
        )
      );
    } catch (error) {
      console.error("Error cancelling class:", error);
      throw new ApiError(500, "Failed to cancel class and process refunds");
    }
  } else {
    // No bookings, safe to delete
    await LiveClass.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json(
      new ApiResponse(200, null, "Live class deleted successfully")
    );
  }
});

/**
 * @desc    Join a live class
 * @route   POST /api/classes/:id/join
 * @access  Private (Fitness Enthusiast only)
 */
export const joinLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify user is a fitness enthusiast
  if (req.user.userType !== USER_TYPES.FITNESS_ENTHUSIAST) {
    throw new ApiError(403, "Only fitness enthusiasts can join live classes");
  }

  const liveClass = await LiveClass.findById(id).populate(
    "trainerId",
    "name email specialization"
  );

  if (!liveClass || !liveClass.isActive) {
    throw new ApiError(404, "Live class not found");
  }

  // Check if class can be joined
  if (!liveClass.canJoin()) {
    const now = new Date();
    const scheduledDateTime = liveClass.scheduledDateTime;
    let reason = "This class cannot be joined";
    
    if (liveClass.status !== "scheduled") {
      reason = `Class is ${liveClass.status}`;
    } else if (!liveClass.isActive) {
      reason = "Class is inactive";
    } else if (liveClass.isFull()) {
      reason = "Class is full";
    } else if (scheduledDateTime && scheduledDateTime <= now) {
      reason = "Class has already started or ended";
    }
    
    throw new ApiError(400, reason);
  }

  // Check if user already booked this class
  const existingBooking = await ClassBooking.findOne({
    userId: req.user._id,
    classId: id,
  });

  if (existingBooking && existingBooking.bookingStatus === "active") {
    throw new ApiError(409, "You have already joined this class");
  }

  try {
    // Create booking
    const booking = await ClassBooking.create({
      userId: req.user._id,
      classId: id,
      trainerId: liveClass.trainerId._id,
      amountPaid: liveClass.cost,
      paymentStatus: "completed",
      bookingStatus: "active",
    });

    // Update class participant count and earnings
    await LiveClass.findByIdAndUpdate(
      id,
      { 
        $inc: { currentParticipants: 1, totalEarnings: liveClass.cost }
      }
    );

    // Update trainer earnings
    await User.findByIdAndUpdate(
      liveClass.trainerId._id,
      { 
        $inc: { 
          totalEarnings: liveClass.cost,
          monthlyEarnings: liveClass.cost 
        },
        lastEarningsUpdate: new Date()
      }
    );

    const populatedBooking = await ClassBooking.findById(booking._id)
      .populate("classId")
      .populate("trainerId", "name email specialization");

    return res.status(201).json(
      new ApiResponse(201, populatedBooking, "Successfully joined the live class")
    );

  } catch (error) {
    console.error("Join class error:", error);
    
    // If booking was created but updates failed, try to rollback
    if (error.name !== 'ValidationError') {
      await ClassBooking.findOneAndDelete({
        userId: req.user._id,
        classId: id,
        createdAt: { $gte: new Date(Date.now() - 5000) } // Within last 5 seconds
      }).catch(err => console.error("Rollback error:", err));
    }
    
    throw new ApiError(500, error.message || "Failed to join class. Please try again.");
  }
});

/**
 * @desc    Get user's booked classes
 * @route   GET /api/classes/my-bookings
 * @access  Private (Fitness Enthusiast only)
 */
export const getUserBookings = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.FITNESS_ENTHUSIAST) {
    throw new ApiError(403, "Only fitness enthusiasts can access this endpoint");
  }

  const { status = "all" } = req.query;

  await LiveClass.updateClassStatuses();

  let query = { userId: req.user._id, isActive: true };
  
  if (status !== "all") {
    if (status === "upcoming") {
      query.bookingStatus = "active";
    } else if (status === "completed") {
      query.bookingStatus = { $in: ["completed", "attended"] };
    } else {
      query.bookingStatus = status;
    }
  }

  const bookings = await ClassBooking.find(query)
    .populate({
      path: "classId",
      select: "title description classType scheduledDate scheduledTime duration status cost difficultyLevel category maxParticipants currentParticipants"
    })
    .populate("trainerId", "name email specialization")
    .sort({ createdAt: -1 });

  // Separate upcoming and completed bookings
  const upcomingBookings = bookings.filter(
    booking => booking.classId && ["scheduled", "ongoing"].includes(booking.classId.status)
  );

  const completedBookings = bookings.filter(
    booking => booking.classId && booking.classId.status === "completed"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        upcoming: upcomingBookings,
        completed: completedBookings,
        all: bookings
      },
      "User bookings retrieved successfully"
    )
  );
});

/**
 * @desc    Cancel class booking
 * @route   DELETE /api/classes/bookings/:bookingId
 * @access  Private (Fitness Enthusiast only)
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await ClassBooking.findById(bookingId).populate("classDetails");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Check if user owns this booking
  if (booking.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only cancel your own bookings");
  }

  if (!booking.canBeCancelled()) {
    throw new ApiError(400, "This booking cannot be cancelled");
  }

  // Calculate refund amount
  const classDateTime = booking.classDetails.scheduledDateTime;
  const refundAmount = booking.calculateRefundAmount(classDateTime);

  try {
    // Update booking
    await ClassBooking.findByIdAndUpdate(
      bookingId,
      {
        bookingStatus: "cancelled",
        cancellationReason: "Cancelled by user",
        cancelledAt: new Date(),
        refundAmount: refundAmount,
        paymentStatus: refundAmount > 0 ? "refunded" : "completed",
        refundedAt: refundAmount > 0 ? new Date() : undefined,
      }
    );

    // Update class participant count and earnings
    await LiveClass.findByIdAndUpdate(
      booking.classId,
      { 
        $inc: { 
          currentParticipants: -1,
          totalEarnings: -refundAmount 
        }
      }
    );

    // Update trainer earnings
    await User.findByIdAndUpdate(
      booking.trainerId,
      { 
        $inc: { 
          totalEarnings: -refundAmount,
          monthlyEarnings: -refundAmount 
        }
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        { refundAmount },
        `Booking cancelled successfully. Refund amount: ₹${refundAmount}`
      )
    );

  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw new ApiError(500, "Failed to cancel booking. Please try again.");
  }
});

/**
 * @desc    Get single live class details
 * @route   GET /api/classes/:id
 * @access  Public
 */
export const getLiveClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const liveClass = await LiveClass.findOne({
    _id: id,
    isActive: true,
  }).populate("trainerId", "name email specialization");

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  // Get current participant count
  const currentParticipants = await ClassBooking.countDocuments({
    classId: id,
    bookingStatus: "active",
  });

  const classWithParticipants = {
    ...liveClass.toObject(),
    currentParticipants,
  };

  return res.status(200).json(
    new ApiResponse(200, classWithParticipants, "Live class retrieved successfully")
  );
});

/**
 * @desc    Get trainer earnings summary
 * @route   GET /api/classes/trainer/earnings
 * @access  Private (Trainer only)
 */
export const getTrainerEarnings = asyncHandler(async (req, res) => {
  if (req.user.userType !== USER_TYPES.TRAINER) {
    throw new ApiError(403, "Only trainers can access earnings data");
  }

  const trainer = await User.findById(req.user._id).select("totalEarnings monthlyEarnings");

  // Get detailed earnings breakdown
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyBookings = await ClassBooking.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(req.user._id),
        bookingStatus: { $in: ["active", "completed"] },
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$amountPaid" },
        totalBookings: { $sum: 1 }
      }
    }
  ]);

  const totalClasses = await LiveClass.countDocuments({
    trainerId: req.user._id,
    isActive: true
  });

  const activeClasses = await LiveClass.countDocuments({
    trainerId: req.user._id,
    status: "scheduled",
    isActive: true
  });

  return res.status(200).json(
    new ApiResponse(200, {
      totalEarnings: trainer.totalEarnings,
      monthlyEarnings: monthlyBookings.length > 0 ? monthlyBookings[0].totalEarnings : 0,
      monthlyBookings: monthlyBookings.length > 0 ? monthlyBookings[0].totalBookings : 0,
      totalClasses,
      activeClasses
    }, "Trainer earnings retrieved successfully")
  );
});