import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPartnerCard from '../components/LabPartnerCard';
import LabBookingModal from '../components/LabBookingModal';

const Care = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('myBookings'); // 'myBookings' or 'findLabs'
  const [labPartners, setLabPartners] = useState([]);
  const [filteredLabPartners, setFilteredLabPartners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLabPartner, setSelectedLabPartner] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    fetchBookings();
    fetchLabPartners();
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

  const fetchLabPartners = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners`
      );
      const data = await response.json();

      if (data.success) {
        setLabPartners(data.data);
        setFilteredLabPartners(data.data);
      } else {
        setError('Failed to load lab partners');
      }
    } catch (err) {
      console.error('Error fetching lab partners:', err);
      setError('Failed to load lab partners. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLabPartners(labPartners);
    } else {
      const filtered = labPartners.filter(
        (lab) =>
          lab.laboratoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lab.laboratoryAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLabPartners(filtered);
    }
  }, [searchTerm, labPartners]);

  const handleViewDetails = (labPartner) => {
    setSelectedLabPartner(labPartner);
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedLabPartner(null);
  };

  const handleBookingSuccess = (booking) => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
    }, 5000);
    fetchBookings(); // Refresh bookings
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffff0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#3f8554] mx-auto mb-4"></div>
          <p className="text-xl text-[#225533] font-semibold">Loading lab partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-4">Lab Partner Care</h1>
          <p className="text-lg text-gray-600">
            View your lab bookings and test reports, or find new lab partners
          </p>
        </div>

        {/* Success Message */}
        {bookingSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              Booking successful! We'll contact you soon to confirm your appointment.
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('myBookings')}
                className={`${
                  activeTab === 'myBookings'
                    ? 'border-[#3f8554] text-[#3f8554]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-lg transition-colors`}
              >
                My Lab Bookings & Reports
              </button>
              <button
                onClick={() => setActiveTab('findLabs')}
                className={`${
                  activeTab === 'findLabs'
                    ? 'border-[#3f8554] text-[#3f8554]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-lg transition-colors`}
              >
                Find Lab Partners
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'myBookings' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-2xl font-semibold text-gray-500 mb-2">No bookings yet</h3>
                <p className="text-gray-400 mb-6">Book your first lab test to get started</p>
                <button
                  onClick={() => setActiveTab('findLabs')}
                  className="px-6 py-3 bg-[#3f8554] hover:bg-[#225533] text-white font-semibold rounded-lg transition-colors"
                >
                  Find Lab Partners
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-[#3f8554]"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#225533]">
                            {booking.labPartnerId?.laboratoryName || 'Lab Partner'}
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
                          <p>📍 {booking.labPartnerId?.laboratoryAddress}</p>
                          <p>📅 {formatDate(booking.bookingDate)} at {booking.timeSlot}</p>
                          <p>📞 {booking.contactPhone}</p>
                          <p>✉️ {booking.contactEmail}</p>
                        </div>
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
                        <p className="text-sm font-semibold text-blue-900 mb-1">Your Notes:</p>
                        <p className="text-sm text-blue-800 italic">{booking.notes}</p>
                      </div>
                    )}

                    {/* Expected Report Delivery Time */}
                    {booking.status !== 'cancelled' && (
                      <div className={`border rounded p-3 mb-3 ${
                        booking.expectedReportDeliveryTime 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 flex-shrink-0 ${
                            booking.expectedReportDeliveryTime ? 'text-purple-600' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-600">Expected Report Delivery:</p>
                            <p className={`text-sm font-semibold ${
                              booking.expectedReportDeliveryTime ? 'text-purple-800' : 'text-gray-500 italic'
                            }`}>
                              {booking.expectedReportDeliveryTime || 'To be updated by lab partner'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PDF Report Section */}
                    {booking.status !== 'cancelled' && (
                      <div className={`rounded-lg p-4 border ${
                        booking.reportUrl 
                          ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className={`w-5 h-5 ${
                            booking.reportUrl ? 'text-teal-600' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className={`font-semibold ${
                            booking.reportUrl ? 'text-teal-900' : 'text-gray-700'
                          }`}>Test Report</h3>
                          {booking.reportUploadedAt && (
                            <span className="ml-auto text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">
                              Uploaded {new Date(booking.reportUploadedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {booking.reportUrl ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-white border border-teal-200 rounded">
                              <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">Test Report (PDF)</p>
                                <p className="text-xs text-gray-600">Click below to view or download</p>
                              </div>
                            </div>
                            <a
                              href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${booking.reportUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded transition-colors text-center flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View / Download Report
                            </a>
                          </div>
                        ) : (
                          <div className="ml-7">
                            <p className="text-sm text-gray-600 italic flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {booking.status === 'pending' 
                                ? 'Report will be uploaded after the test is completed' 
                                : booking.status === 'confirmed'
                                ? 'Report will be uploaded by the lab partner'
                                : 'Report not available yet'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking ID and Date */}
                    <div className="text-xs text-gray-500 flex justify-between border-t pt-2 mt-3">
                      <span>Booking ID: {booking._id.slice(-8)}</span>
                      <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Find Lab Partners Tab */}
        {activeTab === 'findLabs' && (
          <div>
            {/* Info Section - How It Works */}
            <div className="mb-12 bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#225533] mb-4">
                How Lab Partner Care Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#3f8554] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="font-semibold text-[#225533] mb-2">Browse Lab Partners</h3>
                  <p className="text-gray-600 text-sm">
                    Search and explore approved lab partners in your area
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#3f8554] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="font-semibold text-[#225533] mb-2">Select Tests</h3>
                  <p className="text-gray-600 text-sm">
                    Choose from available tests and pick a convenient time slot
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#3f8554] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="font-semibold text-[#225533] mb-2">Get Tested</h3>
                  <p className="text-gray-600 text-sm">
                    Visit the lab at your scheduled time and get your tests done
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-2xl">
                <input
                  type="text"
                  placeholder="Search by lab name, location, or contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 pr-12 text-lg border-2 border-[#3f8554] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#225533] focus:border-transparent"
                />
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#3f8554]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <p className="mt-2 text-sm text-gray-600">
                  Found {filteredLabPartners.length} lab partner(s)
                </p>
              )}
            </div>

            {/* Lab Partners Grid */}
            {filteredLabPartners.length === 0 ? (
              <div className="text-center py-16">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-2xl font-semibold text-gray-500 mb-2">
                  {searchTerm ? 'No lab partners found' : 'No lab partners available'}
                </h3>
                <p className="text-gray-400">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Check back later for approved lab partners'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabPartners.map((labPartner) => (
                  <LabPartnerCard
                    key={labPartner._id}
                    labPartner={labPartner}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedLabPartner && (
        <LabBookingModal
          labPartner={selectedLabPartner}
          onClose={handleCloseModal}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default Care;
