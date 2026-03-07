import mongoose from "mongoose";
import { SETTLEMENT_STATUSES, GST_TYPES } from "../constants.js";

const settlementSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabBooking",
      required: [true, "Booking ID is required"],
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment ID is required"],
    },
    labPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lab partner ID is required"],
      index: true,
    },

    // Razorpay references
    razorpayTransferId: { type: String, index: true, sparse: true },
    razorpaySettlementId: { type: String, index: true, sparse: true },

    // Financial breakdown (all amounts in INR)
    grossAmount: {
      type: Number,
      required: [true, "Gross amount is required"],
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: [true, "Commission amount is required"],
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: 0,
      max: 100,
    },
    gstOnCommission: {
      type: Number,
      required: [true, "GST on commission is required"],
      min: 0,
    },
    gstBreakdown: {
      type: {
        type: String,
        enum: Object.values(GST_TYPES),
        required: true,
      },
      cgstRate: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstRate: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstRate: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
    },
    netSettlementAmount: {
      type: Number,
      required: [true, "Net settlement amount is required"],
      min: 0,
    },

    // Status tracking
    status: {
      type: String,
      enum: Object.values(SETTLEMENT_STATUSES),
      default: SETTLEMENT_STATUSES.PENDING,
      index: true,
    },
    releasedAt: { type: Date, default: null },
    settledAt: { type: Date, default: null },

    // Invoice reference (populated when monthly invoice is generated)
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformInvoice",
      default: null,
    },

    // Billing period for invoice grouping
    billingPeriod: {
      month: { type: Number, min: 1, max: 12 },
      year: { type: Number, min: 2020 },
    },
  },
  { timestamps: true }
);

settlementSchema.index({ labPartnerId: 1, "billingPeriod.year": 1, "billingPeriod.month": 1 });
settlementSchema.index({ labPartnerId: 1, createdAt: -1 });
settlementSchema.index({ invoiceId: 1 });

export const Settlement = mongoose.model("Settlement", settlementSchema);
