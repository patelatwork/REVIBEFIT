import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Filter, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, Clock, DollarSign, Building2, Calendar, Search, X } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api/manager';

const statusStyles = {
    payment_due: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Payment Due' },
    paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
    overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Cancelled' },
};

const ManagerInvoices = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedInvoice, setExpandedInvoice] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSearch, setFilterSearch] = useState('');
    const [sortBy, setSortBy] = useState('dueDate');
    const [sortDir, setSortDir] = useState('desc');

    // Generate Modal
    const [showGenerate, setShowGenerate] = useState(false);
    const [labPartners, setLabPartners] = useState([]);
    const [generateData, setGenerateData] = useState({ labPartnerId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDay: 15 });
    const [generating, setGenerating] = useState(false);

    // Grace period
    const [gracePeriod, setGracePeriod] = useState(null);

    // Confirm actions
    const [confirmAction, setConfirmAction] = useState(null); // { type, invoiceId, data }

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        if (manager.managerType !== 'lab_manager') { navigate('/manager/dashboard'); return; }
        fetchInvoices();
        fetchGracePeriod();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/invoices`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setInvoices(data.data || []);
        } catch (err) { setError(err.message); } finally { setLoading(false); }
    };

    const fetchGracePeriod = async () => {
        try {
            const res = await fetch(`${API}/invoices/grace-period-status`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setGracePeriod(data.data);
        } catch { /* optional */ }
    };

    const fetchLabPartners = async () => {
        try {
            const res = await fetch(`${API}/lab-partners/commission-rates`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setLabPartners(data.data || []);
        } catch { /* silent */ }
    };

    const handleGenerateInvoice = async () => {
        if (!generateData.labPartnerId) { setError('Select a lab partner'); return; }
        try {
            setGenerating(true);
            setError('');
            const res = await fetch(`${API}/invoices/generate/${generateData.labPartnerId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: generateData.month, year: generateData.year, dueDay: generateData.dueDay }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess(`Invoice generated! Invoice #: ${data.data?.summary?.invoiceNumber || 'N/A'}`);
            setShowGenerate(false);
            setGenerateData({ labPartnerId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDay: 15 });
            fetchInvoices();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) { setError(err.message); } finally { setGenerating(false); }
    };

    const handleMarkPaid = async (invoiceId) => {
        try {
            setError('');
            const res = await fetch(`${API}/invoices/${invoiceId}/mark-paid`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod: 'online' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess('Invoice marked as paid!');
            setConfirmAction(null);
            fetchInvoices();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) { setError(err.message); }
    };

    const handleEnforceOverdue = async () => {
        try {
            setError('');
            const res = await fetch(`${API}/invoices/enforce-overdue`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess(`Overdue enforcement complete. ${data.data?.enforcedCount || 0} lab(s) affected.`);
            setConfirmAction(null);
            fetchInvoices();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) { setError(err.message); }
    };

    // Filtered & sorted invoices
    const filtered = invoices
        .filter(inv => filterStatus === 'all' || inv.status === filterStatus)
        .filter(inv => {
            if (!filterSearch) return true;
            const search = filterSearch.toLowerCase();
            return (inv.labPartnerId?.name || '').toLowerCase().includes(search) ||
                (inv.labPartnerId?.laboratoryName || '').toLowerCase().includes(search) ||
                (inv.invoiceNumber || '').toLowerCase().includes(search);
        })
        .sort((a, b) => {
            let av, bv;
            if (sortBy === 'dueDate') { av = new Date(a.dueDate); bv = new Date(b.dueDate); }
            else if (sortBy === 'amount') { av = a.totalCommission; bv = b.totalCommission; }
            else if (sortBy === 'generated') { av = new Date(a.generatedDate); bv = new Date(b.generatedDate); }
            else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
            return sortDir === 'asc' ? av - bv : bv - av;
        });

    const formatCurrency = (a) => `₹${(a || 0).toLocaleString('en-IN')}`;
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const overdueCount = invoices.filter(i => i.status === 'overdue').length;
    const pendingCount = invoices.filter(i => i.status === 'payment_due').length;
    const totalCommission = invoices.reduce((s, i) => s + (i.totalCommission || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegions={manager.assignedRegions} managerType={manager.managerType} />

            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                            <p className="text-gray-500 mt-1">Manage lab partner invoices in your region</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {overdueCount > 0 && (
                                <button onClick={() => setConfirmAction({ type: 'enforce' })} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                                    <AlertTriangle size={16} />Enforce Overdue ({overdueCount})
                                </button>
                            )}
                            <button onClick={() => { setShowGenerate(true); fetchLabPartners(); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm">
                                <Plus size={16} />Generate Invoice
                            </button>
                        </div>
                    </div>

                    {/* Alerts */}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <p className="text-green-700 text-sm font-medium">{success}</p>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <XCircle size={20} className="text-red-600" />
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                            <button onClick={() => setError('')} className="ml-auto"><X size={16} className="text-red-400" /></button>
                        </motion.div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Invoices', value: invoices.length, icon: FileText, color: 'bg-blue-500' },
                            { label: 'Payment Due', value: pendingCount, icon: Clock, color: 'bg-amber-500' },
                            { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'bg-red-500' },
                            { label: 'Total Commission', value: formatCurrency(totalCommission), icon: DollarSign, color: 'bg-green-500' },
                        ].map(c => (
                            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${c.color}`}>
                                        <c.icon size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{c.label}</p>
                                        <p className="text-lg font-bold text-gray-900">{c.value}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text" value={filterSearch}
                                    onChange={(e) => setFilterSearch(e.target.value)}
                                    placeholder="Search by lab, invoice #..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="all">All Status</option>
                                <option value="payment_due">Payment Due</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select value={`${sortBy}-${sortDir}`} onChange={(e) => { const [s, d] = e.target.value.split('-'); setSortBy(s); setSortDir(d); }} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="dueDate-desc">Due Date (Latest)</option>
                                <option value="dueDate-asc">Due Date (Earliest)</option>
                                <option value="amount-desc">Amount (Highest)</option>
                                <option value="amount-asc">Amount (Lowest)</option>
                                <option value="generated-desc">Generated (Latest)</option>
                                <option value="generated-asc">Generated (Earliest)</option>
                            </select>
                        </div>
                    </div>

                    {/* Invoice List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No invoices found</p>
                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or generate a new invoice</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(inv => {
                                const st = statusStyles[inv.status] || statusStyles.payment_due;
                                const isExpanded = expandedInvoice === inv._id;
                                return (
                                    <motion.div key={inv._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpandedInvoice(isExpanded ? null : inv._id)}>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-semibold text-gray-900">#{inv.invoiceNumber}</span>
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Building2 size={14} />
                                                        <span>{inv.labPartnerId?.laboratoryName || inv.labPartnerId?.name || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">Commission</p>
                                                        <p className="font-semibold text-gray-900">{formatCurrency(inv.totalCommission)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400">Due</p>
                                                        <p className="text-gray-700">{formatDate(inv.dueDate)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {inv.status === 'payment_due' || inv.status === 'overdue' ? (
                                                            <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'markPaid', invoiceId: inv._id }); }} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors">
                                                                Mark Paid
                                                            </button>
                                                        ) : null}
                                                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-gray-100">
                                                    <div className="p-5 bg-gray-50/50">
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                                                            <div><p className="text-xs text-gray-400">Billing Period</p><p className="text-sm font-medium text-gray-900">{inv.billingPeriod?.month}/{inv.billingPeriod?.year}</p></div>
                                                            <div><p className="text-xs text-gray-400">Total Booking Value</p><p className="text-sm font-medium text-gray-900">{formatCurrency(inv.totalBookingValue)}</p></div>
                                                            <div><p className="text-xs text-gray-400">Commission Rate</p><p className="text-sm font-medium text-gray-900">{inv.commissionRate}%</p></div>
                                                            <div><p className="text-xs text-gray-400">Bookings</p><p className="text-sm font-medium text-gray-900">{inv.numberOfBookings}</p></div>
                                                            <div><p className="text-xs text-gray-400">Generated</p><p className="text-sm font-medium text-gray-900">{formatDate(inv.generatedDate)}</p></div>
                                                            {inv.paidDate && <div><p className="text-xs text-gray-400">Paid On</p><p className="text-sm font-medium text-green-700">{formatDate(inv.paidDate)}</p></div>}
                                                            {inv.paymentMethod && <div><p className="text-xs text-gray-400">Payment Method</p><p className="text-sm font-medium text-gray-900 capitalize">{inv.paymentMethod.replace('_', ' ')}</p></div>}
                                                        </div>

                                                        {/* Commission Breakdown */}
                                                        {inv.commissionBreakdown && inv.commissionBreakdown.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Commission Breakdown ({inv.commissionBreakdown.length} bookings)</h4>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="text-left text-gray-400 text-xs border-b border-gray-200">
                                                                                <th className="pb-2 pr-4">Enthusiast</th>
                                                                                <th className="pb-2 pr-4">Tests</th>
                                                                                <th className="pb-2 pr-4">Date</th>
                                                                                <th className="pb-2 pr-4 text-right">Amount</th>
                                                                                <th className="pb-2 text-right">Commission</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {inv.commissionBreakdown.map((b, i) => (
                                                                                <tr key={i} className="border-b border-gray-100 last:border-0">
                                                                                    <td className="py-2 pr-4 text-gray-900">{b.fitnessEnthusiastName || 'N/A'}</td>
                                                                                    <td className="py-2 pr-4 text-gray-600">{(b.testNames || []).join(', ') || 'N/A'}</td>
                                                                                    <td className="py-2 pr-4 text-gray-500">{formatDate(b.bookingDate)}</td>
                                                                                    <td className="py-2 pr-4 text-right text-gray-900">{formatCurrency(b.totalAmount)}</td>
                                                                                    <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(b.commissionAmount)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Generate Invoice Modal */}
                    <AnimatePresence>
                        {showGenerate && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGenerate(false)}>
                                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-semibold text-gray-900">Generate Invoice</h3>
                                        <button onClick={() => setShowGenerate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lab Partner</label>
                                            <select value={generateData.labPartnerId} onChange={(e) => setGenerateData(p => ({ ...p, labPartnerId: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                                                <option value="">Select lab partner</option>
                                                {labPartners.map(lp => (
                                                    <option key={lp._id} value={lp._id}>{lp.laboratoryName || lp.name} — {lp.email}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
                                                <select value={generateData.month} onChange={(e) => setGenerateData(p => ({ ...p, month: Number(e.target.value) }))} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                        <option key={m} value={i + 1}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
                                                <input type="number" value={generateData.year} onChange={(e) => setGenerateData(p => ({ ...p, year: Number(e.target.value) }))} min="2020" className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Day (of next month)</label>
                                            <input type="number" value={generateData.dueDay} onChange={(e) => setGenerateData(p => ({ ...p, dueDay: Number(e.target.value) }))} min="1" max="28" className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3 justify-end">
                                        <button onClick={() => setShowGenerate(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                                        <button onClick={handleGenerateInvoice} disabled={generating} className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
                                            {generating ? 'Generating...' : 'Generate'}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Confirm Dialog */}
                    <AnimatePresence>
                        {confirmAction && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
                                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {confirmAction.type === 'markPaid' ? 'Mark as Paid?' : 'Enforce Overdue Invoices?'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">
                                        {confirmAction.type === 'markPaid'
                                            ? 'This will mark the invoice as paid and update the lab partner\'s status.'
                                            : `This will suspend ${overdueCount} lab partner(s) with overdue invoices.`}
                                    </p>
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setConfirmAction(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                                        <button onClick={() => confirmAction.type === 'markPaid' ? handleMarkPaid(confirmAction.invoiceId) : handleEnforceOverdue()} className={`px-5 py-2 text-white rounded-lg text-sm font-medium ${confirmAction.type === 'markPaid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                                            {confirmAction.type === 'markPaid' ? 'Mark Paid' : 'Enforce'}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ManagerInvoices;
