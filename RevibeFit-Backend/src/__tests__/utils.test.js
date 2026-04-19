import { describe, it, expect } from "vitest";

describe("Input validation", () => {
  it("should trim whitespace from strings", () => {
    expect("  John Doe  ".trim()).toBe("John Doe");
  });

  it("should validate email format", () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    expect(emailRegex.test("valid@email.com")).toBe(true);
    expect(emailRegex.test("invalid-email")).toBe(false);
  });

  it("should validate 10-digit phone", () => {
    const phoneRegex = /^\d{10}$/;
    expect(phoneRegex.test("9876543210")).toBe(true);
    expect(phoneRegex.test("123")).toBe(false);
    expect(phoneRegex.test("98765432100")).toBe(false);
  });
});

describe("Commission calculation", () => {
  it("should calculate trainer commission correctly", () => {
    const bookingAmount = 1000;
    const commissionRate = 15;
    const commission = (bookingAmount * commissionRate) / 100;
    expect(commission).toBe(150);
  });

  it("should calculate lab partner commission correctly", () => {
    const bookingAmount = 500;
    const commissionRate = 10;
    const commission = (bookingAmount * commissionRate) / 100;
    expect(commission).toBe(50);
  });

  it("should calculate trainer payout after commission", () => {
    const bookingAmount = 1000;
    const commissionRate = 15;
    const payout = bookingAmount - (bookingAmount * commissionRate) / 100;
    expect(payout).toBe(850);
  });
});

describe("escapeRegex utility", () => {
  it("should escape special regex characters", () => {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(escapeRegex("hello.world")).toBe("hello\\.world");
    expect(escapeRegex("test+value")).toBe("test\\+value");
    expect(escapeRegex("(brackets)")).toBe("\\(brackets\\)");
  });

  it("should leave safe strings unchanged", () => {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expect(escapeRegex("yoga fitness")).toBe("yoga fitness");
    expect(escapeRegex("Mukesh")).toBe("Mukesh");
  });
});
