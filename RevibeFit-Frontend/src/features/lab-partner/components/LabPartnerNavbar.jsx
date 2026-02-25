import logo from '../../../assets/exercise_8407005.png';
import { useNavigate } from 'react-router-dom';

const LabPartnerNavbar = ({ labName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  const handleNameClick = () => {
    navigate('/lab-partner/dashboard');
  };

  return (
    <nav className="bg-[#3f8554] shadow-lg">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Welcome Message */}
          <div 
            className="flex items-center space-x-4 cursor-pointer hover:opacity-90 transition-opacity duration-200"
            onClick={handleNameClick}
          >
            <img 
              src={logo} 
              alt="RevibeFit Logo" 
              className="h-10 w-10"
            />
            <div>
              <span className="text-white text-lg">
                Welcome Back, <span className="font-bold">{labName}</span>
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-white text-[#3f8554] rounded hover:bg-[#fffff0] font-medium transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LabPartnerNavbar;
