import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import Analytics from '../components/Analytics';
import ManageUsers from '../components/ManageUsers';
import useLiveData from '../../../hooks/useLiveData';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    fitnessEnthusiasts: 0,
    trainers: 0,
    labPartners: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    const token = localStorage.getItem('adminToken');
    // Old sessions won't have the token — clear and re-login
    if (!admin || !token) {
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
        setFetchError('');
      } else if (response.status === 401) {
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } else {
        setFetchError(data.message || 'Failed to load stats');
      }
    } catch (error) {
      setFetchError('Could not reach server');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Use live data hook for auto-refresh every 5 seconds (only for overview)
  useLiveData(() => {
    if (activeSection === 'overview') {
      fetchStats();
    }
  }, 5000);

  const renderOverview = () => (
    <>
      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
          <p className="text-red-800 font-medium">Error: {fetchError}</p>
          <p className="text-red-600 text-sm mt-1">Try logging out and back in.</p>
        </div>
      )}

      {/* Pending Approvals Alert */}
      {!loading && stats.pendingApprovals > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-yellow-800">
                <span className="font-semibold">{stats.pendingApprovals}</span> registration{stats.pendingApprovals !== 1 ? 's' : ''} pending your approval
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/pending-approvals')}
              className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg hover:bg-yellow-500 font-medium transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Stats removed from Overview - access via Quick Actions / Analytics tab */}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-[#225533] mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/pending-approvals')}
            className="p-4 border-2 border-[#3f8554] rounded-lg hover:bg-[#3f8554] hover:text-white transition-all duration-200 text-left group">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-white">Manage Approvals</h3>
            <p className="text-sm text-gray-600 group-hover:text-white">Review pending trainer and lab partner registrations</p>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className="p-4 border-2 border-[#3f8554] rounded-lg hover:bg-[#3f8554] hover:text-white transition-all duration-200 text-left group">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-white">View Reports</h3>
            <p className="text-sm text-gray-600 group-hover:text-white">Access detailed analytics and reports</p>
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className="p-4 border-2 border-[#3f8554] rounded-lg hover:bg-[#3f8554] hover:text-white transition-all duration-200 text-left group">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-white">Manage Users</h3>
            <p className="text-sm text-gray-600 group-hover:text-white">View and manage all registered users</p>
          </button>

          <button
            onClick={() => navigate('/admin/invoices')}
            className="p-4 border-2 border-[#3f8554] rounded-lg hover:bg-[#3f8554] hover:text-white transition-all duration-200 text-left group">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-white">Invoice Management</h3>
            <p className="text-sm text-gray-600 group-hover:text-white">Generate invoices, track payments, enforce overdue</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics/lab-earnings')}
            className="p-4 border-2 border-[#3f8554] rounded-lg hover:bg-[#3f8554] hover:text-white transition-all duration-200 text-left group">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-white">Lab Earnings</h3>
            <p className="text-sm text-gray-600 group-hover:text-white">View detailed lab test commission analytics</p>
          </button>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'analytics':
        return <Analytics />;
      case 'users':
        return <ManageUsers />;
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <AdminNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#225533] mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome to RevibeFit Admin Panel</p>
            </div>
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live Updates</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'overview'
                    ? 'border-[#3f8554] text-[#3f8554]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActiveSection('overview')}
              >
                Overview
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'analytics'
                    ? 'border-[#3f8554] text-[#3f8554]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActiveSection('analytics')}
              >
                Analytics & Reports
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSection === 'users'
                    ? 'border-[#3f8554] text-[#3f8554]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActiveSection('users')}
              >
                Manage Users
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
