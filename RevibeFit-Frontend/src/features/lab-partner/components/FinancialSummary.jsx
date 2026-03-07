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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/financial-summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      } else {
        setError(data.message || 'Failed to load financial summary');
      }
    } catch (err) {
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
    }).format(amount || 0);
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
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/lab-partner/settlements')}
            className="px-4 py-2 bg-white text-[#3f8554] border border-[#3f8554] rounded-lg hover:bg-green-50 transition-colors"
          >
            View Settlements
          </button>
          <button
            onClick={() => navigate('/lab-partner/invoices')}
            className="px-4 py-2 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors"
          >
            View Invoices
          </button>
        </div>
      </div>

      {/* Main Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Earned */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Total Earned</h3>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-green-900">{formatCurrency(summary.totalSettled)}</p>
          <p className="text-xs text-green-700 mt-2">All time net settlement amount</p>
        </div>

        {/* This Month Payout */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">This Month Payout</h3>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-blue-900">{formatCurrency(summary.monthSettled)}</p>
          <p className="text-xs text-blue-700 mt-2">Settled amount this month</p>
        </div>

        {/* Pending Settlements */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-800">Pending Settlements</h3>
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-purple-900">{summary.pendingSettlements?.count || 0}</p>
          <p className="text-xs text-purple-700 mt-2">
            Worth {formatCurrency(summary.pendingSettlements?.amount)} awaiting settlement
          </p>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pending Invoices */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Pending Invoices</h4>
              <p className="text-2xl font-bold text-blue-900">{summary.invoices?.payment_due?.count || summary.invoices?.issued?.count || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700 mb-1">Total Amount</p>
              <p className="text-lg font-semibold text-blue-900">{formatCurrency(summary.invoices?.payment_due?.total || summary.invoices?.issued?.total)}</p>
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
              <p className="text-lg font-semibold text-purple-900">{formatCurrency(summary.invoices?.paid?.total)}</p>
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

      {/* Warning for Pending Settlements */}
      {(summary.pendingSettlements?.count > 0) && (
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800">Pending Settlements</p>
              <p className="text-sm text-yellow-700 mt-1">
                You have {summary.pendingSettlements.count} pending settlement{summary.pendingSettlements.count !== 1 ? 's' : ''} worth {formatCurrency(summary.pendingSettlements.amount)}.
                These are from completed bookings awaiting payout processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSummary;
