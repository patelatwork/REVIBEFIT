import logo from '../../../assets/exercise_8407005.png';

const TrainerNavbar = ({ trainerName }) => {
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-[#3f8554] shadow-lg">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Welcome Message */}
          <div className="flex items-center space-x-4">
            <img 
              src={logo} 
              alt="RevibeFit Logo" 
              className="h-10 w-10"
            />
            <div>
              <span className="text-white text-lg">
                Welcome Back, <span className="font-bold">{trainerName}</span>
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

export default TrainerNavbar;
