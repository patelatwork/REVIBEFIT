import { describe, it, expect, vi } from "vitest";
import { validateObjectId, validateRequiredFields, escapeRegex } from "../middlewares/validate.middleware.js";
import { ApiError } from "../utils/ApiError.js";

vi.mock("mongoose", () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: (val) => /^[a-f\d]{24}$/i.test(val),
      },
    },
  },
}));

const VALID_ID = "507f1f77bcf86cd799439011";
const INVALID_ID = "not-an-object-id";

describe("validateObjectId", () => {
  it("calls next for valid ObjectId", () => {
    const middleware = validateObjectId("userId");
    const req = { params: { userId: VALID_ID } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("throws ApiError 400 for invalid ObjectId", () => {
    const middleware = validateObjectId("userId");
    const req = { params: { userId: INVALID_ID } };
    const next = vi.fn();
    expect(() => middleware(req, {}, next)).toThrow(ApiError);
  });

  it("thrown error has statusCode 400", () => {
    const middleware = validateObjectId("userId");
    const req = { params: { userId: INVALID_ID } };
    try {
      middleware(req, {}, vi.fn());
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("error message includes param name", () => {
    const middleware = validateObjectId("postId");
    const req = { params: { postId: INVALID_ID } };
    try {
      middleware(req, {}, vi.fn());
    } catch (err) {
      expect(err.message).toContain("postId");
    }
  });

  it("skips missing params (calls next)", () => {
    const middleware = validateObjectId("userId");
    const req = { params: {} };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("validates multiple params — all valid", () => {
    const middleware = validateObjectId("userId", "postId");
    const req = { params: { userId: VALID_ID, postId: VALID_ID } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("validates multiple params — first invalid throws", () => {
    const middleware = validateObjectId("userId", "postId");
    const req = { params: { userId: INVALID_ID, postId: VALID_ID } };
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });

  it("validates multiple params — second invalid throws", () => {
    const middleware = validateObjectId("userId", "postId");
    const req = { params: { userId: VALID_ID, postId: INVALID_ID } };
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });
});

describe("validateRequiredFields", () => {
  it("calls next when all fields present", () => {
    const middleware = validateRequiredFields("name", "email");
    const req = { body: { name: "Alice", email: "a@b.com" } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("throws ApiError 400 when field missing", () => {
    const middleware = validateRequiredFields("name", "email");
    const req = { body: { name: "Alice" } };
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });

  it("thrown error has statusCode 400", () => {
    const middleware = validateRequiredFields("email");
    const req = { body: {} };
    try {
      middleware(req, {}, vi.fn());
    } catch (err) {
      expect(err.statusCode).toBe(400);
    }
  });

  it("error message includes missing field name", () => {
    const middleware = validateRequiredFields("email");
    const req = { body: {} };
    try {
      middleware(req, {}, vi.fn());
    } catch (err) {
      expect(err.message).toContain("email");
    }
  });

  it("treats empty string as missing", () => {
    const middleware = validateRequiredFields("name");
    const req = { body: { name: "" } };
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });

  it("treats null as missing", () => {
    const middleware = validateRequiredFields("name");
    const req = { body: { name: null } };
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });

  it("error lists all missing fields", () => {
    const middleware = validateRequiredFields("name", "email", "phone");
    const req = { body: {} };
    try {
      middleware(req, {}, vi.fn());
    } catch (err) {
      expect(err.message).toContain("name");
      expect(err.message).toContain("email");
      expect(err.message).toContain("phone");
    }
  });

  it("0 is not treated as missing", () => {
    const middleware = validateRequiredFields("count");
    const req = { body: { count: 0 } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("false is not treated as missing", () => {
    const middleware = validateRequiredFields("active");
    const req = { body: { active: false } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
