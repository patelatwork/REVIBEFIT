import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, FileText, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api/manager';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
        </div>
    </motion.div>
);

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/analytics/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setDashboard(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegion={manager.assignedRegion} managerType={manager.managerType} />

            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {manager.name || 'Manager'}!</h1>
                        <p className="text-gray-500 mt-1">
                            {manager.managerType === 'trainer_manager' ? '🏋️ Trainer Manager' : manager.managerType === 'lab_manager' ? '🧪 Lab Manager' : 'Manager'}
                            {' • Region: '}{manager.assignedRegion || 'Not assigned'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
                            <p className="font-medium">Failed to load dashboard</p>
                            <p className="text-sm mt-1">{error}</p>
                            <button onClick={fetchDashboard} className="mt-3 text-sm bg-red-100 px-4 py-2 rounded-lg hover:bg-red-200">Retry</button>
                        </div>
                    ) : dashboard ? (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {manager.managerType === 'trainer_manager' ? (
                                    <>
                                        <StatCard title="Total Trainers" value={dashboard.overview?.totalTrainers || 0} icon={Users} color="bg-purple-500" subtitle={`${dashboard.overview?.newTrainersThisMonth || 0} new this month`} />
                                        <StatCard title="Fitness Enthusiasts" value={dashboard.overview?.fitnessEnthusiasts || 0} icon={Users} color="bg-blue-500" />
                                        <StatCard title="Pending Approvals" value={dashboard.overview?.pendingApprovals || 0} icon={ShieldCheck} color="bg-amber-500" subtitle="Requires action" />
                                        <StatCard title="Active Trainers" value={dashboard.overview?.activeTrainers || 0} icon={Activity} color="bg-green-500" subtitle={`${dashboard.overview?.suspendedTrainers || 0} suspended`} />
                                    </>
                                ) : manager.managerType === 'lab_manager' ? (
                                    <>
                                        <StatCard title="Lab Partners" value={dashboard.overview?.totalLabPartners || 0} icon={Users} color="bg-teal-500" subtitle={`${dashboard.overview?.newLabsThisMonth || 0} new this month`} />
                                        <StatCard title="Fitness Enthusiasts" value={dashboard.overview?.fitnessEnthusiasts || 0} icon={Users} color="bg-blue-500" />
                                        <StatCard title="Pending Approvals" value={dashboard.overview?.pendingApprovals || 0} icon={ShieldCheck} color="bg-amber-500" subtitle="Requires action" />
                                        <StatCard title="Overdue Invoices" value={dashboard.invoices?.overdue || 0} icon={AlertTriangle} color="bg-red-500" subtitle={`${dashboard.invoices?.pending || 0} pending payment`} />
                                    </>
                                ) : (
                                    <>
                                        <StatCard title="Total Users" value={dashboard.overview?.totalUsers || 0} icon={Users} color="bg-blue-500" />
                                        <StatCard title="Pending Approvals" value={dashboard.overview?.pendingApprovals || 0} icon={ShieldCheck} color="bg-amber-500" />
                                    </>
                                )}
                            </div>

                            {/* Type-specific Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {manager.managerType === 'trainer_manager' ? (
                                    <>
                                        <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Stats</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Total Classes', value: dashboard.liveClasses?.total || 0 },
                                                    { label: 'Total Bookings', value: dashboard.liveClasses?.totalBookings || 0 },
                                                    { label: 'Bookings This Month', value: dashboard.liveClasses?.bookingsThisMonth || 0 },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{item.label}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainer Earnings</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Total Revenue', value: `₹${(dashboard.trainerEarnings?.totalRevenue || 0).toLocaleString()}` },
                                                    { label: 'Platform Commission', value: `₹${(dashboard.trainerEarnings?.totalCommission || 0).toLocaleString()}` },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{item.label}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                ) : manager.managerType === 'lab_manager' ? (
                                    <>
                                        <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Bookings</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Total Bookings', value: dashboard.labs?.totalBookings || 0 },
                                                    { label: 'Bookings This Month', value: dashboard.labs?.bookingsThisMonth || 0 },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{item.label}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Total Invoices', value: dashboard.invoices?.total || 0 },
                                                    { label: 'Paid', value: dashboard.invoices?.paid || 0 },
                                                    { label: 'Overdue', value: dashboard.invoices?.overdue || 0 },
                                                    { label: 'Pending', value: dashboard.invoices?.pending || 0 },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{item.label}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Stats</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Total Revenue', value: `₹${(dashboard.commissionStats?.totalRevenue || 0).toLocaleString()}` },
                                                    { label: 'Total Commission', value: `₹${(dashboard.commissionStats?.totalCommission || 0).toLocaleString()}` },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">{item.label}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                ) : null}

                                {/* Quick Actions (always shown) */}
                                <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                    <div className="space-y-3">
                                        <button onClick={() => navigate('/manager/pending-approvals')} className="w-full text-left px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium">
                                            Review Pending Approvals →
                                        </button>
                                        <button onClick={() => navigate('/manager/users')} className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                                            Manage Users →
                                        </button>
                                        {manager.managerType === 'lab_manager' && (
                                            <button onClick={() => navigate('/manager/invoices')} className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                                                Manage Invoices →
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Recent Registrations */}
                            {dashboard.recentRegistrations?.length > 0 && (
                                <motion.div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500 border-b">
                                                    <th className="pb-3 font-medium">Name</th>
                                                    <th className="pb-3 font-medium">Email</th>
                                                    <th className="pb-3 font-medium">Type</th>
                                                    <th className="pb-3 font-medium">Status</th>
                                                    <th className="pb-3 font-medium">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboard.recentRegistrations.map((user) => (
                                                    <tr key={user._id} className="border-b last:border-0">
                                                        <td className="py-3 font-medium text-gray-900">{user.name}</td>
                                                        <td className="py-3 text-gray-600">{user.email}</td>
                                                        <td className="py-3">
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                                                {user.userType?.replace('-', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {user.isApproved ? 'Approved' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
