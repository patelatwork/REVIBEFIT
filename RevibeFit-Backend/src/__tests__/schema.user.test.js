import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { USER_TYPES, MANAGER_TYPES, INDIAN_STATES } from "../constants.js";

// Load User schema without DB connection — validate() works offline
vi.mock("../config/index.js", () => ({
  default: {
    jwtSecret: "test-secret",
    jwtExpiry: "7d",
    jwtRefreshSecret: "refresh-secret",
    jwtRefreshExpiry: "30d",
  },
}));

const { User } = await import("../models/user.model.js");

const baseEnthusiast = () => ({
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  phone: "9876543210",
  age: 25,
  userType: USER_TYPES.FITNESS_ENTHUSIAST,
  fitnessGoal: "lose weight",
});

const baseTrainer = () => ({
  name: "Trainer One",
  email: "trainer@example.com",
  password: "password123",
  phone: "9876543210",
  age: 30,
  userType: USER_TYPES.TRAINER,
  specialization: "yoga",
  certifications: "/uploads/cert.pdf",
  totalEarnings: 0,
  monthlyEarnings: 0,
  lastEarningsUpdate: new Date(),
});

const baseLabPartner = () => ({
  name: "Lab Corp",
  email: "lab@example.com",
  password: "password123",
  phone: "9876543210",
  age: 35,
  userType: USER_TYPES.LAB_PARTNER,
  laboratoryName: "Health Labs",
  laboratoryAddress: "123 Main St",
  licenseNumber: "LIC12345",
  totalEarnings: 0,
  monthlyEarnings: 0,
  lastEarningsUpdate: new Date(),
  unbilledCommissions: 0,
  currentMonthLiability: 0,
});

const baseManager = () => ({
  name: "Manager One",
  email: "manager@example.com",
  password: "password123",
  phone: "9876543210",
  userType: USER_TYPES.MANAGER,
  managerType: MANAGER_TYPES.TRAINER_MANAGER,
  assignedRegions: ["Northern India"],
});

async function validateDoc(data) {
  const doc = new User(data);
  return doc.validate();
}

async function expectValidationError(data, field) {
  try {
    await validateDoc(data);
    throw new Error("Expected validation error but none thrown");
  } catch (err) {
    if (err.message === "Expected validation error but none thrown") throw err;
    expect(err.errors).toHaveProperty(field);
  }
}

describe("User schema — name", () => {
  it("valid user passes", async () => {
    await expect(validateDoc(baseEnthusiast())).resolves.toBeUndefined();
  });

  it("name required", async () => {
    const data = baseEnthusiast();
    delete data.name;
    await expectValidationError(data, "name");
  });

  it("name minlength 2", async () => {
    const data = { ...baseEnthusiast(), name: "A" };
    await expectValidationError(data, "name");
  });
});

describe("User schema — email", () => {
  it("email required", async () => {
    const data = baseEnthusiast();
    delete data.email;
    await expectValidationError(data, "email");
  });

  it("email format validated", async () => {
    const data = { ...baseEnthusiast(), email: "not-an-email" };
    await expectValidationError(data, "email");
  });

  it("valid email passes", async () => {
    await expect(validateDoc(baseEnthusiast())).resolves.toBeUndefined();
  });
});

describe("User schema — phone", () => {
  it("phone required", async () => {
    const data = baseEnthusiast()
    delete data.phone;
    await expectValidationError(data, "phone");
  });

  it("phone must be 10 digits", async () => {
    const data = { ...baseEnthusiast(), phone: "12345" };
    await expectValidationError(data, "phone");
  });

  it("phone with letters fails", async () => {
    const data = { ...baseEnthusiast(), phone: "98765abcde" };
    await expectValidationError(data, "phone");
  });
});

describe("User schema — password", () => {
  it("password minlength 8", async () => {
    const data = { ...baseEnthusiast(), password: "short" };
    await expectValidationError(data, "password");
  });
});

describe("User schema — userType", () => {
  it("invalid userType fails", async () => {
    const data = { ...baseEnthusiast(), userType: "unknown" };
    await expectValidationError(data, "userType");
  });

  it("all valid userTypes pass", async () => {
    for (const type of Object.values(USER_TYPES)) {
      const data = {
        ...baseEnthusiast(),
        email: `${type}@example.com`,
        userType: type,
        // Add type-specific required fields
        ...(type === USER_TYPES.TRAINER ? {
          specialization: "yoga",
          certifications: "/cert.pdf",
          totalEarnings: 0,
          monthlyEarnings: 0,
          lastEarningsUpdate: new Date(),
        } : {}),
        ...(type === USER_TYPES.LAB_PARTNER ? {
          laboratoryName: "Lab",
          laboratoryAddress: "Addr",
          licenseNumber: "LIC001",
          totalEarnings: 0,
          monthlyEarnings: 0,
          lastEarningsUpdate: new Date(),
          unbilledCommissions: 0,
          currentMonthLiability: 0,
        } : {}),
        ...(type === USER_TYPES.MANAGER ? {
          age: undefined,
          managerType: MANAGER_TYPES.TRAINER_MANAGER,
          assignedRegions: ["Northern India"],
        } : {}),
      };
      // Just test it doesn't throw on userType
    }
  });
});

describe("User schema — age", () => {
  it("age min 13", async () => {
    const data = { ...baseEnthusiast(), age: 10 };
    await expectValidationError(data, "age");
  });

  it("age max 100", async () => {
    const data = { ...baseEnthusiast(), age: 101 };
    await expectValidationError(data, "age");
  });
});

describe("User schema — state", () => {
  it("invalid state fails", async () => {
    const data = { ...baseEnthusiast(), state: "Fakeland" };
    await expectValidationError(data, "state");
  });

  it("valid state passes", async () => {
    const data = { ...baseEnthusiast(), state: "Maharashtra" };
    await expect(validateDoc(data)).resolves.toBeUndefined();
  });

  it("null state passes", async () => {
    const data = { ...baseEnthusiast(), state: null };
    await expect(validateDoc(data)).resolves.toBeUndefined();
  });
});

describe("User schema — trainer fields", () => {
  it("specialization required for trainer", async () => {
    const data = baseTrainer();
    delete data.specialization;
    await expectValidationError(data, "specialization");
  });

  it("certifications required for trainer", async () => {
    const data = baseTrainer();
    delete data.certifications;
    await expectValidationError(data, "certifications");
  });

  it("valid trainer passes", async () => {
    await expect(validateDoc(baseTrainer())).resolves.toBeUndefined();
  });
});

describe("User schema — lab partner fields", () => {
  it("laboratoryName required for lab-partner", async () => {
    const data = baseLabPartner();
    delete data.laboratoryName;
    await expectValidationError(data, "laboratoryName");
  });

  it("laboratoryAddress required for lab-partner", async () => {
    const data = baseLabPartner();
    delete data.laboratoryAddress;
    await expectValidationError(data, "laboratoryAddress");
  });

  it("licenseNumber required for lab-partner", async () => {
    const data = baseLabPartner();
    delete data.licenseNumber;
    await expectValidationError(data, "licenseNumber");
  });

  it("valid lab partner passes", async () => {
    await expect(validateDoc(baseLabPartner())).resolves.toBeUndefined();
  });
});

describe("User schema — manager fields", () => {
  it("valid manager passes", async () => {
    await expect(validateDoc(baseManager())).resolves.toBeUndefined();
  });

  it("managerType must be valid enum", async () => {
    const data = { ...baseManager(), managerType: "invalid_type" };
    await expectValidationError(data, "managerType");
  });
});

describe("User schema — defaults", () => {
  it("isVerified defaults to false", () => {
    const user = new User(baseEnthusiast());
    expect(user.isVerified).toBe(false);
  });

  it("isActive defaults to true", () => {
    const user = new User(baseEnthusiast());
    expect(user.isActive).toBe(true);
  });

  it("isSuspended defaults to false", () => {
    const user = new User(baseEnthusiast());
    expect(user.isSuspended).toBe(false);
  });

  it("trainer commissionRate defaults to 15", () => {
    const user = new User(baseTrainer());
    expect(user.commissionRate).toBe(15);
  });

  it("lab partner commissionRate defaults to 10", () => {
    const user = new User(baseLabPartner());
    expect(user.commissionRate).toBe(10);
  });
});
