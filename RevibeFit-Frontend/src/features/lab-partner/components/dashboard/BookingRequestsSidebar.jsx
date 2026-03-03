import { useNavigate } from 'react-router-dom';

/**
 * Pending booking requests sidebar with approve/reject actions.
 * Mimics the "Appointment request" card from the reference.
 */
const BookingRequestsSidebar = ({ bookings = [], onStatusUpdate }) => {
  const navigate = useNavigate();

  // Only pending bookings
  const pendingBookings = bookings
    .filter((b) => b.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) +
      ', ' +
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const handleConfirm = async (bookingId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'confirmed' }),
        }
      );
      const data = await res.json();
      if (data.success && onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error('Failed to confirm booking:', err);
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'cancelled' }),
        }
      );
      const data = await res.json();
      if (data.success && onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Booking Requests</h3>
        </div>
        <button
          onClick={() => navigate('/lab-partner/manage-bookings')}
          className="text-xs text-[#3f8554] font-medium hover:underline"
        >
          View more
        </button>
      </div>

      {/* Request cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {pendingBookings.length > 0 ? (
          pendingBookings.map((booking) => {
            const patientName = booking.fitnessEnthusiastId?.name || 'Unknown Patient';
            const testNames = booking.selectedTests
              ?.map((t) => t.testId?.testName || t.testName)
              .filter(Boolean);
            const displayTest = testNames?.length > 0 ? testNames.join(', ') : 'Lab Test';

            return (
              <div
                key={booking._id}
                className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#3f8554] to-[#225533] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {patientName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{patientName}</p>
                    <p className="text-xs text-gray-500 truncate">{displayTest}</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {formatDate(booking.bookingDate)}
                      {booking.timeSlot && (
                        <span className="ml-1">• {booking.timeSlot}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCancel(booking._id)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                      title="Decline"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleConfirm(booking._id)}
                      className="w-8 h-8 rounded-full bg-[#3f8554] flex items-center justify-center text-white hover:bg-[#225533] transition-colors shadow-sm"
                      title="Confirm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No pending requests</p>
            <p className="text-xs text-gray-300 mt-0.5">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingRequestsSidebar;
