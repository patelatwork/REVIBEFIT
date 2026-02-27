/**
 * @module config
 * @description Centralized application configuration.
 * All environment variables are validated and exported from here.
 * Never access process.env directly in other files.
 */

import dotenv from "dotenv";
dotenv.config();

const config = {
  // Server
  port: parseInt(process.env.PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",

  // Database
  mongodbUri: process.env.MONGODB_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || "7d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "30d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,

  // Email
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    fromName: process.env.EMAIL_FROM_NAME || "RevibeFit",
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@gmail.com",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    name: process.env.ADMIN_NAME || "RevibeFit Admin",
  },

  // External APIs
  geminiApiKey: process.env.GEMINI_API_KEY,
  fatSecret: {
    clientId: process.env.FATSECRET_CLIENT_ID,
    clientSecret: process.env.FATSECRET_CLIENT_SECRET,
  },

  // Rate Limiting (relaxed in development)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000,
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 20 : 100,
  },
};

/**
 * Validate required environment variables at startup
 */
export const validateConfig = () => {
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("Please check your .env file against .env.sample");
    process.exit(1);
  }
};

export default config;
