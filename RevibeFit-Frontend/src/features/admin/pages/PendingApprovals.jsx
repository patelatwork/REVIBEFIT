import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText, Search, ChevronLeft, ChevronRight, X,
  CheckCircle2, XCircle, MessageSquare, ExternalLink, Clock, Image
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import useLiveData from '../../../hooks/useLiveData';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AVATAR_COLORS = [
  'bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500',
];
const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

// ── Helpers ─────────────────────────────────────────────────
const normalisePath = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  let p = raw.replace(/\\/g, '/');
  if (p.includes('RevibeFit-Backend')) {
    const parts = p.split('/');
    p = `temp/${parts[parts.length - 1]}`;
  } else {
    p = p.replace(/^public\//, '');
  }
  return `${API}/${p}`;
};

const isImageUrl = (url) => /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url || '');

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// ── Reusable field component ────────────────────────────────
const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);

// ── Section header ──────────────────────────────────────────
const SectionHeader = ({ children }) => (
  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-1">{children}</h4>
);

// ── Document embed component ────────────────────────────────
const DocEmbed = ({ url, label }) => {
  if (!url) return null;
  if (isImageUrl(url)) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={label} className="max-w-xs max-h-48 object-contain rounded-lg border border-gray-200 hover:ring-2 hover:ring-emerald-400 transition" />
        </a>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <ExternalLink size={11} /> Open
        </a>
      </div>
      <iframe
        src={url}
        title={label}
        className="w-full h-48 rounded-lg border border-gray-200 bg-gray-50"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

// ── Request More Info Modal ─────────────────────────────────
const RequestInfoModal = ({ user, onClose, onSend, sending }) => {
  const [message, setMessage] = useState('');
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#225533]">Request More Info</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-3">
            This message will be emailed to <strong>{user.name}</strong> ({user.email}).
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f8554] resize-none"
            placeholder="Describe what additional information or documents are needed…"
          />
          <div className="flex gap-3 mt-4 justify-end">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { if (!message.trim()) return; onSend(user._id, message); }}
              disabled={!message.trim() || sending}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#2d6a4f] rounded-xl hover:bg-[#245a42] transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Approval Card (full profile inline) ─────────────────────
const ApprovalCard = ({ user, actionLoading, onApprove, onReject, onRequestInfo }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isTrainer = user.userType === 'trainer';
  const loading = actionLoading === user._id;
  const isPending = user.approvalStatus === 'pending';

  const age = user.dateOfBirth
    ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : user.age || '—';

  const certUrl = normalisePath(user.certifications);
  const govIdUrl = normalisePath(user.governmentId);
  const accredUrl = normalisePath(user.accreditationDocs);
  const labImgs = (user.labImages || []).map(normalisePath).filter(Boolean);
  const hasSocials = user.socialLinks && Object.values(user.socialLinks).some(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="p-6 flex flex-col lg:flex-row gap-6">
        {/* ── Left: Full profile content ── */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 ${getAvatarColor(user.name)}`}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#225533] leading-tight">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${isTrainer ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                  {isTrainer ? 'Trainer' : 'Lab Partner'}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[user.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                  {user.approvalStatus}
                </span>
              </div>
            </div>
          </div>

          {/* ── Basic Information ── */}
          <SectionHeader>Basic Information</SectionHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 mb-5">
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone || '—'} />
            <Field label="Age" value={age} />
            <Field label="Registered" value={new Date(user.createdAt).toLocaleDateString()} />
            <Field label="City" value={user.city} />
            <Field label="State" value={user.state} />
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* ── Trainer: Professional Details ── */}
          {isTrainer && (
            <>
              <SectionHeader>Professional Details</SectionHeader>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
                <div className="col-span-2">
                  <Field label="Specialization" value={user.specialization} />
                </div>
                {user.bio && (
                  <div className="col-span-2">
                    <Field label="Bio / Experience" value={user.bio} />
                  </div>
                )}
              </div>

              {/* Social Links */}
              {hasSocials && (
                <>
                  <SectionHeader>Social Links</SectionHeader>
                  <div className="flex flex-wrap gap-3 mb-5">
                    {user.socialLinks.instagram && (
                      <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-sm font-medium hover:bg-pink-100 transition-colors">
                        <ExternalLink size={14} /> Instagram
                      </a>
                    )}
                    {user.socialLinks.youtube && (
                      <a href={user.socialLinks.youtube} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                        <ExternalLink size={14} /> YouTube
                      </a>
                    )}
                    {user.socialLinks.twitter && (
                      <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-sm font-medium hover:bg-sky-100 transition-colors">
                        <ExternalLink size={14} /> X (Twitter)
                      </a>
                    )}
                    {user.socialLinks.website && (
                      <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Website
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Documents (embedded) */}
              {(certUrl || govIdUrl) && (
                <>
                  <SectionHeader>Documents</SectionHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <DocEmbed url={certUrl} label="Certifications" />
                    <DocEmbed url={govIdUrl} label="Government ID" />
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Lab Partner: Laboratory Details ── */}
          {!isTrainer && (
            <>
              <SectionHeader>Laboratory Details</SectionHeader>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
                <Field label="Laboratory Name" value={user.laboratoryName} />
                <Field label="License Number" value={user.licenseNumber} />
                <div className="col-span-2">
                  <Field label="Laboratory Address" value={user.laboratoryAddress} />
                </div>
              </div>

              {/* Operating Hours */}
              {user.operatingHours && (
                <>
                  <SectionHeader>Operating Hours</SectionHeader>
                  <div className="bg-gray-50 rounded-xl p-3 mb-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {DAYS_OF_WEEK.map((day) => (
                            <th key={day} className="px-2 py-1 text-xs font-bold text-gray-500 text-center">
                              {DAY_ABBR[day]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {DAYS_OF_WEEK.map((day) => {
                            const h = user.operatingHours[day];
                            return (
                              <td key={day} className="px-2 py-1.5 text-center">
                                {h?.isOpen ? (
                                  <span className="text-gray-700 text-xs font-medium">{h.open}–{h.close}</span>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">Closed</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Documents & Images (embedded) */}
              {(accredUrl || labImgs.length > 0) && (
                <>
                  <SectionHeader>Documents & Images</SectionHeader>
                  <div className="space-y-4 mb-5">
                    <DocEmbed url={accredUrl} label="Accreditation Documents" />
                    {labImgs.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                          <Image size={13} /> Lab Images
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          {labImgs.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={`Lab ${i + 1}`} className="w-28 h-28 object-cover rounded-lg border border-gray-200 hover:ring-2 hover:ring-emerald-400 transition" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Right: Action column ── */}
        <div className="flex flex-row lg:flex-col justify-start gap-3 lg:w-44 lg:shrink-0 lg:sticky lg:top-6 lg:self-start">
          {isPending && (
            <>
              <button
                onClick={() => onApprove(user._id)}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#2d6a4f] hover:bg-[#245a42] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                {loading ? 'Processing…' : 'Approve'}
              </button>
              <button
                onClick={() => setShowRejectForm((v) => !v)}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#e63946] hover:bg-[#c1121f] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
              <button
                onClick={() => onRequestInfo(user)}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                Request Info
              </button>
            </>
          )}
          {!isPending && (
            <div className="text-center text-sm text-gray-400 italic py-4">
              {user.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
            </div>
          )}
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
            <p className="text-sm font-medium text-red-700 mb-2">Reason for rejection (optional)</p>
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

// ── Pagination ──────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm text-gray-600 px-3">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ── Main Page Component ─────────────────────────────────────
// ══════════════════════════════════════════════════════════════
const PendingApprovals = () => {
  const navigate = useNavigate();

  // Tab & filter state
  const [activeTab, setActiveTab] = useState('trainer'); // 'trainer' | 'lab-partner'
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Data state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal state
  const [requestInfoUser, setRequestInfoUser] = useState(null);
  const [sendingInfo, setSendingInfo] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem('user');
    if (!admin) navigate('/login');
  }, [navigate]);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [activeTab, status, search, sort]);

  const fetchApprovals = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        type: activeTab,
        status,
        sort,
        page: String(page),
        limit: '10',
      });
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`${API}/api/admin/pending-approvals?${params}`, {
        headers: getAdminHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setUsers(data.data.users || []);
        setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, status, search, sort, page]);

  useLiveData(fetchApprovals, 5000);

  // ── Actions ───────────────────────────────────────────────
  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`${API}/api/admin/approve/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({}),
      });
      if (response.ok) fetchApprovals();
      else {
        const err = await response.json().catch(() => null);
        alert(`Failed to approve: ${err?.message || 'Server error'}`);
      }
    } catch { alert('Error approving user'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (userId, reason, onSuccess) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`${API}/api/admin/reject/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (response.ok) { onSuccess?.(); fetchApprovals(); }
      else {
        const err = await response.json().catch(() => null);
        alert(`Failed to reject: ${err?.message || 'Server error'}`);
      }
    } catch { alert('Error rejecting user'); }
    finally { setActionLoading(null); }
  };

  const handleRequestInfo = async (userId, message) => {
    setSendingInfo(true);
    try {
      const response = await fetch(`${API}/api/admin/request-info/${userId}`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        setRequestInfoUser(null);
        alert('Request for more information sent successfully!');
      } else {
        const err = await response.json().catch(() => null);
        alert(`Failed: ${err?.message || 'Server error'}`);
      }
    } catch { alert('Error sending request'); }
    finally { setSendingInfo(false); }
  };

  // ── Tab counts (we use the pagination total for the active tab) ──
  const tabLabel = (type, label) => {
    const count = type === activeTab ? pagination.total : null;
    return count !== null ? `${label} (${count})` : label;
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="approvals" onSectionChange={() => {}} />

      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#225533] mb-1">Approvals</h1>
                <p className="text-gray-500 text-sm">Review and manage trainer and lab partner registrations</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">Live Updates</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {[
              { key: 'trainer', label: 'Trainers' },
              { key: 'lab-partner', label: 'Lab Partners' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === key
                    ? 'text-[#225533]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tabLabel(key, label)}
                {activeTab === key && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2d6a4f] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3f8554]" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No {status === 'pending' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)} Approvals</h3>
              <p className="text-gray-400 text-sm">
                {status === 'pending'
                  ? `No ${activeTab === 'trainer' ? 'trainer' : 'lab partner'} registrations are waiting for review.`
                  : `No ${activeTab === 'trainer' ? 'trainer' : 'lab partner'} registrations with this status.`}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {users.map((user) => (
                  <ApprovalCard
                    key={user._id}
                    user={user}
                    actionLoading={actionLoading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestInfo={setRequestInfoUser}
                  />
                ))}
              </div>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Request Info Modal */}
      <AnimatePresence>
        {requestInfoUser && (
          <RequestInfoModal
            user={requestInfoUser}
            onClose={() => setRequestInfoUser(null)}
            onSend={handleRequestInfo}
            sending={sendingInfo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingApprovals;