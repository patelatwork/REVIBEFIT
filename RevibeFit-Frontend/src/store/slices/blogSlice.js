import { createSlice } from '@reduxjs/toolkit';

// Initial state for blogs
const initialState = {
  blogs: [],
  readBlogs: [],
  currentBlog: null,
  loading: false,
  error: null,
  filters: {
    category: 'all',
    searchTerm: '',
  },
};

// Blog Slice - Manages blog-related state
const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    // Set all blogs
    setBlogs: (state, action) => {
      state.blogs = action.payload;
      state.loading = false;
    },
    
    // Set read blogs
    setReadBlogs: (state, action) => {
      state.readBlogs = action.payload;
    },
    
    // Set current blog
    setCurrentBlog: (state, action) => {
      state.currentBlog = action.payload;
    },
    
    // Add a blog to read list
    markBlogAsRead: (state, action) => {
      const blogId = action.payload;
      if (!state.readBlogs.find(blog => blog._id === blogId)) {
        const blog = state.blogs.find(b => b._id === blogId);
        if (blog) {
          state.readBlogs.unshift(blog);
        }
      }
    },
    
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Set loading
    setBlogLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Set error
    setBlogError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Clear current blog
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
    },
  },
});

// Export actions
export const {
  setBlogs,
  setReadBlogs,
  setCurrentBlog,
  markBlogAsRead,
  setFilters,
  setBlogLoading,
  setBlogError,
  clearCurrentBlog,
} = blogSlice.actions;

// Selectors
export const selectBlogs = (state) => state.blog.blogs;
export const selectReadBlogs = (state) => state.blog.readBlogs;
export const selectCurrentBlog = (state) => state.blog.currentBlog;
export const selectBlogFilters = (state) => state.blog.filters;
export const selectBlogLoading = (state) => state.blog.loading;
export const selectBlogError = (state) => state.blog.error;

// Filtered blogs selector
export const selectFilteredBlogs = (state) => {
  const { blogs, filters } = state.blog;
  let filtered = blogs;
  
  if (filters.category !== 'all') {
    filtered = filtered.filter(blog => blog.category === filters.category);
  }
  
  if (filters.searchTerm) {
    filtered = filtered.filter(blog =>
      blog.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      blog.content.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }
  
  return filtered;
};

export default blogSlice.reducer;
