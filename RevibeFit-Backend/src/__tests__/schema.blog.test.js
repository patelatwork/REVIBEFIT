import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";

vi.mock("../config/index.js", () => ({
  default: { jwtSecret: "test", jwtRefreshSecret: "refresh" },
}));

const { Blog } = await import("../models/blog.model.js");
const { Challenge } = await import("../models/challenge.model.js");
const { CommunityPost } = await import("../models/communityPost.model.js");

const fakeId = () => new mongoose.Types.ObjectId();

async function expectError(doc, field) {
  try {
    await doc.validate();
    throw new Error("Expected validation error but none thrown");
  } catch (err) {
    if (err.message === "Expected validation error but none thrown") throw err;
    expect(err.errors).toHaveProperty(field);
  }
}

// ─── Blog ───────────────────────────────────────────────────────────────────

const validBlog = () => new Blog({
  title: "My Fitness Blog Post",
  content: "This is a long enough content for the blog post to be valid for testing purposes.",
  category: "Fitness Tips",
  thumbnail: "/uploads/thumb.jpg",
  author: fakeId(),
  authorName: "Alice",
});

describe("Blog schema — title", () => {
  it("valid blog passes", async () => {
    await expect(validBlog().validate()).resolves.toBeUndefined();
  });

  it("title minlength 5", async () => {
    const blog = validBlog();
    blog.title = "Hi";
    await expectError(blog, "title");
  });

  it("title maxlength 200", async () => {
    const blog = validBlog();
    blog.title = "A".repeat(201);
    await expectError(blog, "title");
  });

  it("title required", async () => {
    const blog = validBlog();
    blog.title = undefined;
    await expectError(blog, "title");
  });
});

describe("Blog schema — content", () => {
  it("content minlength 50", async () => {
    const blog = validBlog();
    blog.content = "Short";
    await expectError(blog, "content");
  });

  it("content required", async () => {
    const blog = validBlog();
    blog.content = undefined;
    await expectError(blog, "content");
  });
});

describe("Blog schema — category", () => {
  it("valid categories pass", async () => {
    const categories = ["Fitness Tips", "Nutrition", "Yoga", "Mental Wellness", "General"];
    for (const cat of categories) {
      const blog = validBlog();
      blog.category = cat;
      await expect(blog.validate()).resolves.toBeUndefined();
    }
  });

  it("invalid category fails", async () => {
    const blog = validBlog();
    blog.category = "Invalid Category";
    await expectError(blog, "category");
  });
});

describe("Blog schema — thumbnail", () => {
  it("thumbnail required", async () => {
    const blog = validBlog();
    blog.thumbnail = undefined;
    await expectError(blog, "thumbnail");
  });
});

// ─── Challenge ───────────────────────────────────────────────────────────────

const validChallenge = () => new Challenge({
  title: "30-Day Pushup Challenge",
  description: "Do pushups every day for 30 days to build strength and endurance in your arms.",
  category: "strength",
  startDate: new Date(Date.now() + 86400000),
  endDate: new Date(Date.now() + 86400000 * 31),
  goalType: "count",
  goalTarget: 30,
  goalUnit: "pushups",
  createdBy: fakeId(),
  creatorName: "Trainer Bob",
  creatorType: "trainer",
});

describe("Challenge schema — category", () => {
  it("valid category passes", async () => {
    await expect(validChallenge().validate()).resolves.toBeUndefined();
  });

  it("invalid category fails", async () => {
    const ch = validChallenge();
    ch.category = "swimming";
    await expectError(ch, "category");
  });

  it("all valid categories pass", async () => {
    const cats = ["strength", "cardio", "flexibility", "nutrition", "mindfulness", "general"];
    for (const cat of cats) {
      const ch = validChallenge();
      ch.category = cat;
      await expect(ch.validate()).resolves.toBeUndefined();
    }
  });
});

describe("Challenge schema — goalType", () => {
  it("valid goalTypes pass", async () => {
    for (const gt of ["count", "duration", "streak"]) {
      const ch = validChallenge();
      ch.goalType = gt;
      await expect(ch.validate()).resolves.toBeUndefined();
    }
  });

  it("invalid goalType fails", async () => {
    const ch = validChallenge();
    ch.goalType = "invalid";
    await expectError(ch, "goalType");
  });
});

describe("Challenge schema — goalTarget", () => {
  it("goalTarget min 1", async () => {
    const ch = validChallenge();
    ch.goalTarget = 0;
    await expectError(ch, "goalTarget");
  });

  it("goalTarget required", async () => {
    const ch = validChallenge();
    ch.goalTarget = undefined;
    await expectError(ch, "goalTarget");
  });
});

describe("Challenge schema — difficulty", () => {
  it("difficulty defaults to beginner", () => {
    const ch = new Challenge({
      title: "Test Challenge That Is Long Enough",
      description: "This is a description that is long enough for the challenge to be valid.",
      category: "cardio",
      startDate: new Date(),
      endDate: new Date(),
      goalType: "count",
      goalTarget: 10,
    });
    expect(ch.difficulty).toBe("beginner");
  });
});

// ─── CommunityPost ────────────────────────────────────────────────────────────

const validPost = () => new CommunityPost({
  author: fakeId(),
  authorName: "Alice",
  authorType: "fitness-enthusiast",
  content: "This is my transformation story and I am very proud of it!",
  category: "transformation",
});

describe("CommunityPost schema — content", () => {
  it("valid post passes", async () => {
    await expect(validPost().validate()).resolves.toBeUndefined();
  });

  it("content required", async () => {
    const post = validPost();
    post.content = undefined;
    await expectError(post, "content");
  });

  it("content maxlength 5000", async () => {
    const post = validPost();
    post.content = "A".repeat(5001);
    await expectError(post, "content");
  });
});

describe("CommunityPost schema — category", () => {
  it("valid categories pass", async () => {
    const cats = ["tip", "question", "transformation", "motivation", "discussion", "success-story"];
    for (const cat of cats) {
      const post = validPost();
      post.category = cat;
      await expect(post.validate()).resolves.toBeUndefined();
    }
  });

  it("invalid category fails", async () => {
    const post = validPost();
    post.category = "rant";
    await expectError(post, "category");
  });
});

describe("CommunityPost schema — defaults", () => {
  it("likesCount defaults to 0", () => {
    expect(validPost().likesCount).toBe(0);
  });

  it("commentsCount defaults to 0", () => {
    expect(validPost().commentsCount).toBe(0);
  });

  it("isPinned defaults to false", () => {
    expect(validPost().isPinned).toBe(false);
  });

  it("isVisible defaults to true", () => {
    expect(validPost().isVisible).toBe(true);
  });
});
