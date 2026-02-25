import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/exercise_8407005.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-[#fffff0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand Name */}
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

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/classes" 
              className="text-gray-700 hover:text-[#225533] hover:bg-gray-100 px-3 py-2 rounded font-medium transition-all duration-200"
            >
              Classes
            </Link>
            <Link 
              to="/workouts" 
              className="text-gray-700 hover:text-[#225533] hover:bg-gray-100 px-3 py-2 rounded font-medium transition-all duration-200"
            >
              Workouts
            </Link>
            <Link 
              to="/trainers" 
              className="text-gray-700 hover:text-[#225533] hover:bg-gray-100 px-3 py-2 rounded font-medium transition-all duration-200"
            >
              Trainers
            </Link>
            <Link 
              to="/nutrition" 
              className="text-gray-700 hover:text-[#225533] hover:bg-gray-100 px-3 py-2 rounded font-medium transition-all duration-200"
            >
              Nutrition Plan
            </Link>
            <Link 
              to="/care" 
              className="text-gray-700 hover:text-[#225533] hover:bg-gray-100 px-3 py-2 rounded font-medium transition-all duration-200"
            >
              Care
            </Link>
            <Link 
              to="/blog" 
              className="text-gray-700 hover:text-[#225533] hover:bg-gray-100 px-3 py-2 rounded font-medium transition-all duration-200"
            >
              Blog
            </Link>
          </div>

          {/* Login and Sign Up Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/login" 
              className="px-6 py-2 text-[#3f8554] hover:text-[#225533] hover:bg-gray-100 rounded font-medium transition-all duration-200"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="px-6 py-2 bg-[#3f8554] text-white rounded hover:bg-[#225533] font-medium transition-colors duration-200"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#3f8554] hover:text-[#225533] focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#fffff0] border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/classes"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Classes
            </Link>
            <Link
              to="/workouts"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Workouts
            </Link>
            <Link
              to="/trainers"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Trainers
            </Link>
            <Link
              to="/nutrition-plan"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Nutrition Plan
            </Link>
            <Link
              to="/care"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Care
            </Link>
            <Link
              to="/blog"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-[#3f8554] hover:text-[#225533] hover:bg-gray-100 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block px-3 py-2 rounded-md bg-[#3f8554] text-white hover:bg-[#225533] font-medium transition-colors duration-200 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
