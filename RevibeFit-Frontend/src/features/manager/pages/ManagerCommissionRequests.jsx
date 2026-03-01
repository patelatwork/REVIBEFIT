import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Plus, Send, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, User as UserIcon } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api/manager';

const statusConfig = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Approved' },
    denied: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Denied' },
};

const ManagerCommissionRequests = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [expandedRequest, setExpandedRequest] = useState(null);

    // Users for the form
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ targetUserId: '', proposedRate: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');
    const isLabManager = manager.managerType === 'lab_manager';
    const isTrainerManager = manager.managerType === 'trainer_manager';

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/commission-requests/mine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setRequests(data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            if (isLabManager) {
                const res = await fetch(`${API}/lab-partners/commission-rates`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setUsers(data.data || []);
            } else {
                // Trainer manager — fetch trainers from users endpoint
                const res = await fetch(`${API}/users?limit=200&type=trainer`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setUsers(data.data?.users || []);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleOpenForm = () => {
        setShowForm(true);
        fetchUsers();
    };

    const handleUserSelect = (userId) => {
        setFormData(p => ({ ...p, targetUserId: userId }));
        const user = users.find(u => u._id === userId);
        setSelectedUser(user);
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!formData.targetUserId || formData.proposedRate === '' || !formData.reason.trim()) {
            setError('All fields are required');
            return;
        }

        const rate = Number(formData.proposedRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            setError('Commission rate must be between 0 and 100');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch(`${API}/commission-requests`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetUserId: formData.targetUserId,
                    proposedRate: rate,
                    reason: formData.reason,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSuccess('Commission rate change request submitted successfully!');
            setFormData({ targetUserId: '', proposedRate: '', reason: '' });
            setSelectedUser(null);
            setShowForm(false);
            fetchRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegion={manager.assignedRegion} managerType={manager.managerType} />

            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Commission Requests</h1>
                            <p className="text-gray-500 mt-1">
                                Request commission rate changes for {isLabManager ? 'lab partners' : 'trainers'} in your region
                            </p>
                        </div>
                        {!showForm && (
                            <button onClick={handleOpenForm} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm">
                                <Plus size={16} />New Request
                            </button>
                        )}
                    </div>

                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <p className="text-green-700 text-sm font-medium">{success}</p>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <XCircle size={20} className="text-red-600" />
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><XCircle size={16} /></button>
                        </motion.div>
                    )}

                    {/* New Request Form */}
                    {showForm && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ArrowLeftRight size={20} className="text-blue-500" />New Commission Request
                                </h3>
                                <button onClick={() => { setShowForm(false); setFormData({ targetUserId: '', proposedRate: '', reason: '' }); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* User Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Select {isLabManager ? 'Lab Partner' : 'Trainer'}
                                    </label>
                                    {loadingUsers ? (
                                        <div className="p-3 text-sm text-gray-500">Loading users...</div>
                                    ) : (
                                        <select
                                            value={formData.targetUserId}
                                            onChange={(e) => handleUserSelect(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="">— Select a {isLabManager ? 'lab partner' : 'trainer'} —</option>
                                            {users.map(u => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name} {isLabManager && u.laboratoryName ? `(${u.laboratoryName})` : ''} — {u.email}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Current Rate (read-only) */}
                                {selectedUser && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Commission Rate</label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm font-semibold">
                                            {selectedUser.commissionRate ?? (isLabManager ? 10 : 15)}%
                                        </div>
                                    </div>
                                )}

                                {/* Proposed Rate */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Proposed Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formData.proposedRate}
                                        onChange={(e) => setFormData(p => ({ ...p, proposedRate: e.target.value }))}
                                        min="0" max="100" step="0.5"
                                        placeholder="e.g., 12"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Reason */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Change</label>
                                    <textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                                        rows="3"
                                        placeholder="Explain why you are requesting this commission rate change..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50">
                                    <Send size={16} />{submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Request List */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-12 text-center">
                                <ArrowLeftRight size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 font-medium">No commission requests yet</p>
                                <p className="text-gray-400 text-sm mt-1">Click "New Request" to submit your first commission rate change request</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {requests.map((req) => {
                                    const cfg = statusConfig[req.status] || statusConfig.pending;
                                    const StatusIcon = cfg.icon;
                                    const isExpanded = expandedRequest === req._id;
                                    return (
                                        <div key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer" onClick={() => setExpandedRequest(isExpanded ? null : req._id)}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <UserIcon size={14} className="text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-900 truncate">
                                                            {req.targetUserId?.name || 'Unknown User'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 capitalize">
                                                            ({req.targetUserId?.userType?.replace('-', ' ') || 'N/A'})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span>{req.currentRate}% → <span className="font-semibold text-gray-700">{req.proposedRate}%</span></span>
                                                        <span>•</span>
                                                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                                                        <StatusIcon size={12} />{cfg.label}
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pb-5 -mt-1">
                                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-medium text-gray-700">Reason:</span>
                                                            <p className="text-gray-600 mt-0.5">{req.reason}</p>
                                                        </div>
                                                        {req.targetUserId?.email && (
                                                            <div>
                                                                <span className="font-medium text-gray-700">Email:</span>
                                                                <span className="text-gray-600 ml-2">{req.targetUserId.email}</span>
                                                            </div>
                                                        )}
                                                        {req.targetUserId?.laboratoryName && (
                                                            <div>
                                                                <span className="font-medium text-gray-700">Laboratory:</span>
                                                                <span className="text-gray-600 ml-2">{req.targetUserId.laboratoryName}</span>
                                                            </div>
                                                        )}
                                                        {req.adminResponse && (
                                                            <div className="pt-2 border-t border-gray-200">
                                                                <span className="font-medium text-gray-700">Admin Response:</span>
                                                                <p className="text-gray-600 mt-0.5">{req.adminResponse}</p>
                                                                {req.respondedAt && (
                                                                    <p className="text-gray-400 text-xs mt-1">
                                                                        Responded on {new Date(req.respondedAt).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ManagerCommissionRequests;
