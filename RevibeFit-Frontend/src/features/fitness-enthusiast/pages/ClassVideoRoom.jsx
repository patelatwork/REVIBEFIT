import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebRTC } from '../../../hooks/useWebRTC';

/* ───── Reusable video tile (memoised to prevent flicker) ───── */
const VideoTile = memo(({ stream, name, isTrainer: isTrn }) => {
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
   ClassVideoRoom – Participant's Zoom-like view
   Pinned trainer video (large) + other participants strip + self PiP
   ═══════════════════════════════════════════════════════════════════ */
const ClassVideoRoom = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const trainerVideoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  const {
    isConnected,
    localStream,
    remoteStreams,
    participantCount,
    messages,
    error,
    isClassActive,
    trainerDisconnected,
    classEnded,
    isMuted,
    isVideoOff,
    joinClass,
    leaveClass,
    sendMessage,
    toggleMute,
    toggleVideo,
    cleanup,
  } = useWebRTC(classId, false);

  // Split remote streams into trainer vs other participants
  const trainerEntry = Object.entries(remoteStreams).find(
    ([, v]) => v.isTrainer
  );
  const otherEntries = Object.entries(remoteStreams).filter(
    ([, v]) => !v.isTrainer
  );

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

  // ── Attach local stream to self-view video ──
  // Depend on hasJoined so the effect re-fires once the <video> element mounts.
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, hasJoined]);

  // ── Attach trainer stream to pinned video ──
  // Use the actual MediaStream object as dep (stable reference) instead of
  // trainerEntry (which is a new array every render → flicker).
  const trainerStream = trainerEntry?.[1]?.stream ?? null;
  useEffect(() => {
    if (trainerStream && trainerVideoRef.current) {
      trainerVideoRef.current.srcObject = trainerStream;
    }
  }, [trainerStream]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => cleanup();
  }, []);

  const handleJoin = async () => {
    await joinClass();
    setHasJoined(true);
  };

  const handleLeave = () => {
    leaveClass();
    navigate('/fitness-enthusiast/live-classes');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  /* ── Loading / Error screens ── */
  if (loadingInfo)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">Loading class...</p>
        </div>
      </div>
    );

  if (!classInfo)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">
            Class not found or you haven't booked this class.
          </p>
          <button
            onClick={() => navigate('/classes')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Browse Classes
          </button>
        </div>
      </div>
    );

  if (classEnded)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Class Has Ended
          </h2>
          <p className="text-gray-400 mb-6">
            Thank you for attending "{classInfo.title}"!
          </p>
          <button
            onClick={() => navigate('/fitness-enthusiast/live-classes')}
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
              hasJoined && isClassActive
                ? handleLeave()
                : navigate('/fitness-enthusiast/live-classes')
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
            <p className="text-gray-500 text-sm">
              Trainer: {classInfo.trainer?.name} •{' '}
              <span className="capitalize">{classInfo.classType}</span> •{' '}
              {classInfo.duration} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isClassActive && (
            <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {participantCount}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Video Area ── */}
        <div className="flex-1 flex flex-col">
          {!hasJoined ? (
            /* ── Pre-join screen ── */
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="text-center max-w-lg mx-auto px-4">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">
                    {classInfo.title}
                  </h2>
                  <p className="text-gray-400 mb-1">
                    with {classInfo.trainer?.name}
                  </p>
                  <p className="text-gray-500 text-sm mb-4 capitalize">
                    {classInfo.classType} • {classInfo.duration} min •{' '}
                    {classInfo.maxParticipants} max participants
                  </p>

                  {classInfo.status === 'ongoing' ? (
                    <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg mb-4 inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Class is live! Join now.
                    </div>
                  ) : classInfo.status === 'scheduled' ? (
                    <div className="bg-yellow-500/10 text-yellow-400 px-4 py-2 rounded-lg mb-4 inline-block">
                      Class hasn't started yet. The trainer will start soon.
                    </div>
                  ) : (
                    <div className="bg-gray-500/10 text-gray-400 px-4 py-2 rounded-lg mb-4 inline-block">
                      This class is {classInfo.status}.
                    </div>
                  )}

                  <p className="text-gray-600 text-xs mt-2">
                    Your camera & microphone will be shared with the class.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                {(classInfo.status === 'ongoing' ||
                  classInfo.status === 'scheduled') && (
                  <button
                    onClick={handleJoin}
                    className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg shadow-green-500/30"
                  >
                    {classInfo.status === 'ongoing'
                      ? 'Join Live Class'
                      : 'Join Waiting Room'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Joined: Pinned trainer + participant strip ── */
            <>
              {/* Main video: Pinned trainer */}
              <div className="flex-1 relative bg-black flex items-center justify-center">
                {trainerEntry ? (
                  <>
                    <video
                      ref={trainerVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                    {/* Trainer label */}
                    <div className="absolute top-3 left-3 bg-green-500/80 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white font-medium flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Trainer: {trainerEntry[1].name}
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h3 className="text-white text-xl font-semibold mb-2">
                      {trainerDisconnected
                        ? 'Trainer Reconnecting...'
                        : 'Waiting for Trainer'}
                    </h3>
                    <p className="text-gray-400">
                      {trainerDisconnected
                        ? 'The trainer lost connection. Please wait...'
                        : "The trainer\u2019s video will appear once they start broadcasting."}
                    </p>
                  </div>
                )}

                {/* Trainer disconnected overlay */}
                {trainerDisconnected && trainerEntry && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-yellow-400 font-medium">
                        Trainer reconnecting...
                      </p>
                      <p className="text-gray-400 text-sm">Please wait</p>
                    </div>
                  </div>
                )}

                {/* Self-view PiP (bottom-right corner) */}
                {localStream && (
                  <div className="absolute bottom-4 right-4 w-44 aspect-video rounded-lg overflow-hidden border-2 border-gray-600 shadow-xl bg-gray-800">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs text-white">
                      You
                    </span>
                    {isVideoOff && (
                      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Other participants strip (horizontal, scrollable) */}
              {otherEntries.length > 0 && (
                <div className="h-32 bg-gray-900/80 border-t border-gray-800 flex gap-2 p-2 overflow-x-auto items-center">
                  {otherEntries.map(([socketId, { stream, name }]) => (
                    <div
                      key={socketId}
                      className="h-full aspect-video flex-shrink-0"
                    >
                      <VideoTile stream={stream} name={name} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Controls Bar ── */}
          {hasJoined && (
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
                onClick={() => setShowChat(!showChat)}
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

              {/* Leave class */}
              <button
                onClick={handleLeave}
                className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                title="Leave class"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── Chat Panel ── */}
        {hasJoined && showChat && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold">Live Chat</h3>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 ? (
                <p className="text-gray-600 text-center text-sm">
                  No messages yet.
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
                          msg.isTrainer ? 'text-green-400' : 'text-blue-400'
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
          </div>
        )}
      </div>

      {/* ── Error Toast ── */}
      {error && hasJoined && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default ClassVideoRoom;
