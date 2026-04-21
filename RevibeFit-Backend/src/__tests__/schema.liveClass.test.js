import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";

vi.mock("../config/index.js", () => ({
  default: { jwtSecret: "test", jwtRefreshSecret: "refresh" },
}));

const { LiveClass } = await import("../models/liveClass.model.js");

const fakeId = () => new mongoose.Types.ObjectId();

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

const futureTime = () => "10:00";

const validClass = (overrides = {}) => new LiveClass({
  trainerId: fakeId(),
  title: "Morning Yoga Flow",
  classType: "yoga",
  scheduledDate: futureDate(),
  scheduledTime: futureTime(),
  cost: 299,
  ...overrides,
});

async function expectError(doc, field) {
  try {
    await doc.validate();
    throw new Error("Expected validation error but none thrown");
  } catch (err) {
    if (err.message === "Expected validation error but none thrown") throw err;
    expect(err.errors).toHaveProperty(field);
  }
}

describe("LiveClass schema — title", () => {
  it("valid class passes validation", async () => {
    await expect(validClass().validate()).resolves.toBeUndefined();
  });

  it("title minlength 3", async () => {
    await expectError(validClass({ title: "Hi" }), "title");
  });

  it("title maxlength 100", async () => {
    await expectError(validClass({ title: "A".repeat(101) }), "title");
  });

  it("title required", async () => {
    const cls = validClass();
    cls.title = undefined;
    await expectError(cls, "title");
  });
});

describe("LiveClass schema — classType", () => {
  it("valid classTypes pass", async () => {
    const types = ["cycling", "strength", "running", "yoga", "meditation", "rowing", "outdoor", "stretching"];
    for (const t of types) {
      await expect(validClass({ classType: t }).validate()).resolves.toBeUndefined();
    }
  });

  it("invalid classType fails", async () => {
    await expectError(validClass({ classType: "swimming" }), "classType");
  });

  it("classType required", async () => {
    const cls = validClass();
    cls.classType = undefined;
    await expectError(cls, "classType");
  });
});

describe("LiveClass schema — scheduledTime", () => {
  it("valid HH:MM format passes", async () => {
    await expect(validClass({ scheduledTime: "14:30" }).validate()).resolves.toBeUndefined();
    await expect(validClass({ scheduledTime: "00:00" }).validate()).resolves.toBeUndefined();
    await expect(validClass({ scheduledTime: "23:59" }).validate()).resolves.toBeUndefined();
  });

  it("hour 25 fails", async () => {
    await expectError(validClass({ scheduledTime: "25:00" }), "scheduledTime");
  });

  it("minutes 60 fails", async () => {
    await expectError(validClass({ scheduledTime: "10:60" }), "scheduledTime");
  });

  it("non-numeric format fails", async () => {
    await expectError(validClass({ scheduledTime: "10am" }), "scheduledTime");
  });

  it("hour 24 fails", async () => {
    await expectError(validClass({ scheduledTime: "24:00" }), "scheduledTime");
  });
});

describe("LiveClass schema — duration", () => {
  it("duration min 15", async () => {
    await expectError(validClass({ duration: 14 }), "duration");
  });

  it("duration max 180", async () => {
    await expectError(validClass({ duration: 181 }), "duration");
  });

  it("duration defaults to 60", () => {
    expect(validClass().duration).toBe(60);
  });
});

describe("LiveClass schema — cost", () => {
  it("cost min 0 (free is valid)", async () => {
    await expect(validClass({ cost: 0 }).validate()).resolves.toBeUndefined();
  });

  it("negative cost fails", async () => {
    await expectError(validClass({ cost: -1 }), "cost");
  });

  it("cost max 10000", async () => {
    await expectError(validClass({ cost: 10001 }), "cost");
  });
});

describe("LiveClass schema — maxParticipants", () => {
  it("maxParticipants min 1", async () => {
    await expectError(validClass({ maxParticipants: 0 }), "maxParticipants");
  });

  it("maxParticipants max 200", async () => {
    await expectError(validClass({ maxParticipants: 201 }), "maxParticipants");
  });

  it("maxParticipants defaults to 50", () => {
    expect(validClass().maxParticipants).toBe(50);
  });
});

describe("LiveClass instance methods", () => {
  const makeClassWithTime = (minutesFromNow) => {
    const now = new Date();
    const scheduled = new Date(now.getTime() + minutesFromNow * 60000);
    const hours = String(scheduled.getHours()).padStart(2, "0");
    const mins = String(scheduled.getMinutes()).padStart(2, "0");
    const cls = new LiveClass({
      trainerId: fakeId(),
      title: "Test Class",
      classType: "yoga",
      scheduledDate: scheduled,
      scheduledTime: `${hours}:${mins}`,
      cost: 0,
      currentParticipants: 0,
      maxParticipants: 10,
      status: "scheduled",
      isActive: true,
    });
    return cls;
  };

  describe("isFull()", () => {
    it("returns false when not full", () => {
      const cls = validClass({ currentParticipants: 5, maxParticipants: 10 });
      expect(cls.isFull()).toBe(false);
    });

    it("returns true when at capacity", () => {
      const cls = validClass({ currentParticipants: 10, maxParticipants: 10 });
      expect(cls.isFull()).toBe(true);
    });

    it("returns true when over capacity", () => {
      const cls = validClass({ currentParticipants: 11, maxParticipants: 10 });
      expect(cls.isFull()).toBe(true);
    });
  });

  describe("canJoin()", () => {
    it("returns true for future scheduled active non-full class", () => {
      const cls = makeClassWithTime(60);
      expect(cls.canJoin()).toBe(true);
    });

    it("returns false when cancelled", () => {
      const cls = makeClassWithTime(60);
      cls.status = "cancelled";
      expect(cls.canJoin()).toBe(false);
    });

    it("returns false when full", () => {
      const cls = makeClassWithTime(60);
      cls.currentParticipants = cls.maxParticipants;
      expect(cls.canJoin()).toBe(false);
    });

    it("returns false when in the past", () => {
      const cls = makeClassWithTime(-60);
      expect(cls.canJoin()).toBe(false);
    });

    it("returns false when inactive", () => {
      const cls = makeClassWithTime(60);
      cls.isActive = false;
      expect(cls.canJoin()).toBe(false);
    });
  });

  describe("hasStarted()", () => {
    it("returns false for future class", () => {
      const cls = makeClassWithTime(60);
      expect(cls.hasStarted()).toBe(false);
    });

    it("returns true for past class", () => {
      const cls = makeClassWithTime(-10);
      expect(cls.hasStarted()).toBe(true);
    });
  });

  describe("isCompleted()", () => {
    it("returns true when status is completed", () => {
      const cls = makeClassWithTime(60);
      cls.status = "completed";
      expect(cls.isCompleted()).toBe(true);
    });

    it("returns true when past end time", () => {
      const cls = makeClassWithTime(-120);
      cls.duration = 60;
      expect(cls.isCompleted()).toBe(true);
    });

    it("returns false for future class", () => {
      const cls = makeClassWithTime(120);
      expect(cls.isCompleted()).toBe(false);
    });
  });
});
