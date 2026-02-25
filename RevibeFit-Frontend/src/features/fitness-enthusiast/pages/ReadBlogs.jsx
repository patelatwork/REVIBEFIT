import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReadBlogs = () => {
  const navigate = useNavigate();
  const [readBlogs, setReadBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      const userData = JSON.parse(user);
      if (userData.userType !== 'fitness-enthusiast') {
        navigate('/login');
      } else {
        fetchReadBlogs();
      }
    }
  }, [navigate]);

  const fetchReadBlogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/blogs/read-blogs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setReadBlogs(data.data);
      }
    } catch (err) {
      console.error('Error fetching read blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryBadgeClass = (category) => {
    const categoryClasses = {
      'fitness tips': 'bg-blue-100 text-blue-800',
      'nutrition': 'bg-green-100 text-green-800',
      'yoga': 'bg-purple-100 text-purple-800',
      'mental wellness': 'bg-pink-100 text-pink-800',
      'general': 'bg-gray-100 text-gray-800',
    };
    return categoryClasses[category] || categoryClasses['general'];
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-2">My Read Blogs</h1>
          <p className="text-gray-600">Track your reading journey and revisit your favorite articles</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading your reading history...</span>
          </div>
        ) : readBlogs.length > 0 ? (
          <div className="space-y-6">
            {readBlogs.map((blogReading) => (
              <div
                key={blogReading._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/blog/${blogReading.blogId._id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[#225533] mb-2 hover:text-[#3f8554] transition-colors">
                        {blogReading.blogId.title}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {blogReading.blogId.content.substring(0, 150)}...
                      </p>
                    </div>
                    {blogReading.blogId.thumbnail && (
                      <div className="ml-4 flex-shrink-0">
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${blogReading.blogId.thumbnail.replace(/\\/g, '/')}`}
                          alt={blogReading.blogId.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadgeClass(blogReading.blogId.category)}`}>
                        {blogReading.blogId.category}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>By {blogReading.blogId.author?.name || 'Anonymous'}</p>
                      <p className="font-medium">Read on {formatDate(blogReading.readAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No blogs read yet</h3>
            <p className="text-gray-500 mb-6">Start reading our amazing fitness blogs to track your progress here!</p>
            <button
              onClick={() => navigate('/blog')}
              className="px-6 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors duration-200 font-semibold"
            >
              Browse Blogs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadBlogs;