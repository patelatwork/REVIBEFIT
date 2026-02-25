import { Link } from 'react-router-dom';
import logo from '../../../assets/exercise_8407005.png';

const AdminNavbar = () => {
  const handleLogout = () => {
    localStorage.removeItem('admin');
    window.location.href = '/admin/login';
  };

  return (
    <nav className="bg-[#225533] shadow-lg">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Name */}
          <Link to="/admin/dashboard" className="flex items-center space-x-3">
            <img 
              src={logo} 
              alt="RevibeFit Logo" 
              className="h-10 w-10"
            />
            <span className="text-2xl font-bold text-white">
              RevibeFit Admin
            </span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-white text-[#225533] rounded hover:bg-[#fffff0] font-medium transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
