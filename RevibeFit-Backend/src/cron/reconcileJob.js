import { Payment } from "../models/payment.model.js";
import { Settlement } from "../models/settlement.model.js";
import { PAYMENT_STATUSES, SETTLEMENT_STATUSES } from "../constants.js";
import razorpayService from "../utils/razorpayService.js";

/**
 * Reconciliation job:
 * 1. Expire abandoned payment orders (created but not paid after 30 min)
 * 2. Check settlement status for released transfers
 */
export const reconcilePaymentsJob = async () => {
  console.log("[CRON] Running payment reconciliation...");

  try {
    // 1. Expire abandoned orders older than 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const expiredResult = await Payment.updateMany(
      {
        status: PAYMENT_STATUSES.CREATED,
        createdAt: { $lt: thirtyMinAgo },
      },
      { $set: { status: PAYMENT_STATUSES.FAILED, metadata: { reason: "expired_by_reconciliation" } } }
    );

    if (expiredResult.modifiedCount > 0) {
      console.log(`[CRON] Expired ${expiredResult.modifiedCount} abandoned payment orders`);
    }

    // 2. Check settlements that have been in hold_released for > 5 days
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const pendingSettlements = await Settlement.find({
      status: SETTLEMENT_STATUSES.HOLD_RELEASED,
      releasedAt: { $lt: fiveDaysAgo },
    }).limit(50);

    for (const settlement of pendingSettlements) {
      try {
        if (!settlement.razorpayTransferId) continue;

        // Query Razorpay for the transfer status
        const payment = await Payment.findById(settlement.paymentId);
        if (!payment?.razorpayPaymentId) continue;

        const transfers = await razorpayService.fetchTransfers(payment.razorpayPaymentId);
        const transfer = transfers?.items?.find(
          (t) => t.id === settlement.razorpayTransferId
        );

        if (transfer?.settlement_id) {
          settlement.razorpaySettlementId = transfer.settlement_id;
          settlement.status = SETTLEMENT_STATUSES.SETTLED;
          settlement.settledAt = new Date();
          await settlement.save();
          console.log(`[CRON] Reconciled settlement ${settlement._id} -> settled`);
        }
      } catch (error) {
        console.error(`[CRON] Reconciliation failed for settlement ${settlement._id}:`, error.message);
      }
    }

    console.log("[CRON] Payment reconciliation complete");
  } catch (error) {
    console.error("[CRON] Reconciliation job failed:", error.message);
  }
};
