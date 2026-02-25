import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FitnessEnthusiastCare = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        setError('Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/cancel`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchBookings(); // Refresh the list
      } else {
        setError('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filterBookings = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate >= now && booking.status !== 'cancelled' && booking.status !== 'completed';
        });
      case 'past':
        return bookings.filter(booking => {
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate < now || booking.status === 'completed';
        });
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffff0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3f8554] mx-auto mb-4"></div>
          <p className="text-xl text-[#225533] font-semibold">Loading your lab test bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-2">My Lab Test Bookings</h1>
          <p className="text-gray-600">View and manage your lab test appointments and booking history</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-[#225533]">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-[#225533]">
              {bookings.filter(b => {
                const bookingDate = new Date(b.bookingDate);
                return bookingDate >= new Date() && b.status !== 'cancelled' && b.status !== 'completed';
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-[#225533]">
              {bookings.filter(b => b.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-3xl font-bold text-[#225533]">
              {bookings.filter(b => b.status === 'cancelled').length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-[#225533] hover:bg-gray-100'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'upcoming'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-[#225533] hover:bg-gray-100'
            }`}
          >
            Upcoming ({bookings.filter(b => {
              const bookingDate = new Date(b.bookingDate);
              return bookingDate >= new Date() && b.status !== 'cancelled' && b.status !== 'completed';
            }).length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'past'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-[#225533] hover:bg-gray-100'
            }`}
          >
            Past ({bookings.filter(b => {
              const bookingDate = new Date(b.bookingDate);
              return bookingDate < new Date() || b.status === 'completed';
            }).length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'cancelled'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-[#225533] hover:bg-gray-100'
            }`}
          >
            Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-500 mb-2">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Start by booking a lab test from the Care page'
                : `You don't have any ${filter} bookings`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/care')}
                className="bg-[#3f8554] hover:bg-[#225533] text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Browse Lab Partners
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:border-[#3f8554] transition-colors"
              >
                <div className="p-6">
                  {/* Header with Lab Name and Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#225533] mb-1">
                        {booking.labPartnerId?.laboratoryName || 'Lab Partner'}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        {booking.labPartnerId?.laboratoryAddress}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(
                        booking.status
                      )}`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  {/* Booking Details */}
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h3 className="font-semibold text-[#225533] mb-2">Appointment Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{booking.timeSlot}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-[#225533] mb-2">Contact Information</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          📞 {booking.labPartnerId?.phone}
                        </p>
                        <p className="text-gray-600">
                          ✉️ {booking.labPartnerId?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Tests */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-[#225533] mb-2">Selected Tests</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <ul className="space-y-2">
                        {booking.selectedTests.map((test, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="text-gray-700">{test.testName}</span>
                            <span className="font-semibold text-[#3f8554]">₹{test.price}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-green-300 mt-3 pt-3 flex justify-between items-center">
                        <span className="font-bold text-[#225533]">Total Amount:</span>
                        <span className="text-xl font-bold text-[#225533]">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-[#225533] mb-2">Notes</h3>
                      <p className="text-gray-600 text-sm italic bg-gray-50 p-3 rounded">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Expected Report Delivery Time */}
                  <div className="mb-4">
                    <div className={`rounded-lg p-4 ${
                      booking.expectedReportDeliveryTime 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <svg className={`w-5 h-5 ${
                          booking.expectedReportDeliveryTime ? 'text-purple-600' : 'text-gray-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className={`font-semibold ${
                          booking.expectedReportDeliveryTime ? 'text-purple-900' : 'text-gray-700'
                        }`}>Expected Report Delivery</h3>
                      </div>
                      <p className={`font-medium ml-7 ${
                        booking.expectedReportDeliveryTime ? 'text-purple-800' : 'text-gray-500 italic'
                      }`}>
                        {booking.expectedReportDeliveryTime || 'To be updated by the lab partner'}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Payment Status: </span>
                    <span
                      className={`text-sm font-semibold ${
                        booking.paymentStatus === 'paid'
                          ? 'text-green-600'
                          : booking.paymentStatus === 'refunded'
                          ? 'text-blue-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="flex-1 md:flex-none px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}

                  {/* Booking ID */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Booking ID: {booking._id}
                    </p>
                    <p className="text-xs text-gray-500">
                      Booked on: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FitnessEnthusiastCare;
