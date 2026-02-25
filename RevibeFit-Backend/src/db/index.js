import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import config from "../config/index.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${config.mongodbUri}/${DB_NAME}`
    );
    console.log(
      `\nMongoDB Connected! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(" MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
