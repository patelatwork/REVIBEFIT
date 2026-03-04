import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Filter, ArrowLeft, Plus, Target, Calendar,
  Flame, Users, Dumbbell, Heart, Brain, Salad, Star
} from 'lucide-react';
import ChallengeCard from '../components/ChallengeCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const categoryFilters = [
  { value: '', label: 'All', icon: <Star size={14} /> },
  { value: 'strength', label: 'Strength', icon: <Dumbbell size={14} /> },
  { value: 'cardio', label: 'Cardio', icon: <Flame size={14} /> },
  { value: 'flexibility', label: 'Flexibility', icon: <Heart size={14} /> },
  { value: 'nutrition', label: 'Nutrition', icon: <Salad size={14} /> },
  { value: 'mindfulness', label: 'Mindfulness', icon: <Brain size={14} /> },
  { value: 'general', label: 'General', icon: <Target size={14} /> },
];

const statusFilters = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);

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

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        status,
      });
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);

      const res = await fetch(`${API_URL}/api/community/challenges?${params}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setChallenges(data.data.challenges);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [page, category, status, difficulty]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleJoin = async (challengeId) => {
    if (!user) {
      window.location.href = '/login';
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
        fetchChallenges();
      } else {
        alert(data.message || 'Failed to join challenge');
      }
    } catch (err) {
      console.error('Error joining challenge:', err);
    }
  };

  const isTrainerOrAdmin = user && (user.userType === 'trainer' || user.userType === 'admin');

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#225533] via-[#2d6b42] to-[#3f8554] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to="/community"
            className="inline-flex items-center gap-1 text-green-200 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Community
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center gap-3">
              <Trophy size={40} /> Fitness Challenges
            </h1>
            <p className="text-lg text-green-100 max-w-2xl mb-6">
              Push your limits, track your progress, and compete with the community.
              Join challenges crafted by expert trainers.
            </p>
            {isTrainerOrAdmin && (
              <Link
                to="/community/challenge/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#225533] font-semibold hover:bg-green-50 transition-colors shadow-lg"
              >
                <Plus size={18} /> Create Challenge
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 space-y-4">
          {/* Status Tabs */}
          <div className="flex gap-2">
            {statusFilters.map((s) => (
              <button
                key={s.value}
                onClick={() => { setStatus(s.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  status === s.value
                    ? 'bg-[#225533] text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Category & Difficulty */}
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'bg-[#3f8554] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              {['', 'beginner', 'intermediate', 'advanced'].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    difficulty === d
                      ? 'bg-[#225533] text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {d || 'All Levels'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-[#3f8554]"></div>
          </div>
        )}

        {/* Challenges Grid */}
        {!loading && challenges.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {challenges.map((challenge) => (
              <motion.div key={challenge._id} variants={item}>
                <ChallengeCard challenge={challenge} onJoin={handleJoin} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty */}
        {!loading && challenges.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Challenges Found</h3>
            <p className="text-gray-500">
              {status === 'active'
                ? 'No active challenges right now. Check back soon!'
                : `No ${status} challenges found.`}
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1
                    ? 'bg-[#225533] text-white'
                    : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;
