import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

/**
 * Full-mesh WebRTC hook for group video calls.
 *
 * Every user (trainer + participants) captures their local camera/mic and
 * establishes a separate RTCPeerConnection with EVERY other user in the room.
 * This gives a Zoom-like experience where everyone sees everyone.
 *
 * @param {string} classId – MongoDB _id of the live class
 * @param {boolean} isTrainer – Whether the current user is the trainer
 */
export function useWebRTC(classId, isTrainer) {
  /* ───── Refs (mutable, no stale-closure issues) ───── */
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId → RTCPeerConnection
  const pendingCandidatesRef = useRef(new Map()); // socketId → ICECandidate[]

  /* ───── State ───── */
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: { stream, name, isTrainer } }
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]); // [{ socketId, name, isTrainer }]
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isClassActive, setIsClassActive] = useState(false);
  const [trainerDisconnected, setTrainerDisconnected] = useState(false);
  const [classEnded, setClassEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  /* ───── Create Socket Connection ───── */
  const connectSocket = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Authentication required. Please log in.");
      return null;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("[WebRTC] Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on("connect_error", (err) => {
      console.error("[WebRTC] Socket connect error:", err.message);
      setError("Connection failed: " + err.message);
      setIsConnected(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebRTC] Socket disconnected:", reason);
      setIsConnected(false);
    });

    return socket;
  }, []);

  /* ───── Capture Camera + Mic ───── */
  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("[WebRTC] Media access error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera/microphone permission denied. Please allow access.");
      } else if (err.name === "NotFoundError") {
        setError("No camera or microphone found.");
      } else {
        setError("Failed to access media devices: " + err.message);
      }
      return null;
    }
  }, []);

  /* ───── Create PeerConnection (unified for any peer) ───── */
  const createPeerConnection = (
    peerSocketId,
    peerName,
    peerIsTrainer
  ) => {
    // Tear down existing connection to same peer (reconnect case)
    if (peerConnectionsRef.current.has(peerSocketId)) {
      peerConnectionsRef.current.get(peerSocketId).close();
      peerConnectionsRef.current.delete(peerSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Attach our local tracks so the remote side receives our media
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // When the remote side's tracks arrive, store their stream.
    // ontrack fires once per track (audio + video). We skip the update
    // if we already have the exact same MediaStream object to avoid
    // unnecessary React re-renders that cause flickering.
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams((prev) => {
          if (prev[peerSocketId]?.stream === stream) return prev;
          return {
            ...prev,
            [peerSocketId]: {
              stream,
              name: peerName,
              isTrainer: peerIsTrainer,
            },
          };
        });
      }
    };

    // Trickle ICE candidates to the remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          classId,
          targetSocketId: peerSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE state ${peerSocketId}: ${state}`);
      if (state === "connected" || state === "completed") {
        setTrainerDisconnected(false);
      }
    };

    peerConnectionsRef.current.set(peerSocketId, pc);
    return pc;
  };

  /* ───── Flush queued ICE candidates once remote description is set ───── */
  const flushPendingICE = async (socketId, pc) => {
    const pending = pendingCandidatesRef.current.get(socketId);
    if (pending) {
      for (const c of pending) {
        await pc
          .addIceCandidate(new RTCIceCandidate(c))
          .catch(console.error);
      }
      pendingCandidatesRef.current.delete(socketId);
    }
  };

  /* ───── Send an offer to one peer ───── */
  const sendOfferToPeer = async (socket, peer) => {
    const pc = createPeerConnection(
      peer.socketId,
      peer.name,
      peer.isTrainer
    );
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      classId,
      targetSocketId: peer.socketId,
      offer: pc.localDescription,
    });
  };

  /* ───── Register shared signaling events on a socket ───── */
  const registerSignalingEvents = (socket) => {
    // ── Incoming offer (a peer who joined after us wants to connect) ──
    socket.on(
      "webrtc-offer",
      async ({ offer, senderSocketId, senderName, senderIsTrainer }) => {
        console.log("[WebRTC] Offer from:", senderName);

        const pc = createPeerConnection(
          senderSocketId,
          senderName,
          senderIsTrainer
        );
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingICE(senderSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          classId,
          targetSocketId: senderSocketId,
          answer: pc.localDescription,
        });
      }
    );

    // ── Incoming answer (response to an offer we sent) ──
    socket.on("webrtc-answer", async ({ answer, senderSocketId }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingICE(senderSocketId, pc);
      }
    });

    // ── ICE candidate relay ──
    socket.on("ice-candidate", async ({ candidate, senderSocketId }) => {
      const pc = peerConnectionsRef.current.get(senderSocketId);
      if (pc && pc.remoteDescription) {
        await pc
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(console.error);
      } else {
        // Queue until remote description is set
        if (!pendingCandidatesRef.current.has(senderSocketId)) {
          pendingCandidatesRef.current.set(senderSocketId, []);
        }
        pendingCandidatesRef.current.get(senderSocketId).push(candidate);
      }
    });

    // ── A new peer joined the room ──
    socket.on(
      "new-peer",
      ({
        socketId,
        name,
        userId,
        isTrainer: peerIsTrainer,
        participantCount: count,
      }) => {
        console.log("[WebRTC] New peer:", name);
        setParticipants((prev) => [
          ...prev.filter((p) => p.socketId !== socketId),
          { socketId, name, userId, isTrainer: peerIsTrainer },
        ]);
        if (count !== undefined) setParticipantCount(count);
      }
    );

    // ── A peer left the room ──
    socket.on(
      "peer-left",
      ({ socketId, name, participantCount: count }) => {
        console.log("[WebRTC] Peer left:", name || socketId);

        const pc = peerConnectionsRef.current.get(socketId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(socketId);
        }
        pendingCandidatesRef.current.delete(socketId);

        setRemoteStreams((prev) => {
          const { [socketId]: _, ...rest } = prev;
          return rest;
        });
        setParticipants((prev) =>
          prev.filter((p) => p.socketId !== socketId)
        );
        if (count !== undefined) setParticipantCount(count);
      }
    );

    // ── Chat ──
    socket.on("class-message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );

    // ── Trainer went offline ──
    socket.on("trainer-disconnected", () => {
      setTrainerDisconnected(true);
    });

    // ── Class was ended by the trainer ──
    socket.on("class-ended", () => {
      setClassEnded(true);
      setIsClassActive(false);
    });
  };

  /* ═══════════════════════════════════════════════════════════════
     Trainer: Start Class
     ═══════════════════════════════════════════════════════════════ */
  const startClass = useCallback(async () => {
    try {
      // 1. Capture local media (camera + mic)
      const stream = await getLocalMedia();
      if (!stream) return;

      // 2. Connect socket
      const socket = connectSocket();
      if (!socket) return;
      socketRef.current = socket;

      // 3. Register signaling events BEFORE anything fires
      registerSignalingEvents(socket);

      // 4. Once connected, tell the server to start the class
      socket.on("connect", () => {
        socket.emit("start-class", { classId }, async (response) => {
          if (response.error) {
            setError(response.error);
            return;
          }

          setIsClassActive(true);
          setParticipantCount(response.participantCount || 0);
          console.log("[WebRTC] Class started:", response.message);

          // If trainer is reconnecting, send offers to existing participants
          if (response.existingPeers?.length > 0) {
            for (const peer of response.existingPeers) {
              await sendOfferToPeer(socket, peer);
            }
          }
        });
      });
    } catch (err) {
      console.error("[WebRTC] Start class error:", err);
      setError("Failed to start class: " + err.message);
    }
  }, [classId, getLocalMedia, connectSocket]);

  /* ═══════════════════════════════════════════════════════════════
     Participant: Join Class
     ═══════════════════════════════════════════════════════════════ */
  const joinClass = useCallback(async () => {
    try {
      // 1. Capture local media so every peer receives our video/audio
      const stream = await getLocalMedia();
      if (!stream) return;

      // 2. Connect socket
      const socket = connectSocket();
      if (!socket) return;
      socketRef.current = socket;

      // 3. Register signaling events
      registerSignalingEvents(socket);

      // 4. Once connected, join the room
      socket.on("connect", () => {
        socket.emit("join-class", { classId }, async (response) => {
          if (response.error) {
            setError(response.error);
            return;
          }

          setIsClassActive(true);
          setParticipantCount(response.participantCount);
          console.log(
            "[WebRTC] Joined class with",
            response.existingPeers?.length,
            "existing peers"
          );

          // Seed participants list from existing peers
          if (response.existingPeers?.length > 0) {
            setParticipants(
              response.existingPeers.map((p) => ({
                socketId: p.socketId,
                name: p.name,
                isTrainer: p.isTrainer,
              }))
            );

            // Create PeerConnection & send offer to EVERY existing peer
            for (const peer of response.existingPeers) {
              await sendOfferToPeer(socket, peer);
            }
          }
        });
      });
    } catch (err) {
      console.error("[WebRTC] Join class error:", err);
      setError("Failed to join class: " + err.message);
    }
  }, [classId, getLocalMedia, connectSocket]);

  /* ───── End Class (Trainer only) ───── */
  const endClass = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("end-class", { classId }, (response) => {
        if (response?.error) {
          setError(response.error);
          return;
        }
        setIsClassActive(false);
        setClassEnded(true);
        console.log("[WebRTC] Class ended");
      });
    }
  }, [classId]);

  /* ───── Leave Class (Participant) ───── */
  const leaveClass = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("leave-class", { classId });
    }
    cleanup();
  }, [classId]);

  /* ───── Send Chat Message ───── */
  const sendMessage = useCallback(
    (message) => {
      if (socketRef.current && message.trim()) {
        socketRef.current.emit("class-message", { classId, message });
      }
    },
    [classId]
  );

  /* ───── Toggle Mute ───── */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  /* ───── Toggle Video ───── */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff((prev) => !prev);
    }
  }, []);

  /* ───── Full Cleanup ───── */
  const cleanup = useCallback(() => {
    for (const [, pc] of peerConnectionsRef.current) pc.close();
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setRemoteStreams({});
    setIsConnected(false);
    setIsClassActive(false);
  }, []);

  /* ───── Cleanup on unmount ───── */
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    // State
    isConnected,
    localStream,
    remoteStreams,
    participantCount,
    participants,
    messages,
    error,
    isClassActive,
    trainerDisconnected,
    classEnded,
    isMuted,
    isVideoOff,

    // Actions
    startClass,
    joinClass,
    endClass,
    leaveClass,
    sendMessage,
    toggleMute,
    toggleVideo,
    cleanup,
  };
}
