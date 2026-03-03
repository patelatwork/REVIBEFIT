import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
  pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700' },
  confirmed: { label: 'Confirmed', cls: 'bg-green-50 text-green-700' },
  completed: { label: 'Completed', cls: 'bg-blue-50 text-blue-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600' },
};

/**
 * Upcoming bookings table with date scroller.
 * Mimics the "Upcoming appointments" table from the reference.
 */
const UpcomingBookingsTable = ({ bookings = [] }) => {
  const navigate = useNavigate();

  // Generate date range: 14 days before today to 17 days after (31 total like reference)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateRange = useMemo(() => {
    const dates = [];
    for (let i = -7; i <= 23; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [scrollOffset, setScrollOffset] = useState(0);
  const visibleDates = 15;

  // Filter bookings for selected date (confirmed/pending for upcoming)
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const bd = new Date(b.bookingDate);
        bd.setHours(0, 0, 0, 0);
        return bd.getTime() === selectedDate.getTime() && b.status !== 'cancelled';
      })
      .sort((a, b) => {
        // Sort by time slot
        const getHour = (slot) => {
          const match = slot?.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return 0;
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
          if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };
        return getHour(a.timeSlot) - getHour(b.timeSlot);
      });
  }, [bookings, selectedDate]);

  const isToday = (d) => d.getTime() === today.getTime();
  const isSelected = (d) => d.getTime() === selectedDate.getTime();
  const hasBookings = (d) => bookings.some((b) => {
    const bd = new Date(b.bookingDate);
    bd.setHours(0, 0, 0, 0);
    return bd.getTime() === d.getTime() && b.status !== 'cancelled';
  });

  const formatDateShort = (d) => d.getDate();
  const formatMonthDay = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const scrollLeft = () => setScrollOffset(Math.max(0, scrollOffset - 5));
  const scrollRight = () => setScrollOffset(Math.min(dateRange.length - visibleDates, scrollOffset + 5));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Upcoming Bookings</h3>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3f8554]" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> No bookings
          </span>
        </div>

        <button
          onClick={() => navigate('/lab-partner/manage-bookings')}
          className="text-xs text-[#3f8554] font-medium hover:underline"
        >
          View more
        </button>
      </div>

      {/* Date scroller */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={scrollLeft}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex items-center gap-1 overflow-hidden flex-1">
            {dateRange.slice(scrollOffset, scrollOffset + visibleDates).map((d) => {
              const sel = isSelected(d);
              const tod = isToday(d);
              const has = hasBookings(d);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(new Date(d))}
                  className={`flex-1 min-w-9 max-w-11 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    sel
                      ? 'bg-[#3f8554] text-white shadow-sm scale-105'
                      : tod
                      ? 'bg-[#e8f5ec] text-[#3f8554] font-bold'
                      : has
                      ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {formatDateShort(d)}
                </button>
              );
            })}
          </div>

          <button
            onClick={scrollRight}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-gray-100">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                Patient
                <svg className="inline w-3 h-3 ml-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                Tests
                <svg className="inline w-3 h-3 ml-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                Status
                <svg className="inline w-3 h-3 ml-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Date</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">
                Time
                <svg className="inline w-3 h-3 ml-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
              </th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length > 0 ? (
              filteredBookings.slice(0, 6).map((booking) => {
                const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending;
                const patientName = booking.fitnessEnthusiastId?.name || 'Unknown';
                const testNames = booking.selectedTests?.map((t) => t.testId?.testName || t.testName).filter(Boolean);
                const displayTest = testNames?.length > 0 ? testNames[0] : 'Lab Test';
                const extraCount = (testNames?.length || 0) - 1;

                return (
                  <tr
                    key={booking._id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e8f5ec] flex items-center justify-center text-xs font-semibold text-[#3f8554] shrink-0">
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                          {patientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-sm text-gray-700">{displayTest}</span>
                      {extraCount > 0 && (
                        <span className="text-[10px] text-gray-400 ml-1">+{extraCount}</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${badge.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-600">
                      {formatMonthDay(new Date(booking.bookingDate))}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-600">
                      {booking.timeSlot || '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Contact patient"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                        </button>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <p className="text-sm text-gray-400">No bookings for {formatMonthDay(selectedDate)}</p>
                  <p className="text-xs text-gray-300 mt-1">Select a different date or check all bookings</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingBookingsTable;
