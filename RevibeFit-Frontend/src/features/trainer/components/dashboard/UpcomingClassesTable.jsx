import { useMemo, useState } from 'react';

/**
 * Upcoming classes table with date scroller strip.
 * Mirrors lab partner UpcomingBookingsTable pattern.
 */
const UpcomingClassesTable = ({ schedule = [] }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  // Build 14-day strip
  const dateStrip = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      days.push({
        key: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const filteredClasses = useMemo(() => {
    if (!selectedDate) return schedule.slice(0, 8);
    return schedule.filter((cls) => {
      const classDate = new Date(cls.scheduledDate).toISOString().split('T')[0];
      return classDate === selectedDate;
    });
  }, [schedule, selectedDate]);

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      ongoing: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-gray-50 text-gray-600 border-gray-200',
      cancelled: 'bg-red-50 text-red-600 border-red-200',
    };
    return styles[status] || styles.scheduled;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Upcoming Classes</h3>
        </div>
        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="text-xs text-[#3f8554] font-medium hover:underline"
          >
            Show all
          </button>
        )}
      </div>

      {/* Date scroller */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {dateStrip.map((day) => (
            <button
              key={day.key}
              onClick={() => setSelectedDate(day.key === selectedDate ? null : day.key)}
              className={`flex flex-col items-center min-w-[52px] px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                day.key === selectedDate
                  ? 'bg-[#3f8554] text-white border-[#3f8554] shadow-sm'
                  : day.isToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
              }`}
            >
              <span className="text-[10px] uppercase opacity-70">{day.dayName}</span>
              <span className="text-lg font-bold leading-tight">{day.dayNum}</span>
              <span className="text-[10px] uppercase opacity-70">{day.month}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Class</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Date & Time</th>
              <th className="px-5 py-3 font-medium">Participants</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredClasses.length > 0 ? (
              filteredClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3f8554] to-[#225533] flex items-center justify-center text-white text-xs font-bold">
                        {cls.title?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{cls.title}</p>
                        <p className="text-xs text-gray-400">{cls.duration || 60} min</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-600 capitalize">
                      {cls.classType || 'General'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-800">
                      {new Date(cls.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400">{cls.scheduledTime}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {(cls.participants || []).slice(0, 3).map((p, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-600"
                            title={p.name}
                          >
                            {p.name?.charAt(0)?.toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {cls.currentParticipants || 0}/{cls.maxParticipants || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${getStatusBadge(cls.status)}`}>
                      {cls.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">
                    ₹{cls.price || 0}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-12 text-center text-gray-400 text-sm">
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  {selectedDate ? 'No classes on this date' : 'No upcoming classes scheduled'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingClassesTable;
