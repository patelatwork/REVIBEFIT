import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import config from "../config/index.js";

/**
 * Middleware to verify JWT tokens for regular users.
 * Extracts token from cookies or Authorization header,
 * verifies it, and attaches the user object to req.user.
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    const decodedToken = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    if (user.isSuspended) {
      throw new ApiError(403, `Your account has been suspended. Reason: ${user.suspensionReason}`);
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/**
 * Middleware to verify admin JWT tokens.
 * Admin tokens do not correspond to a User document;
 * they are generated at login with { isAdmin: true }.
 */
export const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No admin token provided");
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    if (!decoded.isAdmin || decoded.userType !== "admin") {
      throw new ApiError(403, "Access denied - Admin privileges required");
    }

    // Attach admin info to request
    req.adminUser = {
      email: decoded.email,
      userType: decoded.userType,
      isAdmin: true,
    };

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid admin token");
  }
});

/**
 * Middleware to verify user type (role-based access control).
 * Must be used after verifyJWT.
 *
 * @param  {...string} allowedTypes - Allowed user types (from USER_TYPES constant)
 */
export const verifyUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!allowedTypes.includes(req.user.userType)) {
      throw new ApiError(
        403,
        `Access denied. Only ${allowedTypes.join(", ")} can access this route`
      );
    }

    next();
  };
};

/**
 * Middleware that allows access for EITHER admin (env-based) OR manager (DB-based).
 * - Admin: JWT contains { isAdmin: true, userType: "admin" } → sets req.adminUser
 * - Manager: JWT contains { _id } → looks up User document → sets req.user + req.managerUser
 */
export const verifyManagerOrAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    // Path 1: Admin (env-based credentials)
    if (decoded.isAdmin && decoded.userType === "admin") {
      req.adminUser = {
        email: decoded.email,
        userType: decoded.userType,
        isAdmin: true,
      };
      return next();
    }

    // Path 2: Manager (DB-based user)
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    if (user.userType !== "manager") {
      throw new ApiError(403, "Access denied - Manager or Admin privileges required");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    if (user.isSuspended) {
      throw new ApiError(
        403,
        `Your account has been suspended. Reason: ${user.suspensionReason}`
      );
    }

    req.user = user;
    req.managerUser = {
      email: user.email,
      name: user.name,
      userType: "manager",
      assignedRegion: user.assignedRegion,
    };
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid access token"
    );
  }
});

/**
 * Middleware to verify manager JWT tokens (manager-only routes).
 * Must be a DB-based user with userType "manager".
 */
export const verifyManager = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    if (user.userType !== "manager") {
      throw new ApiError(403, "Access denied - Manager privileges required");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    if (user.isSuspended) {
      throw new ApiError(
        403,
        `Your account has been suspended. Reason: ${user.suspensionReason}`
      );
    }

    req.user = user;
    req.managerUser = {
      email: user.email,
      name: user.name,
      userType: "manager",
      assignedRegion: user.assignedRegion,
    };
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid access token"
    );
  }
});

