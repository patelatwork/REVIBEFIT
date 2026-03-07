import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  hold_released: { label: 'Hold Released', bg: 'bg-blue-100', text: 'text-blue-800' },
  processing: { label: 'Processing', bg: 'bg-blue-100', text: 'text-blue-800' },
  settled: { label: 'Settled', bg: 'bg-green-100', text: 'text-green-800' },
  failed: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-800' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'settled', label: 'Settled' },
  { key: 'failed', label: 'Failed' },
];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

const Settlements = () => {
  const navigate = useNavigate();
  const [labName, setLabName] = useState('Lab Partner');
  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(user);
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
  }, [navigate]);

  useEffect(() => {
    fetchSettlements();
  }, [page, filterStatus]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchSummary = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/lab-partners/financial-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch (err) {
      console.error('Error fetching financial summary:', err);
    }
  };

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({ page, limit });
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`${API_URL}/api/lab-partners/settlements?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettlements(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || data.data?.length || 0);
      } else {
        setError(data.message || 'Failed to load settlements');
      }
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setError('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key) => {
    setFilterStatus(key);
    setPage(1);
  };

  // Summary cards
  const summaryCards = [
    {
      label: 'Total Settled',
      value: summary ? formatCurrency(summary.totalSettled || 0) : '--',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      label: 'This Month',
      value: summary ? formatCurrency(summary.monthSettled || 0) : '--',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      label: 'Pending',
      value: summary
        ? `${summary.pendingSettlements?.count || 0} (${formatCurrency(summary.pendingSettlements?.amount || 0)})`
        : '--',
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <DashboardNavbar labName={labName} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Settlements</h1>
          <button
            onClick={() => navigate('/lab-partner/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`${card.bg} border ${card.border} rounded-2xl p-5 flex items-center gap-4`}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                {card.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-lg font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === tab.key
                  ? 'bg-[#3f8554] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : settlements.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No settlements found</p>
            <p className="text-gray-400 text-sm mt-2">
              Settlements will appear here once bookings are processed
            </p>
          </div>
        ) : (
          <>
            {/* Settlement List */}
            <div className="space-y-4">
              {settlements.map((s) => {
                const booking = s.booking || {};
                const customerName =
                  booking.labPartnerId?.name ||
                  booking.fitnessEnthusiastName ||
                  booking.customerName ||
                  'Customer';
                const tests = booking.selectedTests || [];
                const totalDeduction = (s.commissionAmount || 0) + (s.gstOnCommission || 0);
                const gst = s.gstBreakdown || {};

                return (
                  <div
                    key={s._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Left: Booking details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{customerName}</h3>
                          <StatusBadge status={s.status} />
                        </div>

                        {/* Booking date */}
                        <p className="text-xs text-gray-500 mb-2">
                          Booking Date: {booking.bookingDate ? formatDate(booking.bookingDate) : '--'}
                        </p>

                        {/* Tests */}
                        {tests.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 font-medium mb-1">Tests Performed</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tests.map((test, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-md"
                                >
                                  {test.testName || test.name || test}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Billing period */}
                        {s.billingPeriod && (
                          <p className="text-xs text-gray-400">
                            Billing Period:{' '}
                            {s.billingPeriod.startDate && s.billingPeriod.endDate
                              ? `${formatDate(s.billingPeriod.startDate)} - ${formatDate(s.billingPeriod.endDate)}`
                              : s.billingPeriod.month && s.billingPeriod.year
                              ? new Date(s.billingPeriod.year, s.billingPeriod.month - 1).toLocaleDateString('en-IN', {
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : '--'}
                          </p>
                        )}

                        {/* Settled date */}
                        {s.status === 'settled' && s.settledAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Settled on {formatDate(s.settledAt)}
                          </p>
                        )}
                      </div>

                      {/* Right: Financial breakdown */}
                      <div className="md:text-right md:min-w-[260px]">
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                          <div>
                            <p className="text-xs text-gray-500">Gross Amount</p>
                            <p className="text-sm font-semibold text-gray-700">
                              {formatCurrency(s.grossAmount || booking.totalAmount || 0)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              Commission ({s.commissionRate || 0}%)
                            </p>
                            <p className="text-sm font-semibold text-red-600">
                              -{formatCurrency(s.commissionAmount || 0)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">
                              GST on Commission
                              {gst.type === 'igst'
                                ? ` (IGST: ${formatCurrency(gst.igst || 0)})`
                                : gst.cgst || gst.sgst
                                ? ` (CGST: ${formatCurrency(gst.cgst || 0)} + SGST: ${formatCurrency(gst.sgst || 0)})`
                                : ''}
                            </p>
                            <p className="text-sm font-semibold text-red-600">
                              -{formatCurrency(s.gstOnCommission || 0)}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">Total Deduction</p>
                            <p className="text-sm font-semibold text-red-600">
                              -{formatCurrency(totalDeduction)}
                            </p>
                          </div>

                          <div className="pt-2">
                            <p className="text-xs text-gray-500">Net Settlement</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(s.netSettlementAmount || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      page <= 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      page >= totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Settlements;
