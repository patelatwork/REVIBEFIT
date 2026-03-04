import { useState } from 'react';
import { Send, Reply, Trash2 } from 'lucide-react';

const CommentSection = ({ comments, onAddComment, onDeleteComment, currentUserId, loading }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    await onAddComment(newComment.trim(), null);
    setNewComment('');
    setSubmitting(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    await onAddComment(replyContent.trim(), replyTo);
    setReplyContent('');
    setReplyTo(null);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-1">
          U
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 rounded-full bg-gray-100 border border-transparent focus:border-[#3f8554] focus:bg-white focus:outline-none text-sm transition-all"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="p-2 rounded-full bg-[#225533] text-white hover:bg-[#3f8554] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3f8554]"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="space-y-3">
              {/* Main comment */}
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                  {comment.authorName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-400 capitalize bg-gray-100 px-1.5 py-0.5 rounded">
                        {comment.authorType?.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-2 text-xs text-gray-500">
                    <span>{timeAgo(comment.createdAt)}</span>
                    <button
                      onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                      className="flex items-center gap-1 hover:text-[#225533] transition-colors font-medium"
                    >
                      <Reply size={12} /> Reply
                    </button>
                    {currentUserId && comment.author?._id === currentUserId && (
                      <button
                        onClick={() => onDeleteComment(comment._id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>

                  {/* Reply Input */}
                  {replyTo === comment._id && (
                    <form onSubmit={handleReply} className="flex gap-2 mt-2 ml-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.authorName}...`}
                        className="flex-1 px-3 py-1.5 rounded-full bg-gray-100 border border-transparent focus:border-[#3f8554] focus:bg-white focus:outline-none text-sm transition-all"
                        autoFocus
                        maxLength={2000}
                      />
                      <button
                        type="submit"
                        disabled={!replyContent.trim() || submitting}
                        className="p-1.5 rounded-full bg-[#225533] text-white hover:bg-[#3f8554] disabled:opacity-50 transition-colors"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-10 space-y-3 border-l-2 border-gray-100 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-[10px] flex-shrink-0">
                        {reply.authorName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-xs text-gray-900">{reply.authorName}</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                        {currentUserId && reply.author?._id === currentUserId && (
                          <button
                            onClick={() => onDeleteComment(reply._id)}
                            className="ml-2 mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
