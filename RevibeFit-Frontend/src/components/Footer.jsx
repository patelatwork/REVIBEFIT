import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/exercise_8407005.png';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Add subscription logic here
    console.log('Subscribing email:', email);
    setEmail('');
  };

  return (
    <footer className="bg-[#fffff0] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={logo} 
                alt="RevibeFit Logo" 
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold text-[#3f8554]">
                RevibeFit
              </span>
            </Link>
            <p className="text-gray-600 leading-relaxed">
              Transform your life through fitness. Join our community and achieve your health goals with expert guidance.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-600 hover:border-[#3f8554] hover:text-[#3f8554] transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-600 hover:border-[#3f8554] hover:text-[#3f8554] transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-600 hover:border-[#3f8554] hover:text-[#3f8554] transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-600 hover:border-[#3f8554] hover:text-[#3f8554] transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/trainers" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Our Trainers
                </Link>
              </li>
              <li>
                <Link 
                  to="/classes" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Live Classes
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Our Services</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/workouts" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Workouts Guide
                </Link>
              </li>
              <li>
                <Link 
                  to="/nutrition" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Nutrition Planner
                </Link>
              </li>
              <li>
                <Link 
                  to="/trainers" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  One-on-One Training
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Trainer Content
                </Link>
              </li>
              <li>
                <Link 
                  to="/care" 
                  className="text-gray-600 hover:text-[#3f8554] transition-colors duration-200"
                >
                  Lab Tests & Care
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-300 pt-12 pb-8">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Subscribe to Our Newsletter
            </h3>
            <p className="text-gray-600 mb-6">
              Stay updated with the latest fitness tips and health advice.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 max-w-md px-6 py-3 rounded border border-gray-300 focus:outline-none focus:border-[#3f8554] bg-white text-gray-800"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-[#3f8554] text-white rounded hover:bg-[#225533] font-medium transition-colors duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-300 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 text-sm">
              © 2025 RevibeFit. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-[#3f8554] text-sm transition-colors duration-200"
              >
                Contact Us
              </Link>
              <Link 
                to="/" 
                className="text-gray-600 hover:text-[#3f8554] text-sm transition-colors duration-200"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
