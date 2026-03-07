import { PlatformInvoice } from "../models/platformInvoice.model.js";
import { sendNotification } from "../services/notificationService.js";
import { INVOICE_STATUSES, NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from "../constants.js";

/**
 * Send payment reminders for invoices approaching due date or in grace period.
 * Schedule: 3 days before due, on due date, day 3 of grace period.
 */
export const sendPaymentRemindersJob = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  console.log("[CRON] Checking for payment reminders...");

  try {
    // Find invoices that are issued or overdue (not yet paid/cancelled)
    const activeInvoices = await PlatformInvoice.find({
      status: { $in: [INVOICE_STATUSES.ISSUED, INVOICE_STATUSES.OVERDUE, "payment_due"] },
    });

    let remindersSent = 0;

    for (const invoice of activeInvoices) {
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      const gracePeriodEnd = invoice.gracePeriodEnd ? new Date(invoice.gracePeriodEnd) : null;

      let reminderType = null;
      let title = "";
      let message = "";
      let channels = [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL];

      // 3 days before due date
      if (daysUntilDue === 3) {
        reminderType = "pre_due";
        title = "Invoice Payment Reminder";
        message = `Your invoice ${invoice.invoiceNumber} for ₹${invoice.totalCommission.toLocaleString("en-IN")} is due in 3 days (${dueDate.toLocaleDateString("en-IN")}).`;
      }
      // On due date
      else if (daysUntilDue === 0) {
        reminderType = "on_due";
        title = "Invoice Due Today";
        message = `Your invoice ${invoice.invoiceNumber} for ₹${invoice.totalCommission.toLocaleString("en-IN")} is due today. Please ensure timely payment to avoid penalties.`;
        channels.push(NOTIFICATION_CHANNELS.SMS);
      }
      // Day 3 of grace period (3 days after due date)
      else if (daysUntilDue === -3 && gracePeriodEnd && today < gracePeriodEnd) {
        reminderType = "grace_warning";
        title = "Overdue Invoice — Grace Period Warning";
        message = `Your invoice ${invoice.invoiceNumber} is overdue. Grace period ends on ${gracePeriodEnd.toLocaleDateString("en-IN")}. Failure to pay may result in account suspension.`;
        channels.push(NOTIFICATION_CHANNELS.SMS);
      }

      if (reminderType) {
        // Check if reminder already sent
        const alreadySent = invoice.reminders?.some(
          (r) => r.type === reminderType
        );

        if (!alreadySent) {
          await sendNotification({
            userId: invoice.labPartnerId,
            type: NOTIFICATION_TYPES.PAYMENT_REMINDER,
            title,
            message,
            data: {
              invoiceId: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              amount: invoice.totalCommission,
              dueDate: invoice.dueDate,
            },
            channels,
          });

          // Record that reminder was sent
          invoice.reminders.push({
            type: reminderType,
            sentAt: now,
            channel: "email",
          });
          await invoice.save();
          remindersSent++;
        }
      }
    }

    console.log(`[CRON] Payment reminders sent: ${remindersSent}`);
  } catch (error) {
    console.error("[CRON] Reminder job failed:", error.message);
  }
};
