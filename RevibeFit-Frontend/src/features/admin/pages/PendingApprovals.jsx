import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import useLiveData from '../../../hooks/useLiveData';

const PendingApprovals = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    // Check if admin is logged in
    const admin = localStorage.getItem('admin');
    if (!admin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/pending-approvals', { headers: getAdminHeaders() });
      const data = await response.json();
      
      if (response.ok) {
        setPendingUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use live data hook for auto-refresh every 5 seconds
  useLiveData(fetchPendingApprovals, 5000);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/approve/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('User approved successfully!');
        fetchPendingApprovals(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Server error:', errorData);
        alert(`Failed to approve user: ${errorData?.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Are you sure you want to reject this user?')) return;
    
    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/reject/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          reason: 'Rejected by admin'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('User rejected successfully!');
        fetchPendingApprovals(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Server error:', errorData);
        alert(`Failed to reject user: ${errorData?.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="approvals" onSectionChange={() => {}} />
      
      <div className="lg:ml-64 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#225533] mb-2">
                Pending Approvals
              </h1>
              <p className="text-gray-600">Review and approve trainer and lab partner registrations</p>
            </div>
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live Updates</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading pending approvals...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Approvals</h3>
            <p className="text-gray-500">All registration requests have been processed!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* User Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        user.userType === 'trainer' ? 'bg-orange-500' : 'bg-purple-500'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-[#225533]">{user.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          user.userType === 'trainer' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {user.userType === 'trainer' ? 'Trainer' : 'Lab Partner'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium text-gray-800">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium text-gray-800">{user.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Age</p>
                        <p className="font-medium text-gray-800">{user.age}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Registered</p>
                        <p className="font-medium text-gray-800">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Trainer Specific Info */}
                    {user.userType === 'trainer' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-500 text-sm">Specialization</p>
                        <p className="font-medium text-gray-800">{user.specialization}</p>
                        {user.certifications && (() => {
                          // Clean up the path - handle various formats
                          let certPath = user.certifications;
                          
                          // If it's an absolute path, extract just the filename
                          if (certPath.includes('\\') || certPath.includes('RevibeFit-Backend')) {
                            const parts = certPath.split(/[\\\/]/);
                            const filename = parts[parts.length - 1];
                            certPath = `temp/${filename}`;
                          } else {
                            // Handle relative paths - remove 'public/' prefix if present
                            certPath = certPath.replace(/\\/g, '/').replace(/^public\//, '');
                          }
                          
                          return (
                            <a 
                              href={`http://localhost:8000/${certPath}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#3f8554] hover:text-[#225533] text-sm mt-2 inline-flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Certifications
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    {/* Lab Partner Specific Info */}
                    {user.userType === 'lab-partner' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Laboratory Name</p>
                            <p className="font-medium text-gray-800">{user.laboratoryName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">License Number</p>
                            <p className="font-medium text-gray-800">{user.licenseNumber}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500">Address</p>
                            <p className="font-medium text-gray-800">{user.laboratoryAddress}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col justify-center space-y-3">
                    <button
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading === user._id}
                      className="w-full px-6 py-3 bg-[#3f8554] text-white rounded-lg font-semibold hover:bg-[#225533] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === user._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(user._id)}
                      disabled={actionLoading === user._id}
                      className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default PendingApprovals;