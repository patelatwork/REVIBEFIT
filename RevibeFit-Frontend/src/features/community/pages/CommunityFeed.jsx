import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, MessageCircle, TrendingUp, Plus, Filter, Search,
  Trophy, Flame, Heart, Sparkles, BookOpen, ArrowRight
} from 'lucide-react';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const categories = [
  { value: '', label: 'All', icon: '🌐' },
  { value: 'discussion', label: 'Discussion', icon: '💬' },
  { value: 'question', label: 'Questions', icon: '❓' },
  { value: 'tip', label: 'Tips', icon: '💡' },
  { value: 'motivation', label: 'Motivation', icon: '💪' },
  { value: 'transformation', label: 'Transformations', icon: '🔄' },
  { value: 'success-story', label: 'Success Stories', icon: '🌟' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: sortBy,
      });
      if (selectedCategory) params.append('category', selectedCategory);

      const res = await fetch(`${API_URL}/api/community/posts?${params}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, sortBy]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/stats`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreatePost = async (formData) => {
    try {
      const res = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      }
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleReact = async (targetId, targetType, reactionType) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/community/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ targetId, targetType, reactionType }),
      });
      if (res.ok) {
        fetchPosts(); // Refresh to show updated reactions
      }
    } catch (err) {
      console.error('Error reacting:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p._id !== postId));
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#225533] via-[#2d6b42] to-[#3f8554] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              RevibeFit Community
            </h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8">
              Connect, inspire, and grow together. Share your fitness journey with a supportive community.
            </p>

            {/* Stats */}
            {stats && (
              <div className="flex flex-wrap justify-center gap-6 mb-6">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2">
                  <Users size={18} />
                  <span className="font-semibold">{stats.totalMembers}</span>
                  <span className="text-green-200 text-sm">members</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2">
                  <MessageCircle size={18} />
                  <span className="font-semibold">{stats.totalPosts}</span>
                  <span className="text-green-200 text-sm">posts</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2">
                  <BookOpen size={18} />
                  <span className="font-semibold">{stats.totalComments}</span>
                  <span className="text-green-200 text-sm">comments</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#225533] font-semibold hover:bg-green-50 transition-colors shadow-lg"
                >
                  <Plus size={18} /> Create Post
                </button>
              )}
              <Link
                to="/community/challenges"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/60 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                <Trophy size={18} /> Challenges
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Filter size={16} className="text-[#3f8554]" /> Categories
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat.value
                        ? 'bg-[#225533] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#3f8554]" /> Sort By
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSortBy('latest'); setPage(1); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === 'latest'
                      ? 'bg-[#225533] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => { setSortBy('popular'); setPage(1); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === 'popular'
                      ? 'bg-[#225533] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-[#3f8554]" /> Explore
              </h3>
              <div className="space-y-2">
                <Link
                  to="/community/challenges"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-[#225533] transition-all"
                >
                  <Trophy size={15} /> Active Challenges
                  <ArrowRight size={13} className="ml-auto" />
                </Link>
                {user && (
                  <Link
                    to="/community/my-feed"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-[#225533] transition-all"
                  >
                    <Heart size={15} /> My Feed
                    <ArrowRight size={13} className="ml-auto" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="lg:col-span-3">
            {/* Create Post CTA (Mobile) */}
            {user && (
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm">Share something with the community...</span>
                </button>
              </div>
            )}

            {/* Desktop Create CTA */}
            {user && (
              <div className="hidden lg:block mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm">What&apos;s on your mind? Share tips, ask questions, or celebrate a win...</span>
                  <Plus size={18} className="ml-auto text-[#3f8554]" />
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-[#3f8554]"></div>
              </div>
            )}

            {/* Posts */}
            {!loading && posts.length > 0 && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                {posts.map((post) => (
                  <motion.div key={post._id} variants={item}>
                    <PostCard
                      post={post}
                      onReact={handleReact}
                      currentUserId={user?._id}
                      onDelete={handleDeletePost}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && posts.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategory
                    ? `No posts in this category yet. Be the first!`
                    : `Be the first to start a conversation!`}
                </p>
                {user && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2.5 rounded-full bg-[#225533] text-white font-semibold hover:bg-[#3f8554] transition-colors"
                  >
                    Create First Post
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-[#225533] text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default CommunityFeed;
