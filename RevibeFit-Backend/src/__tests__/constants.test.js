import { describe, it, expect } from "vitest";
import {
  USER_TYPES,
  MANAGER_TYPES,
  INDIAN_STATES,
  INDIAN_REGIONS,
  REGION_NAMES,
  STATUS_CODES,
  getStatesForRegions,
  getRegionForState,
} from "../constants.js";

describe("USER_TYPES", () => {
  it("has fitness-enthusiast", () => {
    expect(USER_TYPES.FITNESS_ENTHUSIAST).toBe("fitness-enthusiast");
  });

  it("has trainer", () => {
    expect(USER_TYPES.TRAINER).toBe("trainer");
  });

  it("has lab-partner", () => {
    expect(USER_TYPES.LAB_PARTNER).toBe("lab-partner");
  });

  it("has admin", () => {
    expect(USER_TYPES.ADMIN).toBe("admin");
  });

  it("has manager", () => {
    expect(USER_TYPES.MANAGER).toBe("manager");
  });

  it("has exactly 5 values", () => {
    expect(Object.keys(USER_TYPES)).toHaveLength(5);
  });
});

describe("MANAGER_TYPES", () => {
  it("has trainer_manager", () => {
    expect(MANAGER_TYPES.TRAINER_MANAGER).toBe("trainer_manager");
  });

  it("has lab_manager", () => {
    expect(MANAGER_TYPES.LAB_MANAGER).toBe("lab_manager");
  });

  it("has exactly 2 values", () => {
    expect(Object.keys(MANAGER_TYPES)).toHaveLength(2);
  });
});

describe("INDIAN_STATES", () => {
  it("is an array", () => {
    expect(Array.isArray(INDIAN_STATES)).toBe(true);
  });

  it("has 36 states/UTs", () => {
    expect(INDIAN_STATES).toHaveLength(36);
  });

  it("includes Maharashtra", () => {
    expect(INDIAN_STATES).toContain("Maharashtra");
  });

  it("includes Delhi", () => {
    expect(INDIAN_STATES).toContain("Delhi");
  });

  it("includes Tamil Nadu", () => {
    expect(INDIAN_STATES).toContain("Tamil Nadu");
  });

  it("includes Ladakh", () => {
    expect(INDIAN_STATES).toContain("Ladakh");
  });
});

describe("REGION_NAMES", () => {
  it("has 6 regions", () => {
    expect(REGION_NAMES).toHaveLength(6);
  });

  it("includes Northern India", () => {
    expect(REGION_NAMES).toContain("Northern India");
  });

  it("includes Southern India", () => {
    expect(REGION_NAMES).toContain("Southern India");
  });

  it("includes Eastern India", () => {
    expect(REGION_NAMES).toContain("Eastern India");
  });

  it("includes Western India", () => {
    expect(REGION_NAMES).toContain("Western India");
  });

  it("includes Central India", () => {
    expect(REGION_NAMES).toContain("Central India");
  });

  it("includes North-Eastern India", () => {
    expect(REGION_NAMES).toContain("North-Eastern India");
  });
});

describe("getStatesForRegions", () => {
  it("returns states for single region", () => {
    const states = getStatesForRegions(["Western India"]);
    expect(states).toContain("Maharashtra");
    expect(states).toContain("Gujarat");
    expect(states).toContain("Goa");
  });

  it("returns states for multiple regions", () => {
    const states = getStatesForRegions(["Central India", "Eastern India"]);
    expect(states).toContain("Chhattisgarh");
    expect(states).toContain("Bihar");
  });

  it("deduplicates states", () => {
    const states = getStatesForRegions(["Northern India", "Northern India"]);
    const unique = [...new Set(states)];
    expect(states).toHaveLength(unique.length);
  });

  it("returns empty array for empty input", () => {
    expect(getStatesForRegions([])).toEqual([]);
  });

  it("returns empty array for non-array input", () => {
    expect(getStatesForRegions("Northern India")).toEqual([]);
    expect(getStatesForRegions(null)).toEqual([]);
    expect(getStatesForRegions(undefined)).toEqual([]);
  });

  it("skips unknown region names", () => {
    const states = getStatesForRegions(["Unknown Region"]);
    expect(states).toEqual([]);
  });

  it("mixes valid and invalid regions", () => {
    const states = getStatesForRegions(["Central India", "Fake Region"]);
    expect(states).toContain("Chhattisgarh");
    expect(states).toContain("Madhya Pradesh");
  });
});

describe("getRegionForState", () => {
  it("returns correct region for Delhi", () => {
    expect(getRegionForState("Delhi")).toBe("Northern India");
  });

  it("returns correct region for Kerala", () => {
    expect(getRegionForState("Kerala")).toBe("Southern India");
  });

  it("returns correct region for West Bengal", () => {
    expect(getRegionForState("West Bengal")).toBe("Eastern India");
  });

  it("returns correct region for Goa", () => {
    expect(getRegionForState("Goa")).toBe("Western India");
  });

  it("returns correct region for Madhya Pradesh", () => {
    expect(getRegionForState("Madhya Pradesh")).toBe("Central India");
  });

  it("returns correct region for Assam", () => {
    expect(getRegionForState("Assam")).toBe("North-Eastern India");
  });

  it("returns null for unknown state", () => {
    expect(getRegionForState("Unknown State")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getRegionForState("")).toBeNull();
  });

  it("every state in INDIAN_STATES maps to a region", () => {
    for (const state of INDIAN_STATES) {
      expect(getRegionForState(state)).not.toBeNull();
    }
  });
});

describe("STATUS_CODES", () => {
  it("SUCCESS is 200", () => {
    expect(STATUS_CODES.SUCCESS).toBe(200);
  });

  it("CREATED is 201", () => {
    expect(STATUS_CODES.CREATED).toBe(201);
  });

  it("BAD_REQUEST is 400", () => {
    expect(STATUS_CODES.BAD_REQUEST).toBe(400);
  });

  it("UNAUTHORIZED is 401", () => {
    expect(STATUS_CODES.UNAUTHORIZED).toBe(401);
  });

  it("FORBIDDEN is 403", () => {
    expect(STATUS_CODES.FORBIDDEN).toBe(403);
  });

  it("NOT_FOUND is 404", () => {
    expect(STATUS_CODES.NOT_FOUND).toBe(404);
  });

  it("CONFLICT is 409", () => {
    expect(STATUS_CODES.CONFLICT).toBe(409);
  });

  it("INTERNAL_SERVER_ERROR is 500", () => {
    expect(STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
  });
});
