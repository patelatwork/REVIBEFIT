/**
 * Monthly Revenue card.
 * Net = Gross − Commission. Shows net amount prominently with gross and commission below.
 */
const RevenueGaugeCard = ({ financialSummary }) => {
  const gross = financialSummary?.currentBalance?.monthlyEarnings || 0;
  const commissionRate = financialSummary?.commissionRate || 10;

  // Correct calculation: commission is deducted from gross
  const commissionAmount = Math.round((gross * commissionRate) / 100);
  const net = gross - commissionAmount;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#3f8554]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Monthly Revenue</h3>
        </div>
        <span className="text-xs text-[#3f8554] font-medium cursor-pointer hover:underline">View more</span>
      </div>

      <div className="flex flex-col items-center">
        {/* Net amount display */}
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Net Amount</p>
          <p className="text-3xl font-bold text-[#3f8554]">{formatCurrency(net)}</p>
          <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
            <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
            <span className="text-xs font-medium text-amber-700">Commission rate: {commissionRate}%</span>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="flex items-center justify-between w-full mt-3 pt-3 border-t border-gray-100">
          <div className="text-center flex-1">
            <p className="text-xs text-gray-400">Gross</p>
            <p className="text-sm font-semibold text-gray-800">{formatCurrency(gross)}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-xs text-gray-400">Commission</p>
            <p className="text-sm font-semibold text-red-500">−{formatCurrency(commissionAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueGaugeCard;
