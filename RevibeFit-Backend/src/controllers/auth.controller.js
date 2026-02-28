import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { STATUS_CODES, USER_TYPES } from "../constants.js";
import config from "../config/index.js";
import jwt from "jsonwebtoken";

// Generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong while generating tokens"
    );
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    age,
    userType,
    fitnessGoal,
    specialization,
    laboratoryName,
    laboratoryAddress,
    licenseNumber,
    city,
    state,
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !phone || !age || !userType) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "All fields are required");
  }

  // Validate user type
  if (!Object.values(USER_TYPES).includes(userType)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid user type");
  }

  // Block manager self-registration — only admin can create managers
  if (userType === USER_TYPES.MANAGER) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      "Manager accounts can only be created by an admin"
    );
  }

  // Validate user type specific fields
  if (userType === USER_TYPES.FITNESS_ENTHUSIAST && !fitnessGoal) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Fitness goal is required for fitness enthusiasts"
    );
  }

  if (userType === USER_TYPES.TRAINER) {
    if (!specialization) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        "Specialization is required for trainers"
      );
    }
    if (!req.file) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        "Certification document is required for trainers"
      );
    }
  }

  if (userType === USER_TYPES.LAB_PARTNER) {
    if (!laboratoryName || !laboratoryAddress || !licenseNumber) {
      throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        "Laboratory details are required for lab partners"
      );
    }
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(
      STATUS_CODES.CONFLICT,
      "User with this email already exists"
    );
  }

  // Create user object
  const userData = {
    name,
    email,
    password,
    phone,
    age,
    userType,
    city: city || null,
    state: state || null,
  };

  // Add user type specific fields
  if (userType === USER_TYPES.FITNESS_ENTHUSIAST) {
    userData.fitnessGoal = fitnessGoal;
  } else if (userType === USER_TYPES.TRAINER) {
    userData.specialization = specialization;
    // Store only the relative path from public folder: temp/filename.pdf
    // req.file.filename gives just the filename, we prepend temp/
    userData.certifications = `temp/${req.file.filename}`;
  } else if (userType === USER_TYPES.LAB_PARTNER) {
    userData.laboratoryName = laboratoryName;
    userData.laboratoryAddress = laboratoryAddress;
    userData.licenseNumber = licenseNumber;
  }

  // Create user in database
  const user = await User.create(userData);

  // Get user without password
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong while registering user"
    );
  }

  // Determine response message based on user type
  let message = "User registered successfully";
  if (userType === USER_TYPES.TRAINER || userType === USER_TYPES.LAB_PARTNER) {
    message = "Registration successful! Your account is pending admin approval. You will be able to login once approved.";
  }

  return res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(STATUS_CODES.CREATED, createdUser, message)
    );
});

// @desc    Unified Login (all roles: admin, manager, users)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      "Email and password are required"
    );
  }

  // ── Path 1: Admin (env-based credentials) ──────────────────
  if (email === config.admin.email) {
    if (password !== config.admin.password) {
      throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
    }

    const adminData = {
      email: config.admin.email,
      name: config.admin.name,
      userType: USER_TYPES.ADMIN,
      isAdmin: true,
    };

    const accessToken = jwt.sign(
      { email: adminData.email, userType: USER_TYPES.ADMIN, isAdmin: true },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(STATUS_CODES.SUCCESS)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(
          STATUS_CODES.SUCCESS,
          {
            user: adminData,
            accessToken,
          },
          "Logged in successfully"
        )
      );
  }

  // ── Path 2: DB users (manager, fitness-enthusiast, trainer, lab-partner) ──
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      "Your account has been deactivated"
    );
  }

  // Check if user is suspended
  if (user.isSuspended) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      `Your account has been suspended. Reason: ${user.suspensionReason || 'No reason provided'}`
    );
  }

  // Check approval status for trainers and lab partners
  if (user.userType === USER_TYPES.TRAINER || user.userType === USER_TYPES.LAB_PARTNER) {
    if (user.approvalStatus === "pending") {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        "Your account is pending approval. Please wait for admin approval."
      );
    }
    if (user.approvalStatus === "rejected") {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        "Your account has been rejected. Please contact support."
      );
    }
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Get user without password
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Cookie options
  const options = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Logged in successfully"
      )
    );
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "strict",
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, {}, "User logged out successfully"));
});

export { signup, login, logout };
