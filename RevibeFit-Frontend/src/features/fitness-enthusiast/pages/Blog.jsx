import { useEffect, useState } from 'react';
import BlogCard from '../components/BlogCard';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Fitness Tips', 'Nutrition', 'Yoga', 'Mental Wellness', 'General'];

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const categoryParam = selectedCategory !== 'All' ? `?category=${selectedCategory}` : '';
      const response = await fetch(`${apiUrl}/api/blogs${categoryParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }

      const data = await response.json();
      
      if (data.success) {
        setBlogs(data.data);
      } else {
        setError('Failed to load blogs');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Unable to load blogs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#225533] mb-4">
            Fitness & Wellness Blog
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Expert insights, tips, and advice from our certified trainers to help you achieve your fitness goals.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-[#3f8554] text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#3f8554]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center max-w-2xl mx-auto">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchBlogs}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Blog Posts Found</h3>
            <p className="text-gray-600">
              {selectedCategory !== 'All' 
                ? `No posts in ${selectedCategory} category yet. Try another category.`
                : 'Check back soon for new content from our trainers!'}
            </p>
          </div>
        )}

        {/* Blogs Grid */}
        {!loading && !error && blogs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-[#225533] to-[#3f8554] rounded-lg shadow-lg p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                <div>
                  <h3 className="text-4xl font-bold mb-2">{blogs.length}</h3>
                  <p className="font-medium">Blog Posts</p>
                </div>
                <div>
                  <h3 className="text-4xl font-bold mb-2">
                    {new Set(blogs.map(b => b.authorName)).size}
                  </h3>
                  <p className="font-medium">Expert Trainers</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
