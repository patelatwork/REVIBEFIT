import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/user.model.js";
import { LiveClass } from "../models/liveClass.model.js";
import { ClassBooking } from "../models/classBooking.model.js";
import { USER_TYPES } from "../constants.js";

/**
 * Active rooms: Map<classId, {
 *   trainerId, trainerSocketId, trainerName,
 *   participants: Map<socketId, { userId, name }>,
 *   maxParticipants, startedAt
 * }>
 */
const activeRooms = new Map();

/**
 * Initialize Socket.IO on the HTTP server.
 *
 * Full‑mesh group video call signaling:
 *   1. Trainer starts class → creates room
 *   2. Participant joins   → gets list of ALL existing peers (trainer + others)
 *      and sends WebRTC offers to each of them
 *   3. Each existing peer receives the offer, responds with an answer
 *   4. ICE candidates exchanged for NAT traversal
 *   5. Every peer now sends AND receives media with every other peer
 */
export function initSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin.split(",").map((o) => o.trim()),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Authentication Middleware ──────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded._id).select(
        "-password -refreshToken"
      );

      if (!user || !user.isActive)
        return next(new Error("Invalid or inactive user"));

      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        userType: user.userType,
      };

      next();
    } catch (err) {
      next(new Error("Authentication failed: " + err.message));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected: ${socket.user.name} (${socket.user.userType}) – ${socket.id}`
    );

    // ── Trainer: Start Class ───────────────────────────────────
    socket.on("start-class", async ({ classId }, callback) => {
      try {
        const liveClass = await LiveClass.findById(classId);
        if (!liveClass) return callback({ error: "Class not found" });

        if (liveClass.trainerId.toString() !== socket.user._id)
          return callback({
            error: "Only the class trainer can start this class",
          });

        if (!["scheduled", "ongoing"].includes(liveClass.status))
          return callback({
            error: `Cannot start a ${liveClass.status} class`,
          });

        // Reconnect: room exists and trainer is the same user
        if (activeRooms.has(classId)) {
          const room = activeRooms.get(classId);
          if (room.trainerId === socket.user._id) {
            const oldSocketId = room.trainerSocketId;
            room.trainerSocketId = socket.id;
            socket.join(classId);

            // Build list of existing participants so trainer can reconnect
            const existingPeers = [];
            for (const [sid, p] of room.participants) {
              existingPeers.push({
                socketId: sid,
                name: p.name,
                isTrainer: false,
              });
            }

            // Tell participants the old trainer socket left and a new one appeared
            if (oldSocketId !== socket.id) {
              socket.to(classId).emit("peer-left", {
                socketId: oldSocketId,
                name: socket.user.name,
                participantCount: room.participants.size,
              });
              socket.to(classId).emit("new-peer", {
                socketId: socket.id,
                name: socket.user.name,
                userId: socket.user._id,
                isTrainer: true,
                participantCount: room.participants.size,
              });
            }

            return callback({
              success: true,
              message: "Reconnected to class",
              participantCount: room.participants.size,
              existingPeers,
            });
          }
          return callback({ error: "Class is already running" });
        }

        // Create a new room
        activeRooms.set(classId, {
          trainerId: socket.user._id,
          trainerSocketId: socket.id,
          trainerName: socket.user.name,
          participants: new Map(),
          maxParticipants: liveClass.maxParticipants,
          startedAt: new Date(),
        });

        socket.join(classId);
        await LiveClass.findByIdAndUpdate(classId, { status: "ongoing" });

        console.log(
          `[Socket] Room created: ${classId} by ${socket.user.name}`
        );

        callback({
          success: true,
          message: "Class started",
          participantCount: 0,
          existingPeers: [],
        });
      } catch (err) {
        console.error("[Socket] start-class error:", err);
        callback({ error: "Failed to start class" });
      }
    });

    // ── Participant: Join Class ────────────────────────────────
    socket.on("join-class", async ({ classId }, callback) => {
      try {
        const room = activeRooms.get(classId);
        if (!room) return callback({ error: "Class has not started yet" });

        if (
          socket.user.userType === USER_TYPES.TRAINER &&
          room.trainerId === socket.user._id
        ) {
          return callback({
            error: "You are the trainer — use start-class instead",
          });
        }

        const booking = await ClassBooking.findOne({
          userId: socket.user._id,
          classId,
          bookingStatus: "active",
        });
        if (!booking)
          return callback({
            error: "You must book this class before joining",
          });

        if (room.participants.size >= room.maxParticipants)
          return callback({ error: "Class is full" });

        // Handle reconnection (same user, new socket)
        const existingEntry = [...room.participants.entries()].find(
          ([, p]) => p.userId === socket.user._id
        );
        if (existingEntry) {
          const oldSid = existingEntry[0];
          room.participants.delete(oldSid);
          socket.to(classId).emit("peer-left", {
            socketId: oldSid,
            name: socket.user.name,
            participantCount: room.participants.size,
          });
        }

        // Add participant
        room.participants.set(socket.id, {
          userId: socket.user._id,
          name: socket.user.name,
        });

        socket.join(classId);

        await ClassBooking.findByIdAndUpdate(booking._id, {
          joinedAt: new Date(),
          attendanceStatus: "attended",
        });

        // Build list of ALL existing peers (trainer + other participants)
        const existingPeers = [
          {
            socketId: room.trainerSocketId,
            name: room.trainerName,
            isTrainer: true,
          },
        ];
        for (const [sid, p] of room.participants) {
          if (sid !== socket.id) {
            existingPeers.push({
              socketId: sid,
              name: p.name,
              isTrainer: false,
            });
          }
        }

        // Notify ALL existing room members about the new peer
        socket.to(classId).emit("new-peer", {
          socketId: socket.id,
          name: socket.user.name,
          userId: socket.user._id,
          isTrainer: false,
          participantCount: room.participants.size,
        });

        console.log(
          `[Socket] ${socket.user.name} joined class ${classId} (${room.participants.size}/${room.maxParticipants})`
        );

        callback({
          success: true,
          existingPeers,
          participantCount: room.participants.size,
        });
      } catch (err) {
        console.error("[Socket] join-class error:", err);
        callback({ error: "Failed to join class" });
      }
    });

    // ── WebRTC Signaling: Offer ─────────────────────────────────
    socket.on("webrtc-offer", ({ classId, targetSocketId, offer }) => {
      // Look up whether sender is the trainer so the recipient knows
      const room = activeRooms.get(classId);
      const senderIsTrainer = room
        ? room.trainerSocketId === socket.id
        : false;

      io.to(targetSocketId).emit("webrtc-offer", {
        offer,
        senderSocketId: socket.id,
        senderName: socket.user.name,
        senderIsTrainer,
      });
    });

    // ── WebRTC Signaling: Answer ────────────────────────────────
    socket.on("webrtc-answer", ({ classId, targetSocketId, answer }) => {
      io.to(targetSocketId).emit("webrtc-answer", {
        answer,
        senderSocketId: socket.id,
      });
    });

    // ── WebRTC Signaling: ICE Candidate ─────────────────────────
    socket.on("ice-candidate", ({ classId, targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate,
        senderSocketId: socket.id,
      });
    });

    // ── Chat Message ────────────────────────────────────────────
    socket.on("class-message", ({ classId, message }) => {
      const room = activeRooms.get(classId);
      if (!room) return;

      const isTrainer = room.trainerSocketId === socket.id;
      const isParticipant = room.participants.has(socket.id);
      if (!isTrainer && !isParticipant) return;

      io.to(classId).emit("class-message", {
        senderId: socket.user._id,
        senderName: socket.user.name,
        message,
        isTrainer,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Trainer: End Class ──────────────────────────────────────
    socket.on("end-class", async ({ classId }, callback) => {
      try {
        const room = activeRooms.get(classId);
        if (!room)
          return callback?.({ error: "No active room for this class" });

        if (room.trainerId !== socket.user._id)
          return callback?.({ error: "Only the trainer can end the class" });

        io.to(classId).emit("class-ended", {
          message: "The trainer has ended the class",
        });

        await ClassBooking.updateMany(
          { classId, bookingStatus: "active" },
          { bookingStatus: "completed", leftAt: new Date() }
        );
        await LiveClass.findByIdAndUpdate(classId, { status: "completed" });

        const roomSockets = await io.in(classId).fetchSockets();
        for (const s of roomSockets) s.leave(classId);

        activeRooms.delete(classId);

        console.log(`[Socket] Room destroyed: ${classId}`);
        callback?.({ success: true, message: "Class ended" });
      } catch (err) {
        console.error("[Socket] end-class error:", err);
        callback?.({ error: "Failed to end class" });
      }
    });

    // ── Participant: Leave Class ────────────────────────────────
    socket.on("leave-class", async ({ classId }) => {
      handleParticipantLeave(socket, classId, io);
    });

    // ── Disconnect ──────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(
        `[Socket] Disconnected: ${socket.user.name} – ${socket.id}`
      );

      for (const [classId, room] of activeRooms.entries()) {
        if (room.trainerSocketId === socket.id) {
          // Trainer disconnected — notify participants, keep room alive
          io.to(classId).emit("trainer-disconnected", {
            message: "Trainer connection lost. Waiting for reconnection...",
          });
          // Also signal peer-left so participants tear down old PeerConnections
          io.to(classId).emit("peer-left", {
            socketId: socket.id,
            name: socket.user.name,
            participantCount: room.participants.size,
          });

          // Grace period: destroy room if trainer doesn't reconnect
          setTimeout(async () => {
            const currentRoom = activeRooms.get(classId);
            if (currentRoom && currentRoom.trainerSocketId === socket.id) {
              io.to(classId).emit("class-ended", {
                message: "Class ended due to trainer disconnection",
              });

              await ClassBooking.updateMany(
                { classId, bookingStatus: "active" },
                { bookingStatus: "completed", leftAt: new Date() }
              ).catch(console.error);

              await LiveClass.findByIdAndUpdate(classId, {
                status: "completed",
              }).catch(console.error);

              activeRooms.delete(classId);
              console.log(
                `[Socket] Room auto-destroyed (trainer disconnect): ${classId}`
              );
            }
          }, 30000);
        } else if (room.participants.has(socket.id)) {
          handleParticipantLeave(socket, classId, io);
        }
      }
    });

    // ── Get Room Info ───────────────────────────────────────────
    socket.on("get-room-info", ({ classId }, callback) => {
      const room = activeRooms.get(classId);
      if (!room) return callback({ error: "No active room" });

      callback({
        success: true,
        trainerName: room.trainerName,
        participantCount: room.participants.size,
        maxParticipants: room.maxParticipants,
        participants: [...room.participants.values()].map((p) => ({
          name: p.name,
        })),
        startedAt: room.startedAt,
      });
    });
  });

  return io;
}

// ── Helper: Handle participant leaving ───────────────────────────
async function handleParticipantLeave(socket, classId, io) {
  const room = activeRooms.get(classId);
  if (!room) return;

  const participant = room.participants.get(socket.id);
  if (!participant) return;

  room.participants.delete(socket.id);
  socket.leave(classId);

  await ClassBooking.findOneAndUpdate(
    { userId: participant.userId, classId, bookingStatus: "active" },
    { leftAt: new Date() }
  ).catch(console.error);

  // Notify ALL remaining room members (trainer + other participants)
  socket.to(classId).emit("peer-left", {
    socketId: socket.id,
    name: participant.name,
    userId: participant.userId,
    participantCount: room.participants.size,
  });

  console.log(
    `[Socket] ${participant.name} left class ${classId} (${room.participants.size}/${room.maxParticipants})`
  );
}

/**
 * Utility to get active rooms info (for admin endpoints).
 */
export function getActiveRooms() {
  const rooms = [];
  for (const [classId, room] of activeRooms.entries()) {
    rooms.push({
      classId,
      trainerName: room.trainerName,
      participantCount: room.participants.size,
      maxParticipants: room.maxParticipants,
      startedAt: room.startedAt,
    });
  }
  return rooms;
}
