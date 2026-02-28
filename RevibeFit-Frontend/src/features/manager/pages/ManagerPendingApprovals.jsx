import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, X, Lock, Unlock, Clock } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api/manager';

const ManagerPendingApprovals = () => {
    const navigate = useNavigate();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [rejectReason, setRejectReason] = useState({});
    const [showRejectForm, setShowRejectForm] = useState({});

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/pending-approvals`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setApprovals(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (userId) => {
        setActionLoading((p) => ({ ...p, [userId]: 'claiming' }));
        try {
            const res = await fetch(`${API}/claim/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchApprovals();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading((p) => ({ ...p, [userId]: null }));
        }
    };

    const handleRelease = async (userId) => {
        setActionLoading((p) => ({ ...p, [userId]: 'releasing' }));
        try {
            const res = await fetch(`${API}/release/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
            fetchApprovals();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading((p) => ({ ...p, [userId]: null }));
        }
    };

    const handleApprove = async (userId) => {
        setActionLoading((p) => ({ ...p, [userId]: 'approving' }));
        try {
            const res = await fetch(`${API}/approve/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchApprovals();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading((p) => ({ ...p, [userId]: null }));
        }
    };

    const handleReject = async (userId) => {
        if (!rejectReason[userId]?.trim()) { alert('Please provide a reason'); return; }
        setActionLoading((p) => ({ ...p, [userId]: 'rejecting' }));
        try {
            const res = await fetch(`${API}/reject/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason[userId] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchApprovals();
            setShowRejectForm((p) => ({ ...p, [userId]: false }));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading((p) => ({ ...p, [userId]: null }));
        }
    };

    const isClaimedByMe = (user) => user.claimedBy === manager._id;
    const isClaimedByOther = (user) => {
        if (!user.claimedBy || !user.claimedAt) return false;
        const expired = Date.now() - new Date(user.claimedAt).getTime() > 10 * 60 * 1000;
        return !expired && user.claimedBy !== manager._id;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegion={manager.assignedRegion} />
            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                            <p className="text-gray-500 mt-1">{approvals.length} pending in {manager.assignedRegion || 'your region'}</p>
                        </div>
                        <button onClick={fetchApprovals} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">Refresh</button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" /></div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">{error}</div>
                    ) : approvals.length === 0 ? (
                        <div className="text-center py-20"><ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 text-lg">No pending approvals</p></div>
                    ) : (
                        <div className="space-y-4">
                            {approvals.map((user) => (
                                <motion.div key={user._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{user.userType?.replace('-', ' ')}</span>
                                                {isClaimedByMe(user) && <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1"><Lock size={12} /> Claimed by you</span>}
                                                {isClaimedByOther(user) && <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1"><Clock size={12} /> Under review</span>}
                                            </div>
                                            <p className="text-sm text-gray-500">{user.email} • {user.phone || 'No phone'}</p>
                                            {user.userType === 'trainer' && <p className="text-sm text-gray-500 mt-1">Specialization: {user.specialization || 'N/A'}</p>}
                                            {user.userType === 'lab-partner' && (
                                                <p className="text-sm text-gray-500 mt-1">Lab: {user.laboratoryName || 'N/A'} • License: {user.licenseNumber || 'N/A'}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">Applied: {new Date(user.createdAt).toLocaleDateString()} • {user.city}, {user.state}</p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {!isClaimedByMe(user) && !isClaimedByOther(user) && (
                                                <button onClick={() => handleClaim(user._id)} disabled={actionLoading[user._id]} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                                                    <Lock size={14} /> Claim
                                                </button>
                                            )}
                                            {isClaimedByMe(user) && (
                                                <>
                                                    <button onClick={() => handleApprove(user._id)} disabled={actionLoading[user._id]} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => setShowRejectForm((p) => ({ ...p, [user._id]: !p[user._id] }))} disabled={actionLoading[user._id]} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                                                        <X size={14} /> Reject
                                                    </button>
                                                    <button onClick={() => handleRelease(user._id)} disabled={actionLoading[user._id]} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium disabled:opacity-50 flex items-center gap-1">
                                                        <Unlock size={14} /> Release
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {showRejectForm[user._id] && (
                                        <div className="mt-4 p-4 bg-red-50 rounded-lg">
                                            <textarea
                                                value={rejectReason[user._id] || ''} onChange={(e) => setRejectReason((p) => ({ ...p, [user._id]: e.target.value }))}
                                                placeholder="Reason for rejection..." className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" rows={2}
                                            />
                                            <button onClick={() => handleReject(user._id)} disabled={actionLoading[user._id]} className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                                                {actionLoading[user._id] === 'rejecting' ? 'Rejecting...' : 'Confirm Rejection'}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerPendingApprovals;
