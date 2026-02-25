import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const BlogCard = ({ blog }) => {
  const getThumbnailUrl = (thumbPath) => {
    if (!thumbPath) return null;
    if (thumbPath.startsWith('http')) return thumbPath;
    // Replace backslashes with forward slashes for proper URL
    const normalizedPath = thumbPath.replace(/\\/g, '/');
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${normalizedPath}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="h-56 overflow-hidden">
        <img
          src={getThumbnailUrl(blog.thumbnail)}
          alt={blog.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=Blog+Image';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <span className="inline-block px-3 py-1 bg-[#3f8554] text-white text-sm font-semibold rounded-full mb-3">
          {blog.category}
        </span>

        {/* Title */}
        <h3 className="text-2xl font-bold text-[#225533] mb-3 line-clamp-2">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {blog.content}
        </p>

        {/* Author and Date */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#3f8554] flex items-center justify-center text-white font-bold mr-3">
              {blog.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#225533]">{blog.authorName}</p>
              <p className="text-xs text-gray-500">Certified Trainer</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(blog.createdAt)}
          </div>
        </div>

        {/* Read More Button */}
        <Link
          to={`/blog/${blog._id}`}
          className="mt-4 block w-full text-center py-2 px-4 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors duration-200 font-semibold"
        >
          Read More
        </Link>
      </div>
    </div>
  );
};

BlogCard.propTypes = {
  blog: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    thumbnail: PropTypes.string.isRequired,
    authorName: PropTypes.string.isRequired,
    views: PropTypes.number,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default BlogCard;
