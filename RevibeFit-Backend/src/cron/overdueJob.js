import { PlatformInvoice } from "../models/platformInvoice.model.js";
import { User } from "../models/user.model.js";
import { sendNotification } from "../services/notificationService.js";
import { INVOICE_STATUSES, NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from "../constants.js";

/**
 * Enforce overdue invoices: auto-suspend lab partners past grace period.
 */
export const enforceOverdueJob = async () => {
  const now = new Date();

  console.log("[CRON] Checking for overdue enforcement...");

  try {
    // Find invoices past grace period that are overdue
    const overdueInvoices = await PlatformInvoice.find({
      status: { $in: [INVOICE_STATUSES.ISSUED, INVOICE_STATUSES.OVERDUE, "payment_due"] },
      gracePeriodEnd: { $lt: now },
    });

    let suspensionCount = 0;

    for (const invoice of overdueInvoices) {
      // Update invoice status to overdue if not already
      if (invoice.status !== INVOICE_STATUSES.OVERDUE) {
        invoice.status = INVOICE_STATUSES.OVERDUE;
        await invoice.save();
      }

      // Suspend the lab partner
      const labPartner = await User.findById(invoice.labPartnerId);
      if (labPartner && !labPartner.isSuspended) {
        labPartner.isSuspended = true;
        labPartner.suspensionReason = `Non-payment of invoice ${invoice.invoiceNumber} (overdue since ${invoice.dueDate.toLocaleDateString("en-IN")})`;
        labPartner.suspendedAt = now;
        await labPartner.save();

        // Send suspension notification
        await sendNotification({
          userId: labPartner._id,
          type: NOTIFICATION_TYPES.SUSPENSION_NOTICE,
          title: "Account Suspended — Overdue Invoice",
          message: `Your account has been suspended due to non-payment of invoice ${invoice.invoiceNumber}. Please clear your dues to restore access.`,
          data: {
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalCommission,
          },
          channels: [
            NOTIFICATION_CHANNELS.IN_APP,
            NOTIFICATION_CHANNELS.EMAIL,
            NOTIFICATION_CHANNELS.SMS,
          ],
        });

        suspensionCount++;
      }
    }

    console.log(`[CRON] Overdue enforcement: ${overdueInvoices.length} overdue invoices, ${suspensionCount} new suspensions`);
  } catch (error) {
    console.error("[CRON] Overdue enforcement job failed:", error.message);
  }
};
