import { describe, it, expect } from "vitest";

describe("Auth – password hashing", () => {
  it("should not store plaintext password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    expect(hash).not.toBe("SecurePass123");
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("should correctly compare password and hash", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    const isMatch = await bcrypt.compare("SecurePass123", hash);
    expect(isMatch).toBe(true);
  });

  it("should reject wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    const isMatch = await bcrypt.compare("WrongPass", hash);
    expect(isMatch).toBe(false);
  });
});

describe("Auth – JWT tokens", () => {
  it("should generate a valid JWT token", async () => {
    const jwt = await import("jsonwebtoken");
    const payload = { _id: "abc123", email: "test@test.com", userType: "trainer" };
    const token = jwt.sign(payload, "test-secret", { expiresIn: "7d" });
    const decoded = jwt.verify(token, "test-secret");
    expect(decoded._id).toBe("abc123");
    expect(decoded.userType).toBe("trainer");
  });

  it("should reject an expired token", async () => {
    const jwt = await import("jsonwebtoken");
    const token = jwt.sign({ _id: "abc" }, "test-secret", { expiresIn: "-1s" });
    expect(() => jwt.verify(token, "test-secret")).toThrow();
  });

  it("should reject a tampered token", async () => {
    const jwt = await import("jsonwebtoken");
    const token = jwt.sign({ _id: "abc" }, "test-secret");
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(() => jwt.verify(tampered, "test-secret")).toThrow();
  });
});
