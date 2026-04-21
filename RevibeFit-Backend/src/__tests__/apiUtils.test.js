import { describe, it, expect, vi } from "vitest";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../middlewares/validate.middleware.js";

describe("ApiError", () => {
  it("is instance of Error", () => {
    const err = new ApiError(400, "bad request");
    expect(err).toBeInstanceOf(Error);
  });

  it("sets statusCode", () => {
    const err = new ApiError(404, "not found");
    expect(err.statusCode).toBe(404);
  });

  it("sets message", () => {
    const err = new ApiError(400, "custom message");
    expect(err.message).toBe("custom message");
  });

  it("default message is Something went wrong", () => {
    const err = new ApiError(500);
    expect(err.message).toBe("Something went wrong");
  });

  it("success is always false", () => {
    expect(new ApiError(200).success).toBe(false);
    expect(new ApiError(400).success).toBe(false);
  });

  it("data is null", () => {
    expect(new ApiError(400).data).toBeNull();
  });

  it("errors defaults to empty array", () => {
    expect(new ApiError(400).errors).toEqual([]);
  });

  it("errors can be set", () => {
    const errors = [{ field: "email", msg: "invalid" }];
    const err = new ApiError(400, "validation", errors);
    expect(err.errors).toEqual(errors);
  });

  it("captures stack trace by default", () => {
    const err = new ApiError(500);
    expect(err.stack).toBeTruthy();
  });

  it("uses provided stack when given", () => {
    const err = new ApiError(500, "msg", [], "custom stack");
    expect(err.stack).toBe("custom stack");
  });
});

describe("ApiResponse", () => {
  it("sets statusCode", () => {
    const r = new ApiResponse(200, {});
    expect(r.statusCode).toBe(200);
  });

  it("sets data", () => {
    const data = { id: 1 };
    const r = new ApiResponse(200, data);
    expect(r.data).toBe(data);
  });

  it("default message is Success", () => {
    const r = new ApiResponse(200, {});
    expect(r.message).toBe("Success");
  });

  it("custom message", () => {
    const r = new ApiResponse(201, {}, "Created");
    expect(r.message).toBe("Created");
  });

  it("success true for 2xx", () => {
    expect(new ApiResponse(200, {}).success).toBe(true);
    expect(new ApiResponse(201, {}).success).toBe(true);
    expect(new ApiResponse(204, {}).success).toBe(true);
  });

  it("success false for 4xx", () => {
    expect(new ApiResponse(400, {}).success).toBe(false);
    expect(new ApiResponse(404, {}).success).toBe(false);
  });

  it("success false for 5xx", () => {
    expect(new ApiResponse(500, {}).success).toBe(false);
  });

  it("success false at boundary 400", () => {
    expect(new ApiResponse(400, {}).success).toBe(false);
  });

  it("success true at boundary 399", () => {
    expect(new ApiResponse(399, {}).success).toBe(true);
  });
});

describe("asyncHandler", () => {
  it("calls the handler with req, res, next", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const middleware = asyncHandler(handler);
    const req = {}, res = {}, next = vi.fn();
    await middleware(req, res, next);
    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it("calls next with error on async throw", async () => {
    const err = new Error("async fail");
    const handler = vi.fn().mockRejectedValue(err);
    const middleware = asyncHandler(handler);
    const next = vi.fn();
    await middleware({}, {}, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("does not call next on success", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const middleware = asyncHandler(handler);
    const next = vi.fn();
    await middleware({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes ApiError through next", async () => {
    const apiErr = new ApiError(403, "forbidden");
    const handler = vi.fn().mockRejectedValue(apiErr);
    const middleware = asyncHandler(handler);
    const next = vi.fn();
    await middleware({}, {}, next);
    expect(next).toHaveBeenCalledWith(apiErr);
  });
});

describe("escapeRegex", () => {
  it("escapes dot", () => {
    expect(escapeRegex("a.b")).toBe("a\\.b");
  });

  it("escapes asterisk", () => {
    expect(escapeRegex("a*b")).toBe("a\\*b");
  });

  it("escapes plus", () => {
    expect(escapeRegex("a+b")).toBe("a\\+b");
  });

  it("escapes question mark", () => {
    expect(escapeRegex("a?b")).toBe("a\\?b");
  });

  it("escapes caret", () => {
    expect(escapeRegex("^abc")).toBe("\\^abc");
  });

  it("escapes dollar", () => {
    expect(escapeRegex("abc$")).toBe("abc\\$");
  });

  it("escapes curly braces", () => {
    expect(escapeRegex("a{2}")).toBe("a\\{2\\}");
  });

  it("escapes parens", () => {
    expect(escapeRegex("(ab)")).toBe("\\(ab\\)");
  });

  it("escapes pipe", () => {
    expect(escapeRegex("a|b")).toBe("a\\|b");
  });

  it("escapes square brackets", () => {
    expect(escapeRegex("[ab]")).toBe("\\[ab\\]");
  });

  it("escapes backslash", () => {
    expect(escapeRegex("a\\b")).toBe("a\\\\b");
  });

  it("returns null as-is", () => {
    expect(escapeRegex(null)).toBeNull();
  });

  it("returns undefined as-is", () => {
    expect(escapeRegex(undefined)).toBeUndefined();
  });

  it("returns empty string as-is", () => {
    expect(escapeRegex("")).toBe("");
  });

  it("normal string unchanged", () => {
    expect(escapeRegex("hello world")).toBe("hello world");
  });
});
