import { describe, it, expect } from "vitest";

const shouldFail = process.env.DEMO_FORCE_FAIL === "1";

describe("Auth demo intentional fail", () => {
  // This test is skipped by default. It runs only when DEMO_FORCE_FAIL=1.
  (shouldFail ? it : it.skip)("should fail intentionally to show CI red state", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("SecurePass123", 10);
    const isMatch = await bcrypt.compare("WrongPass", hash);

    // Intentionally wrong assertion for demonstration.
    expect(isMatch).toBe(true);
  });
});
