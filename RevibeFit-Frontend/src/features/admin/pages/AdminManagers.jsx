import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCog, Plus, Trash2, Activity, X } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const API = 'http://localhost:8000/api/admin';

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep", "Puducherry",
];

const AdminManagers = () => {
    const navigate = useNavigate();
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', assignedRegion: '', department: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [activityLog, setActivityLog] = useState(null);
    const [activityManager, setActivityManager] = useState(null);
    const [commissionRequests, setCommissionRequests] = useState([]);
    const [showCommissions, setShowCommissions] = useState(false);

    const token = localStorage.getItem('accessToken');
    useEffect(() => { if (!token) navigate('/login'); else { fetchManagers(); fetchCommissions(); } }, []);

    const fetchManagers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/managers`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setManagers(data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchCommissions = async () => {
        try {
            const res = await fetch(`${API}/commission-requests`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setCommissionRequests(data.data || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.name || !createForm.email || !createForm.password) { setCreateError('Name, email, password required'); return; }
        setCreateLoading(true); setCreateError('');
        try {
            const res = await fetch(`${API}/managers`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShowCreate(false); setCreateForm({ name: '', email: '', password: '', phone: '', assignedRegion: '', department: '' });
            fetchManagers();
        } catch (err) { setCreateError(err.message); } finally { setCreateLoading(false); }
    };

    const handleRemove = async (id, name) => {
        if (!confirm(`Remove manager "${name}"? Their account will be deactivated.`)) return;
        try {
            const res = await fetch(`${API}/managers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
            fetchManagers();
        } catch (err) { alert(err.message); }
    };

    const viewActivity = async (id) => {
        try {
            const res = await fetch(`${API}/managers/${id}/activity-log`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setActivityLog(data.data.logs || []);
            setActivityManager(data.data.manager);
        } catch (err) { alert(err.message); }
    };

    const handleCommissionAction = async (id, action, adminResponse) => {
        try {
            const res = await fetch(`${API}/commission-requests/${id}/respond`, {
                method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, adminResponse }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
            fetchCommissions();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar activeSection="managers" onSectionChange={() => { }} />
            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manager Management</h1>
                            <p className="text-gray-500 mt-1">{managers.length} managers • {commissionRequests.length} pending commission requests</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCommissions(!showCommissions)} className={`px-4 py-2 rounded-lg text-sm font-medium ${commissionRequests.length > 0 ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                Commission Requests ({commissionRequests.length})
                            </button>
                            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#3f8554] text-white rounded-lg text-sm font-medium hover:bg-[#225533] flex items-center gap-2">
                                <Plus size={16} /> Add Manager
                            </button>
                        </div>
                    </div>

                    {/* Commission Requests */}
                    {showCommissions && commissionRequests.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4">Pending Commission Rate Requests</h3>
                            <div className="space-y-3">
                                {commissionRequests.map((req) => (
                                    <div key={req._id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{req.targetUserId?.name || 'User'} ({req.targetUserType})</p>
                                            <p className="text-sm text-gray-500">Current: {req.currentRate}% → Proposed: {req.proposedRate}%</p>
                                            <p className="text-sm text-gray-500">By: {req.requestedBy?.name} • Reason: {req.reason}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleCommissionAction(req._id, 'approved')} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">Approve</button>
                                            <button onClick={() => handleCommissionAction(req._id, 'denied', 'Request denied by admin')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">Deny</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Managers List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" /></div>
                    ) : managers.length === 0 ? (
                        <div className="text-center py-20"><UserCog size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No managers yet</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {managers.map((mgr) => (
                                <motion.div key={mgr._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                {mgr.name?.charAt(0)?.toUpperCase() || 'M'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{mgr.name}</h3>
                                                <p className="text-sm text-gray-500">{mgr.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${mgr.isActive && !mgr.isSuspended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {mgr.isActive && !mgr.isSuspended ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600"><span className="font-medium">Region:</span> {mgr.assignedRegion || 'Not assigned'}</p>
                                        {mgr.department && <p className="text-sm text-gray-600"><span className="font-medium">Dept:</span> {mgr.department}</p>}
                                        <p className="text-sm text-gray-600"><span className="font-medium">Recent actions:</span> {mgr.recentActions || 0} (30 days)</p>
                                        <p className="text-xs text-gray-400">Created: {new Date(mgr.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => viewActivity(mgr._id)} className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                                            <Activity size={14} /> Activity
                                        </button>
                                        {mgr.isActive && (
                                            <button onClick={() => handleRemove(mgr._id, mgr.name)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-1">
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Manager Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Create Manager</h3>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input value={createForm.name} onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="Full Name *" className="w-full px-4 py-3 border rounded-lg text-sm" />
                            <input type="email" value={createForm.email} onChange={(e) => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="Email *" className="w-full px-4 py-3 border rounded-lg text-sm" />
                            <input type="password" value={createForm.password} onChange={(e) => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Password *" className="w-full px-4 py-3 border rounded-lg text-sm" />
                            <input value={createForm.phone} onChange={(e) => setCreateForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full px-4 py-3 border rounded-lg text-sm" />
                            <select value={createForm.assignedRegion} onChange={(e) => setCreateForm(p => ({ ...p, assignedRegion: e.target.value }))} className="w-full px-4 py-3 border rounded-lg text-sm bg-white">
                                <option value="">Select Region</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input value={createForm.department} onChange={(e) => setCreateForm(p => ({ ...p, department: e.target.value }))} placeholder="Department (optional)" className="w-full px-4 py-3 border rounded-lg text-sm" />
                            {createError && <p className="text-red-500 text-sm">{createError}</p>}
                            <button type="submit" disabled={createLoading} className="w-full py-3 bg-[#3f8554] text-white rounded-lg font-medium hover:bg-[#225533] disabled:opacity-50">
                                {createLoading ? 'Creating...' : 'Create Manager'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Log Modal */}
            {activityLog && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Activity Log: {activityManager?.name}</h3>
                            <button onClick={() => { setActivityLog(null); setActivityManager(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        {activityLog.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No activity recorded</p>
                        ) : (
                            <div className="space-y-3">
                                {activityLog.map((log, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900">{log.action?.replace(/_/g, ' ')}</span>
                                            <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Target: {log.targetModel} • {log.targetId || 'N/A'}</p>
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <p className="text-xs text-gray-400 mt-1">{JSON.stringify(log.details)}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagers;
