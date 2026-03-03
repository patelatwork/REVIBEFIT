import { useMemo } from 'react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: 'Confirmed', color: '#3f8554', bg: '#e8f5ec' },
  completed: { label: 'Completed', color: '#3b82f6', bg: '#dbeafe' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
};

/**
 * Total bookings card with horizontal breakdown bar.
 * Mimics "Total patients" card from the reference.
 */
const TotalBookingsCard = ({ bookings = [] }) => {
  const { statusCounts, total, trend } = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status]++;
    });
    const sum = bookings.length;

    // Simple trend: this month vs last month
    const now = new Date();
    const thisMonth = bookings.filter(
      (b) => new Date(b.createdAt).getMonth() === now.getMonth() && new Date(b.createdAt).getFullYear() === now.getFullYear()
    ).length;
    const lastMonth = bookings.filter((b) => {
      const d = new Date(b.createdAt);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    }).length;
    const diff = thisMonth - lastMonth;

    return { statusCounts: counts, total: sum, trend: diff };
  }, [bookings]);

  const activeTotal = statusCounts.pending + statusCounts.confirmed + statusCounts.completed;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Total Bookings</h3>
        </div>
        <span className="text-xs text-[#3f8554] font-medium cursor-pointer hover:underline">View more</span>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-gray-800">{total}</span>
        {trend !== 0 && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${trend > 0 ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
        )}
      </div>

      {/* Legend dots */}
      <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'cancelled').map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Horizontal stacked bar */}
      <div className="w-full h-6 rounded-full overflow-hidden bg-gray-100 flex">
        {activeTotal > 0 &&
          ['confirmed', 'completed', 'pending'].map((key) => {
            const pct = (statusCounts[key] / activeTotal) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: STATUS_CONFIG[key].color }}
                title={`${STATUS_CONFIG[key].label}: ${statusCounts[key]}`}
              />
            );
          })}
      </div>

      {/* Number row */}
      <div className="flex items-center justify-between mt-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="text-center">
            <p className="text-lg font-bold text-gray-800">{statusCounts[key]}</p>
            <p className="text-[10px] text-gray-400">{cfg.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TotalBookingsCard;
