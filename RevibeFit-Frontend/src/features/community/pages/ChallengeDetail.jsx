import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trophy, Target, Users, Calendar, Clock, Star,
  TrendingUp, Award, CheckCircle, Plus, Trash2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const ChallengeDetail = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [progressValue, setProgressValue] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchChallenge = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/community/challenges/${challengeId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setChallenge(data.data);
    } catch (err) {
      console.error('Error fetching challenge:', err);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/challenges/${challengeId}/leaderboard`);
      const data = await res.json();
      if (data.success) setLeaderboard(data.data.leaderboard);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
    fetchLeaderboard();
  }, [fetchChallenge, fetchLeaderboard]);

  const handleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/community/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchChallenge();
        fetchLeaderboard();
      } else {
        alert(data.message || 'Failed to join');
      }
    } catch (err) {
      console.error('Error joining:', err);
    }
  };

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!progressValue || parseFloat(progressValue) <= 0) return;

    setSubmittingProgress(true);
    try {
      const res = await fetch(`${API_URL}/api/community/challenges/${challengeId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ value: parseFloat(progressValue), note: progressNote }),
      });
      const data = await res.json();
      if (data.success) {
        setProgressValue('');
        setProgressNote('');
        setShowProgressForm(false);
        fetchChallenge();
        fetchLeaderboard();
        if (data.data.isCompleted) {
          alert('🎉 Congratulations! You completed the challenge!');
        }
      } else {
        alert(data.message || 'Failed to log progress');
      }
    } catch (err) {
      console.error('Error logging progress:', err);
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    try {
      await fetch(`${API_URL}/api/community/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      navigate('/community/challenges');
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-[#3f8554]"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Challenge Not Found</h2>
        <Link to="/community/challenges" className="text-[#225533] font-medium hover:underline">
          Back to Challenges
        </Link>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const isActive = startDate <= now && endDate >= now;
  const isEnded = endDate < now;
  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const participation = challenge.participation || {};
  const progressPercent = participation.joined
    ? Math.min(100, Math.round((participation.progress / challenge.goalTarget) * 100))
    : 0;
  const isOwner = user && challenge.createdBy?._id === user._id;

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      {/* Hero */}
      <div className="relative">
        <div className="h-56 md:h-72 bg-gradient-to-br from-[#225533] to-[#3f8554] overflow-hidden">
          {challenge.coverImage && (
            <img
              src={`${API_URL}/${challenge.coverImage}`}
              alt={challenge.title}
              className="w-full h-full object-cover opacity-30"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto w-full px-4 pb-8">
            <Link
              to="/community/challenges"
              className="inline-flex items-center gap-1 text-green-200 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft size={15} /> Back to Challenges
            </Link>
            <div className="flex gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColors[challenge.difficulty]}`}>
                {challenge.difficulty}
              </span>
              {isActive && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-500 text-white">Active</span>}
              {isEnded && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-500 text-white">Ended</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {challenge.title}
            </h1>
            <p className="text-green-100 text-sm">
              By {challenge.creatorName} • {challenge.category}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="font-bold text-gray-900 text-lg mb-3">About this Challenge</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {challenge.description}
              </p>

              {/* Rules */}
              {challenge.rules && challenge.rules.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-[#3f8554]" /> Rules
                  </h3>
                  <ul className="space-y-1.5">
                    {challenge.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-[#225533]/10 text-[#225533] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* My Progress (if joined) */}
            {participation.joined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#3f8554]" /> Your Progress
                  </h2>
                  {isActive && !participation.isCompleted && (
                    <button
                      onClick={() => setShowProgressForm(!showProgressForm)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#225533] text-white hover:bg-[#3f8554] transition-colors"
                    >
                      <Plus size={14} /> Log Progress
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">
                      {participation.progress} / {challenge.goalTarget} {challenge.goalUnit}
                    </span>
                    <span className="font-bold text-[#225533]">{progressPercent}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        participation.isCompleted
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-[#225533] to-[#3f8554]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {participation.isCompleted && (
                    <p className="text-emerald-600 font-bold mt-2 flex items-center gap-1">
                      <Trophy size={16} /> Challenge Completed! 🎉
                    </p>
                  )}
                </div>

                {/* Progress Form */}
                {showProgressForm && (
                  <form onSubmit={handleLogProgress} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 font-medium block mb-1">
                          Progress ({challenge.goalUnit})
                        </label>
                        <input
                          type="number"
                          value={progressValue}
                          onChange={(e) => setProgressValue(e.target.value)}
                          placeholder={`e.g., 10`}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm"
                          min="0.1"
                          step="0.1"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 font-medium block mb-1">Note (optional)</label>
                        <input
                          type="text"
                          value={progressNote}
                          onChange={(e) => setProgressNote(e.target.value)}
                          placeholder="How did it go?"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm"
                          maxLength={500}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingProgress || !progressValue}
                      className="w-full py-2 rounded-lg bg-[#225533] text-white font-medium hover:bg-[#3f8554] disabled:opacity-50 transition-colors text-sm"
                    >
                      {submittingProgress ? 'Saving...' : 'Log Progress'}
                    </button>
                  </form>
                )}

                {/* Progress Log */}
                {participation.progressLog && participation.progressLog.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {[...participation.progressLog].reverse().slice(0, 10).map((log, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                          <span className="w-2 h-2 rounded-full bg-[#3f8554] flex-shrink-0" />
                          <span className="font-medium text-gray-800">+{log.value} {challenge.goalUnit}</span>
                          {log.note && <span className="text-gray-500 truncate">{log.note}</span>}
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                            {new Date(log.loggedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <Award size={18} className="text-amber-500" /> Leaderboard
              </h2>

              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const entryPercent = Math.min(100, Math.round((entry.progress / challenge.goalTarget) * 100));
                    return (
                      <div
                        key={entry.rank}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          entry.rank <= 3 ? 'bg-amber-50/50 border border-amber-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1 ? 'bg-amber-400 text-white' :
                          entry.rank === 2 ? 'bg-gray-300 text-white' :
                          entry.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {entry.userName}
                            </span>
                            {entry.isCompleted && (
                              <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#225533] to-[#3f8554] transition-all"
                              style={{ width: `${entryPercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#225533] flex-shrink-0">
                          {entry.progress}/{challenge.goalTarget}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-8">
                  No participants yet. Be the first to join!
                </p>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Challenge Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 sticky top-24">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target size={16} className="text-[#3f8554]" />
                  <span>Goal: <strong>{challenge.goalTarget} {challenge.goalUnit}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-[#3f8554]" />
                  <span>{new Date(challenge.startDate).toLocaleDateString()} → {new Date(challenge.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-[#3f8554]" />
                  <span>{totalDays} days total {isActive && `(${daysLeft}d left)`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-[#3f8554]" />
                  <span>{challenge.participantsCount} participants</span>
                  {challenge.maxParticipants && (
                    <span className="text-gray-400">/ {challenge.maxParticipants}</span>
                  )}
                </div>
              </div>

              {/* Join / Status Button */}
              {!participation.joined && isActive && (
                <button
                  onClick={handleJoin}
                  className="w-full py-3 rounded-xl bg-[#225533] text-white font-bold hover:bg-[#3f8554] transition-colors flex items-center justify-center gap-2"
                >
                  <Trophy size={18} /> Join Challenge
                </button>
              )}
              {participation.joined && !participation.isCompleted && isActive && (
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-sm font-medium text-green-700">You&apos;re in! 💪</p>
                  <p className="text-xs text-green-600 mt-0.5">Keep logging your progress</p>
                </div>
              )}
              {participation.isCompleted && (
                <div className="p-3 bg-emerald-50 rounded-lg text-center">
                  <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-1">
                    <Trophy size={16} /> Challenge Complete! 🎉
                  </p>
                </div>
              )}
              {isEnded && !participation.joined && (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">This challenge has ended</p>
                </div>
              )}

              {/* Delete (for owner) */}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="w-full py-2 rounded-lg border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> Delete Challenge
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;
