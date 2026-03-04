import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageSquare, Trash2, UserPlus, UserMinus, Clock } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import CommentSection from '../../community/components/CommentSection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const reactionEmojis = { like: '👍', love: '❤️', fire: '🔥', clap: '👏' };

const AdminPostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const getToken = () => localStorage.getItem('accessToken');
  const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

  useEffect(() => { fetchPost(); }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/community/posts/${postId}`, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPost(data.data);
        if (token && data.data.author) checkFollowing(data.data.author._id || data.data.author);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const checkFollowing = async (userId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/community/is-following/${userId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      const data = await res.json();
      if (data.success) setIsFollowing(data.data.isFollowing);
    } catch {}
  };

  const toggleFollow = async () => {
    const authorId = post.author?._id || post.author;
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/community/follow/${authorId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      setIsFollowing(!isFollowing);
    } catch {}
  };

  const toggleReaction = async (type) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/community/react`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ targetId: post._id, targetType: 'post', type }),
      });
      fetchPost(); setShowReactions(false);
    } catch {}
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/community/posts/${post._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      navigate('/admin/community');
    } catch {}
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const currentUser = getCurrentUser();
  const isOwner = currentUser && post && (currentUser._id === (post.author?._id || post.author));

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="community" onSectionChange={() => {}} />

      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <Link to="/admin/community" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#225533] text-sm mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to Community
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#225533]"></div></div>
          ) : !post ? (
            <div className="text-center py-20 text-gray-400">Post not found</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#225533] flex items-center justify-center text-white font-bold text-lg">
                      {(post.authorName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{post.authorName}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">{post.authorType?.replace('-', ' ')}</span>
                        <Clock size={12} /> {timeAgo(post.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && !isOwner && (
                      <button onClick={toggleFollow} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-[#225533] text-white'}`}>
                        {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                      </button>
                    )}
                    <button onClick={deletePost} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                {post.category && <span className="inline-block mt-3 px-3 py-1 bg-[#225533]/10 text-[#225533] rounded-full text-xs font-medium capitalize">{post.category.replace('-', ' ')}</span>}
              </div>

              <div className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                {post.images?.length > 0 && (
                  <div className={`mt-4 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((img, i) => <img key={i} src={img.startsWith('http') ? img : `${API_URL}/${img}`} alt="" className="rounded-lg w-full object-cover max-h-96" />)}
                  </div>
                )}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {post.tags.map((tag) => <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">#{tag}</span>)}
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4">
                <div className="relative">
                  <button onClick={() => setShowReactions(!showReactions)} className="flex items-center gap-1.5 text-gray-500 hover:text-[#225533] text-sm transition-colors">
                    <Heart size={18} /> {post.likesCount || 0}
                  </button>
                  {showReactions && (
                    <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-lg">
                      {Object.entries(reactionEmojis).map(([type, emoji]) => (
                        <button key={type} onClick={() => toggleReaction(type)} className="text-xl hover:scale-125 transition-transform px-1" title={type}>{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-gray-500 text-sm"><MessageSquare size={18} /> {post.commentsCount || 0}</span>
              </div>

              <div className="border-t border-gray-100"><CommentSection postId={post._id} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPostDetail;
