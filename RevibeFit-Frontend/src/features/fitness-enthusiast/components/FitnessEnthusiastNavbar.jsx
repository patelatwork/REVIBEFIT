import { Link } from 'react-router-dom';
import logo from '../../../assets/exercise_8407005.png';

const FitnessEnthusiastNavbar = ({ userName }) => {
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-[#fffff0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand Name */}
          <Link to="/fitness-enthusiast/dashboard" className="flex items-center space-x-3">
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

          {/* Welcome Message and Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-700 font-medium">
              Welcome Back, <span className="text-[#3f8554] font-semibold">{userName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-[#3f8554] text-white rounded hover:bg-[#225533] font-medium transition-colors duration-200"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[#3f8554] hover:text-[#225533] focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default FitnessEnthusiastNavbar;
