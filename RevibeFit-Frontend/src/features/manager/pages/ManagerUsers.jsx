import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, Ban, CheckCircle, Eye } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api/manager';

const ManagerUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [userType, setUserType] = useState('');
    const [page, setPage] = useState(1);
    const [activityModal, setActivityModal] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [suspendModal, setSuspendModal] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    useEffect(() => { if (!token) navigate('/login'); }, []);
    useEffect(() => { fetchUsers(); }, [page, userType]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 15 });
            if (search) params.set('search', search);
            if (userType) params.set('userType', userType);
            const res = await fetch(`${API}/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUsers(data.data.users || []);
            setPagination(data.data.pagination || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchUsers(); };

    const handleSuspend = async (userId, suspend) => {
        try {
            const res = await fetch(`${API}/users/${userId}/suspend`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ suspend, reason: suspend ? suspendReason : undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuspendModal(null); setSuspendReason('');
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const fetchActivity = async (userId) => {
        try {
            const res = await fetch(`${API}/users/${userId}/activity`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setActivityData(data.data);
            setActivityModal(userId);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegion={manager.assignedRegion} />
            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
                    <p className="text-gray-500 mb-6">Manage users in {manager.assignedRegion || 'your region'}</p>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="flex-1 relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" />
                            </div>
                            <button type="submit" className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">Search</button>
                        </form>
                        <select value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1); }}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                            <option value="">All Types</option>
                            <option value="fitness-enthusiast">Fitness Enthusiasts</option>
                            <option value="trainer">Trainers</option>
                            <option value="lab-partner">Lab Partners</option>
                        </select>
                    </div>

                    {/* Users Table */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" /></div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr className="text-left text-gray-500">
                                            <th className="px-6 py-4 font-medium">Name</th>
                                            <th className="px-6 py-4 font-medium">Email</th>
                                            <th className="px-6 py-4 font-medium">Type</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium">Joined</th>
                                            <th className="px-6 py-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id} className="border-t hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{user.userType?.replace('-', ' ')}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.isSuspended ? (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspended</span>
                                                    ) : user.isApproved ? (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => fetchActivity(user._id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View Activity"><Eye size={16} /></button>
                                                        {user.userType !== 'manager' && user.userType !== 'admin' && (
                                                            user.isSuspended ? (
                                                                <button onClick={() => handleSuspend(user._id, false)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Unsuspend"><CheckCircle size={16} /></button>
                                                            ) : (
                                                                <button onClick={() => setSuspendModal(user._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Suspend"><Ban size={16} /></button>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t">
                                    <p className="text-sm text-gray-500">Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalUsers} users)</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Previous</button>
                                        <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Suspend Modal */}
            {suspendModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspend User</h3>
                        <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason for suspension..." className="w-full px-3 py-2 border rounded-lg text-sm mb-4" rows={3} />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => { setSuspendModal(null); setSuspendReason(''); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={() => handleSuspend(suspendModal, true)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Suspend</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {activityModal && activityData && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">User Activity: {activityData.user?.name}</h3>
                            <button onClick={() => { setActivityModal(null); setActivityData(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        {activityData.summary && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                {Object.entries(activityData.summary).map(([key, val]) => (
                                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                        <p className="text-lg font-semibold text-gray-900">{typeof val === 'number' ? val.toLocaleString() : val}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-sm text-gray-500">More details available in the full admin panel.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerUsers;
