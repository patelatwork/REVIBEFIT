import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPartnerNavbar from '../components/LabPartnerNavbar';

const MyInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labName, setLabName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showBreakdown, setShowBreakdown] = useState({});

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(user);
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    fetchInvoices();
  }, [navigate]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/invoices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log('Invoices response:', data);
      if (data.success) {
        setInvoices(data.data || []);
      } else {
        setError(data.message || 'Failed to load invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
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

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return invoice.status === 'payment_due' || invoice.status === 'overdue';
    if (filterStatus === 'paid') return invoice.status === 'paid';
    if (filterStatus === 'overdue') return invoice.status === 'overdue' || new Date(invoice.dueDate) < new Date();
    return true;
  });

  const toggleBreakdown = (invoiceId) => {
    setShowBreakdown(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffff0]">
        <LabPartnerNavbar labName={labName} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <LabPartnerNavbar labName={labName} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-[#225533]">My Invoices</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/lab-partner/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

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

        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No invoices found</p>
            <p className="text-gray-400 text-sm mt-2">Invoices will appear here once generated by the admin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* Invoice Info */}
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-[#225533]">{invoice.invoiceNumber}</h3>
                      {getStatusBadge(invoice)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Billing Period</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {invoice.billingPeriod.type === 'monthly' ? (
                            new Date(invoice.billingPeriod.year, invoice.billingPeriod.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                          ) : invoice.billingPeriod.startDate && invoice.billingPeriod.endDate ? (
                            `${formatDate(invoice.billingPeriod.startDate)} - ${formatDate(invoice.billingPeriod.endDate)}`
                          ) : (
                            'Custom Range'
                          )}
                        </p>
                        {invoice.billingPeriod.type && (
                          <p className="text-xs text-gray-500 mt-1 capitalize">({invoice.billingPeriod.type})</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm font-semibold text-gray-700">{formatDate(invoice.dueDate)}</p>
                        <p className="text-xs mt-1">{getDaysUntilDue(invoice.dueDate)}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Bookings</p>
                        <p className="text-sm font-semibold text-gray-700">{invoice.numberOfBookings} bookings</p>
                        <p className="text-xs text-gray-500">Total Value: {formatCurrency(invoice.totalBookingValue)}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Commission Rate</p>
                        <p className="text-sm font-semibold text-gray-700">{invoice.commissionRate}%</p>
                      </div>
                    </div>

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
                              <span className="ml-2 font-semibold capitalize">{invoice.paymentMethod.replace('_', ' ')}</span>
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

                  {/* Amount */}
                  <div className="text-right md:ml-6">
                    <p className="text-sm text-gray-500 mb-1">Total Commission</p>
                    <p className="text-3xl font-bold text-[#3f8554]">{formatCurrency(invoice.totalCommission)}</p>
                    
                    {invoice.status !== 'paid' && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Payment Instructions</p>
                        <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                          Please contact admin for payment details
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Notes:</p>
                    <p className="text-sm text-gray-700 mt-1">{invoice.notes}</p>
                  </div>
                )}

                {/* Commission Breakdown */}
                {invoice.commissionBreakdown && invoice.commissionBreakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleBreakdown(invoice._id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-sm font-semibold text-[#225533]">
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
                                <p className="font-bold text-[#3f8554]">{formatCurrency(entry.commissionAmount)}</p>
                                <p className="text-xs text-gray-500">{entry.commissionRate}% of {formatCurrency(entry.totalAmount)}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Tests:</span> {entry.testNames.join(', ')}
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
