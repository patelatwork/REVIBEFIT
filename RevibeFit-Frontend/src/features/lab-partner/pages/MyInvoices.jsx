import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';

const MyInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labName, setLabName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBreakdown, setShowBreakdown] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [invoicesRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/lab-partners/invoices`, { headers }),
        fetch(`${API_URL}/api/lab-partners/financial-summary`, { headers }),
      ]);

      const invoicesData = await invoicesRes.json();
      const summaryData = await summaryRes.json();

      if (invoicesData.success) {
        setInvoices(invoicesData.data || []);
      } else {
        setError(invoicesData.message || 'Failed to load invoices');
      }

      if (summaryData.success) {
        setFinancialSummary(summaryData.data);
      }
    } catch (err) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      issued: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      issued: 'Issued',
      paid: 'Paid',
      overdue: 'Overdue',
      draft: 'Draft',
      cancelled: 'Cancelled',
    };
    const cls = styles[status] || 'bg-gray-100 text-gray-800';
    const label = labels[status] || status;
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${cls}`}>
        {label}
      </span>
    );
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 font-semibold">{Math.abs(diffDays)} days overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-semibold">Due today</span>;
    } else if (diffDays <= 5) {
      return <span className="text-yellow-600 font-semibold">Due in {diffDays} days</span>;
    } else {
      return <span className="text-gray-600">Due in {diffDays} days</span>;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'issued') return invoice.status === 'issued';
    if (filterStatus === 'paid') return invoice.status === 'paid';
    if (filterStatus === 'overdue') return invoice.status === 'overdue';
    return true;
  });

  const toggleBreakdown = (invoiceId) => {
    setShowBreakdown((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  const handleDownloadPdf = (invoiceId) => {
    const token = localStorage.getItem('accessToken');
    const url = `${API_URL}/api/lab-partners/invoices/${invoiceId}/download-pdf`;
    window.open(`${url}?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faf9]">
        <DashboardNavbar labName={labName} />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="h-24 bg-gray-200 rounded-2xl"></div>
              <div className="h-24 bg-gray-200 rounded-2xl"></div>
              <div className="h-24 bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <DashboardNavbar labName={labName} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Settlement Statements & Tax Invoices</h1>
          <button
            onClick={() => navigate('/lab-partner/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary Cards */}
        {financialSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-1">Total Settled</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(financialSummary.totalSettled)}
              </p>
              <p className="text-xs text-green-700 mt-1">All time settlements</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-1">This Month Settled</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(financialSummary.monthSettled)}
              </p>
              <p className="text-xs text-blue-700 mt-1">Settlements this month</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
              <p className="text-sm font-medium text-purple-800 mb-1">Pending Settlements</p>
              <p className="text-2xl font-bold text-purple-900">
                {financialSummary.pendingSettlements?.count || 0}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Worth {formatCurrency(financialSummary.pendingSettlements?.amount)}
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: invoices.length },
            { key: 'issued', label: 'Issued', count: invoices.filter((i) => i.status === 'issued').length },
            { key: 'paid', label: 'Paid', count: invoices.filter((i) => i.status === 'paid').length },
            { key: 'overdue', label: 'Overdue', count: invoices.filter((i) => i.status === 'overdue').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === tab.key
                  ? 'bg-[#3f8554] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No invoices found</p>
            <p className="text-gray-400 text-sm mt-2">Settlement invoices will appear here once generated</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  {/* Invoice Info */}
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{invoice.invoiceNumber}</h3>
                      {getStatusBadge(invoice.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Billing Period</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {invoice.billingPeriod?.month && invoice.billingPeriod?.year
                            ? new Date(invoice.billingPeriod.year, invoice.billingPeriod.month - 1).toLocaleDateString('en-IN', {
                                month: 'long',
                                year: 'numeric',
                              })
                            : invoice.billingPeriod?.startDate && invoice.billingPeriod?.endDate
                            ? `${formatDate(invoice.billingPeriod.startDate)} - ${formatDate(invoice.billingPeriod.endDate)}`
                            : 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm font-semibold text-gray-700">{formatDate(invoice.dueDate)}</p>
                        <p className="text-xs mt-1">{getDaysUntilDue(invoice.dueDate)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Settlements</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {invoice.settlementIds?.length || 0} settlement{(invoice.settlementIds?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* GST Breakdown */}
                    {invoice.gstDetails && (
                      <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-3">Tax Breakdown</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Commission Amount</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatCurrency(invoice.totalSettlementAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">GST Type</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {invoice.gstDetails.taxType === 'igst'
                                ? 'IGST'
                                : 'CGST + SGST'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Tax Amount</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {invoice.gstDetails.taxType === 'igst'
                                ? formatCurrency(invoice.gstDetails.igst?.amount)
                                : formatCurrency(
                                    (invoice.gstDetails.cgst?.amount || 0) +
                                      (invoice.gstDetails.sgst?.amount || 0)
                                  )}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {invoice.gstDetails.taxType === 'igst'
                                ? `@ ${invoice.gstDetails.igst?.rate || 0}%`
                                : `CGST @ ${invoice.gstDetails.cgst?.rate || 0}% + SGST @ ${invoice.gstDetails.sgst?.rate || 0}%`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Invoice Amount</p>
                            <p className="text-sm font-bold text-[#3f8554]">
                              {formatCurrency(invoice.gstDetails.totalInvoiceAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Details (if paid) */}
                    {invoice.status === 'paid' && invoice.paidDate && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-800 font-semibold mb-1">Payment Details</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-green-700">Paid on:</span>
                            <span className="ml-2 font-semibold">{formatDate(invoice.paidDate)}</span>
                          </div>
                          {invoice.paymentMethod && (
                            <div>
                              <span className="text-green-700">Method:</span>
                              <span className="ml-2 font-semibold capitalize">
                                {invoice.paymentMethod.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                          {invoice.paymentReference && (
                            <div>
                              <span className="text-green-700">Reference:</span>
                              <span className="ml-2 font-semibold">{invoice.paymentReference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Net Settlement Amount + Download */}
                  <div className="text-right md:ml-6 flex flex-col items-end">
                    <p className="text-sm text-gray-500 mb-1">Net Settlement</p>
                    <p className="text-2xl font-bold text-[#3f8554]">
                      {formatCurrency(invoice.totalSettlementAmount)}
                    </p>

                    <button
                      onClick={() => handleDownloadPdf(invoice._id)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#3f8554] text-white text-sm font-medium rounded-lg hover:bg-[#225533] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Notes:</p>
                    <p className="text-sm text-gray-700 mt-1">{invoice.notes}</p>
                  </div>
                )}

                {/* Commission Breakdown (expand/collapse) */}
                {invoice.commissionBreakdown && invoice.commissionBreakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleBreakdown(invoice._id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        Commission Breakdown ({invoice.commissionBreakdown.length} entries)
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${showBreakdown[invoice._id] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showBreakdown[invoice._id] && (
                      <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                        {invoice.commissionBreakdown.map((entry, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{entry.fitnessEnthusiastName}</p>
                                <p className="text-xs text-gray-500">{formatDate(entry.bookingDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">{formatCurrency(entry.commissionAmount)}</p>
                                <p className="text-xs text-gray-500">
                                  {entry.commissionRate}% of {formatCurrency(entry.totalAmount)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Tests:</span> {entry.testNames?.join(', ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInvoices;
