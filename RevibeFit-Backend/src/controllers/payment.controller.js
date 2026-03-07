import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/payment.model.js";
import { LabBooking } from "../models/labBooking.model.js";
import { User } from "../models/user.model.js";
import { PAYMENT_STATUSES, BOOKING_STATUSES } from "../constants.js";
import { calculateBookingFinancials } from "../utils/gstCalculator.js";
import razorpayService from "../utils/razorpayService.js";
import config from "../config/index.js";

/**
 * Create a Razorpay order for a booking.
 * Called after the booking is created, before Razorpay Checkout opens.
 *
 * POST /api/payments/create-order
 * Body: { bookingId }
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const booking = await LabBooking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Ensure the booking belongs to the requesting user
  if (booking.fitnessEnthusiastId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only pay for your own bookings");
  }

  // Ensure booking is in a payable state
  if (booking.paymentStatus === "paid") {
    throw new ApiError(400, "This booking is already paid");
  }

  // Check if an order already exists for this booking
  const existingPayment = await Payment.findOne({
    bookingId,
    status: PAYMENT_STATUSES.CREATED,
  });
  if (existingPayment) {
    // Return existing order so frontend can retry checkout
    return res.status(200).json(
      new ApiResponse(200, {
        razorpayOrderId: existingPayment.razorpayOrderId,
        razorpayKeyId: config.razorpay.keyId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        bookingId: booking._id,
      }, "Existing payment order retrieved")
    );
  }

  // Fetch lab partner for commission and Razorpay linked account
  const labPartner = await User.findById(booking.labPartnerId);
  if (!labPartner) {
    throw new ApiError(404, "Lab partner not found");
  }

  const commissionRate = labPartner.commissionRate || config.platform.commissionDefault;
  const financials = calculateBookingFinancials(
    booking.totalAmount,
    commissionRate,
    labPartner.placeOfSupply || labPartner.state
  );

  // Amount in paise for Razorpay
  const amountInPaise = Math.round(booking.totalAmount * 100);
  const labSettlementInPaise = Math.round(financials.netSettlement * 100);

  // Create Razorpay order
  const razorpayOrder = await razorpayService.createOrder({
    amount: amountInPaise,
    receipt: booking._id.toString(),
    labLinkedAccountId: labPartner.razorpayLinkedAccountId,
    labSettlementAmount: labSettlementInPaise,
    notes: {
      bookingId: booking._id.toString(),
      labPartnerId: labPartner._id.toString(),
      fitnessEnthusiastId: req.user._id.toString(),
    },
  });

  // Create Payment document
  const payment = await Payment.create({
    bookingId: booking._id,
    fitnessEnthusiastId: req.user._id,
    labPartnerId: labPartner._id,
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: "INR",
    status: PAYMENT_STATUSES.CREATED,
    commissionAmount: financials.commissionAmount,
    gstOnCommission: financials.gstBreakdown.totalTax,
    labSettlementAmount: financials.netSettlement,
  });

  // Update booking with order reference
  booking.razorpayOrderId = razorpayOrder.id;
  booking.paymentId = payment._id;
  await booking.save();

  res.status(201).json(
    new ApiResponse(201, {
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: config.razorpay.keyId,
      amount: amountInPaise,
      currency: "INR",
      bookingId: booking._id,
    }, "Payment order created successfully")
  );
});

/**
 * Verify Razorpay payment after Checkout success callback.
 *
 * POST /api/payments/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment verification fields");
  }

  // Verify signature
  const isValid = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    throw new ApiError(400, "Payment verification failed — invalid signature");
  }

  // Idempotent: use findOneAndUpdate with status filter
  const payment = await Payment.findOneAndUpdate(
    {
      razorpayOrderId: razorpay_order_id,
      status: PAYMENT_STATUSES.CREATED,
    },
    {
      $set: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: PAYMENT_STATUSES.CAPTURED,
      },
    },
    { new: true }
  );

  if (!payment) {
    // Already processed (by webhook or duplicate call) — fetch current state
    const existingPayment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (existingPayment && existingPayment.status === PAYMENT_STATUSES.CAPTURED) {
      return res.status(200).json(
        new ApiResponse(200, { payment: existingPayment }, "Payment already verified")
      );
    }
    throw new ApiError(404, "Payment order not found or already processed");
  }

  // Fetch Razorpay payment for transfer ID
  try {
    const rzpPayment = await razorpayService.fetchPayment(razorpay_payment_id);
    if (rzpPayment.method) {
      payment.method = rzpPayment.method;
    }
    // Extract transfer ID if Route was used
    if (rzpPayment.transfers && rzpPayment.transfers.items?.length > 0) {
      payment.transferId = rzpPayment.transfers.items[0].id;
      payment.transferStatus = "on_hold";
    }
    await payment.save();
  } catch {
    // Non-critical: transfer info can be updated later via webhook
  }

  // Update booking
  await LabBooking.findByIdAndUpdate(payment.bookingId, {
    razorpayPaymentId: razorpay_payment_id,
    paymentStatus: "paid",
    status: BOOKING_STATUSES.CONFIRMED,
  });

  res.status(200).json(
    new ApiResponse(200, { payment }, "Payment verified successfully")
  );
});

/**
 * Get payment status for a booking.
 *
 * GET /api/payments/:bookingId/status
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const payment = await Payment.findOne({ bookingId })
    .sort({ createdAt: -1 })
    .select("status razorpayOrderId razorpayPaymentId amount method transferStatus refunds");

  if (!payment) {
    throw new ApiError(404, "No payment found for this booking");
  }

  res.status(200).json(
    new ApiResponse(200, { payment }, "Payment status retrieved")
  );
});

/**
 * Request a refund for a booking (fitness enthusiast).
 * Status-based: full refund if booking is still 'confirmed'.
 *
 * POST /api/payments/:bookingId/refund
 */
export const requestRefund = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await LabBooking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  // Ensure the booking belongs to the requesting user
  if (booking.fitnessEnthusiastId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only request refunds for your own bookings");
  }

  // Status-based refund rules
  const refundableStatuses = [
    BOOKING_STATUSES.PENDING,
    BOOKING_STATUSES.CONFIRMED,
  ];
  if (!refundableStatuses.includes(booking.status)) {
    throw new ApiError(
      400,
      `Refund not available. Booking status "${booking.status}" is past the refundable stage (before sample collection).`
    );
  }

  const payment = await Payment.findOne({
    bookingId,
    status: PAYMENT_STATUSES.CAPTURED,
  });

  if (!payment) {
    throw new ApiError(400, "No captured payment found for this booking");
  }

  // Check if refund already in progress
  const activeRefund = payment.refunds.find(
    (r) => r.status === "initiated" || r.status === "processing"
  );
  if (activeRefund) {
    throw new ApiError(400, "A refund is already in progress for this booking");
  }

  // Initiate full refund via Razorpay
  const razorpayRefund = await razorpayService.initiateRefund(
    payment.razorpayPaymentId,
    {
      notes: reason || "Customer requested refund",
      reverseAll: true,
    }
  );

  // Add refund to payment record
  payment.refunds.push({
    razorpayRefundId: razorpayRefund.id,
    amount: payment.amount, // Full refund (in paise)
    status: "initiated",
    reason: reason || "Customer requested refund",
    initiatedBy: req.user._id,
    isAdminOverride: false,
  });
  payment.status = PAYMENT_STATUSES.REFUNDED;
  await payment.save();

  // Update booking
  booking.paymentStatus = "refunded";
  booking.status = BOOKING_STATUSES.CANCELLED;
  await booking.save();

  res.status(200).json(
    new ApiResponse(200, {
      refundId: razorpayRefund.id,
      amount: payment.amount / 100, // Convert back to INR
      status: "initiated",
    }, "Refund initiated successfully")
  );
});

/**
 * Admin override refund (partial or full).
 *
 * POST /api/payments/:bookingId/admin-refund
 * Body: { amount (in INR), reason }
 */
export const adminOverrideRefund = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { amount, reason } = req.body;

  if (!reason) {
    throw new ApiError(400, "Reason is required for admin refund override");
  }

  const payment = await Payment.findOne({
    bookingId,
    status: { $in: [PAYMENT_STATUSES.CAPTURED, PAYMENT_STATUSES.REFUNDED] },
  });

  if (!payment) {
    throw new ApiError(404, "No payment found for this booking");
  }

  const refundAmountPaise = amount ? Math.round(amount * 100) : payment.amount;

  // Validate refund doesn't exceed payment
  const existingRefundTotal = payment.refunds
    .filter((r) => r.status !== "failed")
    .reduce((sum, r) => sum + r.amount, 0);

  if (existingRefundTotal + refundAmountPaise > payment.amount) {
    throw new ApiError(400, "Refund amount exceeds remaining payment amount");
  }

  const razorpayRefund = await razorpayService.initiateRefund(
    payment.razorpayPaymentId,
    {
      amount: refundAmountPaise,
      notes: `Admin override: ${reason}`,
      reverseAll: !amount, // Full reverse if no specific amount
    }
  );

  payment.refunds.push({
    razorpayRefundId: razorpayRefund.id,
    amount: refundAmountPaise,
    status: "initiated",
    reason: `Admin override: ${reason}`,
    initiatedBy: null, // Admin doesn't have a user doc
    isAdminOverride: true,
  });

  // Update status to refunded if this is a full refund
  if (existingRefundTotal + refundAmountPaise >= payment.amount) {
    payment.status = PAYMENT_STATUSES.REFUNDED;
  }
  await payment.save();

  // Update booking if full refund
  if (existingRefundTotal + refundAmountPaise >= payment.amount) {
    await LabBooking.findByIdAndUpdate(bookingId, {
      paymentStatus: "refunded",
      status: BOOKING_STATUSES.CANCELLED,
    });
  }

  res.status(200).json(
    new ApiResponse(200, {
      refundId: razorpayRefund.id,
      amount: refundAmountPaise / 100,
      status: "initiated",
    }, "Admin refund initiated successfully")
  );
});
