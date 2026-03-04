import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Flame, Award, HandMetal, Clock, User, Trash2 } from 'lucide-react';

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

const categoryLabels = {
  tip: '💡 Tip',
  question: '❓ Question',
  transformation: '🔄 Transformation',
  motivation: '💪 Motivation',
  discussion: '💬 Discussion',
  'success-story': '🌟 Success Story',
};

const PostCard = ({ post, onReact, currentUserId, onDelete, basePath = '/community' }) => {
  const [showReactions, setShowReactions] = useState(false);

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
    return new Date(date).toLocaleDateString();
  };

  const isOwner = currentUserId && post.author?._id === currentUserId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center text-white font-bold text-sm">
            {post.authorName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <Link
              to={`${basePath}/user/${post.author?._id}`}
              className="font-semibold text-gray-900 hover:text-[#225533] transition-colors text-sm"
            >
              {post.authorName}
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-500">
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
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[post.category] || 'bg-gray-100 text-gray-700'}`}>
            {categoryLabels[post.category] || post.category}
          </span>
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(post._id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <Link to={`${basePath}/post/${post._id}`}>
        <div className="px-5 pb-3">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.content?.length > 300
              ? `${post.content.slice(0, 300)}...`
              : post.content}
          </p>
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative aspect-video bg-gray-100">
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${img}`}
                  alt={`Post image ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        )}
      </Link>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-5 pt-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag, i) => (
            <span key={i} className="text-xs text-[#3f8554] bg-[#3f8554]/10 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Reactions Summary */}
      <div className="px-5 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 mt-2">
        <div className="flex items-center gap-1">
          {post.reactionsCount && Object.entries(post.reactionsCount)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <span key={type} className="flex items-center gap-0.5">
                {reactionEmojis[type]?.icon} {count}
              </span>
            ))
          }
          {post.likesCount > 0 && (
            <span className="ml-1">{post.likesCount} reactions</span>
          )}
        </div>
        <Link to={`${basePath}/post/${post._id}`} className="hover:text-[#225533] transition-colors">
          <span className="flex items-center gap-1">
            <MessageCircle size={13} /> {post.commentsCount || 0} comments
          </span>
        </Link>
      </div>

      {/* Action Bar */}
      <div className="px-3 pb-3 flex items-center gap-1 border-t border-gray-100 pt-2 relative">
        <div
          className="relative flex-1"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            onClick={() => onReact && onReact(post._id, 'post', 'like')}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              post.userReaction
                ? 'text-[#225533] bg-[#225533]/10'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {post.userReaction ? reactionEmojis[post.userReaction]?.icon : '👍'}{' '}
            {post.userReaction ? reactionEmojis[post.userReaction]?.label : 'React'}
          </button>

          {/* Reaction Picker */}
          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1.5 flex gap-1 z-10">
              {Object.entries(reactionEmojis).map(([type, { icon, label }]) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReact && onReact(post._id, 'post', type);
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

        <Link
          to={`${basePath}/post/${post._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
        >
          <MessageCircle size={16} /> Comment
        </Link>
      </div>
    </div>
  );
};

export default PostCard;
