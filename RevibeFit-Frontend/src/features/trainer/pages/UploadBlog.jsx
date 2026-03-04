import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerNavbar from '../components/TrainerNavbar';

const UploadBlog = () => {
  const navigate = useNavigate();
  const [trainerName, setTrainerName] = useState('Trainer');
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);

  const categories = ['Fitness Tips', 'Nutrition', 'Yoga', 'Mental Wellness', 'General'];

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setTrainerName(userData.name || 'Trainer');
    }
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
      <TrainerNavbar trainerName={trainerName} />
      
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

              {thumbnailPreview ? (
                /* Preview state */
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label
                      htmlFor="thumbnail-upload"
                      className="cursor-pointer px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      Change Image
                    </label>
                    <button
                      type="button"
                      onClick={() => { setThumbnail(null); setThumbnailPreview(null); }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                    {thumbnail?.name}
                  </div>
                </div>
              ) : (
                /* Upload dropzone */
                <label
                  htmlFor="thumbnail-upload"
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleThumbnailChange({ target: { files: [file] } });
                  }}
                  className={`flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                    isDragOver
                      ? 'border-[#3f8554] bg-[#e8f5ec]'
                      : 'border-gray-300 bg-gray-50 hover:border-[#3f8554] hover:bg-[#f4fbf6]'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isDragOver ? 'bg-[#3f8554]/10' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-6 h-6 transition-colors ${isDragOver ? 'text-[#3f8554]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {isDragOver ? 'Drop your image here' : 'Click to upload or drag & drop'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </div>
                </label>
              )}

              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                required={!thumbnailPreview}
              />
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
