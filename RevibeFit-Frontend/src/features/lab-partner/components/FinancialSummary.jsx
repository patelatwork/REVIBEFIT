import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FinancialSummary = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const fetchFinancialSummary = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching financial summary...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/financial-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setSummary(data.data);
        console.log('Summary set:', data.data);
      } else {
        console.error('API returned error:', data);
        setError(data.message || 'Failed to load financial summary');
      }
    } catch (err) {
      console.error('Error fetching financial summary:', err);
      setError(`Failed to load financial summary: ${err.message}`);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#225533]">Financial Summary</h2>
        <button
          onClick={() => navigate('/lab-partner/invoices')}
          className="px-4 py-2 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors"
        >
          View Invoices
        </button>
      </div>

      {/* Main Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current Month Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">This Month Revenue</h3>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-900">{formatCurrency(summary.currentBalance?.monthlyEarnings || 0)}</p>
          <p className="text-xs text-green-700 mt-2">Total bookings received this month</p>
        </div>

        {/* Current Month Liability (Commission Owed) */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-orange-800">This Month Liability</h3>
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-orange-900">{formatCurrency(summary.currentBalance?.currentMonthLiability || 0)}</p>
          <p className="text-xs text-orange-700 mt-2">Commission to be billed this month</p>
        </div>

        {/* Unbilled Commissions (Total Debt) */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-800">Total Platform Debt</h3>
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-red-900">{formatCurrency(summary.currentBalance?.unbilledCommissions || 0)}</p>
          <p className="text-xs text-red-700 mt-2">Outstanding commission across all invoices</p>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pending Invoices */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Pending Invoices</h4>
              <p className="text-2xl font-bold text-blue-900">{summary.invoices?.payment_due?.count || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700 mb-1">Total Amount</p>
              <p className="text-lg font-semibold text-blue-900">{formatCurrency(summary.invoices?.payment_due?.total || 0)}</p>
            </div>
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-800 mb-1">Paid Invoices</h4>
              <p className="text-2xl font-bold text-purple-900">{summary.invoices?.paid?.count || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-700 mb-1">Total Paid</p>
              <p className="text-lg font-semibold text-purple-900">{formatCurrency(summary.invoices?.paid?.total || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rate Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-700">Platform Commission Rate</p>
              <p className="text-xs text-gray-500">Applied to all bookings</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#3f8554]">{summary.commissionRate || 10}%</p>
        </div>
      </div>

      {/* Warning for Pending Payments */}
      {(summary.invoices?.payment_due?.count > 0 || summary.invoices?.overdue?.count > 0) && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800">Payment Reminder</p>
              <p className="text-sm text-yellow-700 mt-1">
                You have {(summary.invoices?.payment_due?.count || 0) + (summary.invoices?.overdue?.count || 0)} pending invoice{((summary.invoices?.payment_due?.count || 0) + (summary.invoices?.overdue?.count || 0)) !== 1 ? 's' : ''} totaling {formatCurrency((summary.invoices?.payment_due?.total || 0) + (summary.invoices?.overdue?.total || 0))}. 
                Please ensure payment by the due date to avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;
