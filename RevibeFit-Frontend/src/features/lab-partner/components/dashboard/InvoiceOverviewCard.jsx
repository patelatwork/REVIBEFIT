/**
 * Invoice overview card with mini bar chart.
 * Mimics the "Total appointment" card from the reference.
 */
const InvoiceOverviewCard = ({ financialSummary }) => {
  const invoiceData = financialSummary?.invoices || {};
  const paymentDue = invoiceData.payment_due || { total: 0, count: 0 };
  const paid = invoiceData.paid || { total: 0, count: 0 };
  const overdue = invoiceData.overdue || { total: 0, count: 0 };
  const totalInvoices = paymentDue.count + paid.count + overdue.count;
  const commissionRate = financialSummary?.commissionRate || 10;
  const unbilled = financialSummary?.pendingCommissions?.amount || 0;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  // Bar chart data
  const bars = [
    { label: 'Due', value: paymentDue.count, color: '#f59e0b' },
    { label: 'Paid', value: paid.count, color: '#3f8554' },
    { label: 'Overdue', value: overdue.count, color: '#ef4444' },
    { label: 'Unbilled', value: financialSummary?.pendingCommissions?.bookingsCount || 0, color: '#60a5fa' },
  ];
  const maxBar = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Invoices</h3>
        </div>
        <span className="text-xs text-[#3f8554] font-medium cursor-pointer hover:underline">View more</span>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-800">{totalInvoices}</span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-amber-700 bg-amber-50">
          {commissionRate}% rate
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        {unbilled > 0 ? `${formatCurrency(unbilled)} unbilled` : 'All commissions billed'}
      </p>

      {/* Mini bar chart */}
      <div className="flex items-end gap-2 h-20">
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-gray-600">{bar.value}</span>
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
