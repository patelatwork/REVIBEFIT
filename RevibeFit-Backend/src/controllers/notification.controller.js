import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.model.js";

/**
 * Get notifications for the authenticated user (paginated).
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = { userId };
  if (unreadOnly === "true") {
    query.read = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, "Notifications fetched successfully")
  );
});

/**
 * Get unread notification count.
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    read: false,
  });

  res.status(200).json(
    new ApiResponse(200, { count }, "Unread count fetched")
  );
});

/**
 * Mark a single notification as read.
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json(new ApiResponse(404, null, "Notification not found"));
  }

  res.status(200).json(
    new ApiResponse(200, notification, "Marked as read")
  );
});

/**
 * Mark all notifications as read.
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  res.status(200).json(
    new ApiResponse(200, { modifiedCount: result.modifiedCount }, "All notifications marked as read")
  );
});
