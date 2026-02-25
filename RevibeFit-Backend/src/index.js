import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
      console.log(`Server URL: http://localhost:${PORT}`);
    });

    app.on("error", (error) => {
      console.error(" Server Error:", error);
      throw error;
    });
  })
  .catch((err) => {
    console.error(" MongoDB Connection Failed:", err);
    process.exit(1);
  });
