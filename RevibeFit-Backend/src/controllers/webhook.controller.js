import { Payment } from "../models/payment.model.js";
import { Settlement } from "../models/settlement.model.js";
import { LabBooking } from "../models/labBooking.model.js";
import { PAYMENT_STATUSES, BOOKING_STATUSES } from "../constants.js";
import razorpayService from "../utils/razorpayService.js";

/**
 * Handle Razorpay webhook events.
 * This endpoint uses express.raw() body parser for signature verification.
 *
 * POST /api/webhooks/razorpay
 */
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return res.status(400).json({ error: "Missing signature" });
  }

  // Verify webhook signature
  let isValid;
  try {
    isValid = razorpayService.verifyWebhookSignature(req.body, signature);
  } catch {
    return res.status(500).json({ error: "Signature verification error" });
  }

  if (!isValid) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body.toString());
  const eventId = event.event_id || event.id;
  const eventType = event.event;

  try {
    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity, eventId);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity, eventId);
        break;
      case "transfer.settled":
        await handleTransferSettled(event.payload.transfer.entity, eventId);
        break;
      case "refund.processed":
        await handleRefundProcessed(event.payload.refund.entity, eventId);
        break;
      default:
        // Acknowledge unhandled events
        break;
    }
  } catch (error) {
    console.error(`Webhook error [${eventType}]:`, error.message);
    // Return 200 anyway to prevent Razorpay from retrying
    // The reconciliation cron will catch any missed updates
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ status: "ok" });
};

/**
 * Handle payment.captured event.
 * Updates Payment doc and confirms booking if not already done by verifyPayment.
 */
async function handlePaymentCaptured(paymentEntity, eventId) {
  const payment = await Payment.findOneAndUpdate(
    {
      razorpayOrderId: paymentEntity.order_id,
      status: PAYMENT_STATUSES.CREATED,
      processedEvents: { $ne: eventId },
    },
    {
      $set: {
        razorpayPaymentId: paymentEntity.id,
        status: PAYMENT_STATUSES.CAPTURED,
        method: paymentEntity.method,
      },
      $push: { processedEvents: eventId },
    },
    { new: true }
  );

  if (!payment) {
    // Already captured (by frontend verify or previous webhook)
    // Just ensure event is recorded for idempotency
    await Payment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      { $addToSet: { processedEvents: eventId } }
    );
    return;
  }

  // Extract transfer info
  if (paymentEntity.transfers && paymentEntity.transfers.items?.length > 0) {
    payment.transferId = paymentEntity.transfers.items[0].id;
    payment.transferStatus = "on_hold";
    await payment.save();
  }

  // Confirm the booking
  await LabBooking.findByIdAndUpdate(payment.bookingId, {
    razorpayPaymentId: paymentEntity.id,
    paymentStatus: "paid",
    status: BOOKING_STATUSES.CONFIRMED,
  });
}

/**
 * Handle payment.failed event.
 */
async function handlePaymentFailed(paymentEntity, eventId) {
  await Payment.findOneAndUpdate(
    {
      razorpayOrderId: paymentEntity.order_id,
      processedEvents: { $ne: eventId },
    },
    {
      $set: {
        razorpayPaymentId: paymentEntity.id,
        status: PAYMENT_STATUSES.FAILED,
        method: paymentEntity.method,
        metadata: {
          errorCode: paymentEntity.error_code,
          errorDescription: paymentEntity.error_description,
          errorReason: paymentEntity.error_reason,
        },
      },
      $push: { processedEvents: eventId },
    }
  );

  // Update booking payment status
  const payment = await Payment.findOne({
    razorpayOrderId: paymentEntity.order_id,
  });
  if (payment) {
    await LabBooking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: "failed",
    });
  }
}

/**
 * Handle transfer.settled event (lab partner received money).
 */
async function handleTransferSettled(transferEntity, eventId) {
  // Find the settlement by Razorpay transfer ID
  const settlement = await Settlement.findOneAndUpdate(
    {
      razorpayTransferId: transferEntity.id,
    },
    {
      $set: {
        razorpaySettlementId: transferEntity.settlement_id,
        status: "settled",
        settledAt: new Date(),
      },
    },
    { new: true }
  );

  if (!settlement) {
    // The transfer may also be tracked on the Payment doc
    await Payment.findOneAndUpdate(
      {
        transferId: transferEntity.id,
        processedEvents: { $ne: eventId },
      },
      {
        $set: {
          transferStatus: "settled",
          settledAt: new Date(),
        },
        $push: { processedEvents: eventId },
      }
    );
    return;
  }

  // Also update the Payment doc
  await Payment.findOneAndUpdate(
    { _id: settlement.paymentId },
    {
      $set: { transferStatus: "settled", settledAt: new Date() },
      $addToSet: { processedEvents: eventId },
    }
  );
}

/**
 * Handle refund.processed event.
 */
async function handleRefundProcessed(refundEntity, eventId) {
  const paymentId = refundEntity.payment_id;

  const payment = await Payment.findOne({
    razorpayPaymentId: paymentId,
    processedEvents: { $ne: eventId },
  });

  if (!payment) return;

  // Update the specific refund sub-document
  const refundIdx = payment.refunds.findIndex(
    (r) => r.razorpayRefundId === refundEntity.id
  );

  if (refundIdx !== -1) {
    payment.refunds[refundIdx].status = "completed";
  } else {
    // Refund initiated outside our system — record it
    payment.refunds.push({
      razorpayRefundId: refundEntity.id,
      amount: refundEntity.amount,
      status: "completed",
      reason: "Processed via Razorpay dashboard",
    });
  }

  payment.processedEvents.push(eventId);
  await payment.save();
}
