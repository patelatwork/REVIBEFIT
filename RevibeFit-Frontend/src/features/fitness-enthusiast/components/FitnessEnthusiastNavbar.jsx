import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import logo from '../../../assets/exercise_8407005.png';

const links = [
  { to: '/classes', label: 'Classes' },
  { to: '/workouts', label: 'Workouts' },
  { to: '/trainers', label: 'Trainers' },
  { to: '/nutrition', label: 'Nutrition Plan' },
  { to: '/care', label: 'Care' },
  { to: '/blog', label: 'Blog' },
];

const FitnessEnthusiastNavbar = ({ userName }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-50 bg-[#fffff0]/90 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/fitness-enthusiast/dashboard" className="flex items-center gap-2.5">
            <img src={logo} alt="RevibeFit Logo" className="h-9 w-9" />
            <span className="text-xl font-bold text-[#3f8554] tracking-tight">RevibeFit</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(l.to)
                    ? 'bg-[#225533]/10 text-[#225533]'
                    : 'text-gray-600 hover:text-[#225533] hover:bg-gray-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-[#3f8554]">{userName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#3f8554] hover:bg-[#225533] text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[#3f8554] hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200/60 bg-[#fffff0]/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l.to)
                    ? 'bg-[#225533]/10 text-[#225533]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-200">
              <p className="px-3 text-sm text-gray-500 mb-2">
                Signed in as <span className="font-semibold text-[#3f8554]">{userName}</span>
              </p>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#3f8554] hover:bg-[#225533] text-white text-sm font-medium rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default FitnessEnthusiastNavbar;
