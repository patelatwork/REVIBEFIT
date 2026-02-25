import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Error logging middleware
 * Logs all errors to error.log file with timestamp and details
 */
const errorLogger = (err, req, res, next) => {
  const logsDir = path.join(__dirname, "..", "..", "logs");
  
  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const errorLogPath = path.join(logsDir, "error.log");
  
  // Prepare error log entry
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
    user: req.user?._id || "anonymous",
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params,
  };

  // Format log entry
  const logEntry = `
${"=".repeat(80)}
[${timestamp}] ${err.statusCode || 500} - ${req.method} ${req.url}
User: ${errorLog.user}
IP: ${errorLog.ip}
User-Agent: ${errorLog.userAgent}
Error: ${err.message}
Stack: ${err.stack}
Request Body: ${JSON.stringify(req.body, null, 2)}
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
  if (process.env.NODE_ENV === "development") {
    console.error("\nError occurred:");
    console.error("Method:", req.method);
    console.error("URL:", req.url);
    console.error("Status:", err.statusCode || 500);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
  }

  // Pass error to next middleware (error handler)
  next(err);
};

export { errorLogger };
