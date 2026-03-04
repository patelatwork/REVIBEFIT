/**
 * Revenue card showing monthly payout with commission breakdown.
 * Mirrors lab partner RevenueGaugeCard style.
 */
const RevenueCard = ({ earnings, stats }) => {
  const commissionRate = earnings?.commissionRate || 15;
  const monthlyPayout = earnings?.monthlyEarnings || stats?.monthlyEarnings || 0;
  const monthlyGross = earnings?.monthlyBookingValue || 0;
  const monthlyCommission = earnings?.monthlyCommission || 0;
  const totalEarnings = earnings?.allTime?.totalPayout || stats?.totalEarnings || 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Revenue</h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {commissionRate}% commission
        </span>
      </div>

      {/* Monthly Payout */}
      <div className="mb-4">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Monthly Net Payout</p>
        <p className="text-3xl font-bold text-gray-800">
          ₹{monthlyPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Gross Bookings</span>
          <span className="font-semibold text-gray-700">₹{monthlyGross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Platform Commission</span>
          <span className="font-semibold text-red-500">−₹{monthlyCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">All-Time Earnings</span>
          <span className="font-bold text-[#3f8554]">₹{totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;
