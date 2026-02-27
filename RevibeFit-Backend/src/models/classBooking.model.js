import mongoose from "mongoose";

const classBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: [true, "Class ID is required"],
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Trainer ID is required"],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed", // Assuming immediate payment for simplicity
    },
    bookingStatus: {
      type: String,
      enum: ["active", "cancelled", "completed", "no-show"],
      default: "active",
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    attendanceStatus: {
      type: String,
      enum: ["registered", "attended", "missed"],
      default: "registered",
    },
    // Rating and feedback after class completion
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    feedback: {
      type: String,
      maxlength: [500, "Feedback cannot exceed 500 characters"],
    },
    // For tracking refunds
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, "Refund amount cannot be negative"],
    },
    refundReason: {
      type: String,
      maxlength: [200, "Refund reason cannot exceed 200 characters"],
    },
    refundedAt: {
      type: Date,
    },
    // Additional metadata
    cancellationReason: {
      type: String,
      maxlength: [200, "Cancellation reason cannot exceed 200 characters"],
    },
    cancelledAt: {
      type: Date,
    },
    // Commission tracking
    commissionRate: {
      type: Number,
      default: 15,
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: [0, "Commission amount cannot be negative"],
    },
    trainerPayout: {
      type: Number,
      default: 0,
      min: [0, "Trainer payout cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one booking per user per class
classBookingSchema.index({ userId: 1, classId: 1 }, { unique: true });
classBookingSchema.index({ trainerId: 1, bookingDate: 1 });
classBookingSchema.index({ userId: 1, bookingStatus: 1 });
classBookingSchema.index({ classId: 1, bookingStatus: 1 });

// Virtual to populate class and trainer details
classBookingSchema.virtual('classDetails', {
  ref: 'LiveClass',
  localField: 'classId',
  foreignField: '_id',
  justOne: true
});

classBookingSchema.virtual('trainerDetails', {
  ref: 'User',
  localField: 'trainerId', 
  foreignField: '_id',
  justOne: true
});

classBookingSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id', 
  justOne: true
});

// Method to check if booking can be cancelled
classBookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const booking = this;
  
  // Can't cancel if already cancelled, completed, or no-show
  if (['cancelled', 'completed', 'no-show'].includes(booking.bookingStatus)) {
    return false;
  }
  
  // Can't cancel if payment failed
  if (booking.paymentStatus === 'failed') {
    return false;
  }
  
  return true;
};

// Method to calculate refund amount based on cancellation timing
classBookingSchema.methods.calculateRefundAmount = function(classDateTime) {
  const now = new Date();
  const hoursUntilClass = (classDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilClass >= 24) {
    return this.amountPaid; // Full refund if cancelled 24+ hours before
  } else if (hoursUntilClass >= 2) {
    return this.amountPaid * 0.5; // 50% refund if cancelled 2-24 hours before
  } else {
    return 0; // No refund if cancelled less than 2 hours before
  }
};

// Static method to get user's active bookings
classBookingSchema.statics.getActiveBookings = function(userId) {
  return this.find({
    userId: userId,
    bookingStatus: 'active',
    isActive: true
  }).populate('classDetails trainerDetails');
};

// Static method to get completed bookings (class history)
classBookingSchema.statics.getCompletedBookings = function(userId) {
  return this.find({
    userId: userId,
    bookingStatus: { $in: ['completed', 'attended'] },
    isActive: true
  }).populate('classDetails trainerDetails').sort({ createdAt: -1 });
};

// Static method to get trainer's bookings
classBookingSchema.statics.getTrainerBookings = function(trainerId, status = null) {
  const query = {
    trainerId: trainerId,
    isActive: true
  };
  
  if (status) {
    query.bookingStatus = status;
  }
  
  return this.find(query).populate('classDetails userDetails');
};

// Pre-save middleware
classBookingSchema.pre('save', function(next) {
  // Set attendance status based on booking status
  if (this.bookingStatus === 'completed' && this.attendanceStatus === 'registered') {
    this.attendanceStatus = 'attended';
  } else if (this.bookingStatus === 'no-show') {
    this.attendanceStatus = 'missed';
  }
  
  next();
});

export const ClassBooking = mongoose.model("ClassBooking", classBookingSchema);