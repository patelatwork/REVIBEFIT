/**
 * Settlements overview card with mini bar chart.
 * Shows settlement-based financial data on the dashboard.
 */
const InvoiceOverviewCard = ({ financialSummary }) => {
  const totalSettled = financialSummary?.totalSettled || 0;
  const monthSettled = financialSummary?.monthSettled || 0;
  const pending = financialSummary?.pendingSettlements || { count: 0, amount: 0 };
  const commissionRate = financialSummary?.commissionRate || 10;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // Bar chart data
  const bars = [
    { label: 'Settled', value: totalSettled, color: '#3f8554' },
    { label: 'Pending', value: pending.amount, color: '#f59e0b' },
    { label: 'Month', value: monthSettled, color: '#60a5fa' },
  ];
  const maxBar = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Settlements</h3>
        </div>
        <span className="text-xs text-[#3f8554] font-medium cursor-pointer hover:underline">View more</span>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-800">{formatCurrency(totalSettled)}</span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-amber-700 bg-amber-50">
          {commissionRate}% rate
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        {pending.count > 0
          ? `${pending.count} pending (${formatCurrency(pending.amount)})`
          : 'No pending settlements'}
      </p>

      {/* Mini stats */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500">This Month</p>
          <p className="text-sm font-bold text-gray-800">{formatCurrency(monthSettled)}</p>
        </div>
        <div className="flex-1 bg-yellow-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500">Pending</p>
          <p className="text-sm font-bold text-gray-800">{pending.count}</p>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-2 h-20">
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-gray-600">{formatCurrency(bar.value)}</span>
            <div
              className="w-full rounded-t-md transition-all duration-700"
              style={{
                height: `${Math.max((bar.value / maxBar) * 56, 4)}px`,
                backgroundColor: bar.color,
              }}
            />
            <span className="text-[10px] text-gray-400">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceOverviewCard;
