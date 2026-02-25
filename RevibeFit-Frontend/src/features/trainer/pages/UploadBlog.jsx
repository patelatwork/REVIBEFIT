import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerNavbar from '../components/TrainerNavbar';

const UploadBlog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Fitness Tips',
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);

  const categories = ['Fitness Tips', 'Nutrition', 'Yoga', 'Mental Wellness', 'General'];

  useEffect(() => {
    fetchTrainerBlogs();
  }, []);

  const fetchTrainerBlogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/blogs/trainer/my-blogs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Thumbnail image must be less than 5MB');
        return;
      }
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim() || formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (!formData.content.trim() || formData.content.length < 50) {
      setError('Content must be at least 50 characters');
      return;
    }

    if (!thumbnail) {
      setError('Please upload a thumbnail image');
      return;
    }

    try {
      setLoading(true);

      // Get token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Create FormData
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('category', formData.category);
      data.append('thumbnail', thumbnail);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/blogs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create blog post');
      }

      setSuccess('Blog post created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'Fitness Tips',
      });
      setThumbnail(null);
      setThumbnailPreview(null);

      // Refresh blog list
      fetchTrainerBlogs();

      // Scroll to blog list
      setTimeout(() => {
        document.getElementById('blog-list')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (err) {
      console.error('Error creating blog:', err);
      setError(err.message || 'Failed to create blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete blog post');
      }

      setSuccess('Blog post deleted successfully!');
      fetchTrainerBlogs();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting blog:', err);
      setError(err.message || 'Failed to delete blog post. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      category: blog.category,
    });
    setThumbnailPreview(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${blog.thumbnail.replace(/\\/g, '/')}`);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingBlog) return;

    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('category', formData.category);
      if (thumbnail) {
        data.append('thumbnail', thumbnail);
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/blogs/${editingBlog._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update blog post');
      }

      setSuccess('Blog post updated successfully!');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'Fitness Tips',
      });
      setThumbnail(null);
      setThumbnailPreview(null);
      setEditingBlog(null);

      // Refresh blog list
      fetchTrainerBlogs();

      // Scroll to blog list
      setTimeout(() => {
        document.getElementById('blog-list')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (err) {
      console.error('Error updating blog:', err);
      setError(err.message || 'Failed to update blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      content: '',
      category: 'Fitness Tips',
    });
    setThumbnail(null);
    setThumbnailPreview(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <TrainerNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-6">
            {editingBlog ? 'Update Blog Post' : 'Upload New Blog Post'}
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={editingBlog ? handleUpdate : handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Blog Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter your blog title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Thumbnail Image <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Maximum file size: 5MB</p>
              
              {thumbnailPreview && (
                <div className="mt-4">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Blog Content <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your blog content here... (minimum 50 characters)"
                rows="12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] resize-vertical"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Characters: {formData.content.length} / minimum 50
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#3f8554] text-white py-3 px-6 rounded-lg hover:bg-[#225533] transition-colors duration-200 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (editingBlog ? 'Updating...' : 'Publishing...') : (editingBlog ? 'Update Blog Post' : 'Publish Blog Post')}
              </button>
              
              {editingBlog && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200 font-semibold"
                >
                  Cancel Edit
                </button>
              )}
              
              {!editingBlog && (
                <button
                  type="button"
                  onClick={() => navigate('/trainer/dashboard')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Manage Blog Posts Section */}
        <div id="blog-list" className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-[#225533] mb-6">Manage Blog Posts</h2>

          {loadingBlogs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#3f8554] mx-auto"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">You haven't created any blog posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div key={blog._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${blog.thumbnail.replace(/\\/g, '/')}`}
                      alt={blog.title}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/128x128?text=Blog';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-[#225533]">{blog.title}</h3>
                        <span className="px-3 py-1 bg-[#3f8554] text-white text-sm rounded-full">
                          {blog.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2 line-clamp-2">{blog.content}</p>
                      <div className="flex gap-4 text-sm text-gray-500 mb-3">
                        <span>{formatDate(blog.createdAt)}</span>
                        <span className={blog.isPublished ? 'text-green-600' : 'text-red-600'}>
                          {blog.isPublished ? 'Published' : 'Unpublished'}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(blog)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-sm font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadBlog;
