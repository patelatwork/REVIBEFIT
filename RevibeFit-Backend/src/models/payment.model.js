import mongoose from "mongoose";
import { PAYMENT_STATUSES } from "../constants.js";

const refundSubSchema = new mongoose.Schema(
  {
    razorpayRefundId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["initiated", "processing", "completed", "failed"],
      default: "initiated",
    },
    reason: { type: String, default: null },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isAdminOverride: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabBooking",
      required: [true, "Booking ID is required"],
      index: true,
    },
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

    // Razorpay identifiers
    razorpayOrderId: {
      type: String,
      required: [true, "Razorpay order ID is required"],
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    razorpaySignature: { type: String },

    // Amounts (stored in paise for precision)
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: { type: String, default: "INR" },

    // Status
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.CREATED,
      index: true,
    },
    method: { type: String, default: null }, // card, upi, netbanking, wallet

    // Route transfer details
    transferId: { type: String, default: null },
    transferStatus: {
      type: String,
      enum: ["created", "on_hold", "released", "settled", "failed", null],
      default: null,
    },

    // Financial breakdown (stored in INR, not paise)
    commissionAmount: { type: Number, default: 0, min: 0 },
    gstOnCommission: { type: Number, default: 0, min: 0 },
    labSettlementAmount: { type: Number, default: 0, min: 0 },
    settledAt: { type: Date, default: null },

    // Refund history
    refunds: [refundSubSchema],

    // Webhook event tracking (for idempotency)
    processedEvents: [{ type: String }],

    // Raw Razorpay metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

paymentSchema.index({ fitnessEnthusiastId: 1, createdAt: -1 });
paymentSchema.index({ labPartnerId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
