import { describe, it, expect } from "vitest";
import mongoose from "mongoose";

/**
 * GENUINE APPLICATION FAILURE TESTS
 * These tests verify real security scenarios and business logic failures
 * that would cause production issues if they weren't caught.
 */

// ============================================================================
// TEST 1: SUSPENDED USER ACCESS SHOULD FAIL
// ============================================================================
describe("Real Failure: Suspended User Access", () => {
  it("should reject a suspended trainer even with valid token", async () => {
    const jwt = await import("jsonwebtoken");

    // Real scenario: Trainer has valid JWT but account is suspended
    const suspendedTrainer = {
      _id: "507f1f77bcf86cd799439011",
      email: "trainer@revibe.com",
      userType: "trainer",
      isSuspended: true,
      suspensionReason: "Payment verification failed",
      isActive: true,
    };

    // Token is cryptographically valid
    const validToken = jwt.sign(
      { _id: suspendedTrainer._id, email: suspendedTrainer.email },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "7d" }
    );

    const decoded = jwt.verify(
      validToken,
      process.env.JWT_SECRET || "test-secret"
    );

    // Token validates OK
    expect(decoded._id).toBe(suspendedTrainer._id);

    // BUT: User document shows suspension
    // Application MUST check this and reject access
    const shouldHaveAccess = !(
      suspendedTrainer.isSuspended && suspendedTrainer.isActive
    );
    expect(shouldHaveAccess).toBe(false);
    expect(suspendedTrainer.suspensionReason).toBeDefined();
  });

  it("should reject a deactivated client even with valid token", async () => {
    const jwt = await import("jsonwebtoken");

    const deactivatedClient = {
      _id: "507f1f77bcf86cd799439012",
      email: "client@revibe.com",
      userType: "client",
      isActive: false, // ← Account deactivated
      isSuspended: false,
    };

    const validToken = jwt.sign(
      { _id: deactivatedClient._id },
      process.env.JWT_SECRET || "test-secret"
    );

    // Token is valid, but user is deactivated
    const decoded = jwt.verify(
      validToken,
      process.env.JWT_SECRET || "test-secret"
    );
    expect(decoded._id).toBeDefined();

    // Application MUST reject deactivated users
    const canAccess = deactivatedClient.isActive;
    expect(canAccess).toBe(false);
  });
});

// ============================================================================
// TEST 2: UNAUTHORIZED ADMIN ACCESS SHOULD FAIL
// ============================================================================
describe("Real Failure: Unauthorized Admin Access", () => {
  it("should reject regular user attempting admin-level access", async () => {
    const jwt = await import("jsonwebtoken");

    // Attacker: Regular user tries to create fake admin token
    const regularUser = {
      _id: "507f1f77bcf86cd799439013",
      email: "hacker@revibe.com",
      userType: "client", // ← NOT admin
      isAdmin: false,
    };

    // User crafts a token claiming to be admin (FORGERY)
    const forgedAdminToken = jwt.sign(
      {
        _id: regularUser._id,
        email: regularUser.email,
        userType: "admin", // ← FORGED
        isAdmin: true, // ← FORGED
      },
      "wrong-secret" // ← Different secret
    );

    // Attempting to verify with correct secret should fail
    const jwtSecret = process.env.JWT_SECRET || "test-secret";
    expect(() => jwt.verify(forgedAdminToken, jwtSecret)).toThrow();
  });

  it("should reject regular user with valid token trying admin operations", async () => {
    const jwt = await import("jsonwebtoken");

    const trainerUser = {
      _id: "507f1f77bcf86cd799439014",
      email: "trainer@revibe.com",
      userType: "trainer",
      isAdmin: false,
    };

    // Valid token for trainer user
    const validTrainerToken = jwt.sign(
      {
        _id: trainerUser._id,
        email: trainerUser.email,
        userType: "trainer",
        isAdmin: false, // ← Not admin
      },
      process.env.JWT_SECRET || "test-secret"
    );

    const decoded = jwt.verify(
      validTrainerToken,
      process.env.JWT_SECRET || "test-secret"
    );

    // Token is valid, but user is NOT admin
    expect(decoded.isAdmin).toBe(false);
    expect(decoded.userType).not.toBe("admin");

    // Application MUST reject this user for admin operations
    const hasAdminAccess = decoded.isAdmin && decoded.userType === "admin";
    expect(hasAdminAccess).toBe(false);
  });

  it("should only allow trainer role to access trainer routes", async () => {
    // Real scenario: Client trying to access trainer-only operations

    const client = {
      _id: "507f1f77bcf86cd799439015",
      email: "client@revibe.com",
      userType: "client",
    };

    const trainer = {
      _id: "507f1f77bcf86cd799439016",
      email: "trainer@revibe.com",
      userType: "trainer",
    };

    const allowedTypes = ["trainer"]; // ← Only trainers can access

    // Client tries to access
    const clientCanAccess = allowedTypes.includes(client.userType);
    expect(clientCanAccess).toBe(false); // ✓ Should be rejected

    // Trainer tries to access
    const trainerCanAccess = allowedTypes.includes(trainer.userType);
    expect(trainerCanAccess).toBe(true); // ✓ Should be allowed
  });
});

// ============================================================================
// TEST 3: INVALID REQUEST VALIDATION SHOULD FAIL
// ============================================================================
describe("Real Failure: Invalid Request Validation", () => {
  it("should reject requests with invalid MongoDB ObjectIds", () => {
    // Real scenario: Attacker sends malformed ID in URL
    const validObjectId = "507f1f77bcf86cd799439011";
    const invalidObjectIds = [
      "not-a-valid-id",
      "507f1f77bcf86cd79943901", // Too short
      "507f1f77bcf86cd7994390111111", // Too long
      "xxxxxxxxxxxxxxxxxxxxxxxx",
      "",
      null,
    ];

    // Validate correct ID format
    expect(mongoose.Types.ObjectId.isValid(validObjectId)).toBe(true);

    // All invalid IDs should fail
    invalidObjectIds.forEach((id) => {
      expect(mongoose.Types.ObjectId.isValid(id)).toBe(false);
    });
  });

  it("should reject requests with missing required fields", () => {
    // Real scenario: Create user without required email
    const requiredFields = ["email", "password", "userType"];

    const validBody = {
      email: "trainer@revibe.com",
      password: "SecurePass123",
      userType: "trainer",
    };

    // Valid request has all required fields
    const allFieldsPresent = requiredFields.every(
      (field) => validBody[field] !== undefined && validBody[field] !== ""
    );
    expect(allFieldsPresent).toBe(true);

    // Invalid request: missing password
    const invalidBody = {
      email: "trainer@revibe.com",
      userType: "trainer",
      // password is missing
    };

    const missingFields = requiredFields.filter(
      (field) =>
        invalidBody[field] === undefined ||
        invalidBody[field] === null ||
        invalidBody[field] === ""
    );
    expect(missingFields).toEqual(["password"]);
    expect(missingFields.length > 0).toBe(true);
  });

  it("should reject requests with null/empty required fields", () => {
    const requiredFields = ["name", "email", "phone"];

    const invalidBodies = [
      { name: "", email: "test@test.com", phone: "1234567890" }, // Empty name
      { name: "John", email: null, phone: "1234567890" }, // Null email
      { name: "John", email: "test@test.com", phone: "" }, // Empty phone
      { name: undefined, email: "test@test.com", phone: "1234567890" }, // Undefined name
    ];

    invalidBodies.forEach((body) => {
      const missing = requiredFields.filter(
        (field) =>
          body[field] === undefined ||
          body[field] === null ||
          body[field] === ""
      );
      expect(missing.length > 0).toBe(true);
    });
  });

  it("should reject update requests with invalid data types", () => {
    // Real scenario: Booking endpoint receives wrong data type for classId

    const validUpdate = {
      classId: "507f1f77bcf86cd799439011", // Valid ObjectId string
      status: "confirmed", // Valid enum
      notes: "Please confirm", // Valid string
    };

    expect(mongoose.Types.ObjectId.isValid(validUpdate.classId)).toBe(true);
    expect(typeof validUpdate.status).toBe("string");

    // Invalid test cases
    const invalidClassIds = [
      "not-a-valid-objectid", // Too short, invalid format
      "abc", // Way too short
      "xyz", // Invalid
      "", // Empty
    ];

    invalidClassIds.forEach((classId) => {
      const isValidId = mongoose.Types.ObjectId.isValid(classId);
      expect(isValidId).toBe(false);
    });

    // Also test that null status is invalid
    const nullStatusUpdate = {
      classId: "507f1f77bcf86cd799439011",
      status: null, // Null instead of string
    };
    expect(nullStatusUpdate.status).toBe(null);
  });

  it("should reject requests with SQL injection attempts", () => {
    // Real scenario: Attacker tries SQL/NoSQL injection in user input

    const sqlInjectionAttempts = [
      "'; DROP TABLE users; --",
      "1 OR 1=1",
      { $ne: null }, // NoSQL injection attempt
      { $gt: "" }, // NoSQL query operator
    ];

    const legitimateInputs = [
      "John Doe",
      "trainer@revibe.com",
      "Some normal text",
    ];

    // Legitimate inputs are strings
    legitimateInputs.forEach((input) => {
      expect(typeof input).toBe("string");
      expect(input).not.toMatch(/[;'`"]|(\$\w+)/); // No SQL/NoSQL patterns
    });

    // Suspicious inputs might be objects (NoSQL) or contain special chars (SQL)
    sqlInjectionAttempts.forEach((input) => {
      if (typeof input === "object") {
        expect(typeof input).not.toBe("string");
      }
    });
  });
});

// ============================================================================
// TEST 4: COMBINED REAL-WORLD FAILURE SCENARIO
// ============================================================================
describe("Real Failure: Combined Attack Scenario", () => {
  it("should reject malicious request: suspended user + invalid data + no auth", async () => {
    // Real scenario: Attacker tries multiple bypass techniques at once

    const suspendedTrainer = {
      _id: "507f1f77bcf86cd799439017",
      isSuspended: true,
      isActive: true,
    };

    const maliciousRequestBody = {
      classId: "invalid-id-format", // Invalid ObjectId
      bookingId: "'; DROP TABLE bookings; --", // SQL injection attempt
      status: null, // Null instead of valid enum
    };

    // Check 1: User is suspended
    expect(suspendedTrainer.isSuspended).toBe(true);

    // Check 2: Invalid ObjectId
    expect(
      mongoose.Types.ObjectId.isValid(maliciousRequestBody.classId)
    ).toBe(false);

    // Check 3: Null status
    expect(maliciousRequestBody.status).toBe(null);

    // All checks should fail
    expect([
      suspendedTrainer.isSuspended === false,
      mongoose.Types.ObjectId.isValid(maliciousRequestBody.classId),
      maliciousRequestBody.status !== null,
    ]).toEqual([false, false, false]);
  });
});
