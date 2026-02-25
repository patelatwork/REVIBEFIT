import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const LabBookingModal = ({ labPartner, onClose, onBookingSuccess }) => {
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [bookingDate, setBookingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingTests, setFetchingTests] = useState(true);

  // Available time slots
  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
  ];

  // Fetch tests for this lab partner
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/${labPartner._id}/tests`
        );
        const data = await response.json();
        
        if (data.success) {
          setTests(data.data);
        } else {
          setError('Failed to load tests');
        }
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Failed to load tests');
      } finally {
        setFetchingTests(false);
      }
    };

    fetchTests();
  }, [labPartner._id]);

  const handleTestToggle = (testId) => {
    setSelectedTests((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const calculateTotal = () => {
    return tests
      .filter((test) => selectedTests.includes(test._id))
      .reduce((sum, test) => sum + test.price, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      return;
    }

    if (!bookingDate || !timeSlot) {
      setError('Please select a date and time slot');
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Please login to book an appointment');
        setLoading(false);
        return;
      }

      const bookingData = {
        labPartnerId: labPartner._id,
        selectedTests: selectedTests.map((testId) => ({ testId })),
        bookingDate,
        timeSlot,
        notes,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/bookings/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bookingData),
        }
      );

      const data = await response.json();

      if (data.success) {
        onBookingSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-[#225533] text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{labPartner.laboratoryName}</h2>
              <p className="text-sm opacity-90">{labPartner.laboratoryAddress}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Available Tests */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#225533] mb-4">Available Tests</h3>
            
            {fetchingTests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tests...</p>
              </div>
            ) : tests.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No tests available at this lab</p>
            ) : (
              <div className="space-y-3">
                {tests.map((test) => (
                  <div
                    key={test._id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTests.includes(test._id)
                        ? 'border-[#3f8554] bg-green-50'
                        : 'border-gray-200 hover:border-[#3f8554]'
                    }`}
                    onClick={() => handleTestToggle(test._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(test._id)}
                          onChange={() => handleTestToggle(test._id)}
                          className="mt-1 mr-3 h-5 w-5 text-[#3f8554] focus:ring-[#3f8554]"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#225533] mb-1">{test.testName}</h4>
                          <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-[#3f8554] font-semibold">₹{test.price}</span>
                            <span className="text-gray-500">Duration: {test.duration}</span>
                            {test.category && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {test.category}
                              </span>
                            )}
                          </div>
                          {test.preparationInstructions && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              ℹ️ {test.preparationInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Details */}
          {selectedTests.length > 0 && (
            <>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-[#225533] mb-2">Selected Tests Summary</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 mb-2">
                  {tests
                    .filter((test) => selectedTests.includes(test._id))
                    .map((test) => (
                      <li key={test._id}>
                        {test.testName} - ₹{test.price}
                      </li>
                    ))}
                </ul>
                <p className="text-lg font-bold text-[#225533]">
                  Total Amount: ₹{calculateTotal()}
                </p>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-[#225533] font-semibold mb-2">
                  Select Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={getMinDate()}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                />
              </div>

              {/* Time Slot Selection */}
              <div className="mb-6">
                <label className="block text-[#225533] font-semibold mb-2">
                  Select Time Slot <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        timeSlot === slot
                          ? 'border-[#3f8554] bg-green-50 text-[#225533] font-semibold'
                          : 'border-gray-200 hover:border-[#3f8554]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-[#225533] font-semibold mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  placeholder="Any special requirements or health conditions we should know about..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedTests.length === 0}
                  className="flex-1 px-6 py-3 bg-[#3f8554] hover:bg-[#225533] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

LabBookingModal.propTypes = {
  labPartner: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    laboratoryName: PropTypes.string.isRequired,
    laboratoryAddress: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onBookingSuccess: PropTypes.func.isRequired,
};

export default LabBookingModal;
