import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
  {
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Trainer ID is required"],
    },
    title: {
      type: String,
      required: [true, "Class title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    classType: {
      type: String,
      required: [true, "Class type is required"],
      enum: {
        values: [
          "cycling",
          "strength",
          "running",
          "yoga",
          "meditation",
          "rowing",
          "outdoor",
          "stretching",
          "other"
        ],
        message: "Invalid class type"
      },
    },
    otherClassType: {
      type: String,
      required: function() {
        return this.classType === "other";
      },
      trim: true,
      maxlength: [50, "Other class type cannot exceed 50 characters"],
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    scheduledTime: {
      type: String,
      required: [true, "Scheduled time is required"],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"]
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Duration must be at least 15 minutes"],
      max: [180, "Duration cannot exceed 3 hours"],
      default: 60, // in minutes
    },
    cost: {
      type: Number,
      required: [true, "Cost is required"],
      min: [0, "Cost cannot be negative"],
      max: [10000, "Cost cannot exceed ₹10,000"],
    },
    maxParticipants: {
      type: Number,
      default: 50,
      min: [1, "Must allow at least 1 participant"],
      max: [200, "Cannot exceed 200 participants"],
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: [0, "Cannot be negative"],
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For tracking earnings
    totalEarnings: {
      type: Number,
      default: 0,
      min: [0, "Earnings cannot be negative"],
    },
    // Additional class info
    requirements: {
      type: String,
      maxlength: [300, "Requirements cannot exceed 300 characters"],
    },
    equipment: {
      type: String,
      maxlength: [200, "Equipment list cannot exceed 200 characters"],
    },
    difficultyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
liveClassSchema.index({ trainerId: 1, scheduledDate: 1 });
liveClassSchema.index({ classType: 1, status: 1 });
liveClassSchema.index({ scheduledDate: 1, status: 1 });

// Virtual to get full scheduled datetime
liveClassSchema.virtual('scheduledDateTime').get(function() {
  if (this.scheduledDate && this.scheduledTime) {
    const [hours, minutes] = this.scheduledTime.split(':');
    const datetime = new Date(this.scheduledDate);
    datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return datetime;
  }
  return null;
});

// Method to check if class is full
liveClassSchema.methods.isFull = function() {
  return this.currentParticipants >= this.maxParticipants;
};

// Method to check if class can be joined
liveClassSchema.methods.canJoin = function() {
  const now = new Date();
  const classDateTime = this.scheduledDateTime;
  
  return (
    this.status === "scheduled" &&
    this.isActive &&
    !this.isFull() &&
    classDateTime > now
  );
};

// Method to check if class has started
liveClassSchema.methods.hasStarted = function() {
  const now = new Date();
  const classDateTime = this.scheduledDateTime;
  
  return classDateTime <= now;
};

// Method to check if class is completed
liveClassSchema.methods.isCompleted = function() {
  const now = new Date();
  const classDateTime = this.scheduledDateTime;
  const endTime = new Date(classDateTime.getTime() + (this.duration * 60000));
  
  return now >= endTime || this.status === "completed";
};

// Pre-save middleware to validate and update status based on time
liveClassSchema.pre('save', function(next) {
  // Validate that scheduled datetime is in the future (only for new documents or when date/time changes)
  if (this.isNew || this.isModified('scheduledDate') || this.isModified('scheduledTime')) {
    const scheduledDateTime = this.scheduledDateTime;
    const now = new Date();
    
    if (scheduledDateTime && scheduledDateTime <= now) {
      return next(new Error('Scheduled date and time must be in the future'));
    }
  }
  
  if (this.hasStarted() && this.status === 'scheduled') {
    this.status = 'ongoing';
  } else if (this.isCompleted() && this.status === 'ongoing') {
    this.status = 'completed';
  }
  next();
});

// Static method to update class statuses
liveClassSchema.statics.updateClassStatuses = async function() {
  const now = new Date();
  
  // Update scheduled classes to ongoing if they've started
  await this.updateMany(
    {
      status: 'scheduled',
      $expr: {
        $lte: [
          {
            $dateFromParts: {
              year: { $year: '$scheduledDate' },
              month: { $month: '$scheduledDate' },
              day: { $dayOfMonth: '$scheduledDate' },
              hour: { $toInt: { $substr: ['$scheduledTime', 0, 2] } },
              minute: { $toInt: { $substr: ['$scheduledTime', 3, 2] } }
            }
          },
          now
        ]
      }
    },
    { status: 'ongoing' }
  );

  // Update ongoing classes to completed if they've ended
  await this.updateMany(
    {
      status: 'ongoing',
      $expr: {
        $lte: [
          {
            $add: [
              {
                $dateFromParts: {
                  year: { $year: '$scheduledDate' },
                  month: { $month: '$scheduledDate' },
                  day: { $dayOfMonth: '$scheduledDate' },
                  hour: { $toInt: { $substr: ['$scheduledTime', 0, 2] } },
                  minute: { $toInt: { $substr: ['$scheduledTime', 3, 2] } }
                }
              },
              { $multiply: ['$duration', 60000] }
            ]
          },
          now
        ]
      }
    },
    { status: 'completed' }
  );
};

export const LiveClass = mongoose.model("LiveClass", liveClassSchema);