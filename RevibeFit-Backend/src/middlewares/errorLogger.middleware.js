import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fields to redact from logged request bodies
const SENSITIVE_FIELDS = [
  "password",
  "confirmPassword",
  "currentPassword",
  "newPassword",
  "refreshToken",
  "accessToken",
  "token",
  "secret",
  "creditCard",
  "cardNumber",
  "cvv",
];

/**
 * Recursively redact sensitive fields from an object.
 * Returns a shallow-safe copy; does not mutate the original.
 */
const redactSensitive = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(redacted)) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key]);
    }
  }
  return redacted;
};

/**
 * Error logging middleware
 * Logs all errors to error.log file with timestamp and details.
 * Sensitive fields (passwords, tokens) are automatically redacted.
 */
const errorLogger = (err, req, res, next) => {
  const logsDir = path.join(__dirname, "..", "..", "logs");

  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const errorLogPath = path.join(logsDir, "error.log");

  const timestamp = new Date().toISOString();
  const safeBody = redactSensitive(req.body);

  // Format log entry
  const logEntry = `
${"=".repeat(80)}
[${timestamp}] ${err.statusCode || 500} - ${req.method} ${req.url}
User: ${req.user?._id || "anonymous"}
IP: ${req.ip || req.connection?.remoteAddress}
User-Agent: ${req.get("user-agent")}
Error: ${err.message}
Stack: ${err.stack}
Request Body: ${JSON.stringify(safeBody, null, 2)}
Request Query: ${JSON.stringify(req.query, null, 2)}
Request Params: ${JSON.stringify(req.params, null, 2)}
${"=".repeat(80)}
`;

  // Write to error log file
  fs.appendFile(errorLogPath, logEntry, (writeErr) => {
    if (writeErr) {
      console.error("Failed to write to error log:", writeErr);
    }
  });

  // Also log to console in development
  if (!config.isProduction) {
    console.error(`\n[${timestamp}] ${err.statusCode || 500} ${req.method} ${req.url}`);
    console.error("Message:", err.message);
  }

  // Pass error to next middleware (error handler)
  next(err);
};

export { errorLogger };
