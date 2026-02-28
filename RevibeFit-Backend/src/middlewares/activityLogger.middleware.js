import { ManagerActivityLog } from "../models/managerActivityLog.model.js";

/**
 * Log a manager write action to the activity log.
 *
 * @param {Object} req     — Express request (must have req.user with manager info)
 * @param {string} action  — Action enum value (e.g., "APPROVE_USER")
 * @param {string} targetModel — Model name (e.g., "User", "PlatformInvoice")
 * @param {string|null} targetId — Target document ID
 * @param {Object} details — Additional action-specific metadata
 */
export const logManagerActivity = async (
    req,
    action,
    targetModel,
    targetId,
    details = {}
) => {
    try {
        const managerId = req.user?._id;
        if (!managerId) return; // Only log for manager users, not admin

        await ManagerActivityLog.create({
            managerId,
            action,
            targetModel,
            targetId,
            details,
            ipAddress:
                req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        });
    } catch (error) {
        // Activity logging should never block the main request
        console.error("Failed to log manager activity:", error.message);
    }
};
