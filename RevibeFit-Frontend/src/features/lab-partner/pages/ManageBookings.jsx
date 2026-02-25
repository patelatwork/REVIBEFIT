import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPartnerNavbar from '../components/LabPartnerNavbar';

const ManageBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labName, setLabName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingDeliveryTime, setEditingDeliveryTime] = useState({});
  const [deliveryTimeInputs, setDeliveryTimeInputs] = useState({});
  const [uploadingReport, setUploadingReport] = useState({});
  const [deletingReport, setDeletingReport] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [markingPayment, setMarkingPayment] = useState({});

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(user);
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    fetchBookings();
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/lab-bookings`,
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

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('accessToken');
      const payload = { status: newStatus };
      
      // Include expected delivery time if it's set for this booking
      if (deliveryTimeInputs[bookingId]) {
        payload.expectedReportDeliveryTime = deliveryTimeInputs[bookingId];
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Clear the delivery time input for this booking after successful update
        setDeliveryTimeInputs(prev => {
          const updated = { ...prev };
          delete updated[bookingId];
          return updated;
        });
        setEditingDeliveryTime(prev => {
          const updated = { ...prev };
          delete updated[bookingId];
          return updated;
        });
        fetchBookings(); // Refresh the list
      } else {
        setError('Failed to update booking status');
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking status');
    }
  };

  const handleDeliveryTimeChange = (bookingId, value) => {
    setDeliveryTimeInputs(prev => ({
      ...prev,
      [bookingId]: value
    }));
  };

  const updateExpectedDeliveryTime = async (bookingId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: bookings.find(b => b._id === bookingId)?.status,
            expectedReportDeliveryTime: deliveryTimeInputs[bookingId]
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setEditingDeliveryTime(prev => ({
          ...prev,
          [bookingId]: false
        }));
        fetchBookings();
      } else {
        setError('Failed to update delivery time');
      }
    } catch (err) {
      console.error('Error updating delivery time:', err);
      setError('Failed to update delivery time');
    }
  };

  const handleReportUpload = async (bookingId, file) => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingReport(prev => ({ ...prev, [bookingId]: true }));
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('report', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/upload-report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchBookings(); // Refresh the list
        // Clear the file input and selected file
        setSelectedFiles(prev => {
          const updated = { ...prev };
          delete updated[bookingId];
          return updated;
        });
        const fileInput = document.getElementById(`report-upload-${bookingId}`);
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || 'Failed to upload report');
      }
    } catch (err) {
      console.error('Error uploading report:', err);
      setError('Failed to upload report');
    } finally {
      setUploadingReport(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const markUserPaymentReceived = async (bookingId) => {
    if (!confirm('Confirm that user has paid for this booking? This will automatically track the 10% platform commission.')) {
      return;
    }

    setMarkingPayment(prev => ({ ...prev, [`user-${bookingId}`]: true }));
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/user-payment-received`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod: 'cash', // Default, can be made dynamic
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchBookings(); // Refresh the list
        const revenue = data.data.revenue;
        if (revenue) {
          alert(`Payment received! Lab earnings: ₹${revenue.labCash}. Commission (${revenue.commissionRate}%): ₹${revenue.commissionAmount} added to platform debt.`);
        }
      } else {
        setError(data.message || 'Failed to mark user payment');
      }
    } catch (err) {
      console.error('Error marking user payment:', err);
      setError('Failed to mark user payment');
    } finally {
      setMarkingPayment(prev => ({ ...prev, [`user-${bookingId}`]: false }));
    }
  };

  const handleFileSelect = (bookingId, event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        event.target.value = '';
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        event.target.value = '';
        return;
      }

      setError('');
      setSelectedFiles(prev => ({ ...prev, [bookingId]: file }));
    }
  };

  const handleReportDelete = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    setDeletingReport(prev => ({ ...prev, [bookingId]: true }));
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/${bookingId}/report`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchBookings(); // Refresh the list
      } else {
        setError(data.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    } finally {
      setDeletingReport(prev => ({ ...prev, [bookingId]: false }));
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateKey = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else if (date.getTime() === tomorrow.getTime()) {
      return `Tomorrow, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else if (date.getTime() === yesterday.getTime()) {
      return `Yesterday, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus);

  // Group bookings by the date they were created (not bookingDate)
  const groupedBookings = filteredBookings.reduce((groups, booking) => {
    const dateKey = formatDateKey(booking.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(booking);
    return groups;
  }, {});

  const getBookingStats = () => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };
  };

  const stats = getBookingStats();

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <LabPartnerNavbar labName={labName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-2">Manage Bookings</h1>
          <p className="text-gray-600">View and manage appointments from fitness enthusiasts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-[#3f8554] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'confirmed'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Confirmed ({stats.confirmed})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filterStatus === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
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
              {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
            </h3>
            <p className="text-gray-400">
              {filterStatus === 'all' 
                ? 'Bookings will appear here once fitness enthusiasts book appointments' 
                : `Try selecting a different filter`}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedBookings).length === 0 ? (
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
                  {filterStatus === 'all' ? 'No bookings yet' : `No ${filterStatus} bookings`}
                </h3>
                <p className="text-gray-400">
                  {filterStatus === 'all' 
                    ? 'Bookings will appear here once fitness enthusiasts book appointments' 
                    : `Try selecting a different filter`}
                </p>
              </div>
            ) : (
              Object.entries(groupedBookings).map(([dateKey, dayBookings]) => {
                const firstBooking = dayBookings[0];
                return (
                  <div key={dateKey} className="space-y-4">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-[#3f8554] to-[#225533] text-white py-3 px-6 rounded-lg shadow-md">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <svg 
                            className="w-6 h-6" 
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
                          {formatDateHeader(firstBooking.createdAt)}
                        </h2>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                          {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                        </span>
                      </div>
                    </div>

                    {/* Bookings for this day */}
                    <div className="space-y-4">
                      {dayBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-[#3f8554]"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#225533]">
                        {booking.fitnessEnthusiastId?.name || 'User'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                          booking.status
                        )}`}
                      >
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📅 {formatDate(booking.bookingDate)} at {booking.timeSlot}</p>
                      <p>📞 {booking.contactPhone}</p>
                      <p>✉️ {booking.contactEmail}</p>
                      {booking.fitnessEnthusiastId?.age && (
                        <p>Age: {booking.fitnessEnthusiastId.age} years</p>
                      )}
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            if (!deliveryTimeInputs[booking._id] && !booking.expectedReportDeliveryTime) {
                              alert('Please set the expected report delivery time before confirming the booking.');
                              setEditingDeliveryTime(prev => ({ ...prev, [booking._id]: true }));
                              return;
                            }
                            updateBookingStatus(booking._id, 'confirmed');
                          }}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(booking._id, 'completed')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Tests */}
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <h4 className="font-semibold text-[#225533] mb-2 text-sm">Tests Booked:</h4>
                  <ul className="space-y-1">
                    {booking.selectedTests.map((test, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>{test.testName}</span>
                        <span className="font-semibold text-[#3f8554]">₹{test.price}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-[#225533]">₹{booking.totalAmount}</span>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Patient Notes:</p>
                    <p className="text-sm text-blue-800 italic">{booking.notes}</p>
                  </div>
                )}

                {/* Expected Report Delivery Time */}
                <div className={`border rounded p-3 mb-3 ${
                  !booking.expectedReportDeliveryTime && booking.status === 'pending' 
                    ? 'bg-yellow-50 border-yellow-300' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <p className={`text-sm font-semibold mb-2 ${
                    !booking.expectedReportDeliveryTime && booking.status === 'pending'
                      ? 'text-yellow-900'
                      : 'text-purple-900'
                  }`}>
                    Expected Report Delivery Time:
                    {!booking.expectedReportDeliveryTime && booking.status === 'pending' && (
                      <span className="ml-2 text-xs text-red-600">(Required before confirming)</span>
                    )}
                  </p>
                  {editingDeliveryTime[booking._id] || !booking.expectedReportDeliveryTime ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={deliveryTimeInputs[booking._id] || booking.expectedReportDeliveryTime || ''}
                        onChange={(e) => handleDeliveryTimeChange(booking._id, e.target.value)}
                        placeholder="e.g., 2 hours, 1 day, 3-5 days"
                        className="flex-1 px-3 py-2 border border-purple-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => updateExpectedDeliveryTime(booking._id)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Save
                      </button>
                      {booking.expectedReportDeliveryTime && (
                        <button
                          onClick={() => {
                            setEditingDeliveryTime(prev => ({ ...prev, [booking._id]: false }));
                            setDeliveryTimeInputs(prev => {
                              const updated = { ...prev };
                              delete updated[booking._id];
                              return updated;
                            });
                          }}
                          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-semibold rounded transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-purple-800 font-medium">
                        {booking.expectedReportDeliveryTime}
                      </p>
                      <button
                        onClick={() => {
                          setEditingDeliveryTime(prev => ({ ...prev, [booking._id]: true }));
                          setDeliveryTimeInputs(prev => ({ ...prev, [booking._id]: booking.expectedReportDeliveryTime }));
                        }}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold rounded transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* PDF Report Upload Section */}
                <div className="border rounded p-4 mb-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-teal-900 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Test Report
                    </h4>
                    {booking.reportUploadedAt && (
                      <span className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">
                        Uploaded {new Date(booking.reportUploadedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {booking.reportUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white border border-teal-200 rounded">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">Test Report (PDF)</p>
                          <p className="text-xs text-gray-600">Click to view or download</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <a
                          href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${booking.reportUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded transition-colors text-center flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Report
                        </a>
                        <button
                          onClick={() => handleReportDelete(booking._id)}
                          disabled={deletingReport[booking._id]}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {deletingReport[booking._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-amber-800">No report uploaded yet</span>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="file"
                          id={`report-upload-${booking._id}`}
                          accept=".pdf"
                          onChange={(e) => handleFileSelect(booking._id, e)}
                          className="flex-1 w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer"
                          disabled={uploadingReport[booking._id]}
                        />
                        
                        {selectedFiles[booking._id] && (
                          <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded">
                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-teal-800 flex-1">
                              <strong>Selected:</strong> {selectedFiles[booking._id].name} ({(selectedFiles[booking._id].size / 1024).toFixed(2)} KB)
                            </span>
                            <button
                              onClick={() => {
                                setSelectedFiles(prev => {
                                  const updated = { ...prev };
                                  delete updated[booking._id];
                                  return updated;
                                });
                                const fileInput = document.getElementById(`report-upload-${booking._id}`);
                                if (fileInput) fileInput.value = '';
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleReportUpload(booking._id, selectedFiles[booking._id])}
                          disabled={!selectedFiles[booking._id] || uploadingReport[booking._id]}
                          className="w-full px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {uploadingReport[booking._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <span>Upload Report</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Upload PDF file only (max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Tracking Section */}
                <div className="border rounded-lg p-4 mb-3 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                  <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Payment Tracking
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Payment Status */}
                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">User Payment</p>
                        {booking.userPaidToLab ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Received
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            Not Received
                          </span>
                        )}
                      </div>
                      
                      {booking.userPaidToLab ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>✓ Amount: ₹{booking.totalAmount}</p>
                          {booking.userPaymentDate && (
                            <p>✓ Date: {new Date(booking.userPaymentDate).toLocaleDateString()}</p>
                          )}
                          {booking.userPaymentMethod && (
                            <p>✓ Method: {booking.userPaymentMethod}</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => markUserPaymentReceived(booking._id)}
                          disabled={markingPayment[`user-${booking._id}`]}
                          className="w-full mt-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {markingPayment[`user-${booking._id}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Mark User Payment Received
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Commission Payment Status */}
                    <div className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700">Platform Commission</p>
                        {booking.paymentReceivedByLab ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Auto-Tracked
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            Pending Payment
                          </span>
                        )}
                      </div>
                      
                      {booking.paymentReceivedByLab ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>✓ Commission: ₹{booking.commissionAmount || Math.round(booking.totalAmount * 0.1)}</p>
                          {booking.paymentReceivedDate && (
                            <p>✓ Tracked: {new Date(booking.paymentReceivedDate).toLocaleDateString()}</p>
                          )}
                          <p className="text-orange-600 font-semibold">
                            Status: {booking.commissionStatus === 'paid' ? 'Paid to Platform' : booking.commissionStatus === 'billed' ? 'Billed' : 'Unbilled'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Commission will be automatically tracked when you mark user payment as received
                          </p>
                          <p className="text-orange-600 font-semibold">
                            Expected: ₹{Math.round(booking.totalAmount * 0.1)} (10%)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking ID and Date */}
                <div className="text-xs text-gray-500 flex justify-between border-t pt-2">
                  <span>Booking ID: {booking._id.slice(-8)}</span>
                  <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
