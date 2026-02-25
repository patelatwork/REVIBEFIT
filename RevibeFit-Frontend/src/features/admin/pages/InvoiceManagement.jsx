import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const InvoiceManagement = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [enforcing, setEnforcing] = useState(false);
  const [gracePeriodData, setGracePeriodData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: '',
  });
  const [showLabPartnerModal, setShowLabPartnerModal] = useState(false);
  const [labPartners, setLabPartners] = useState([]);
  const [selectedLabPartners, setSelectedLabPartners] = useState([]);
  const [loadingLabPartners, setLoadingLabPartners] = useState(false);
  const [showFlexibleInvoiceModal, setShowFlexibleInvoiceModal] = useState(false);
  const [selectedLabPartner, setSelectedLabPartner] = useState(null);
  const [invoiceTimeWindow, setInvoiceTimeWindow] = useState('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [confirmedDates, setConfirmedDates] = useState(null);

  useEffect(() => {
    const admin = localStorage.getItem('admin');
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchInvoices();
    fetchGracePeriodStatus();
  }, [navigate]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/invoices`
      );

      const data = await response.json();
      console.log('Admin invoices response:', data);
      if (data.success) {
        setInvoices(data.data || []);
      } else {
        setError('Failed to load invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchGracePeriodStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/invoices/grace-period-status`
      );

      const data = await response.json();
      if (data.success) {
        setGracePeriodData(data.data);
      }
    } catch (err) {
      console.error('Error fetching grace period status:', err);
    }
  };

  const fetchLabPartners = async () => {
    setLoadingLabPartners(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/lab-partners/commission-rates`
      );

      const data = await response.json();
      if (data.success) {
        setLabPartners(data.data);
      }
    } catch (err) {
      console.error('Error fetching lab partners:', err);
    } finally {
      setLoadingLabPartners(false);
    }
  };

  const openInvoiceGenerationModal = async () => {
    await fetchLabPartners();
    setSelectedLabPartners([]);
    setShowLabPartnerModal(true);
  };

  const toggleLabPartnerSelection = (labPartnerId) => {
    setSelectedLabPartners(prev => {
      if (prev.includes(labPartnerId)) {
        return prev.filter(id => id !== labPartnerId);
      } else {
        return [...prev, labPartnerId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedLabPartners.length === labPartners.length) {
      setSelectedLabPartners([]);
    } else {
      setSelectedLabPartners(labPartners.map(lp => lp._id));
    }
  };

  const generateAllInvoices = async () => {
    if (selectedLabPartners.length === 0) {
      alert('Please select at least one lab partner');
      return;
    }

    const confirmMessage = selectedLabPartners.length === labPartners.length
      ? 'Generate monthly invoices for ALL lab partners?'
      : `Generate monthly invoices for ${selectedLabPartners.length} selected lab partner(s)?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // Get current month and year (not previous month)
      const now = new Date();
      const month = now.getMonth() + 1; // Current month (1-12)
      const year = now.getFullYear();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/invoices/generate-all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            month: month,
            year: year,
            labPartnerIds: selectedLabPartners,
          }),
        }
      );

      const data = await response.json();
      console.log('Invoice generation response:', data);
      if (data.success) {
        const summary = data.data.summary;
        alert(
          `Invoice Generation Complete!\n\n` +
          `Successfully generated: ${summary.generated}\n` +
          `Skipped: ${summary.skipped}\n` +
          `Failed: ${summary.failed}\n\n` +
          `Total processed: ${summary.total} lab partner(s)`
        );
        setShowLabPartnerModal(false);
        fetchInvoices();
        fetchGracePeriodStatus();
      } else {
        console.error('Invoice generation failed:', data);
        setError(data.message || 'Failed to generate invoices');
        alert('Error: ' + (data.message || 'Failed to generate invoices'));
      }
    } catch (err) {
      console.error('Error generating invoices:', err);
      setError('Failed to generate invoices');
    } finally {
      setGenerating(false);
    }
  };

  const openFlexibleInvoiceModal = (labPartner) => {
    setSelectedLabPartner(labPartner);
    setInvoiceTimeWindow('monthly');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowDateConfirmation(false);
    setConfirmedDates(null);
    setShowFlexibleInvoiceModal(true);
  };

  const calculateDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    if (invoiceTimeWindow === 'monthly') {
      // Previous month
      const month = now.getMonth();
      const year = month === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const billingMonth = month === 0 ? 12 : month;
      startDate = new Date(year, billingMonth - 1, 1);
      endDate = new Date(year, billingMonth, 0);
    } else if (invoiceTimeWindow === 'weekly') {
      // Last 7 days
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
    } else if (invoiceTimeWindow === 'custom') {
      if (!customStartDate || !customEndDate) {
        return null;
      }
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    }

    return { startDate, endDate };
  };

  const handleDateConfirmation = () => {
    const dateRange = calculateDateRange();
    if (!dateRange) {
      alert('Please select valid dates for custom range');
      return;
    }
    setConfirmedDates(dateRange);
    setShowDateConfirmation(true);
  };

  const generateFlexibleInvoice = async () => {
    if (!confirmedDates) {
      alert('Please confirm the date range first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const payload = {
        timeWindow: invoiceTimeWindow,
      };

      if (invoiceTimeWindow === 'monthly') {
        const month = confirmedDates.startDate.getMonth() + 1;
        const year = confirmedDates.startDate.getFullYear();
        payload.month = month;
        payload.year = year;
      } else if (invoiceTimeWindow === 'weekly') {
        payload.startDate = confirmedDates.startDate.toISOString();
      } else if (invoiceTimeWindow === 'custom') {
        payload.startDate = confirmedDates.startDate.toISOString();
        payload.endDate = confirmedDates.endDate.toISOString();
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/invoices/generate-flexible/${selectedLabPartner._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(
          `Invoice Generated Successfully!\n\n` +
          `Invoice Number: ${data.data.summary.invoiceNumber}\n` +
          `Bookings: ${data.data.summary.numberOfBookings}\n` +
          `Total Commission: ${formatCurrency(data.data.summary.totalCommission)}\n` +
          `Date Range: ${formatDate(data.data.summary.dateRange.startDate)} - ${formatDate(data.data.summary.dateRange.endDate)}`
        );
        setShowFlexibleInvoiceModal(false);
        fetchInvoices();
      } else {
        setError(data.message || 'Failed to generate invoice');
      }
    } catch (err) {
      console.error('Error generating flexible invoice:', err);
      setError('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const enforceOverdueInvoices = async () => {
    if (!confirm('Suspend all lab partners with overdue invoices?')) {
      return;
    }

    setEnforcing(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/invoices/enforce-overdue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        const { enforcedCount, suspended } = data.data;
        alert(
          `Enforcement complete!\n\n` +
          `New suspensions: ${enforcedCount}\n` +
          `Total overdue invoices: ${data.data.summary.totalOverdueInvoices}\n\n` +
          (suspended.length > 0 
            ? `Suspended labs:\n${suspended.map(s => `- ${s.laboratoryName}: ${s.overdueCount} invoice(s), ₹${s.totalOverdue}`).join('\n')}`
            : 'No new suspensions.')
        );
        fetchInvoices();
        fetchGracePeriodStatus();
      } else {
        setError(data.message || 'Failed to enforce overdue invoices');
      }
    } catch (err) {
      console.error('Error enforcing overdue invoices:', err);
      setError('Failed to enforce overdue invoices');
    } finally {
      setEnforcing(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDetails({
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentNotes: '',
    });
    setShowPaymentModal(true);
  };

  const markInvoiceAsPaid = async () => {
    if (!paymentDetails.paymentReference) {
      alert('Please enter payment reference');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/invoices/${selectedInvoice._id}/mark-paid`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentDetails),
        }
      );

      const data = await response.json();
      if (data.success) {
        const message = data.data.labPartnerRestored
          ? `Invoice marked as paid!\n\nLab Partner "${data.data.invoice.labPartnerId.laboratoryName}" has been automatically unsuspended.`
          : 'Invoice marked as paid successfully!';
        
        alert(message);
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        fetchInvoices();
        fetchGracePeriodStatus();
      } else {
        alert(data.message || 'Failed to mark invoice as paid');
      }
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      alert('Failed to mark invoice as paid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (invoice) => {
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    
    if (invoice.status === 'paid') {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Paid</span>;
    } else if (invoice.status === 'overdue' || dueDate < now) {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Overdue</span>;
    } else {
      return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return invoice.status === 'payment_due' || invoice.status === 'overdue';
    if (filterStatus === 'paid') return invoice.status === 'paid';
    if (filterStatus === 'overdue') return invoice.status === 'overdue' || new Date(invoice.dueDate) < new Date();
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fffff0' }}>
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-[#225533]">Invoice Management</h1>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={openInvoiceGenerationModal}
            disabled={generating}
            className="px-6 py-4 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Invoices...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Monthly Invoices
              </>
            )}
          </button>

          <button
            onClick={enforceOverdueInvoices}
            disabled={enforcing}
            className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {enforcing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enforcing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Enforce Overdue Invoices
              </>
            )}
          </button>
        </div>

        {/* Grace Period Status */}
        {gracePeriodData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#225533] mb-4">Grace Period Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-900">{gracePeriodData.summary.overdue}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-sm text-yellow-700 mb-1">In Grace Period</p>
                <p className="text-3xl font-bold text-yellow-900">{gracePeriodData.summary.inGracePeriod}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 mb-1">Normal</p>
                <p className="text-3xl font-bold text-green-900">{gracePeriodData.summary.normal}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({invoices.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending ({invoices.filter(i => i.status === 'payment_due' || i.status === 'overdue').length})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'paid'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Paid ({invoices.filter(i => i.status === 'paid').length})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'overdue'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overdue ({invoices.filter(i => i.status === 'overdue' || new Date(i.dueDate) < new Date()).length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Invoices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-[#225533]">{invoice.invoiceNumber}</h3>
                      {getStatusBadge(invoice)}
                    </div>
                    
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      {invoice.labPartnerId?.laboratoryName || 'Lab Partner'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Billing Period</p>
                        <p className="font-semibold">
                          {invoice.billingPeriod?.month && invoice.billingPeriod?.year ? (
                            new Date(invoice.billingPeriod.year, invoice.billingPeriod.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                          ) : invoice.billingPeriod?.startDate && invoice.billingPeriod?.endDate ? (
                            `${formatDate(invoice.billingPeriod.startDate)} - ${formatDate(invoice.billingPeriod.endDate)}`
                          ) : (
                            'Custom Period'
                          )}
                        </p>
                        {invoice.billingPeriod?.type && (
                          <p className="text-xs text-gray-500 capitalize">({invoice.billingPeriod.type})</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Bookings</p>
                        <p className="font-semibold">{invoice.numberOfBookings} bookings</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="font-semibold">{formatCurrency(invoice.totalBookingValue)}</p>
                      </div>
                    </div>

                    {invoice.status === 'paid' && invoice.paidDate && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-800 font-semibold mb-1">Payment Received</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-green-700">Date:</span>
                            <span className="ml-2 font-semibold">{formatDate(invoice.paidDate)}</span>
                          </div>
                          {invoice.paymentMethod && (
                            <div>
                              <span className="text-green-700">Method:</span>
                              <span className="ml-2 font-semibold capitalize">{invoice.paymentMethod.replace('_', ' ')}</span>
                            </div>
                          )}
                          {invoice.paymentReference && (
                            <div>
                              <span className="text-green-700">Ref:</span>
                              <span className="ml-2 font-semibold">{invoice.paymentReference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right md:ml-6">
                    <p className="text-sm text-gray-500 mb-1">Commission</p>
                    <p className="text-3xl font-bold text-[#3f8554]">{formatCurrency(invoice.totalCommission)}</p>
                    
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => openPaymentModal(invoice)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scaleIn">
            <h2 className="text-2xl font-bold text-[#225533] mb-4">Mark Invoice as Paid</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Invoice: {selectedInvoice.invoiceNumber}</p>
              <p className="text-sm text-gray-600">Lab: {selectedInvoice.labPartnerId?.laboratoryName}</p>
              <p className="text-lg font-bold text-[#3f8554] mt-2">Amount: {formatCurrency(selectedInvoice.totalCommission)}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentDetails.paymentMethod}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Reference *</label>
                <input
                  type="text"
                  value={paymentDetails.paymentReference}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentReference: e.target.value })}
                  placeholder="Transaction ID / Cheque Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={paymentDetails.paymentNotes}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentNotes: e.target.value })}
                  placeholder="Additional payment details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={markInvoiceAsPaid}
                className="flex-1 px-4 py-2 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors font-semibold"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lab Partner Selection Modal */}
      {showLabPartnerModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#225533]">Select Lab Partners for Invoice Generation</h2>
              <p className="text-sm text-gray-600 mt-2">Choose which lab partners to generate invoices for</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingLabPartners ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading lab partners...</p>
                </div>
              ) : labPartners.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No lab partners found</p>
                </div>
              ) : (
                <>
                  {/* Select All Checkbox */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLabPartners.length === labPartners.length && labPartners.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 text-[#3f8554] border-gray-300 rounded focus:ring-[#3f8554]"
                      />
                      <span className="font-semibold text-gray-900">
                        Select All ({labPartners.length} lab partner{labPartners.length !== 1 ? 's' : ''})
                      </span>
                    </label>
                  </div>

                  {/* Lab Partners List */}
                  <div className="space-y-2">
                    {labPartners.map((labPartner) => (
                      <div
                        key={labPartner._id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedLabPartners.includes(labPartner._id)
                            ? 'border-[#3f8554] bg-green-50'
                            : 'border-gray-200 hover:border-[#3f8554] hover:bg-gray-50'
                        }`}
                        onClick={() => toggleLabPartnerSelection(labPartner._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedLabPartners.includes(labPartner._id)}
                              onChange={() => toggleLabPartnerSelection(labPartner._id)}
                              className="mt-1 w-5 h-5 text-[#3f8554] border-gray-300 rounded focus:ring-[#3f8554]"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{labPartner.laboratoryName}</h3>
                              <p className="text-sm text-gray-600">{labPartner.name}</p>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Commission Rate:</span>
                                  <span className="ml-2 font-semibold text-[#3f8554]">{labPartner.commissionRate}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Unbilled:</span>
                                  <span className="ml-2 font-semibold">{formatCurrency(labPartner.unbilledCommissions || 0)}</span>
                                </div>
                              </div>
                              {labPartner.isSuspended && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLabPartnerModal(false);
                              openFlexibleInvoiceModal(labPartner);
                            }}
                            className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
                          >
                            Custom Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="mb-4 text-sm text-gray-600">
                <strong>{selectedLabPartners.length}</strong> lab partner{selectedLabPartners.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={generateAllInvoices}
                  disabled={selectedLabPartners.length === 0 || generating}
                  className="flex-1 px-4 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Invoices'}
                </button>
                <button
                  onClick={() => {
                    setShowLabPartnerModal(false);
                    setSelectedLabPartners([]);
                  }}
                  disabled={generating}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flexible Invoice Generation Modal */}
      {showFlexibleInvoiceModal && selectedLabPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#225533]">Generate Invoice for {selectedLabPartner.laboratoryName}</h2>
              <p className="text-sm text-gray-600 mt-2">Select time window for invoice generation</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Time Window Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Period</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setInvoiceTimeWindow('monthly')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      invoiceTimeWindow === 'monthly'
                        ? 'bg-[#3f8554] text-white ring-2 ring-[#3f8554]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setInvoiceTimeWindow('weekly')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      invoiceTimeWindow === 'weekly'
                        ? 'bg-[#3f8554] text-white ring-2 ring-[#3f8554]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setInvoiceTimeWindow('custom')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      invoiceTimeWindow === 'custom'
                        ? 'bg-[#3f8554] text-white ring-2 ring-[#3f8554]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
              </div>

              {/* Custom Date Range Inputs */}
              {invoiceTimeWindow === 'custom' && (
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                    />
                  </div>
                </div>
              )}

              {/* Date Confirmation */}
              {!showDateConfirmation && (
                <button
                  onClick={handleDateConfirmation}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-4"
                >
                  Preview Date Range
                </button>
              )}

              {showDateConfirmation && confirmedDates && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Confirm Invoice Period</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 font-medium">Start Date:</p>
                      <p className="text-blue-900 font-bold text-lg">{formatDate(confirmedDates.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-blue-700 font-medium">End Date:</p>
                      <p className="text-blue-900 font-bold text-lg">{formatDate(confirmedDates.endDate)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-blue-700">
                    The invoice will include all completed bookings with received payments in this date range.
                  </p>
                  <button
                    onClick={() => setShowDateConfirmation(false)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Change Date Range
                  </button>
                </div>
              )}

              {/* Lab Partner Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Lab Partner Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-semibold">{selectedLabPartner.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="ml-2 font-semibold text-[#3f8554]">{selectedLabPartner.commissionRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unbilled:</span>
                    <span className="ml-2 font-semibold">{formatCurrency(selectedLabPartner.unbilledCommissions || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={generateFlexibleInvoice}
                  disabled={!showDateConfirmation || generating}
                  className="flex-1 px-4 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating Invoice...' : 'Generate Invoice'}
                </button>
                <button
                  onClick={() => {
                    setShowFlexibleInvoiceModal(false);
                    setSelectedLabPartner(null);
                    setShowDateConfirmation(false);
                  }}
                  disabled={generating}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
