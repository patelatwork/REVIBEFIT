import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPartnerNavbar from '../components/LabPartnerNavbar';

const LabReports = () => {
  const navigate = useNavigate();
  const [labName, setLabName] = useState('Lab Partner');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingFor, setUploadingFor] = useState(null);

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/lab-partners/bookings/lab-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Filter only confirmed bookings that need reports
        const confirmedBookings = (data.data || []).filter(
          booking => booking.status === 'confirmed' || booking.status === 'completed'
        );
        setBookings(confirmedBookings);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (bookingId, file) => {
    try {
      setUploadingFor(bookingId);
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const formData = new FormData();
      formData.append('report', file);

      const response = await fetch(`${apiUrl}/api/lab-partners/bookings/${bookingId}/upload-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('Report uploaded successfully!');
        fetchBookings(); // Refresh the list
      } else {
        alert(data.message || 'Failed to upload report');
      }
    } catch (err) {
      console.error('Error uploading report:', err);
      alert('Failed to upload report. Please try again.');
    } finally {
      setUploadingFor(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <LabPartnerNavbar labName={labName} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#225533]">Test Reports</h1>
          <p className="text-gray-600 mt-2">Upload test reports for confirmed bookings</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="mt-2 text-gray-500">Confirmed bookings will appear here for report upload.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#225533]">
                        Booking #{booking._id?.slice(-6)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <span className="text-gray-500">Patient:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {booking.fitnessEnthusiastId?.name || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tests:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {booking.selectedTests?.length || 0} test(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Booking Date:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          ₹{booking.totalAmount}
                        </span>
                      </div>
                    </div>

                    {booking.selectedTests && booking.selectedTests.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-1">Selected Tests:</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.selectedTests.map((test, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {test.testName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  {booking.report ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">Report uploaded</span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${booking.report}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3f8554] hover:text-[#225533] text-sm font-medium"
                      >
                        View Report →
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUpload(booking._id, file);
                            }
                          }}
                          className="hidden"
                          disabled={uploadingFor === booking._id}
                        />
                        <span className={`inline-flex items-center px-4 py-2 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] cursor-pointer ${uploadingFor === booking._id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingFor === booking._id ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Upload Report
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabReports;
