import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./middlewares/error.middleware.js";
import { errorLogger } from "./middlewares/errorLogger.middleware.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));


app.use(express.static("public"));


app.use(cookieParser());

// Request logging
// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}


const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" }
);


app.use(morgan("dev"));

app.use(morgan("combined", { stream: accessLogStream }));

// Routes
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import trainerRoutes from "./routes/trainer.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import labPartnerRoutes from "./routes/labPartner.routes.js";
import workoutRoutes from "./routes/workout.routes.js";
import liveClassRoutes from "./routes/liveClass.routes.js";
import nutritionRoutes from "./routes/nutrition.routes.js";

// Route declarations
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/lab-partners", labPartnerRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/classes", liveClassRoutes);
app.use("/api/nutrition", nutritionRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// Error logging middleware 
app.use(errorLogger);

// Error handling middleware (should be last)
app.use(errorHandler);

export { app };
