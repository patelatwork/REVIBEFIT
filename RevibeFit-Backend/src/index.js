import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import config, { validateConfig } from "./config/index.js";
import { initSocketIO } from "./socket/index.js";

// Load environment variables
dotenv.config();

// Validate required config at startup
validateConfig();

const PORT = config.port;

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);
const io = initSocketIO(httpServer);

// Make io accessible in routes if needed
app.set("io", io);

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    const server = httpServer.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`WebRTC signaling server ready on ws://localhost:${PORT}`);
      console.log(`Server URL: http://localhost:${PORT}`);
    });

    app.on("error", (error) => {
      console.error(" Server Error:", error);
      throw error;
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        console.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    console.error(" MongoDB Connection Failed:", err);
    process.exit(1);
  });
