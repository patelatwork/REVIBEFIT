import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { errorLogger } from "./middlewares/errorLogger.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import config from "./config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────

// Helmet: Set various HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS: Restrict to known origins (not wildcard)
app.use(
  cors({
    origin: config.corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting: Prevent brute-force / DDoS on all API routes
app.use("/api", apiLimiter);

// NoSQL injection sanitization: Strip $ and . from req.body
// Note: Express 5 makes req.query a read-only getter, so we only sanitize req.body
// (query params are already strings and not passed to Mongoose directly)
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
  }
  next();
});

// HTTP Parameter Pollution protection
app.use(hpp());

// ─── Body Parsing ───────────────────────────────────────────────────────────

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ─── Static Files & Cookies ─────────────────────────────────────────────────

app.use(express.static("public"));
app.use(cookieParser());

// ─── Request Logging ────────────────────────────────────────────────────────

const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" }
);

// Console logging in development only
if (!config.isProduction) {
  app.use(morgan("dev"));
}
// File-based combined logging always
app.use(morgan("combined", { stream: accessLogStream }));

// ─── Route Imports ──────────────────────────────────────────────────────────

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import trainerRoutes from "./routes/trainer.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import labPartnerRoutes from "./routes/labPartner.routes.js";
import workoutRoutes from "./routes/workout.routes.js";
import liveClassRoutes from "./routes/liveClass.routes.js";
import nutritionRoutes from "./routes/nutrition.routes.js";
import managerRoutes from "./routes/manager.routes.js";

// ─── Route Declarations ─────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/lab-partners", labPartnerRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/classes", liveClassRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/nutrition", nutritionRoutes);

// ─── API Documentation (Swagger UI) ────────────────────────────────────────

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "RevibeFit API Docs",
  })
);
// Expose raw OpenAPI spec as JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Health Check ───────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    environment: config.nodeEnv,
  });
});

// ─── Error Handling ─────────────────────────────────────────────────────────

app.use(errorLogger);
app.use(errorHandler);

export { app };
