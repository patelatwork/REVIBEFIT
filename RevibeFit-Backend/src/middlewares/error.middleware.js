import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { STATUS_CODES } from "../constants.js";
import config from "../config/index.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? STATUS_CODES.BAD_REQUEST
        : STATUS_CODES.INTERNAL_SERVER_ERROR;

    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    ...(!config.isProduction && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
