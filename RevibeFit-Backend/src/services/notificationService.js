import { Notification } from "../models/notification.model.js";
import { NOTIFICATION_CHANNELS } from "../constants.js";
import { sendSms } from "../utils/smsService.js";
import { User } from "../models/user.model.js";

/**
 * Central notification dispatcher.
 * Creates in-app notification, sends email, and/or SMS based on channels.
 *
 * @param {Object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.type - Notification type (from NOTIFICATION_TYPES)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body
 * @param {Object} [params.data] - Additional payload (bookingId, invoiceId, amount, etc.)
 * @param {string[]} [params.channels] - Delivery channels (defaults to all)
 * @param {Object} [params.io] - Socket.IO instance for real-time push
 * @returns {Promise<Object>} Created notification document
 */
export const sendNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  channels = [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
  io = null,
}) => {
  let notification = null;

  // 1. Create in-app notification
  if (channels.includes(NOTIFICATION_CHANNELS.IN_APP)) {
    notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      channels,
    });

    // Push via Socket.IO if available
    if (io) {
      io.to(`user:${userId}`).emit("notification", {
        _id: notification._id,
        type,
        title,
        message,
        data,
        createdAt: notification.createdAt,
      });
    }
  }

  // 2. Send email (non-blocking)
  if (channels.includes(NOTIFICATION_CHANNELS.EMAIL)) {
    try {
      // Dynamic import to avoid circular dependencies
      const { sendNotificationEmail } = await import("../utils/emailService.js");
      const user = await User.findById(userId).select("email name");
      if (user?.email) {
        await sendNotificationEmail(user.email, user.name, title, message, data);
        if (notification) {
          notification.emailSent = true;
          await notification.save();
        }
      }
    } catch (error) {
      console.error(`Email notification failed for user ${userId}:`, error.message);
    }
  }

  // 3. Send SMS for critical alerts (non-blocking)
  if (channels.includes(NOTIFICATION_CHANNELS.SMS)) {
    try {
      const user = await User.findById(userId).select("phone");
      if (user?.phone) {
        await sendSms(user.phone, `${title}: ${message}`);
        if (notification) {
          notification.smsSent = true;
          await notification.save();
        }
      }
    } catch (error) {
      console.error(`SMS notification failed for user ${userId}:`, error.message);
    }
  }

  return notification;
};

/**
 * Send notifications to multiple users.
 */
export const sendBulkNotification = async ({ userIds, type, title, message, data, channels, io }) => {
  const results = await Promise.allSettled(
    userIds.map((userId) =>
      sendNotification({ userId, type, title, message, data, channels, io })
    )
  );
  return results;
};

export default { sendNotification, sendBulkNotification };
