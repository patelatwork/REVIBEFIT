import React, { useState, useEffect } from 'react';
import {
  X, Dumbbell, FlaskConical, BookOpen, Utensils, Calendar,
  Activity, Eye, ArrowLeft, ChevronRight,
} from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', userType: '' });
  const [suspendModal, setSuspendModal] = useState({ isOpen: false, user: null, action: null });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [commissionModal, setCommissionModal] = useState({ isOpen: false, user: null, userType: null });
  const [newCommissionRate, setNewCommissionRate] = useState('');
  // User activity detail
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  useEffect(() => { fetchUsers(); }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page, limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.userType && { userType: filters.userType }),
      });
      const response = await fetch(`${apiUrl}/api/admin/users?${queryParams}`, { headers: getAdminHeaders() });
      const data = await response.json();
      if (data.success) { setUsers(data.data.users); setPagination(data.data.pagination); }
    } catch (error) { console.error('Error fetching users:', error); }
    finally { setLoading(false); }
  };

  // ─── User Activity ──────────────────────────────────────
  const fetchUserActivity = async (userId) => {
    try {
      setActivityLoading(true);
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/activity`, { headers: getAdminHeaders() });
      const data = await response.json();
      if (data.success) { setUserActivity(data.data); }
    } catch (error) { console.error('Error fetching user activity:', error); }
    finally { setActivityLoading(false); }
  };

  const openUserDetail = (user) => {
    setSelectedUser(user);
    setUserActivity(null);
    fetchUserActivity(user._id);
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setUserActivity(null);
  };

  // ─── Handlers ───────────────────────────────────────────
  const handleSearch = (e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  const handleUserTypeFilter = (e) => setFilters(prev => ({ ...prev, userType: e.target.value, page: 1 }));
  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));

  const openSuspendModal = (user, action) => { setSuspendModal({ isOpen: true, user, action }); setSuspensionReason(''); };
  const closeSuspendModal = () => { setSuspendModal({ isOpen: false, user: null, action: null }); setSuspensionReason(''); };

  const handleSuspendUser = async () => {
    try {
      const { user, action } = suspendModal;
      const response = await fetch(`${apiUrl}/api/admin/users/${user._id}/suspend`, {
        method: 'PATCH', headers: getAdminHeaders(),
        body: JSON.stringify({ suspend: action === 'suspend', reason: suspensionReason }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isSuspended: action === 'suspend', suspensionReason } : u));
        closeSuspendModal();
      } else { alert('Error updating user status'); }
    } catch (error) { console.error(error); alert('Error updating user status'); }
  };

  const openCommissionModal = (user) => {
    const ut = user.userType === 'trainer' ? 'trainer' : 'lab-partner';
    setCommissionModal({ isOpen: true, user, userType: ut });
    setNewCommissionRate(user.commissionRate?.toString() || (ut === 'trainer' ? '15' : '10'));
  };
  const closeCommissionModal = () => { setCommissionModal({ isOpen: false, user: null, userType: null }); setNewCommissionRate(''); };

  const handleUpdateCommissionRate = async () => {
    try {
      const { user, userType } = commissionModal;
      const rate = parseFloat(newCommissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) { alert('Valid rate: 0-100'); return; }

      const endpoint = userType === 'trainer'
        ? `${apiUrl}/api/admin/trainers/${user._id}/commission-rate`
        : `${apiUrl}/api/admin/lab-partners/${user._id}/commission-rate`;

      const response = await fetch(endpoint, {
        method: 'PATCH', headers: getAdminHeaders(),
        body: JSON.stringify({ commissionRate: rate }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, commissionRate: rate } : u));
        closeCommissionModal();
        alert(`Commission rate updated to ${rate}%`);
      } else { alert(data.message || 'Error updating commission rate'); }
    } catch (error) { console.error(error); alert('Error updating commission rate'); }
  };

  // ─── Helpers ────────────────────────────────────────────
  const getUserTypeColor = (userType) => {
    const map = { 'fitness-enthusiast': 'bg-blue-100 text-blue-800', 'trainer': 'bg-green-100 text-green-800', 'lab-partner': 'bg-purple-100 text-purple-800', 'admin': 'bg-red-100 text-red-800' };
    return map[userType] || 'bg-gray-100 text-gray-800';
  };
  const formatUserType = (ut) => ut.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // ─── User Activity Detail Panel ─────────────────────────
  const renderActivityPanel = () => {
    if (!selectedUser) return null;
    const a = userActivity;

    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={closeUserDetail} />
        <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slideLeft">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#225533] to-[#3f8554] p-6 z-10">
            <button onClick={closeUserDetail} className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 rounded-full p-1.5">
              <X size={20} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                <p className="text-green-200 text-sm">{selectedUser.email}</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getUserTypeColor(selectedUser.userType)}`}>
                  {formatUserType(selectedUser.userType)}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {activityLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f8554]"></div>
              </div>
            ) : !a ? (
              <p className="text-center text-gray-400 py-12">Failed to load activity</p>
            ) : (
              <>
                {/* User Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Profile Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{a.user?.phone || '-'}</span></div>
                    <div><span className="text-gray-500">Age:</span> <span className="font-medium">{a.user?.age || '-'}</span></div>
                    <div><span className="text-gray-500">Status:</span> <span className={`font-medium ${a.user?.isSuspended ? 'text-red-600' : 'text-green-600'}`}>{a.user?.isSuspended ? 'Suspended' : 'Active'}</span></div>
                    <div><span className="text-gray-500">Joined:</span> <span className="font-medium">{formatDate(a.user?.createdAt)}</span></div>
                    {a.user?.fitnessGoal && <div className="col-span-2"><span className="text-gray-500">Fitness Goal:</span> <span className="font-medium capitalize">{a.user.fitnessGoal}</span></div>}
                    {a.user?.specialization && <div className="col-span-2"><span className="text-gray-500">Specialization:</span> <span className="font-medium capitalize">{a.user.specialization}</span></div>}
                    {a.user?.laboratoryName && <div className="col-span-2"><span className="text-gray-500">Lab:</span> <span className="font-medium">{a.user.laboratoryName}</span></div>}
                    {a.summary?.commissionRate !== undefined && <div><span className="text-gray-500">Commission Rate:</span> <span className="font-medium">{a.summary.commissionRate}%</span></div>}
                  </div>
                </div>

                {/* Summary Stats */}
                {a.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {a.user?.userType === 'fitness-enthusiast' && (
                      <>
                        <MiniStat label="Workouts" value={a.summary.totalWorkouts} icon={Dumbbell} color="green" />
                        <MiniStat label="Classes Booked" value={a.summary.totalClassBookings} icon={Calendar} color="blue" />
                        <MiniStat label="Lab Bookings" value={a.summary.totalLabBookings} icon={FlaskConical} color="purple" />
                        <MiniStat label="Meal Logs" value={a.summary.totalMealLogs} icon={Utensils} color="amber" />
                        <MiniStat label="Blog Reads" value={a.summary.totalBlogReads} icon={BookOpen} color="teal" />
                        <MiniStat label="Total Spent" value={`₹${(a.summary.totalSpent || 0).toLocaleString()}`} icon={Activity} color="red" />
                      </>
                    )}
                    {a.user?.userType === 'trainer' && (
                      <>
                        <MiniStat label="Classes Created" value={a.summary.totalClasses} icon={Calendar} color="blue" />
                        <MiniStat label="Total Bookings" value={a.summary.totalBookingsReceived} icon={Activity} color="green" />
                        <MiniStat label="Blogs Written" value={a.summary.totalBlogs} icon={BookOpen} color="purple" />
                        <MiniStat label="Total Earnings" value={`₹${(a.summary.totalEarnings || 0).toLocaleString()}`} icon={Dumbbell} color="amber" />
                      </>
                    )}
                    {a.user?.userType === 'lab-partner' && (
                      <>
                        <MiniStat label="Total Bookings" value={a.summary.totalBookings} icon={FlaskConical} color="purple" />
                        <MiniStat label="Invoices" value={a.summary.totalInvoices} icon={Calendar} color="blue" />
                        <MiniStat label="Tests Offered" value={a.summary.totalTests} icon={Activity} color="green" />
                        <MiniStat label="Total Earnings" value={`₹${(a.summary.totalEarnings || 0).toLocaleString()}`} icon={Dumbbell} color="amber" />
                      </>
                    )}
                  </div>
                )}

                {/* Fitness Enthusiast Activity */}
                {a.user?.userType === 'fitness-enthusiast' && (
                  <>
                    {a.workouts?.length > 0 && (
                      <ActivitySection title="Recent Workouts" icon={Dumbbell}>
                        {a.workouts.slice(0, 10).map((w, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800 capitalize">{w.workoutName || w.category || 'Workout'}</p>
                              <p className="text-xs text-gray-400">{w.difficulty} • {w.duration || '-'} min</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(w.completedAt || w.createdAt)}</span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.classBookings?.length > 0 && (
                      <ActivitySection title="Class Bookings" icon={Calendar}>
                        {a.classBookings.slice(0, 10).map((b, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{b.classId?.title || 'Class'}</p>
                              <p className="text-xs text-gray-400">Trainer: {b.trainerId?.name || '-'} • ₹{b.amountPaid}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${b.bookingStatus === 'completed' ? 'bg-green-100 text-green-700' : b.bookingStatus === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {b.bookingStatus}
                            </span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.labBookings?.length > 0 && (
                      <ActivitySection title="Lab Bookings" icon={FlaskConical}>
                        {a.labBookings.slice(0, 10).map((b, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{b.labPartnerId?.laboratoryName || b.labPartnerId?.name || 'Lab'}</p>
                              <p className="text-xs text-gray-400">₹{b.totalAmount || '-'} • {b.paymentStatus}</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(b.createdAt)}</span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.blogReadings?.length > 0 && (
                      <ActivitySection title="Blog Reads" icon={BookOpen}>
                        {a.blogReadings.slice(0, 8).map((r, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{r.blogId?.title || 'Blog'}</p>
                              <p className="text-xs text-gray-400">{r.blogId?.category || '-'}</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(r.readAt)}</span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                  </>
                )}

                {/* Trainer Activity */}
                {a.user?.userType === 'trainer' && (
                  <>
                    {a.earnings && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="font-semibold text-blue-800 mb-2">Earnings Breakdown</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-blue-600">Total Booking Value:</span> <span className="font-semibold">₹{(a.earnings.totalBookingValue || 0).toLocaleString()}</span></div>
                          <div><span className="text-blue-600">Platform Commission:</span> <span className="font-semibold text-green-700">₹{(a.earnings.totalCommission || 0).toLocaleString()}</span></div>
                          <div><span className="text-blue-600">Trainer Payout:</span> <span className="font-semibold">₹{(a.earnings.totalPayout || 0).toLocaleString()}</span></div>
                          <div><span className="text-blue-600">Total Bookings:</span> <span className="font-semibold">{a.earnings.bookings || 0}</span></div>
                        </div>
                      </div>
                    )}
                    {a.classes?.length > 0 && (
                      <ActivitySection title="Classes Created" icon={Calendar}>
                        {a.classes.slice(0, 10).map((c, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{c.title}</p>
                              <p className="text-xs text-gray-400 capitalize">{c.classType} • {c.difficultyLevel} • ₹{c.cost}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-green-100 text-green-700' : c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.bookingsReceived?.length > 0 && (
                      <ActivitySection title="Recent Bookings Received" icon={Activity}>
                        {a.bookingsReceived.slice(0, 10).map((b, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{b.userId?.name || 'User'}</p>
                              <p className="text-xs text-gray-400">{b.classId?.title || 'Class'} • ₹{b.amountPaid}</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(b.createdAt)}</span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.blogs?.length > 0 && (
                      <ActivitySection title="Blogs Written" icon={BookOpen}>
                        {a.blogs.slice(0, 8).map((b, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{b.title}</p>
                              <p className="text-xs text-gray-400">{b.category}</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(b.createdAt)}</span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                  </>
                )}

                {/* Lab Partner Activity */}
                {a.user?.userType === 'lab-partner' && (
                  <>
                    {a.earnings && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <h4 className="font-semibold text-purple-800 mb-2">Earnings Breakdown</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-purple-600">Total Booking Value:</span> <span className="font-semibold">₹{(a.earnings.totalBookingValue || 0).toLocaleString()}</span></div>
                          <div><span className="text-purple-600">Platform Commission:</span> <span className="font-semibold text-green-700">₹{(a.earnings.totalCommission || 0).toLocaleString()}</span></div>
                          <div><span className="text-purple-600">Total Bookings:</span> <span className="font-semibold">{a.earnings.bookings || 0}</span></div>
                        </div>
                      </div>
                    )}
                    {a.labBookings?.length > 0 && (
                      <ActivitySection title="Recent Lab Bookings" icon={FlaskConical}>
                        {a.labBookings.slice(0, 10).map((b, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{b.userId?.name || 'User'}</p>
                              <p className="text-xs text-gray-400">₹{b.totalAmount || '-'} • {b.paymentStatus}</p>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(b.createdAt)}</span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.tests?.length > 0 && (
                      <ActivitySection title="Tests Offered" icon={Activity}>
                        {a.tests.map((t, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{t.testName || t.name}</p>
                              <p className="text-xs text-gray-400">{t.category || '-'} • ₹{t.price || '-'}</p>
                            </div>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                    {a.invoices?.length > 0 && (
                      <ActivitySection title="Invoices" icon={Calendar}>
                        {a.invoices.slice(0, 8).map((inv, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">Invoice #{inv.invoiceNumber || inv._id?.slice(-6)}</p>
                              <p className="text-xs text-gray-400">₹{inv.totalCommission || '-'}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {inv.status}
                            </span>
                          </div>
                        ))}
                      </ActivitySection>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
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
        <p className="text-gray-600">View and manage all registered users. Click on a user row to see their past activity.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <input type="text" placeholder="Search by name or email..."
              value={filters.search} onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by User Type</label>
            <select value={filters.userType} onChange={handleUserTypeFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]">
              <option value="">All Users</option>
              <option value="fitness-enthusiast">Fitness Enthusiasts</option>
              <option value="trainer">Trainers</option>
              <option value="lab-partner">Lab Partners</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Results per page</label>
            <select value={filters.limit} onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => openUserDetail(user)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-[#225533] transition-colors flex items-center gap-2">
                        {user.name}
                        <Eye size={14} className="text-gray-300 group-hover:text-[#3f8554] transition-colors" />
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                      {(user.userType === 'lab-partner' || user.userType === 'trainer') && user.commissionRate !== undefined && (
                        <div className="text-xs text-[#3f8554] font-semibold mt-1">Commission: {user.commissionRate}%</div>
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
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Suspended</span>
                      ) : user.isActive ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
                      )}
                      {user.userType !== 'fitness-enthusiast' && (
                        <div>
                          {user.isApproved ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Approved</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    {user.userType !== 'admin' && (
                      <div className="space-x-2">
                        {user.isSuspended ? (
                          <button onClick={() => openSuspendModal(user, 'unsuspend')}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded transition-colors">
                            Unsuspend
                          </button>
                        ) : (
                          <button onClick={() => openSuspendModal(user, 'suspend')}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors">
                            Suspend
                          </button>
                        )}
                        {(user.userType === 'lab-partner' || user.userType === 'trainer') && (
                          <button onClick={() => openCommissionModal(user)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded transition-colors">
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
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.currentPage - 1) * filters.limit) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(pagination.currentPage * filters.limit, pagination.totalUsers)}</span>{' '}
                  of <span className="font-medium">{pagination.totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-[#3f8554] border-[#3f8554] text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${page === 1 ? 'rounded-l-md' : ''} ${page === pagination.totalPages ? 'rounded-r-md' : ''}`}>
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
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#3f8554]/20">
              <div className="bg-gradient-to-r from-[#225533] to-[#3f8554] p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">Set Commission Rate</h3>
                  <button onClick={closeCommissionModal}
                    className="text-white/80 hover:text-white text-2xl font-bold bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center">×</button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    {commissionModal.userType === 'trainer' ? 'Trainer' : 'Lab Partner'}: <strong className="text-[#225533]">{commissionModal.user?.laboratoryName || commissionModal.user?.name}</strong>
                  </p>
                  <p className="text-xs text-gray-500">Current Rate: {commissionModal.user?.commissionRate || (commissionModal.userType === 'trainer' ? 15 : 10)}%</p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Commission Rate (%):</label>
                  <input type="number" value={newCommissionRate} onChange={(e) => setNewCommissionRate(e.target.value)}
                    placeholder="0-100" min="0" max="100" step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent" />
                  <p className="text-xs text-gray-500 mt-2">This rate will apply to all future bookings.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={closeCommissionModal} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleUpdateCommissionRate} disabled={!newCommissionRate}
                    className="flex-1 px-4 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors disabled:opacity-50">
                    Update Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Suspension Modal */}
      {suspendModal.isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {suspendModal.action === 'suspend' ? 'Suspend User' : 'Unsuspend User'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  User: <strong>{suspendModal.user?.name}</strong> ({suspendModal.user?.email})
                </p>
                {suspendModal.action === 'suspend' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason:</label>
                    <textarea value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)}
                      placeholder="Enter reason..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3f8554]" rows="3" />
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button onClick={closeSuspendModal} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">Cancel</button>
                  <button onClick={handleSuspendUser} disabled={suspendModal.action === 'suspend' && !suspensionReason.trim()}
                    className={`px-4 py-2 rounded transition-colors disabled:opacity-50 ${suspendModal.action === 'suspend' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                    {suspendModal.action === 'suspend' ? 'Suspend' : 'Unsuspend'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Activity Slide-over Panel */}
      {renderActivityPanel()}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────

const MiniStat = ({ label, value, icon: Icon, color = 'green' }) => {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <div className={`${c} border rounded-xl p-3 text-center`}>
      <Icon size={18} className="mx-auto mb-1 opacity-70" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
};

const ActivitySection = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
      <Icon size={16} className="text-[#3f8554]" />
      <h4 className="font-semibold text-gray-700 text-sm">{title}</h4>
    </div>
    <div className="px-4 py-2">{children}</div>
  </div>
);

export default ManageUsers;
