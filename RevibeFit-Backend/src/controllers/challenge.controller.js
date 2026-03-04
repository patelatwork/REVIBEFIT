import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Challenge } from "../models/challenge.model.js";
import { ChallengeParticipant } from "../models/challengeParticipant.model.js";
import { USER_TYPES } from "../constants.js";

/**
 * @desc    Create a new fitness challenge
 * @route   POST /api/community/challenges
 * @access  Private (Trainer or Admin only)
 */
export const createChallenge = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    startDate,
    endDate,
    goalType,
    goalTarget,
    goalUnit,
    rules,
    maxParticipants,
    difficulty,
  } = req.body;

  // Only trainers and admins can create challenges
  if (
    req.user.userType !== USER_TYPES.TRAINER &&
    req.user.userType !== USER_TYPES.ADMIN
  ) {
    throw new ApiError(403, "Only trainers and admins can create challenges");
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new ApiError(400, "End date must be after start date");
  }

  // Handle cover image
  let coverImage = null;
  if (req.file) {
    const filePath = req.file.path.split("public")[1] || req.file.path;
    coverImage = filePath.replace(/\\/g, "/").replace(/^\//, "");
  }

  const challenge = await Challenge.create({
    title,
    description,
    category,
    coverImage,
    createdBy: req.user._id,
    creatorName: req.user.name,
    creatorType: req.user.userType,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    goalType,
    goalTarget: parseInt(goalTarget),
    goalUnit,
    rules: rules
      ? Array.isArray(rules)
        ? rules
        : rules.split("|").map((r) => r.trim())
      : [],
    maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
    difficulty: difficulty || "beginner",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, challenge, "Challenge created successfully"));
});

/**
 * @desc    Get all active challenges
 * @route   GET /api/community/challenges
 * @access  Public
 */
export const getChallenges = asyncHandler(async (req, res) => {
  const { category, difficulty, status = "active", page = 1, limit = 10 } = req.query;

  const now = new Date();
  const filter = {};

  if (status === "active") {
    filter.isActive = true;
    filter.endDate = { $gte: now };
  } else if (status === "upcoming") {
    filter.isActive = true;
    filter.startDate = { $gt: now };
  } else if (status === "completed") {
    filter.$or = [{ endDate: { $lt: now } }, { isActive: false }];
  }

  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [challenges, total] = await Promise.all([
    Challenge.find(filter)
      .populate("createdBy", "name userType")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Challenge.countDocuments(filter),
  ]);

  // If user is authenticated, check their participation status
  let participationMap = {};
  if (req.user) {
    const challengeIds = challenges.map((c) => c._id);
    const participations = await ChallengeParticipant.find({
      challenge: { $in: challengeIds },
      user: req.user._id,
    });
    participations.forEach((p) => {
      participationMap[p.challenge.toString()] = {
        joined: true,
        progress: p.progress,
        isCompleted: p.isCompleted,
      };
    });
  }

  const challengesWithMeta = challenges.map((challenge) => ({
    ...challenge.toObject(),
    participation: participationMap[challenge._id.toString()] || {
      joined: false,
      progress: 0,
      isCompleted: false,
    },
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        challenges: challengesWithMeta,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Challenges retrieved successfully"
    )
  );
});

/**
 * @desc    Get single challenge details
 * @route   GET /api/community/challenges/:challengeId
 * @access  Public
 */
export const getChallengeById = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  const challenge = await Challenge.findById(challengeId).populate(
    "createdBy",
    "name userType"
  );

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  // Get participation info if logged in
  let participation = null;
  if (req.user) {
    participation = await ChallengeParticipant.findOne({
      challenge: challengeId,
      user: req.user._id,
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...challenge.toObject(),
        participation: participation
          ? {
              joined: true,
              progress: participation.progress,
              isCompleted: participation.isCompleted,
              progressLog: participation.progressLog,
            }
          : { joined: false },
      },
      "Challenge retrieved successfully"
    )
  );
});

/**
 * @desc    Join a challenge
 * @route   POST /api/community/challenges/:challengeId/join
 * @access  Private
 */
export const joinChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user._id;

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  if (!challenge.isActive) {
    throw new ApiError(400, "This challenge is no longer active");
  }

  if (new Date() > new Date(challenge.endDate)) {
    throw new ApiError(400, "This challenge has already ended");
  }

  if (
    challenge.maxParticipants &&
    challenge.participantsCount >= challenge.maxParticipants
  ) {
    throw new ApiError(400, "This challenge is full");
  }

  // Check if already joined
  const existing = await ChallengeParticipant.findOne({
    challenge: challengeId,
    user: userId,
  });
  if (existing) {
    throw new ApiError(400, "You have already joined this challenge");
  }

  const participant = await ChallengeParticipant.create({
    challenge: challengeId,
    user: userId,
    userName: req.user.name,
  });

  await Challenge.findByIdAndUpdate(challengeId, {
    $inc: { participantsCount: 1 },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, participant, "Successfully joined the challenge!")
    );
});

/**
 * @desc    Log progress for a challenge
 * @route   POST /api/community/challenges/:challengeId/progress
 * @access  Private (participant only)
 */
export const logProgress = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { value, note } = req.body;
  const userId = req.user._id;

  if (!value || value <= 0) {
    throw new ApiError(400, "Progress value must be a positive number");
  }

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  if (new Date() > new Date(challenge.endDate)) {
    throw new ApiError(400, "This challenge has already ended");
  }

  const participant = await ChallengeParticipant.findOne({
    challenge: challengeId,
    user: userId,
  });

  if (!participant) {
    throw new ApiError(400, "You have not joined this challenge");
  }

  if (participant.isCompleted) {
    throw new ApiError(400, "You have already completed this challenge");
  }

  // Add to progress log
  participant.progressLog.push({
    value: parseFloat(value),
    note: note || "",
    loggedAt: new Date(),
  });

  // Update total progress
  participant.progress += parseFloat(value);

  // Check if completed
  if (participant.progress >= challenge.goalTarget) {
    participant.isCompleted = true;
    participant.completedAt = new Date();
  }

  await participant.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        progress: participant.progress,
        goalTarget: challenge.goalTarget,
        isCompleted: participant.isCompleted,
        percentComplete: Math.min(
          100,
          Math.round((participant.progress / challenge.goalTarget) * 100)
        ),
      },
      "Progress logged successfully"
    )
  );
});

/**
 * @desc    Get challenge leaderboard
 * @route   GET /api/community/challenges/:challengeId/leaderboard
 * @access  Public
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { limit = 20 } = req.query;

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  const leaderboard = await ChallengeParticipant.find({
    challenge: challengeId,
  })
    .populate("user", "name userType")
    .sort({ progress: -1, completedAt: 1 })
    .limit(parseInt(limit));

  const leaderboardData = leaderboard.map((entry, index) => ({
    rank: index + 1,
    user: entry.user,
    userName: entry.userName,
    progress: entry.progress,
    percentComplete: Math.min(
      100,
      Math.round((entry.progress / challenge.goalTarget) * 100)
    ),
    isCompleted: entry.isCompleted,
    completedAt: entry.completedAt,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        challenge: {
          title: challenge.title,
          goalTarget: challenge.goalTarget,
          goalUnit: challenge.goalUnit,
          participantsCount: challenge.participantsCount,
        },
        leaderboard: leaderboardData,
      },
      "Leaderboard retrieved successfully"
    )
  );
});

/**
 * @desc    Delete a challenge (creator or admin only)
 * @route   DELETE /api/community/challenges/:challengeId
 * @access  Private (creator or admin)
 */
export const deleteChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user._id;

  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  if (
    challenge.createdBy.toString() !== userId.toString() &&
    req.user.userType !== USER_TYPES.ADMIN
  ) {
    throw new ApiError(403, "You can only delete challenges you created");
  }

  // Delete all participants
  await ChallengeParticipant.deleteMany({ challenge: challengeId });
  await Challenge.findByIdAndDelete(challengeId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Challenge deleted successfully"));
});
