import { useMemo } from 'react';

/**
 * Top earning classes with mini bar chart.
 * Shows top performing classes by revenue.
 */
const TopClassesCard = ({ earningsByClass = [] }) => {
  const sortedClasses = useMemo(() => {
    return earningsByClass.slice(0, 5);
  }, [earningsByClass]);

  const maxEarnings = sortedClasses.length > 0 ? Math.max(...sortedClasses.map((c) => c.totalEarnings)) : 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.044-1.573.986-1.573 1.96V8.25c0 1.024.574 1.956 1.573 2.012A11.878 11.878 0 019 10.64a4.5 4.5 0 009 0c1.153.286 2.302.67 3.425 1.122 1 .453 1.575 1.387 1.575 2.412V8.196c0-.974-.577-1.916-1.573-1.96A48.438 48.438 0 0012 6a48.505 48.505 0 00-6.75.236z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Top Earning Classes</h3>
        </div>
      </div>

      <div className="space-y-3">
        {sortedClasses.length > 0 ? (
          sortedClasses.map((cls, i) => (
            <div key={cls._id || i} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 w-4">#{i + 1}</span>
                  <span className="text-sm text-gray-700 font-medium truncate">{cls.classTitle}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{cls.bookings} bookings</span>
                  <span className="text-sm font-bold text-gray-800">₹{cls.totalEarnings?.toLocaleString('en-IN')}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 group-hover:opacity-90"
                  style={{
                    width: maxEarnings > 0 ? `${(cls.totalEarnings / maxEarnings) * 100}%` : '0%',
                    background: `linear-gradient(90deg, #3f8554, ${i % 2 === 0 ? '#60a5fa' : '#f59e0b'})`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-sm text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            No earnings data yet
          </div>
        )}
      </div>
    </div>
  );
};

export default TopClassesCard;
