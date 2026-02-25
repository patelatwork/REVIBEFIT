import { useState, useEffect } from 'react';

const Classes = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [userBookings, setUserBookings] = useState([]);

  const categories = [
    'All',
    'Cycling',
    'Strength', 
    'Running',
    'Yoga',
    'Meditation',
    'Rowing',
    'Outdoor',
    'Stretching'
  ];

  // Category images mapping - fitness themed
  const categoryImages = {
    cycling: 'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400&h=300&fit=crop',
    strength: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    running: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=300&fit=crop',
    yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    meditation: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
    rowing: 'https://images.unsplash.com/photo-1521805103424-d8f8430e8933?w=400&h=300&fit=crop',
    outdoor: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=400&h=300&fit=crop',
    stretching: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop'
  };

  useEffect(() => {
    fetchClasses();
    fetchUserBookings();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes?upcoming=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const classesData = data.data.classes || [];
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        let bookingsData = [];
        if (data.data) {
          if (Array.isArray(data.data)) {
            bookingsData = data.data;
          } else if (data.data.all && Array.isArray(data.data.all)) {
            bookingsData = data.data.all;
          }
        }
        setUserBookings(bookingsData);
      } else {
        setUserBookings([]);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      setUserBookings([]);
    }
  };

  const filteredClasses = activeCategory === 'All'
    ? classes
    : classes.filter(classItem => classItem.classType.toLowerCase() === activeCategory.toLowerCase());

  const handleJoinClass = async () => {
    if (!selectedClass) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/${selectedClass._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Successfully joined the class!');
        setShowJoinModal(false);
        setSelectedClass(null);
        
        await Promise.all([
          fetchClasses(),
          fetchUserBookings()
        ]);
      } else {
        console.error('Join failed:', data);
        alert(data.message || `Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error joining class:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const isAlreadyBooked = (classId) => {
    if (!Array.isArray(userBookings)) {
      return false;
    }
    
    return userBookings.some(booking => {
      const bookingClassId = booking.classId?._id || booking.classId;
      return bookingClassId === classId;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#225533] mb-4">
            Live Fitness Classes
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Join live fitness classes from certified trainers and take your fitness journey to the next level
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-[#3f8554] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse border-2 border-gray-200">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No Classes Available
            </h3>
            <p className="text-gray-600">
              {activeCategory === 'All' 
                ? 'Check back later for new classes!' 
                : `No ${activeCategory.toLowerCase()} classes available right now.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClasses.map((classItem) => (
              <div
                key={classItem._id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-[#3f8554] cursor-pointer transform hover:scale-105"
                onClick={() => {
                  setSelectedClass(classItem);
                  setShowJoinModal(true);
                }}
              >
                {/* Class Image */}
                <div className="h-48 bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center relative overflow-hidden">
                  {categoryImages[classItem.classType.toLowerCase()] ? (
                    <img
                      src={categoryImages[classItem.classType.toLowerCase()]}
                      alt={classItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#fffff0] flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#225533]">FIT</span>
                    </div>
                  )}
                  
                  {/* Status and Difficulty Badges */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(classItem.status)}`}>
                      {classItem.status}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(classItem.difficultyLevel)}`}>
                      {classItem.difficultyLevel}
                    </span>
                  </div>

                  {/* Already Booked Indicator */}
                  {isAlreadyBooked(classItem._id) && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
                        Enrolled
                      </span>
                    </div>
                  )}
                </div>

                {/* Class Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#225533] mb-2">
                    {classItem.title}
                  </h3>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="w-4 h-4 mr-2 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDateTime(classItem.scheduledDate, classItem.scheduledTime)}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="w-4 h-4 mr-2 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{classItem.duration} minutes</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="w-4 h-4 mr-2 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>with {classItem.trainerId?.name || 'Trainer'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600 text-sm">
                        <svg className="w-4 h-4 mr-2 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{classItem.currentParticipants} / {classItem.maxParticipants} joined</span>
                      </div>
                      <div className="text-xl font-bold text-[#3f8554]">
                        ₹{classItem.cost}
                      </div>
                    </div>
                  </div>

                  {classItem.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {classItem.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join Class Modal */}
        {showJoinModal && selectedClass && (
          <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"></div>
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#3f8554]/20 transform transition-all duration-300 ease-out scale-100">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#225533] to-[#3f8554] p-6 rounded-t-2xl">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      Join Class
                    </h2>
                    <button
                      onClick={() => {
                        setShowJoinModal(false);
                        setSelectedClass(null);
                      }}
                      className="text-white/80 hover:text-white text-2xl font-bold transition-colors duration-200 bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[#225533] mb-2">
                      {selectedClass.title}
                    </h3>
                    <p className="text-gray-600">{selectedClass.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-500">Date & Time</div>
                      <div className="font-semibold text-[#225533]">
                        {formatDateTime(selectedClass.scheduledDate, selectedClass.scheduledTime)}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="font-semibold text-[#225533]">
                        {selectedClass.duration} minutes
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-500">Spots Left</div>
                      <div className="font-semibold text-[#225533]">
                        {selectedClass.maxParticipants - selectedClass.currentParticipants}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-500">Cost</div>
                      <div className="font-semibold text-[#3f8554] text-xl">
                        ₹{selectedClass.cost}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    {isAlreadyBooked(selectedClass._id) ? (
                      <div className="flex-1 bg-green-100 text-green-800 py-3 rounded-lg font-medium text-center">
                        Already Enrolled
                      </div>
                    ) : (
                      <button
                        onClick={handleJoinClass}
                        className="flex-1 bg-[#3f8554] text-white py-3 rounded-lg hover:bg-[#225533] transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] duration-200"
                      >
                        Join Class - ₹{selectedClass.cost}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowJoinModal(false);
                        setSelectedClass(null);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Classes;

