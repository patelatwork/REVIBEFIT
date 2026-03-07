import cron from "node-cron";
import { generateAllMonthlyInvoicesJob } from "./invoiceJob.js";
import { sendPaymentRemindersJob } from "./reminderJob.js";
import { enforceOverdueJob } from "./overdueJob.js";
import { reconcilePaymentsJob } from "./reconcileJob.js";

/**
 * Initialize all scheduled cron jobs.
 * Call this after the database connection is established.
 */
export const initCronJobs = () => {
  // Auto-generate invoices: 1st of every month at 2:00 AM IST
  cron.schedule("0 2 1 * *", generateAllMonthlyInvoicesJob, {
    timezone: "Asia/Kolkata",
  });

  // Payment reminders: Daily at 9:00 AM IST
  cron.schedule("0 9 * * *", sendPaymentRemindersJob, {
    timezone: "Asia/Kolkata",
  });

  // Overdue enforcement: Daily at 10:00 AM IST
  cron.schedule("0 10 * * *", enforceOverdueJob, {
    timezone: "Asia/Kolkata",
  });

  // Payment reconciliation: Every 6 hours
  cron.schedule("0 */6 * * *", reconcilePaymentsJob, {
    timezone: "Asia/Kolkata",
  });

  console.log("Cron jobs initialized:");
  console.log("  - Invoice generation: 1st of month, 2:00 AM IST");
  console.log("  - Payment reminders: Daily 9:00 AM IST");
  console.log("  - Overdue enforcement: Daily 10:00 AM IST");
  console.log("  - Payment reconciliation: Every 6 hours");
};
