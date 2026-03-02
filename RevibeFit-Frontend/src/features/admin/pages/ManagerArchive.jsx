import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, Filter, ChevronLeft, ChevronRight,
    RotateCcw, Trash2, Eye, X, Activity, Calendar, MapPin,
    Mail, Phone, Shield, Clock, User, AlertTriangle, Users
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const API = 'http://localhost:8000/api/admin';

const REGION_NAMES = [
    "Northern India", "Southern India", "Eastern India",
    "Western India", "Central India", "North-Eastern India",
];

const REGION_COLORS = {
    "Northern India": "bg-blue-100 text-blue-700",
    "Southern India": "bg-emerald-100 text-emerald-700",
    "Eastern India": "bg-amber-100 text-amber-700",
    "Western India": "bg-purple-100 text-purple-700",
    "Central India": "bg-rose-100 text-rose-700",
    "North-Eastern India": "bg-cyan-100 text-cyan-700",
};

const STATUS_COLORS = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    inactive: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const ManagerArchive = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('accessToken');

    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalManagers: 0 });
    const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);

    // Detail modal
    const [selectedManager, setSelectedManager] = useState(null);
    const [managerDetail, setManagerDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Action states
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => {
        if (!token) navigate('/login');
    }, []);

    const fetchManagers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 12 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('managerType', typeFilter);
            if (regionFilter.length) params.append('region', regionFilter.join(','));

            const res = await fetch(`${API}/managers/archive?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setManagers(data.data.managers || []);
            setPagination(data.data.pagination || { currentPage: 1, totalPages: 1, totalManagers: 0 });
            setCounts(data.data.counts || { total: 0, active: 0, inactive: 0 });
        } catch (err) {
            console.error('Failed to fetch archive:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, typeFilter, regionFilter.join(','), token]);

    useEffect(() => {
        if (token) fetchManagers();
    }, [fetchManagers]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchManagerDetail = async (id) => {
        try {
            setDetailLoading(true);
            const res = await fetch(`${API}/managers/${id}/detail`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setManagerDetail(data.data);
        } catch (err) {
            alert(err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewDetail = (mgr) => {
        setSelectedManager(mgr);
        fetchManagerDetail(mgr._id);
    };

    const handleReactivate = async (id, name) => {
        if (!confirm(`Reactivate manager "${name}"? They will become visible in Manager Management again.`)) return;
        try {
            setActionLoading(id);
            const res = await fetch(`${API}/managers/${id}/reactivate`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchManagers();
            if (selectedManager?._id === id) {
                setSelectedManager(null);
                setManagerDetail(null);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const handlePermanentDelete = async (id, name) => {
        if (!confirm(`PERMANENTLY DELETE manager "${name}"?\n\nThis action cannot be undone. All activity logs will also be deleted.`)) return;
        if (!confirm(`Are you absolutely sure? This will permanently remove all data for "${name}".`)) return;
        try {
            setActionLoading(id);
            const res = await fetch(`${API}/managers/${id}/permanent`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchManagers();
            if (selectedManager?._id === id) {
                setSelectedManager(null);
                setManagerDetail(null);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const getStatus = (mgr) => {
        if (mgr.isActive && !mgr.isSuspended) return 'active';
        return 'inactive';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
        setRegionFilter([]);
        setPage(1);
    };

    const hasActiveFilters = search || statusFilter || typeFilter || regionFilter.length;

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar activeSection="managers" onSectionChange={() => { }} />
            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">

                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/admin/managers')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Manager Management
                        </button>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">All Managers</h1>
                                <p className="text-gray-500 mt-1">Complete history of all managers</p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Users size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
                                        <p className="text-xs text-gray-500">Total Managers</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <Shield size={20} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{counts.active}</p>
                                        <p className="text-xs text-gray-500">Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{counts.inactive}</p>
                                        <p className="text-xs text-gray-500">Inactive</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20 focus:border-[#3f8554]"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 border transition-colors ${hasActiveFilters
                                        ? 'bg-[#3f8554]/10 text-[#3f8554] border-[#3f8554]/30'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <Filter size={16} /> Filters {hasActiveFilters && '•'}
                            </button>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                                            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20"
                                        >
                                            <option value="">All Types</option>
                                            <option value="trainer_manager">Trainer Manager</option>
                                            <option value="lab_manager">Lab Manager</option>
                                        </select>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-1.5">Regions</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {REGION_NAMES.map(r => (
                                                    <label key={r} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                                                        regionFilter.includes(r)
                                                            ? 'bg-[#3f8554]/10 text-[#3f8554] border-[#3f8554]/30'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={regionFilter.includes(r)}
                                                            onChange={(e) => {
                                                                setRegionFilter(prev =>
                                                                    e.target.checked ? [...prev, r] : prev.filter(x => x !== r)
                                                                );
                                                                setPage(1);
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        {r.replace(' India', '')}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
                        </div>
                    ) : managers.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                            <Users size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-1">No managers found</p>
                            <p className="text-gray-400 text-sm">{hasActiveFilters ? 'Try adjusting your filters' : 'No managers have been created yet'}</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Region</th>
                                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions (30d)</th>
                                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                            <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {managers.map((mgr) => {
                                            const status = getStatus(mgr);
                                            const colors = STATUS_COLORS[status];
                                            return (
                                                <motion.tr
                                                    key={mgr._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                {mgr.name?.charAt(0)?.toUpperCase() || 'M'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-900 text-sm truncate">{mgr.name}</p>
                                                                <p className="text-xs text-gray-500 truncate">{mgr.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mgr.managerType === 'trainer_manager' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                                            {mgr.managerType === 'trainer_manager' ? 'Trainer' : 'Lab'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {mgr.assignedRegions?.length ? mgr.assignedRegions.map(r => (
                                                                <span key={r} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${REGION_COLORS[r] || 'bg-gray-100 text-gray-600'}`}>
                                                                    {r.replace(' India', '')}
                                                                </span>
                                                            )) : <span className="text-sm text-gray-400">—</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{mgr.recentActions || 0}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-500">{formatDate(mgr.createdAt)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleViewDetail(mgr)}
                                                                className="p-2 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                                title="View details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {status === 'inactive' && (
                                                                <button
                                                                    onClick={() => handleReactivate(mgr._id, mgr.name)}
                                                                    disabled={actionLoading === mgr._id}
                                                                    className="p-2 rounded-lg text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                                                    title="Reactivate"
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handlePermanentDelete(mgr._id, mgr.name)}
                                                                disabled={actionLoading === mgr._id}
                                                                className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                                                title="Permanently delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">
                                        Showing {((page - 1) * 12) + 1}–{Math.min(page * 12, pagination.totalManagers)} of {pagination.totalManagers}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={!pagination.hasPrevPage}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                            } else if (page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = page - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === page
                                                            ? 'bg-[#3f8554] text-white'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={!pagination.hasNextPage}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Manager Detail Modal */}
            <AnimatePresence>
                {selectedManager && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) { setSelectedManager(null); setManagerDetail(null); } }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                        {selectedManager.name?.charAt(0)?.toUpperCase() || 'M'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedManager.name}</h2>
                                        <p className="text-sm text-gray-500">{selectedManager.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {(() => {
                                                const status = getStatus(selectedManager);
                                                const colors = STATUS_COLORS[status];
                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                );
                                            })()}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedManager.managerType === 'trainer_manager' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                                {selectedManager.managerType === 'trainer_manager' ? 'Trainer Manager' : 'Lab Manager'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedManager(null); setManagerDetail(null); }}
                                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center h-48">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500" />
                                    </div>
                                ) : managerDetail ? (
                                    <div className="space-y-6">
                                        {/* Info Grid */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Profile Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <InfoItem icon={Mail} label="Email" value={managerDetail.manager.email} />
                                                <InfoItem icon={Phone} label="Phone" value={managerDetail.manager.phone || 'N/A'} />
                                                <div className="sm:col-span-2">
                                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Regions</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {managerDetail.manager.assignedRegions?.length ? managerDetail.manager.assignedRegions.map(r => (
                                                                    <span key={r} className={`px-2 py-0.5 rounded text-xs font-medium ${REGION_COLORS[r] || 'bg-gray-100 text-gray-600'}`}>{r}</span>
                                                                )) : <span className="text-sm text-gray-400">Not assigned</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <InfoItem icon={User} label="Age" value={managerDetail.manager.age || 'N/A'} />
                                                <InfoItem icon={Calendar} label="Created" value={formatDateTime(managerDetail.manager.createdAt)} />
                                                <InfoItem icon={Shield} label="Created By" value={managerDetail.manager.createdByAdmin || 'System'} />
                                                {managerDetail.manager.deactivatedAt && (
                                                    <InfoItem icon={Clock} label="Deactivated" value={formatDateTime(managerDetail.manager.deactivatedAt)} />
                                                )}
                                                {managerDetail.manager.deactivationReason && (
                                                    <InfoItem icon={AlertTriangle} label="Reason" value={managerDetail.manager.deactivationReason} />
                                                )}
                                                <InfoItem icon={Clock} label="Active Duration" value={`${managerDetail.stats.activeDurationDays} days`} />
                                            </div>
                                        </div>

                                        {/* Activity Summary */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Activity Summary</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                                    <p className="text-2xl font-bold text-blue-700">{managerDetail.activity.totalActions}</p>
                                                    <p className="text-xs text-blue-600 mt-1">Total Actions</p>
                                                </div>
                                                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                                    <p className="text-2xl font-bold text-emerald-700">{managerDetail.activity.recentActions}</p>
                                                    <p className="text-xs text-emerald-600 mt-1">Last 30 Days</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Log */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                                Activity Log ({managerDetail.activity.logs.length}{managerDetail.activity.totalActions > 200 ? ' of ' + managerDetail.activity.totalActions : ''})
                                            </h3>
                                            {managerDetail.activity.logs.length === 0 ? (
                                                <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg text-sm">No activity recorded</p>
                                            ) : (
                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                    {managerDetail.activity.logs.map((log, i) => (
                                                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {log.action?.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                                                                    {formatDateTime(log.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Target: {log.targetModel} {log.targetUserType ? `(${log.targetUserType})` : ''} • {log.targetId || 'N/A'}
                                                            </p>
                                                            {log.details && Object.keys(log.details).length > 0 && (
                                                                <p className="text-xs text-gray-400 mt-1 break-all">{JSON.stringify(log.details)}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Modal Footer - Actions */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50">
                                {getStatus(selectedManager) === 'inactive' && (
                                    <button
                                        onClick={() => handleReactivate(selectedManager._id, selectedManager.name)}
                                        disabled={actionLoading === selectedManager._id}
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                    >
                                        <RotateCcw size={14} /> Reactivate
                                    </button>
                                )}
                                <button
                                    onClick={() => handlePermanentDelete(selectedManager._id, selectedManager.name)}
                                    disabled={actionLoading === selectedManager._id}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={14} /> Permanently Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <Icon size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
        </div>
    </div>
);

export default ManagerArchive;
