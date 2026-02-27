import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../../../hooks/useWebRTC';

/* ───── Reusable video tile (memoised to prevent flicker) ───── */
const VideoTile = memo(({ stream, name, isTrainer: isTrn }) => {
  // Callback ref: only sets srcObject when the DOM node changes or stream changes
  const lastStreamRef = useRef(null);
  const videoRef = useCallback(
    (node) => {
      if (node && stream && lastStreamRef.current !== stream) {
        node.srcObject = stream;
        lastStreamRef.current = stream;
      }
    },
    [stream]
  );

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex-shrink-0">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {name && (
        <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white truncate max-w-[90%]">
          {name}
          {isTrn && ' 🎓'}
        </span>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   TrainerVideoRoom – Zoom-like layout
   Large self-view + scrollable participant video strip + chat panel
   ═══════════════════════════════════════════════════════════════════ */
const TrainerVideoRoom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    isConnected,
    localStream,
    remoteStreams,
    participantCount,
    participants,
    messages,
    error,
    isClassActive,
    classEnded,
    isMuted,
    isVideoOff,
    startClass,
    endClass,
    sendMessage,
    toggleMute,
    toggleVideo,
    cleanup,
  } = useWebRTC(classId, true);

  const remoteEntries = Object.entries(remoteStreams);

  // ── Fetch class info via REST ──
  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(
          `http://localhost:8000/api/classes/${classId}/room-info`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setClassInfo(data.success ? data.data : null);
      } catch {
        setClassInfo(null);
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchClassInfo();
  }, [classId]);

  // ── Attach local stream to video element ──
  // Must depend on isClassActive because the <video> element only mounts
  // when isClassActive is true; without this dep the ref is null on first fire.
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isClassActive]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Elapsed time timer ──
  useEffect(() => {
    let interval;
    if (isClassActive) {
      interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isClassActive]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => cleanup();
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0)
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleEndClass = () => {
    endClass();
    setShowEndConfirm(false);
    setTimeout(() => navigate('/trainer/live-classes'), 2000);
  };

  /* ── Loading / Error screens ── */
  if (loadingInfo)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">Loading class info...</p>
        </div>
      </div>
    );

  if (!classInfo)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">
            Class not found or you don't have access.
          </p>
          <button
            onClick={() => navigate('/trainer/live-classes')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to My Classes
          </button>
        </div>
      </div>
    );

  if (!classInfo.isTrainer)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">
            Only the class trainer can access this room.
          </p>
          <button
            onClick={() => navigate('/trainer/live-classes')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to My Classes
          </button>
        </div>
      </div>
    );

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* ── Top Bar ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              isClassActive
                ? setShowEndConfirm(true)
                : navigate('/trainer/live-classes')
            }
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-semibold text-lg">
              {classInfo.title}
            </h1>
            <p className="text-gray-500 text-sm capitalize">
              {classInfo.classType} • {classInfo.duration} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isClassActive && (
            <>
              <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </div>
              <span className="text-gray-400 text-sm font-mono">
                {formatTime(elapsedTime)}
              </span>
            </>
          )}
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {participantCount}/{classInfo.maxParticipants}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Video Area ── */}
        <div className="flex-1 flex flex-col">
          {!isClassActive && !classEnded ? (
            /* ── Pre-start screen ── */
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">
                  Ready to Go Live?
                </h2>
                <p className="text-gray-400 mb-2">
                  {classInfo.currentParticipants} participant
                  {classInfo.currentParticipants !== 1 ? 's' : ''} booked
                </p>
                <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                  Your camera and microphone will be activated when you start
                  the class. All participants will see and hear each other.
                </p>

                {error && (
                  <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4 max-w-md mx-auto">
                    {error}
                  </div>
                )}

                <button
                  onClick={startClass}
                  className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg shadow-green-500/30"
                >
                  Start Live Class
                </button>
              </div>
            </div>
          ) : classEnded ? (
            /* ── Class ended screen ── */
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">
                  Class Ended
                </h2>
                <p className="text-gray-400 mb-1">
                  Duration: {formatTime(elapsedTime)}
                </p>
                <p className="text-gray-500 mb-6">
                  Total participants: {participantCount}
                </p>
                <button
                  onClick={() => navigate('/trainer/live-classes')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Back to My Classes
                </button>
              </div>
            </div>
          ) : (
            /* ── LIVE: Self‑view + participant strip ── */
            <>
              {/* Large self-view */}
              <div className="flex-1 relative bg-black flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Label */}
                <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm text-white font-medium">
                  You (Trainer)
                </span>

                {/* Video off overlay */}
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <p className="text-gray-400">Camera Off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Participant video strip (horizontal, below self-view) */}
              {remoteEntries.length > 0 && (
                <div className="h-36 bg-gray-900/80 border-t border-gray-800 flex gap-2 p-2 overflow-x-auto items-center">
                  {remoteEntries.map(
                    ([socketId, { stream, name, isTrainer: isTrn }]) => (
                      <div key={socketId} className="h-full aspect-video flex-shrink-0">
                        <VideoTile
                          stream={stream}
                          name={name}
                          isTrainer={isTrn}
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Controls Bar ── */}
          {isClassActive && (
            <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 flex items-center justify-center gap-4">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMuted
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              {/* Video */}
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isVideoOff
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              {/* Chat toggle */}
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setShowParticipants(false);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  showChat
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle chat"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Participants toggle */}
              <button
                onClick={() => {
                  setShowParticipants(!showParticipants);
                  setShowChat(false);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  showParticipants
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle participants"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* End class */}
              <button
                onClick={() => setShowEndConfirm(true)}
                className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                title="End class"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Side Panel: Chat / Participants ── */}
        {isClassActive && (showChat || showParticipants) && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold">
                {showChat ? 'Live Chat' : `Participants (${participantCount})`}
              </h3>
            </div>

            {showChat ? (
              <>
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {messages.length === 0 ? (
                    <p className="text-gray-600 text-center text-sm">
                      No messages yet. Say hi to your class!
                    </p>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`${
                          msg.isTrainer ? 'bg-green-500/10' : 'bg-gray-800'
                        } rounded-lg p-2.5`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-medium ${
                              msg.isTrainer
                                ? 'text-green-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {msg.senderName}
                            {msg.isTrainer && (
                              <span className="ml-1 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                Trainer
                              </span>
                            )}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-gray-800 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                {participants.length === 0 ? (
                  <p className="text-gray-600 text-center text-sm">
                    No participants yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div
                        key={p.socketId}
                        className="flex items-center gap-3 bg-gray-800 rounded-lg p-3"
                      >
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <span className="text-green-400 text-sm font-medium">
                            {p.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {p.name}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {p.isTrainer ? 'Trainer' : 'Participant'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── End Class Confirmation Modal ── */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 border border-gray-800">
            <h3 className="text-white text-xl font-bold mb-2">End Class?</h3>
            <p className="text-gray-400 mb-6">
              This will disconnect all {participantCount} participant
              {participantCount !== 1 ? 's' : ''} and end the live session. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEndClass}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                End Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Toast ── */}
      {error && isClassActive && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default TrainerVideoRoom;
