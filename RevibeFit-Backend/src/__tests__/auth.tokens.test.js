import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";

vi.mock("../config/index.js", () => ({
  default: {
    jwtSecret: "test-access-secret",
    jwtExpiry: "7d",
    jwtRefreshSecret: "test-refresh-secret",
    jwtRefreshExpiry: "30d",
  },
}));

const { User } = await import("../models/user.model.js");

const makeUser = (overrides = {}) => new User({
  _id: "507f1f77bcf86cd799439011",
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  phone: "9876543210",
  age: 25,
  userType: "fitness-enthusiast",
  fitnessGoal: "lose weight",
  ...overrides,
});

describe("generateAccessToken", () => {
  it("returns a string token", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    expect(typeof token).toBe("string");
  });

  it("payload contains _id", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    const decoded = jwt.decode(token);
    expect(decoded._id).toBeTruthy();
  });

  it("payload contains email", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    const decoded = jwt.decode(token);
    expect(decoded.email).toBe("test@example.com");
  });

  it("payload contains userType", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    const decoded = jwt.decode(token);
    expect(decoded.userType).toBe("fitness-enthusiast");
  });

  it("payload contains name", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    const decoded = jwt.decode(token);
    expect(decoded.name).toBe("Test User");
  });

  it("can be verified with correct secret", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    expect(() => jwt.verify(token, "test-access-secret")).not.toThrow();
  });

  it("throws with wrong secret", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });

  it("tampered token throws JsonWebTokenError", () => {
    const user = makeUser();
    const token = user.generateAccessToken();
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(() => jwt.verify(tampered, "test-access-secret")).toThrow();
  });
});

describe("generateRefreshToken", () => {
  it("returns a string token", () => {
    const user = makeUser();
    const token = user.generateRefreshToken();
    expect(typeof token).toBe("string");
  });

  it("payload contains _id only (no email/name)", () => {
    const user = makeUser();
    const token = user.generateRefreshToken();
    const decoded = jwt.decode(token);
    expect(decoded._id).toBeTruthy();
    expect(decoded.email).toBeUndefined();
    expect(decoded.name).toBeUndefined();
    expect(decoded.userType).toBeUndefined();
  });

  it("can be verified with refresh secret", () => {
    const user = makeUser();
    const token = user.generateRefreshToken();
    expect(() => jwt.verify(token, "test-refresh-secret")).not.toThrow();
  });

  it("fails verification with access secret", () => {
    const user = makeUser();
    const token = user.generateRefreshToken();
    expect(() => jwt.verify(token, "test-access-secret")).toThrow();
  });

  it("tampered refresh token throws", () => {
    const user = makeUser();
    const token = user.generateRefreshToken();
    const tampered = token.slice(0, -5) + "YYYYY";
    expect(() => jwt.verify(tampered, "test-refresh-secret")).toThrow();
  });
});

describe("expired tokens", () => {
  it("expired token throws TokenExpiredError", () => {
    const token = jwt.sign({ _id: "123" }, "test-access-secret", { expiresIn: "0s" });
    expect(() => jwt.verify(token, "test-access-secret")).toThrow(/jwt expired/i);
  });
});

describe("admin token structure", () => {
  it("admin token contains isAdmin and userType=admin", () => {
    const adminToken = jwt.sign(
      { email: "admin@test.com", userType: "admin", isAdmin: true },
      "test-access-secret",
      { expiresIn: "7d" }
    );
    const decoded = jwt.decode(adminToken);
    expect(decoded.isAdmin).toBe(true);
    expect(decoded.userType).toBe("admin");
  });
});
