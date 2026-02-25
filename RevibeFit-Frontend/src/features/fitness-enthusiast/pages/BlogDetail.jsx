import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRead, setIsRead] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchBlogDetail();
    checkReadStatus();
  }, [id]);

  const fetchBlogDetail = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/blogs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog');
      }

      const data = await response.json();
      
      if (data.success) {
        setBlog(data.data);
      } else {
        setError('Blog not found');
      }
    } catch (err) {
      console.error('Error fetching blog:', err);
      setError('Unable to load blog. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const checkReadStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      
      if (!token || !user) return;
      
      const userData = JSON.parse(user);
      if (userData.userType !== 'fitness-enthusiast') return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/blogs/${id}/read-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsRead(data.data.hasRead);
      }
    } catch (err) {
      console.error('Error checking read status:', err);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      setMarkingAsRead(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      console.log('Marking blog as read:', id);
      console.log('API URL:', `${apiUrl}/api/blogs/${id}/mark-read`);
      
      const response = await fetch(`${apiUrl}/api/blogs/${id}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setIsRead(true);
        console.log('Blog marked as read successfully');
        
        // Show success message
        alert('Blog marked as completed! Check your dashboard to see it in your reading history.');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(`Failed to mark blog as read: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error marking blog as read:', err);
      alert('An error occurred while marking the blog as read. Please try again.');
    } finally {
      setMarkingAsRead(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#3f8554]"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">{error || 'Blog not found'}</h2>
          <button
            onClick={() => navigate('/blog')}
            className="px-6 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors duration-200"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center text-[#3f8554] hover:text-[#225533] font-semibold mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blogs
        </Link>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#225533] mb-4">
          {blog.title}
        </h1>

        {/* Category Badge */}
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-[#3f8554] text-white text-sm font-semibold rounded-full">
            {blog.category}
          </span>
        </div>

        {/* Author and Meta Info */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full bg-[#3f8554] flex items-center justify-center text-white font-bold text-xl mr-4">
              {blog.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-[#225533]">{blog.authorName}</p>
              <p className="text-sm text-gray-600">
                {blog.author?.specialization || 'Certified Trainer'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{formatDate(blog.createdAt)}</p>
          </div>
        </div>

        {/* Thumbnail Image */}
        <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
          <img
            src={getThumbnailUrl(blog.thumbnail)}
            alt={blog.title}
            className="w-full h-96 object-cover"
            onError={(e) => {
              console.error('Image failed to load:', blog.thumbnail);
              console.error('Attempted URL:', getThumbnailUrl(blog.thumbnail));
              e.target.src = 'https://via.placeholder.com/800x400?text=Blog+Image';
            }}
          />
        </div>

        {/* Blog Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {blog.content}
          </div>
        </div>

        {/* Mark as Read Button - Only for fitness enthusiasts */}
        {(() => {
          const user = localStorage.getItem('user');
          if (user) {
            const userData = JSON.parse(user);
            if (userData.userType === 'fitness-enthusiast') {
              return (
                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  {isRead ? (
                    <div className="flex items-center justify-center bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Completed Reading</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        onClick={handleMarkAsRead}
                        disabled={markingAsRead}
                        className="px-8 py-4 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors duration-200 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {markingAsRead ? 'Marking as Read...' : 'Mark as Completed Reading'}
                      </button>
                    </div>
                  )}
                </div>
              );
            }
          }
          return null;
        })()}

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <h3 className="text-xl font-bold text-[#225533] mb-4">Share this post</h3>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Facebook
            </button>
            <button className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-200">
              Twitter
            </button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
              WhatsApp
            </button>
          </div>
        </div>

        {/* Contact Trainer Section */}
        {blog.author && (
          <div className="mt-12 bg-gradient-to-r from-[#225533] to-[#3f8554] rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Want to know more?</h3>
            <p className="mb-6">
              Contact {blog.authorName} for personalized training advice and consultation.
            </p>
            <div className="flex gap-4">
              <Link
                to="/trainers"
                className="px-6 py-3 bg-white text-[#225533] rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
              >
                View Trainer Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetail;
