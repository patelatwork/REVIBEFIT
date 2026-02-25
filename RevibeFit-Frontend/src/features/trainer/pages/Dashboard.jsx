import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TrainerNavbar from '../components/TrainerNavbar';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [trainerName, setTrainerName] = useState('Trainer');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      const userData = JSON.parse(user);
      setTrainerName(userData.name || 'Trainer');
      fetchDashboardStats();
    }
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/trainers/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <TrainerNavbar trainerName={trainerName} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-[#225533] mb-2">
          Trainer Dashboard
        </h1>
        <p className="text-gray-600 mb-8">Welcome back, {trainerName}!</p>

        {/* Stats Overview */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Clients</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalClients}</p>
                </div>
                <svg className="h-10 w-10 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Classes</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalClasses}</p>
                  <p className="text-green-100 text-xs mt-1">{stats.upcomingClasses} upcoming</p>
                </div>
                <svg className="h-10 w-10 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Bookings</p>
                  <p className="text-3xl font-bold mt-1">{stats.activeBookings}</p>
                </div>
                <svg className="h-10 w-10 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Monthly Earnings</p>
                  <p className="text-3xl font-bold mt-1">₹{stats.monthlyEarnings?.toFixed(0) || 0}</p>
                </div>
                <svg className="h-10 w-10 text-yellow-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/trainer/clients" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">My Clients</h2>
            <p className="text-gray-600">Manage your clients</p>
            {stats && <p className="text-2xl font-bold text-[#225533] mt-3">{stats.totalClients}</p>}
          </Link>

          <Link to="/trainer/schedule" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Schedule</h2>
            <p className="text-gray-600">View training sessions</p>
            {stats && <p className="text-2xl font-bold text-[#225533] mt-3">{stats.upcomingClasses} upcoming</p>}
          </Link>

          <Link to="/trainer/upload-blog" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Create & Manage Blogs</h2>
            <p className="text-gray-600">Share your knowledge</p>
            {stats && <p className="text-2xl font-bold text-[#225533] mt-3">{stats.totalBlogs} blogs</p>}
          </Link>

          <Link 
            to="/trainer/live-classes"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Live Classes</h2>
            <p className="text-gray-600">Schedule and host live classes</p>
            {stats && <p className="text-2xl font-bold text-[#225533] mt-3">{stats.totalClasses} total</p>}
          </Link>

          <Link to="/trainer/earnings" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Earnings</h2>
            <p className="text-gray-600">Track your earnings</p>
            {stats && <p className="text-2xl font-bold text-[#225533] mt-3">₹{stats.totalEarnings?.toFixed(0) || 0}</p>}
          </Link>

          <Link to="/trainer/profile" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Profile</h2>
            <p className="text-gray-600">Manage your profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
