import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { USER_TYPES } from "../constants.js";
import config from "../config/index.js";

const userSchema = new mongoose.Schema(
  {
    // Common fields for all user types
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [13, "Age must be at least 13"],
      max: [100, "Age must be less than 100"],
    },
    userType: {
      type: String,
      required: [true, "User type is required"],
      enum: Object.values(USER_TYPES),
    },

    // Fitness Enthusiast specific fields
    fitnessGoal: {
      type: String,
      required: function () {
        return this.userType === USER_TYPES.FITNESS_ENTHUSIAST;
      },
    },

    // Trainer specific fields
    specialization: {
      type: String,
      required: function () {
        return this.userType === USER_TYPES.TRAINER;
      },
    },
    certifications: {
      type: String, // Will store file path
      required: function () {
        return this.userType === USER_TYPES.TRAINER;
      },
    },
    // Trainer earnings tracking
    totalEarnings: {
      type: Number,
      default: function () {
        return this.userType === USER_TYPES.TRAINER || this.userType === USER_TYPES.LAB_PARTNER ? 0 : undefined;
      },
      min: [0, "Earnings cannot be negative"],
      required: function () {
        return this.userType === USER_TYPES.TRAINER || this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    monthlyEarnings: {
      type: Number,
      default: function () {
        return this.userType === USER_TYPES.TRAINER || this.userType === USER_TYPES.LAB_PARTNER ? 0 : undefined;
      },
      min: [0, "Monthly earnings cannot be negative"],
      required: function () {
        return this.userType === USER_TYPES.TRAINER || this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    lastEarningsUpdate: {
      type: Date,
      default: function () {
        return this.userType === USER_TYPES.TRAINER || this.userType === USER_TYPES.LAB_PARTNER ? Date.now() : undefined;
      },
      required: function () {
        return this.userType === USER_TYPES.TRAINER || this.userType === USER_TYPES.LAB_PARTNER;
      },
    },

    // Lab Partner specific fields
    laboratoryName: {
      type: String,
      required: function () {
        return this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    laboratoryAddress: {
      type: String,
      required: function () {
        return this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    licenseNumber: {
      type: String,
      required: function () {
        return this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    offeredTests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabTest",
      },
    ],
    // Lab Partner financial tracking
    unbilledCommissions: {
      type: Number,
      default: function () {
        return this.userType === USER_TYPES.LAB_PARTNER ? 0 : undefined;
      },
      min: [0, "Unbilled commissions cannot be negative"],
      required: function () {
        return this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    currentMonthLiability: {
      type: Number,
      default: function () {
        return this.userType === USER_TYPES.LAB_PARTNER ? 0 : undefined;
      },
      min: [0, "Current month liability cannot be negative"],
      required: function () {
        return this.userType === USER_TYPES.LAB_PARTNER;
      },
    },
    commissionRate: {
      type: Number,
      default: function () {
        return this.userType === USER_TYPES.LAB_PARTNER ? 10 : undefined;
      },
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
      required: function () {
        return this.userType === USER_TYPES.LAB_PARTNER;
      },
    },

    // Common fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: function () {
        // Fitness enthusiasts are auto-approved, trainers and lab partners need approval
        return this.userType === USER_TYPES.FITNESS_ENTHUSIAST;
      },
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.userType === USER_TYPES.FITNESS_ENTHUSIAST ? "approved" : "pending";
      },
    },
    approvedBy: {
      type: String, // Admin email who approved
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userType: this.userType,
      name: this.name,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiry,
    }
  );
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    config.jwtRefreshSecret,
    {
      expiresIn: config.jwtRefreshExpiry,
    }
  );
};

export const User = mongoose.model("User", userSchema);
