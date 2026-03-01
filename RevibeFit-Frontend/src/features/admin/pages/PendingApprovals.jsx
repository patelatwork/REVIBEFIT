import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import useLiveData from '../../../hooks/useLiveData';

const AVATAR_COLORS = [
  'bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500',
];
const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const ApprovalCard = ({ user, actionLoading, onApprove, onReject }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isTrainer = user.userType === 'trainer';
  const isLabPartner = user.userType === 'lab-partner';
  const loading = actionLoading === user._id;

  const roleBadgeColor = isTrainer
    ? 'bg-orange-100 text-orange-600'
    : 'bg-purple-100 text-purple-600';

  const age = user.dateOfBirth
    ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : user.age || '—';

  // Normalise certification path
  const certUrl = (() => {
    const raw = user.certifications;
    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    let p = raw.replace(/\\/g, '/');
    if (p.includes('RevibeFit-Backend')) {
      const parts = p.split('/');
      p = `temp/${parts[parts.length - 1]}`;
    } else {
      p = p.replace(/^public\//, '');
    }
    return `http://localhost:8000/${p}`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-6 flex flex-col lg:flex-row gap-6">
        {/* ── Left content ── */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${getAvatarColor(user.name)}`}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#225533] leading-tight">{user.name}</h3>
              <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColor}`}>
                {isTrainer ? 'Trainer' : 'Lab Partner'}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Phone</p>
              <p className="text-sm font-semibold text-gray-800">{user.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Age</p>
              <p className="text-sm font-semibold text-gray-800">{age}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Registered</p>
              <p className="text-sm font-semibold text-gray-800">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            {(user.city || user.state) && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-gray-800">{[user.city, user.state].filter(Boolean).join(', ')}</p>
              </div>
            )}
          </div>

          <hr className="border-gray-100 mb-4" />

          {/* Specialization / Lab info */}
          {isTrainer && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-0.5">Specialization</p>
              <p className="text-sm font-semibold text-gray-800">{user.specialization || 'N/A'}</p>
            </div>
          )}
          {isLabPartner && (
            <div className="mb-3 grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Laboratory</p>
                <p className="text-sm font-semibold text-gray-800">{user.laboratoryName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">License No.</p>
                <p className="text-sm font-semibold text-gray-800">{user.licenseNumber || 'N/A'}</p>
              </div>
              {user.laboratoryAddress && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Address</p>
                  <p className="text-sm font-semibold text-gray-800">{user.laboratoryAddress}</p>
                </div>
              )}
            </div>
          )}

          {/* Certifications link */}
          {certUrl && (
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              <FileText size={15} />
              {isLabPartner ? 'View Documents' : 'View Certifications'}
            </a>
          )}
        </div>

        {/* ── Right action column ── */}
        <div className="flex flex-row lg:flex-col justify-end gap-3 lg:w-44 lg:shrink-0">
          <button
            onClick={() => onApprove(user._id)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#2d6a4f] hover:bg-[#245a42] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectForm((v) => !v)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#e63946] hover:bg-[#c1121f] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Rejection form */}
      <AnimatePresence>
        {showRejectForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-red-100 bg-red-50 px-6 py-4"
          >
            <p className="text-sm font-medium text-red-700 mb-2">Reason for rejection</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Describe why this application is being rejected…"
              className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  if (!rejectReason.trim()) { alert('Please provide a reason'); return; }
                  onReject(user._id, rejectReason, () => setShowRejectForm(false));
                }}
                disabled={loading}
                className="px-5 py-2 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PendingApprovals = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const admin = localStorage.getItem('user');
    if (!admin) navigate('/login');
  }, [navigate]);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/pending-approvals', { headers: getAdminHeaders() });
      const data = await response.json();
      if (response.ok) setPendingUsers(data.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(fetchPendingApprovals, 5000);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/approve/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({}),
      });
      if (response.ok) {
        fetchPendingApprovals();
      } else {
        const errorData = await response.json().catch(() => null);
        alert(`Failed to approve: ${errorData?.message || 'Server error'}`);
      }
    } catch (error) {
      alert('Error approving user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, reason, onSuccess) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/reject/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        onSuccess?.();
        fetchPendingApprovals();
      } else {
        const errorData = await response.json().catch(() => null);
        alert(`Failed to reject: ${errorData?.message || 'Server error'}`);
      }
    } catch (error) {
      alert('Error rejecting user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="approvals" onSectionChange={() => { }} />

      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#225533] mb-1">Pending Approvals</h1>
                <p className="text-gray-500 text-sm">Review and approve trainer and lab partner registrations</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">Live Updates</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3f8554]" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <svg className="w-14 h-14 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No Pending Approvals</h3>
              <p className="text-gray-400 text-sm">All registration requests have been processed!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <ApprovalCard
                  key={user._id}
                  user={user}
                  actionLoading={actionLoading}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingApprovals;