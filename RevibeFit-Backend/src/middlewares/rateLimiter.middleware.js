/**
 * @module rateLimiter
 * @description Rate limiting middleware to prevent brute-force attacks and API abuse.
 * Configures different limits for general API access vs auth endpoints.
 */

import rateLimit from "express-rate-limit";
import config from "../config/index.js";

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15-minute window
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth-specific rate limiter (stricter)
 * Limits login/signup to 20 attempts per 15-minute window
 */
export const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  max: config.authRateLimit.max,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
