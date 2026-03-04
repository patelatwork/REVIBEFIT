import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, UserPlus, UserCheck, Trash2 } from 'lucide-react';
import CommentSection from '../components/CommentSection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const reactionEmojis = {
  like: { icon: '👍', label: 'Like' },
  love: { icon: '❤️', label: 'Love' },
  fire: { icon: '🔥', label: 'Fire' },
  clap: { icon: '👏', label: 'Clap' },
};

const categoryColors = {
  tip: 'bg-blue-100 text-blue-700',
  question: 'bg-purple-100 text-purple-700',
  transformation: 'bg-emerald-100 text-emerald-700',
  motivation: 'bg-amber-100 text-amber-700',
  discussion: 'bg-gray-100 text-gray-700',
  'success-story': 'bg-pink-100 text-pink-700',
};

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

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

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/community/posts/${postId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setPost(data.data);
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.data.comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  const checkFollowStatus = useCallback(async () => {
    if (!user || !post?.author?._id || user._id === post.author._id) return;
    try {
      const res = await fetch(`${API_URL}/api/community/is-following/${post.author._id}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) setIsFollowingAuthor(data.data.isFollowing);
    } catch { /* ignore */ }
  }, [user, post]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleReact = async (reactionType) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await fetch(`${API_URL}/api/community/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ targetId: postId, targetType: 'post', reactionType }),
      });
      fetchPost();
    } catch (err) {
      console.error('Error reacting:', err);
    }
  };

  const handleAddComment = async (content, parentComment) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await fetch(`${API_URL}/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ content, parentComment }),
      });
      fetchComments();
      fetchPost(); // refresh comment count
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await fetch(`${API_URL}/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      fetchComments();
      fetchPost();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await fetch(`${API_URL}/api/community/follow/${post.author._id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      setIsFollowingAuthor(!isFollowingAuthor);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch(`${API_URL}/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      navigate('/community');
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-[#3f8554]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Post Not Found</h2>
        <Link to="/community" className="text-[#225533] font-medium hover:underline">
          Back to Community
        </Link>
      </div>
    );
  }

  const isOwner = user && post.author?._id === user._id;

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#225533] transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back to Community
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Post Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Author Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center text-white font-bold text-lg">
                  {post.authorName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{post.authorName}</span>
                    {user && post.author?._id !== user._id && (
                      <button
                        onClick={handleFollow}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                          isFollowingAuthor
                            ? 'bg-[#225533]/10 text-[#225533]'
                            : 'bg-[#225533] text-white hover:bg-[#3f8554]'
                        }`}
                      >
                        {isFollowingAuthor ? <><UserCheck size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                      {post.authorType?.replace('-', ' ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[post.category] || ''}`}>
                  {post.category}
                </span>
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                {post.content}
              </p>
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.images.map((img, i) => (
                  <div key={i} className="aspect-video bg-gray-100">
                    <img
                      src={`${API_URL}/${img}`}
                      alt={`Post image ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="px-6 pt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag, i) => (
                  <span key={i} className="text-xs text-[#3f8554] bg-[#3f8554]/10 px-2.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reactions Bar */}
            <div className="px-6 py-3 border-t border-gray-100 mt-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {post.reactionsCount && Object.entries(post.reactionsCount)
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => (
                      <span key={type} className="flex items-center gap-0.5">
                        {reactionEmojis[type]?.icon} {count}
                      </span>
                    ))
                  }
                  {post.likesCount > 0 && <span className="ml-1 text-xs">{post.likesCount} reactions</span>}
                </div>
                <span className="text-xs text-gray-400">{post.commentsCount || 0} comments</span>
              </div>

              {/* Reaction Buttons */}
              <div
                className="relative inline-block"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <button
                  onClick={() => handleReact('like')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    post.userReaction
                      ? 'text-[#225533] bg-[#225533]/10'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {post.userReaction ? reactionEmojis[post.userReaction]?.icon : '👍'}{' '}
                  {post.userReaction ? reactionEmojis[post.userReaction]?.label : 'React'}
                </button>

                {showReactions && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-lg border px-2 py-1.5 flex gap-1 z-10">
                    {Object.entries(reactionEmojis).map(([type, { icon, label }]) => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(type);
                          setShowReactions(false);
                        }}
                        className={`text-xl hover:scale-125 transition-transform p-1 rounded-full ${
                          post.userReaction === type ? 'bg-[#225533]/10 scale-110' : ''
                        }`}
                        title={label}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="px-6 py-5 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Comments ({post.commentsCount || 0})</h3>
              <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                currentUserId={user?._id}
                loading={commentsLoading}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PostDetail;
