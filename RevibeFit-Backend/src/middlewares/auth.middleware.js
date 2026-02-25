import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from header or cookies
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized - No token provided");
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    // Check if user is suspended
    if (user.isSuspended) {
      throw new ApiError(403, `Your account has been suspended. Reason: ${user.suspensionReason}`);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

// Middleware to verify user type
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
