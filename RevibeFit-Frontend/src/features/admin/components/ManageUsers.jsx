import React, { useState, useEffect } from 'react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    userType: ''
  });
  const [suspendModal, setSuspendModal] = useState({
    isOpen: false,
    user: null,
    action: null
  });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [commissionModal, setCommissionModal] = useState({
    isOpen: false,
    user: null
  });
  const [newCommissionRate, setNewCommissionRate] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.userType && { userType: filters.userType })
      });

      const response = await fetch(`${apiUrl}/api/admin/users?${queryParams}`, { headers: getAdminHeaders() });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setFilters(prev => ({
      ...prev,
      search: searchValue,
      page: 1
    }));
  };

  const handleUserTypeFilter = (e) => {
    const userType = e.target.value;
    setFilters(prev => ({
      ...prev,
      userType,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const openSuspendModal = (user, action) => {
    setSuspendModal({
      isOpen: true,
      user,
      action
    });
    setSuspensionReason('');
  };

  const closeSuspendModal = () => {
    setSuspendModal({
      isOpen: false,
      user: null,
      action: null
    });
    setSuspensionReason('');
  };

  const handleSuspendUser = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { user, action } = suspendModal;
      
      const response = await fetch(`${apiUrl}/api/admin/users/${user._id}/suspend`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          suspend: action === 'suspend',
          reason: suspensionReason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update user in local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u._id === user._id 
              ? { ...u, isSuspended: action === 'suspend', suspensionReason: suspensionReason }
              : u
          )
        );
        closeSuspendModal();
        alert(`User ${action === 'suspend' ? 'suspended' : 'unsuspended'} successfully!`);
      } else {
        alert('Error updating user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const openCommissionModal = (user) => {
    setCommissionModal({
      isOpen: true,
      user
    });
    setNewCommissionRate(user.commissionRate?.toString() || '10');
  };

  const closeCommissionModal = () => {
    setCommissionModal({
      isOpen: false,
      user: null
    });
    setNewCommissionRate('');
  };

  const handleUpdateCommissionRate = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { user } = commissionModal;
      
      const rate = parseFloat(newCommissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        alert('Please enter a valid commission rate between 0 and 100');
        return;
      }

      const response = await fetch(`${apiUrl}/api/admin/lab-partners/${user._id}/commission-rate`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          commissionRate: rate
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update user in local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u._id === user._id 
              ? { ...u, commissionRate: rate }
              : u
          )
        );
        closeCommissionModal();
        alert(`Commission rate updated to ${rate}%`);
      } else {
        alert(data.message || 'Error updating commission rate');
      }
    } catch (error) {
      console.error('Error updating commission rate:', error);
      alert('Error updating commission rate');
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'fitness-enthusiast':
        return 'bg-blue-100 text-blue-800';
      case 'trainer':
        return 'bg-green-100 text-green-800';
      case 'lab-partner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUserType = (userType) => {
    return userType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
        <span className="ml-3 text-lg">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-[#225533] mb-2">Manage Users</h2>
        <p className="text-gray-600">View and manage all registered users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by User Type
            </label>
            <select
              value={filters.userType}
              onChange={handleUserTypeFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
            >
              <option value="">All Users</option>
              <option value="fitness-enthusiast">Fitness Enthusiasts</option>
              <option value="trainer">Trainers</option>
              <option value="lab-partner">Lab Partners</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Results per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      )}
                      {user.userType === 'lab-partner' && user.commissionRate !== undefined && (
                        <div className="text-xs text-[#3f8554] font-semibold mt-1">
                          Commission: {user.commissionRate}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeColor(user.userType)}`}>
                      {formatUserType(user.userType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {user.isSuspended ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Suspended
                        </span>
                      ) : user.isActive ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      
                      {user.userType !== 'fitness-enthusiast' && (
                        <div>
                          {user.isApproved ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.userType !== 'admin' && (
                      <div className="space-x-2">
                        {user.isSuspended ? (
                          <button
                            onClick={() => openSuspendModal(user, 'unsuspend')}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded transition-colors"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => openSuspendModal(user, 'suspend')}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {user.userType === 'lab-partner' && (
                          <button
                            onClick={() => openCommissionModal(user)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded transition-colors"
                          >
                            Set Rate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * filters.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * filters.limit, pagination.totalUsers)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-[#3f8554] border-[#3f8554] text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${page === 1 ? 'rounded-l-md' : ''} ${
                        page === pagination.totalPages ? 'rounded-r-md' : ''
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commission Rate Modal */}
      {commissionModal.isOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-fadeIn">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white animate-slideDown">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Set Commission Rate
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  Lab Partner: <strong>{commissionModal.user?.laboratoryName || commissionModal.user?.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Current Rate: <strong>{commissionModal.user?.commissionRate || 10}%</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Commission Rate (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(e.target.value)}
                  placeholder="Enter rate (0-100)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This rate will apply to all future bookings for this lab partner.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCommissionModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCommissionRate}
                  className="px-4 py-2 bg-[#3f8554] text-white rounded hover:bg-[#225533] transition-colors"
                >
                  Update Rate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {suspendModal.isOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm overflow-y-auto h-full w-full z-50 animate-fadeIn">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white animate-slideDown">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {suspendModal.action === 'suspend' ? 'Suspend User' : 'Unsuspend User'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  User: <strong>{suspendModal.user?.name}</strong> ({suspendModal.user?.email})
                </p>
              </div>

              {suspendModal.action === 'suspend' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for suspension:
                  </label>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                    rows="3"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeSuspendModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendUser}
                  disabled={suspendModal.action === 'suspend' && !suspensionReason.trim()}
                  className={`px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    suspendModal.action === 'suspend'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {suspendModal.action === 'suspend' ? 'Suspend' : 'Unsuspend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission Rate Modal */}
      {commissionModal.isOpen && (
        <>
          {/* Backdrop with blur */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#3f8554]/20 transform transition-all duration-300 ease-out scale-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#225533] to-[#3f8554] p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">
                    Set Commission Rate
                  </h3>
                  <button
                    onClick={closeCommissionModal}
                    className="text-white/80 hover:text-white text-2xl font-bold transition-colors duration-200 bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Lab Partner: <strong className="text-[#225533]">{commissionModal.user?.laboratoryName || commissionModal.user?.name}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Current Rate: {commissionModal.user?.commissionRate || 10}%
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Commission Rate (%):
                  </label>
                  <input
                    type="number"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(e.target.value)}
                    placeholder="Enter commission rate (0-100)"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    This rate will apply to all future bookings for this lab partner.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCommissionModal}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCommissionRate}
                    disabled={!newCommissionRate}
                    className="flex-1 px-4 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] duration-200"
                  >
                    Update Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageUsers;