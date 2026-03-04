/**
 * Recent client activity sidebar showing latest transactions.
 * Mirrors lab partner BookingRequestsSidebar pattern.
 */
const RecentActivitySidebar = ({ recentTransactions = [] }) => {
  const getTimeAgo = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
          {recentTransactions.length} recent
        </span>
      </div>

      {/* Activity list */}
      <div className="px-5 pb-5 space-y-3 max-h-[420px] overflow-y-auto">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((txn, i) => (
            <div
              key={txn._id || i}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3f8554] to-emerald-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {txn.userId?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {txn.userId?.name || 'Unknown'}
                  </p>
                  <span className="text-sm font-bold text-[#3f8554] shrink-0">
                    +₹{(txn.trainerPayout || txn.amountPaid)?.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {txn.classId?.title || 'Class Booking'}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    txn.bookingStatus === 'completed'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-green-50 text-green-600'
                  }`}>
                    {txn.bookingStatus}
                  </span>
                  <span className="text-[10px] text-gray-400">{getTimeAgo(txn.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-sm text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivitySidebar;
