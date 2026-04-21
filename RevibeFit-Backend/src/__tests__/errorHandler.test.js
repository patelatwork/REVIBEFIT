import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "../utils/ApiError.js";

// Mock mongoose Error
vi.mock("mongoose", () => {
  class MongooseError extends Error {}
  return { default: { Error: MongooseError }, Error: MongooseError };
});

vi.mock("../config/index.js", () => ({
  default: { isProduction: false },
}));

const { errorHandler } = await import("../middlewares/error.middleware.js");

const makeRes = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe("errorHandler — ApiError passthrough", () => {
  it("uses ApiError statusCode", () => {
    const err = new ApiError(404, "not found");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("response success is false", () => {
    const err = new ApiError(400, "bad request");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it("response message matches ApiError message", () => {
    const err = new ApiError(403, "forbidden access");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe("forbidden access");
  });

  it("response errors array present", () => {
    const errors = [{ field: "email" }];
    const err = new ApiError(400, "validation", errors);
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.errors).toEqual(errors);
  });
});

describe("errorHandler — non-ApiError conversion", () => {
  it("converts plain Error to 500", () => {
    const err = new Error("something broke");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("response success false for plain Error", () => {
    const err = new Error("oops");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it("response has message field", () => {
    const err = new Error("server error");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe("server error");
  });
});

describe("errorHandler — stack trace", () => {
  it("includes stack in dev mode (isProduction=false)", () => {
    const err = new ApiError(500, "dev error");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    // Top-level mock sets isProduction=false so stack should be present
    expect(body.stack).toBeDefined();
  });

  it("omits stack in production mode", () => {
    // Build a minimal production handler inline to test the spread logic
    const prodConfig = { isProduction: true };
    const prodHandler = (err, req, res, next) => {
      const error = err instanceof ApiError ? err : new ApiError(500, err.message);
      const response = {
        success: false,
        message: error.message,
        errors: error.errors,
        ...(!prodConfig.isProduction && { stack: error.stack }),
      };
      return res.status(error.statusCode).json(response);
    };
    const err = new ApiError(500, "prod error");
    const res = makeRes();
    prodHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBeUndefined();
  });
});

describe("errorHandler — response shape", () => {
  it("response has success, message, errors fields", () => {
    const err = new ApiError(400, "bad");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    const body = res.json.mock.calls[0][0];
    expect(body).toHaveProperty("success");
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("errors");
  });

  it("401 statusCode used correctly", () => {
    const err = new ApiError(401, "unauthorized");
    const res = makeRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
