import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Trophy, Users, Filter, Plus, TrendingUp, Clock, Heart, Flame } from 'lucide-react';
import TrainerNavbar from '../components/TrainerNavbar';
import PostCard from '../../community/components/PostCard';
import CreatePostModal from '../../community/components/CreatePostModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const categories = [
  { value: '', label: 'All', icon: '🌐' },
  { value: 'discussion', label: 'Discussion', icon: '💬' },
  { value: 'question', label: 'Questions', icon: '❓' },
  { value: 'tip', label: 'Tips', icon: '💡' },
  { value: 'motivation', label: 'Motivation', icon: '🔥' },
  { value: 'transformation', label: 'Transformations', icon: '✨' },
  { value: 'success-story', label: 'Success Stories', icon: '🏆' },
];

const TrainerCommunity = () => {
  const navigate = useNavigate();
  const [trainerName, setTrainerName] = useState('Trainer');
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalMembers: 0, totalPosts: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getToken = () => localStorage.getItem('accessToken');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setTrainerName(JSON.parse(stored).name || 'Trainer'); } catch {}
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [category, sort, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page, limit: 10, sort });
      if (category) params.append('category', category);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/community/posts?${params}`, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts || []);
        setTotalPages(data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    setPage(1);
    setCategory('');
    fetchPosts();
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TrainerNavbar trainerName={trainerName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#225533] mb-1">Community</h1>
              <p className="text-gray-500 text-sm">Connect, inspire, and grow together with the fitness community.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#225533] text-white rounded-xl font-medium hover:bg-[#3f8554] transition-colors"
              >
                <Plus size={18} /> Create Post
              </button>
              <Link
                to="/trainer/community/challenges"
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#225533] text-[#225533] rounded-xl font-medium hover:bg-[#225533] hover:text-white transition-colors"
              >
                <Trophy size={18} /> Challenges
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: 'Members', value: stats.totalMembers, icon: Users },
              { label: 'Posts', value: stats.totalPosts, icon: MessageSquare },
              { label: 'Comments', value: stats.totalComments, icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="p-2 bg-[#225533]/10 rounded-lg">
                  <s.icon size={20} className="text-[#225533]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'bg-[#225533] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#225533]"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No posts yet</h3>
            <p className="text-gray-400 text-sm">Be the first to share something with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                basePath="/trainer/community"
                onPostClick={() => navigate(`/trainer/community/post/${post._id}`)}
                onReactionToggled={fetchPosts}
                onDeleted={fetchPosts}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  page === p ? 'bg-[#225533] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handlePostCreated} />
      )}
    </div>
  );
};

export default TrainerCommunity;
