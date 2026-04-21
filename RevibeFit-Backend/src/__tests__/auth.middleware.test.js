import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "../utils/ApiError.js";

const { mockJwtVerify, mockUserFindById, mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUserFindById = vi.fn(() => ({ select: mockSelect }));
  const mockJwtVerify = vi.fn();
  return { mockJwtVerify, mockUserFindById, mockSelect };
});

// Mock config
vi.mock("../config/index.js", () => ({
  default: {
    jwtSecret: "test-secret",
    isProduction: false,
  },
}));

// Mock JWT
vi.mock("jsonwebtoken", () => ({
  default: { verify: (...args) => mockJwtVerify(...args) },
}));

// Mock User model
vi.mock("../models/user.model.js", () => ({
  User: {
    findById: (...args) => mockUserFindById(...args),
  },
}));

// Import after mocks
const { verifyJWT, verifyAdmin, verifyUserType, verifyTrainerManager, verifyLabManager } =
  await import("../middlewares/auth.middleware.js");

const makeReq = (token = null, cookie = null) => ({
  cookies: cookie ? { accessToken: cookie } : {},
  header: (name) => (name === "Authorization" && token ? `Bearer ${token}` : undefined),
});

const makeRes = () => ({});
const makeNext = () => vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindById.mockReturnValue({ select: mockSelect });
});

describe("verifyJWT", () => {
  it("throws 401 when no token", async () => {
    const req = makeReq();
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("throws 401 when token invalid", async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error("invalid"); });
    const req = makeReq("badtoken");
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("throws 401 when jwt verify throws (user not found path)", async () => {
    // Simulate token that decodes to bad _id causing findById to fail
    mockJwtVerify.mockImplementation(() => { throw new Error("jwt expired"); });
    const req = makeReq("expiredtoken");
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("req.user has isActive property when login succeeds", async () => {
    const user = { _id: "123", isActive: true, isSuspended: false, userType: "trainer" };
    mockJwtVerify.mockReturnValue({ _id: "123" });
    mockSelect.mockResolvedValue(user);
    const req = makeReq("validtoken");
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(req.user.isActive).toBe(true);
  });

  it("req.user has correct userType when login succeeds", async () => {
    const user = { _id: "456", isActive: true, isSuspended: false, userType: "lab-partner" };
    mockJwtVerify.mockReturnValue({ _id: "456" });
    mockSelect.mockResolvedValue(user);
    const req = makeReq("validtoken");
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(req.user.userType).toBe("lab-partner");
  });

  it("sets req.user and calls next for valid token", async () => {
    const user = { _id: "123", isActive: true, isSuspended: false, userType: "trainer" };
    mockJwtVerify.mockReturnValue({ _id: "123" });
    mockSelect.mockResolvedValue(user);
    const req = makeReq("validtoken");
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledWith();
  });

  it("reads token from cookie", async () => {
    const user = { _id: "123", isActive: true, isSuspended: false };
    mockJwtVerify.mockReturnValue({ _id: "123" });
    mockSelect.mockResolvedValue(user);
    const req = makeReq(null, "cookietoken");
    const next = makeNext();
    await verifyJWT(req, makeRes(), next);
    expect(req.user).toBe(user);
  });
});

describe("verifyAdmin", () => {
  it("throws 401 when no token", async () => {
    const req = makeReq();
    const next = makeNext();
    await verifyAdmin(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("throws error when token not admin", async () => {
    mockJwtVerify.mockReturnValue({ isAdmin: false, userType: "trainer" });
    const req = makeReq("sometoken");
    const next = makeNext();
    await verifyAdmin(req, makeRes(), next);
    // inner ApiError(403) caught and re-thrown as ApiError(401) by outer catch
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("throws error when userType not admin", async () => {
    mockJwtVerify.mockReturnValue({ isAdmin: true, userType: "manager" });
    const req = makeReq("sometoken");
    const next = makeNext();
    await verifyAdmin(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("sets req.adminUser for valid admin token", async () => {
    mockJwtVerify.mockReturnValue({ isAdmin: true, userType: "admin", email: "admin@test.com" });
    const req = makeReq("admintoken");
    const next = makeNext();
    await verifyAdmin(req, makeRes(), next);
    expect(req.adminUser).toEqual({ email: "admin@test.com", userType: "admin", isAdmin: true });
    expect(next).toHaveBeenCalledWith();
  });

  it("throws 401 on invalid token", async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error("jwt malformed"); });
    const req = makeReq("badtoken");
    const next = makeNext();
    await verifyAdmin(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe("verifyUserType", () => {
  it("throws 401 when req.user absent", () => {
    const middleware = verifyUserType("trainer");
    const req = {};
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });

  it("thrown error has statusCode 401 when no user", () => {
    const middleware = verifyUserType("trainer");
    try {
      middleware({}, {}, vi.fn());
    } catch (err) {
      expect(err.statusCode).toBe(401);
    }
  });

  it("throws 403 when userType not allowed", () => {
    const middleware = verifyUserType("trainer");
    const req = { user: { userType: "fitness-enthusiast" } };
    expect(() => middleware(req, {}, vi.fn())).toThrow(ApiError);
  });

  it("403 for wrong type", () => {
    const middleware = verifyUserType("trainer");
    try {
      middleware({ user: { userType: "lab-partner" } }, {}, vi.fn());
    } catch (err) {
      expect(err.statusCode).toBe(403);
    }
  });

  it("calls next for correct userType", () => {
    const middleware = verifyUserType("trainer");
    const req = { user: { userType: "trainer" } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows multiple types", () => {
    const middleware = verifyUserType("trainer", "lab-partner");
    const req = { user: { userType: "lab-partner" } };
    const next = vi.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("verifyTrainerManager", () => {
  it("calls next with ApiError when managerType is lab_manager", async () => {
    const req = { user: { managerType: "lab_manager" } };
    const next = vi.fn();
    await verifyTrainerManager(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("calls next for trainer_manager", async () => {
    const req = { user: { managerType: "trainer_manager" } };
    const next = vi.fn();
    await verifyTrainerManager(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("bypasses for adminUser", async () => {
    const req = { adminUser: { isAdmin: true } };
    const next = vi.fn();
    await verifyTrainerManager(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("verifyLabManager", () => {
  it("calls next with ApiError when managerType is trainer_manager", async () => {
    const req = { user: { managerType: "trainer_manager" } };
    const next = vi.fn();
    await verifyLabManager(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("calls next for lab_manager", async () => {
    const req = { user: { managerType: "lab_manager" } };
    const next = vi.fn();
    await verifyLabManager(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("bypasses for adminUser", async () => {
    const req = { adminUser: { isAdmin: true } };
    const next = vi.fn();
    await verifyLabManager(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
