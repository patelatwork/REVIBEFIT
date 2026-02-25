import mongoose from "mongoose";

const labBookingSchema = new mongoose.Schema(
  {
    fitnessEnthusiastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Fitness enthusiast ID is required"],
    },
    labPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lab partner ID is required"],
    },
    selectedTests: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabTest",
          required: true,
        },
        testName: String,
        price: Number,
      },
    ],
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
      // Examples: "9:00 AM - 10:00 AM", "2:00 PM - 3:00 PM"
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount must be positive"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    // User payment to Lab (fitness enthusiast pays lab directly)
    userPaidToLab: {
      type: Boolean,
      default: false,
      description: "Indicates if fitness enthusiast has paid the lab",
    },
    userPaymentDate: {
      type: Date,
      default: null,
      description: "When fitness enthusiast paid the lab",
    },
    userPaymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "upi", null],
      default: null,
      description: "How fitness enthusiast paid the lab",
    },
    userPaymentVerifiedBy: {
      type: String,
      default: null,
      description: "Lab partner email who verified user payment",
    },
    // Lab payment to Platform (separate tracking)
    paymentReceivedByLab: {
      type: Boolean,
      default: false,
      description: "Lab partner marks they received payment (triggers commission)",
    },
    paymentReceivedDate: {
      type: Date,
      default: null,
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: [0, "Commission amount cannot be negative"],
    },
    commissionStatus: {
      type: String,
      enum: ["pending", "billed", "paid"],
      default: "pending",
    },
    billedInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformInvoice",
      default: null,
    },
    billingPeriod: {
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        min: 2020,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    // Contact info at time of booking
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
    },
    expectedReportDeliveryTime: {
      type: String,
      trim: true,
      // Expected format: "2 hours", "1 day", "3-5 days", etc.
    },
    reportUrl: {
      type: String,
      trim: true,
      // URL to the uploaded PDF report
    },
    reportUploadedAt: {
      type: Date,
      // Timestamp when the report was uploaded
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
labBookingSchema.index({ fitnessEnthusiastId: 1, status: 1 });
labBookingSchema.index({ labPartnerId: 1, bookingDate: 1 });
labBookingSchema.index({ status: 1 });

export const LabBooking = mongoose.model("LabBooking", labBookingSchema);
