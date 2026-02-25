import { useState, useEffect } from 'react';

const LiveClasses = () => {
  const [allClasses, setAllClasses] = useState([]);
  const [myBookings, setMyBookings] = useState({ upcoming: [], completed: [] });
  const [activeTab, setActiveTab] = useState('available'); // available, upcoming, completed
  const [filters, setFilters] = useState({
    classType: 'all',
    difficultyLevel: 'all',
    search: ''
  });
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(false);

  const classTypes = [
    'all', 'cycling', 'strength', 'running', 'yoga', 'meditation', 
    'rowing', 'outdoor', 'stretching', 'other'
  ];

  useEffect(() => {
    fetchAllClasses();
    fetchMyBookings();
    
    // Set up interval to refresh data every minute
    const interval = setInterval(() => {
      fetchAllClasses();
      fetchMyBookings();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes?upcoming=true`);
      const data = await response.json();
      if (data.success) {
        setAllClasses(data.data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleJoinClass = async (classId) => {
    if (!confirm('Are you sure you want to join this class?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/${classId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Successfully joined the class!');
        setShowClassModal(false);
        fetchAllClasses();
        fetchMyBookings();
      } else {
        alert(data.message || 'Error joining class');
      }
    } catch (error) {
      console.error('Error joining class:', error);
      alert('Error joining class');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking? Refund amount depends on cancellation time.')) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchMyBookings();
        fetchAllClasses();
      } else {
        alert(data.message || 'Error cancelling booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    const classDate = new Date(date);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return `${classDate.toLocaleDateString('en-US', options)} at ${time}`;
  };

  const getTimeStatus = (scheduledDate, scheduledTime, duration) => {
    const now = new Date();
    const classDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const endTime = new Date(classDateTime.getTime() + (duration * 60000));

    if (now < classDateTime) {
      const hoursUntil = Math.ceil((classDateTime - now) / (1000 * 60 * 60));
      return {
        status: 'upcoming',
        message: hoursUntil > 24 ? `Starts in ${Math.ceil(hoursUntil / 24)} days` : `Starts in ${hoursUntil} hours`,
        canJoin: false,
        color: 'text-blue-600'
      };
    } else if (now >= classDateTime && now < endTime) {
      return {
        status: 'ongoing',
        message: 'Class is live now!',
        canJoin: true,
        color: 'text-green-600'
      };
    } else {
      return {
        status: 'completed',
        message: 'Class completed',
        canJoin: false,
        color: 'text-gray-600'
      };
    }
  };

  const isAlreadyBooked = (classId) => {
    return myBookings.upcoming.some(booking => booking.classDetails._id === classId) ||
           myBookings.completed.some(booking => booking.classDetails._id === classId);
  };

  const filteredClasses = allClasses.filter(classItem => {
    const matchesType = filters.classType === 'all' || classItem.classType === filters.classType;
    const matchesDifficulty = filters.difficultyLevel === 'all' || classItem.difficultyLevel === filters.difficultyLevel;
    const matchesSearch = !filters.search || 
      classItem.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      classItem.trainerId.name.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesType && matchesDifficulty && matchesSearch;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const openClassModal = (classItem) => {
    setSelectedClass(classItem);
    setShowClassModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes</h1>
          <p className="text-gray-600">Join live fitness classes from certified trainers</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'available', label: 'Available Classes' },
                { key: 'upcoming', label: `My Upcoming (${myBookings.upcoming.length})` },
                { key: 'completed', label: `History (${myBookings.completed.length})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters - Only show for available classes */}
        {activeTab === 'available' && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search classes or trainers..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                <select
                  value={filters.classType}
                  onChange={(e) => handleFilterChange('classType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficultyLevel}
                  onChange={(e) => handleFilterChange('difficultyLevel', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ classType: 'all', difficultyLevel: 'all', search: '' })}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {activeTab === 'available' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Classes ({filteredClasses.length})
                </h2>
              </div>
              
              {filteredClasses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No classes available matching your criteria.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredClasses.map((classItem) => {
                    const timeStatus = getTimeStatus(classItem.scheduledDate, classItem.scheduledTime, classItem.duration);
                    const alreadyBooked = isAlreadyBooked(classItem._id);
                    
                    return (
                      <div key={classItem._id} className="p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {classItem.classType === 'other' ? classItem.otherClassType : classItem.classType}
                              </span>
                              <span className={`text-sm font-medium ${timeStatus.color}`}>
                                {timeStatus.message}
                              </span>
                              {alreadyBooked && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Booked
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Trainer:</span><br />
                                {classItem.trainerId.name}
                              </div>
                              <div>
                                <span className="font-medium">Date & Time:</span><br />
                                {formatDateTime(classItem.scheduledDate, classItem.scheduledTime)}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span><br />
                                {classItem.duration} minutes
                              </div>
                              <div>
                                <span className="font-medium">Cost:</span><br />
                                ₹{classItem.cost}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Participants:</span><br />
                                {classItem.currentParticipants} / {classItem.maxParticipants}
                              </div>
                              <div>
                                <span className="font-medium">Difficulty:</span><br />
                                {classItem.difficultyLevel}
                              </div>
                              <div>
                                <span className="font-medium">Specialization:</span><br />
                                {classItem.trainerId.specialization}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            <button
                              onClick={() => openClassModal(classItem)}
                              className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            >
                              View Details
                            </button>
                            {!alreadyBooked && classItem.currentParticipants < classItem.maxParticipants && timeStatus.status === 'upcoming' && (
                              <button
                                onClick={() => handleJoinClass(classItem._id)}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                Join Class
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Upcoming Classes</h2>
              </div>
              
              {myBookings.upcoming.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No upcoming classes. Browse available classes to join one!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {myBookings.upcoming.map((booking) => {
                    const classItem = booking.classDetails;
                    const timeStatus = getTimeStatus(classItem.scheduledDate, classItem.scheduledTime, classItem.duration);
                    
                    return (
                      <div key={booking._id} className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {classItem.classType === 'other' ? classItem.otherClassType : classItem.classType}
                              </span>
                              <span className={`text-sm font-medium ${timeStatus.color}`}>
                                {timeStatus.message}
                              </span>
                              {timeStatus.status === 'ongoing' && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white animate-pulse">
                                  LIVE NOW
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Trainer:</span><br />
                                {booking.trainerDetails.name}
                              </div>
                              <div>
                                <span className="font-medium">Date & Time:</span><br />
                                {formatDateTime(classItem.scheduledDate, classItem.scheduledTime)}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span><br />
                                {classItem.duration} minutes
                              </div>
                              <div>
                                <span className="font-medium">Paid:</span><br />
                                ₹{booking.amountPaid}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            {timeStatus.status === 'ongoing' ? (
                              <button
                                onClick={() => alert('Joining live class... (This would connect to the live session)')}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                Join Live Session
                              </button>
                            ) : timeStatus.status === 'upcoming' ? (
                              <>
                                <button
                                  onClick={() => openClassModal(classItem)}
                                  className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  disabled={loading}
                                  className="px-4 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">Class completed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Class History</h2>
              </div>
              
              {myBookings.completed.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No completed classes yet. Join some classes to build your history!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {myBookings.completed.map((booking) => {
                    const classItem = booking.classDetails;
                    
                    return (
                      <div key={booking._id} className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Completed
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {classItem.classType === 'other' ? classItem.otherClassType : classItem.classType}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Trainer:</span><br />
                                {booking.trainerDetails.name}
                              </div>
                              <div>
                                <span className="font-medium">Completed:</span><br />
                                {formatDateTime(classItem.scheduledDate, classItem.scheduledTime)}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span><br />
                                {classItem.duration} minutes
                              </div>
                              <div>
                                <span className="font-medium">Cost:</span><br />
                                ₹{booking.amountPaid}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            <button
                              onClick={() => openClassModal(classItem)}
                              className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Class Details Modal */}
        {showClassModal && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedClass.title}</h2>
                  <button
                    onClick={() => setShowClassModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Class Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Type:</strong> {selectedClass.classType === 'other' ? selectedClass.otherClassType : selectedClass.classType}</p>
                        <p><strong>Date & Time:</strong> {formatDateTime(selectedClass.scheduledDate, selectedClass.scheduledTime)}</p>
                        <p><strong>Duration:</strong> {selectedClass.duration} minutes</p>
                        <p><strong>Cost:</strong> ₹{selectedClass.cost}</p>
                        <p><strong>Difficulty:</strong> {selectedClass.difficultyLevel}</p>
                        <p><strong>Participants:</strong> {selectedClass.currentParticipants} / {selectedClass.maxParticipants}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Trainer Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {selectedClass.trainerId.name}</p>
                        <p><strong>Email:</strong> {selectedClass.trainerId.email}</p>
                        <p><strong>Specialization:</strong> {selectedClass.trainerId.specialization}</p>
                      </div>
                    </div>
                  </div>

                  {selectedClass.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600 text-sm">{selectedClass.description}</p>
                    </div>
                  )}

                  {selectedClass.requirements && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                      <p className="text-gray-600 text-sm">{selectedClass.requirements}</p>
                    </div>
                  )}

                  {selectedClass.equipment && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Equipment Needed</h3>
                      <p className="text-gray-600 text-sm">{selectedClass.equipment}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    {!isAlreadyBooked(selectedClass._id) && 
                     selectedClass.currentParticipants < selectedClass.maxParticipants && 
                     activeTab === 'available' && (
                      <button
                        onClick={() => handleJoinClass(selectedClass._id)}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Joining...' : `Join Class - ₹${selectedClass.cost}`}
                      </button>
                    )}
                    
                    {isAlreadyBooked(selectedClass._id) && (
                      <div className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg text-center">
                        You have already booked this class
                      </div>
                    )}
                    
                    {selectedClass.currentParticipants >= selectedClass.maxParticipants && (
                      <div className="w-full bg-red-100 text-red-600 py-3 rounded-lg text-center">
                        Class is full
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClasses;