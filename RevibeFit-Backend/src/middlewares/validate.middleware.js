/**
 * @module validate
 * @description Request validation middleware.
 * Validates MongoDB ObjectIds in route params and sanitizes inputs.
 */

import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to validate that route params are valid MongoDB ObjectIds.
 * Prevents CastError crashes when invalid IDs are passed.
 *
 * @param  {...string} paramNames - The route parameter names to validate
 * @returns {Function} Express middleware
 *
 * @example
 * router.get("/:userId", validateObjectId("userId"), getUser);
 */
export const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new ApiError(400, `Invalid ${paramName}: ${value}`);
      }
    }
    next();
  };
};

/**
 * Middleware to validate required body fields exist.
 *
 * @param  {...string} fields - Required field names
 * @returns {Function} Express middleware
 *
 * @example
 * router.post("/", validateRequiredFields("name", "email"), createUser);
 */
export const validateRequiredFields = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === ""
    );

    if (missing.length > 0) {
      throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
    }
    next();
  };
};

/**
 * Sanitize regex-sensitive characters from search strings
 * to prevent ReDoS attacks via $regex queries.
 *
 * @param {string} str - The string to sanitize
 * @returns {string} Escaped string safe for use in RegExp
 */
export const escapeRegex = (str) => {
  if (!str) return str;
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
