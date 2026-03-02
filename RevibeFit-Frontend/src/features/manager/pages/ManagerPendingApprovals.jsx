import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Unlock, Clock, FileText, ExternalLink, Image } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';
import { useManagerProfile } from '../../../hooks/useManagerProfile';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API = `${API_BASE}/api/manager`;

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
    return `${API_BASE}/${p}`;
};

const isImageUrl = (url) => /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url || '');

// ── Reusable field component ────────────────────────────────
const Field = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
);

const SectionHeader = ({ children }) => (
    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-1">{children}</h4>
);

// ── Document embed component ────────────────────────────────
const DocEmbed = ({ url, label }) => {
    const [imgError, setImgError] = useState(false);

    if (!url) return null;

    if (isImageUrl(url) && !imgError) {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <ExternalLink size={11} /> Open
                    </a>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                    <img
                        src={url}
                        alt={label}
                        onError={() => setImgError(true)}
                        className="max-w-full max-h-52 object-contain rounded-lg border border-gray-200 hover:ring-2 hover:ring-emerald-400 transition bg-gray-50"
                    />
                </a>
            </div>
        );
    }

    // PDF or image load failure — show a document card with open link
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-colors group"
            >
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 group-hover:border-blue-300 transition-colors shrink-0">
                    <FileText size={22} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Click to view document</p>
                </div>
                <ExternalLink size={15} className="text-blue-500 shrink-0" />
            </a>
        </div>
    );
};

const ApprovalCard = ({ user, manager, actionLoading, onApprove, onReject, onClaim, onRelease }) => {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const isClaimedByMe = user.claimedBy === manager._id;
    const isClaimedByOther = (() => {
        if (!user.claimedBy || !user.claimedAt) return false;
        const expired = Date.now() - new Date(user.claimedAt).getTime() > 10 * 60 * 1000;
        return !expired && user.claimedBy !== manager._id;
    })();

    const isTrainer = user.userType === 'trainer';
    const isLabPartner = user.userType === 'lab-partner';
    const loading = actionLoading[user._id];

    const roleBadgeColor = isTrainer
        ? 'bg-orange-100 text-orange-600'
        : isLabPartner
        ? 'bg-blue-100 text-blue-600'
        : 'bg-gray-100 text-gray-600';

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
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{user.name}</h3>
                                {isClaimedByMe && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        <Lock size={10} /> Claimed by you
                                    </span>
                                )}
                                {isClaimedByOther && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                        <Clock size={10} /> Under review
                                    </span>
                                )}
                            </div>
                            <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${roleBadgeColor}`}>
                                {user.userType === 'lab-partner' ? 'Lab Partner' : user.userType?.charAt(0).toUpperCase() + user.userType?.slice(1)}
                            </span>
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
                                        <p className="text-xs text-gray-400 mb-0.5">Bio / Experience</p>
                                        <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed">{user.bio}</p>
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
                    {isLabPartner && (
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
                    {!isClaimedByMe && !isClaimedByOther && (
                        <button
                            onClick={() => onClaim(user._id)}
                            disabled={!!loading}
                            className="w-full py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Lock size={15} />
                            {loading === 'claiming' ? 'Claiming…' : 'Claim Review'}
                        </button>
                    )}

                    {isClaimedByMe && (
                        <>
                            <button
                                onClick={() => onApprove(user._id)}
                                disabled={!!loading}
                                className="w-full py-3 px-4 rounded-xl bg-[#2d6a4f] hover:bg-[#245a42] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50"
                            >
                                {loading === 'approving' ? 'Approving…' : 'Approve'}
                            </button>
                            <button
                                onClick={() => setShowRejectForm((v) => !v)}
                                disabled={!!loading}
                                className="w-full py-3 px-4 rounded-xl bg-[#e63946] hover:bg-[#c1121f] text-white text-sm font-bold tracking-wide transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => onRelease(user._id)}
                                disabled={!!loading}
                                className="w-full py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                <Unlock size={13} />
                                {loading === 'releasing' ? 'Releasing…' : 'Release'}
                            </button>
                        </>
                    )}

                    {isClaimedByOther && (
                        <div className="w-full py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm font-medium text-center">
                            Under review
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
                                disabled={!!loading}
                                className="px-5 py-2 bg-[#e63946] hover:bg-[#c1121f] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                                {loading === 'rejecting' ? 'Rejecting…' : 'Confirm Rejection'}
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

const ManagerPendingApprovals = () => {
    const navigate = useNavigate();
    const { manager, token, regionsChanged } = useManagerProfile();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        if (token) fetchApprovals();
    }, [regionsChanged]);

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

    const handleReject = async (userId, reason, onSuccess) => {
        setActionLoading((p) => ({ ...p, [userId]: 'rejecting' }));
        try {
            const res = await fetch(`${API}/reject/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            onSuccess?.();
            fetchApprovals();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading((p) => ({ ...p, [userId]: null }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegions={manager.assignedRegions} managerType={manager.managerType} />
            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                            <p className="text-gray-500 mt-1">{approvals.length} pending in {manager.assignedRegions?.join(', ') || 'your region'}</p>
                        </div>
                        <button onClick={fetchApprovals} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium">Refresh</button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">{error}</div>
                    ) : approvals.length === 0 ? (
                        <div className="text-center py-20">
                            <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No pending approvals</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {approvals.map((user) => (
                                <ApprovalCard
                                    key={user._id}
                                    user={user}
                                    manager={manager}
                                    actionLoading={actionLoading}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onClaim={handleClaim}
                                    onRelease={handleRelease}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerPendingApprovals;
