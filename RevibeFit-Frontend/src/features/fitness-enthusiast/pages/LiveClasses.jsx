import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LiveClasses = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Bookings response:', data);
      
      if (data.success && data.data) {
        // Backend returns { upcoming: [], completed: [], all: [] }
        // Filter client-side to move ended classes to history
        const now = new Date();
        
        const upcoming = (data.data.upcoming || []).filter(booking => {
          if (!booking.classId?.scheduledDate || !booking.classId?.scheduledTime) return true;
          const [hours, minutes] = booking.classId.scheduledTime.split(':');
          const classDateTime = new Date(booking.classId.scheduledDate);
          classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const classEndTime = new Date(classDateTime.getTime() + (booking.classId.duration * 60000));
          return classEndTime > now; // Only show if class hasn't ended
        });
        
        const completed = (data.data.completed || []).concat(
          (data.data.upcoming || []).filter(booking => {
            if (!booking.classId?.scheduledDate || !booking.classId?.scheduledTime) return false;
            const [hours, minutes] = booking.classId.scheduledTime.split(':');
            const classDateTime = new Date(booking.classId.scheduledDate);
            classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            const classEndTime = new Date(classDateTime.getTime() + (booking.classId.duration * 60000));
            return classEndTime <= now; // Move to history if class has ended
          })
        );
        
        setUpcomingClasses(upcoming);
        setCompletedClasses(completed);
      } else {
        setUpcomingClasses([]);
        setCompletedClasses([]);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      setUpcomingClasses([]);
      setCompletedClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (scheduledDate, scheduledTime) => {
    if (!scheduledDate || !scheduledTime) return 'Invalid Date';
    
    const [hours, minutes] = scheduledTime.split(':');
    const date = new Date(scheduledDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClassDateTime = (scheduledDate, scheduledTime) => {
    if (!scheduledDate || !scheduledTime) return null;
    const [hours, minutes] = scheduledTime.split(':');
    const date = new Date(scheduledDate);
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const canJoinClass = (booking) => {
    const classDateTime = getClassDateTime(booking.classId.scheduledDate, booking.classId.scheduledTime);
    if (!classDateTime) return { canJoin: false, message: 'Invalid class time' };
    
    const now = new Date();
    const classEndTime = new Date(classDateTime.getTime() + (booking.classId.duration * 60000));
    
    if (now < classDateTime) {
      return { canJoin: false, message: 'Class has not started yet' };
    } else if (now > classEndTime) {
      return { canJoin: false, message: 'Class has ended' };
    } else {
      return { canJoin: true, message: 'Join Now' };
    }
  };

  const handleJoinClass = (booking) => {
    const status = canJoinClass(booking);
    if (status.canJoin) {
      // Navigate to WebRTC video room
      navigate(`/class-room/${booking.classId._id}`);
    } else {
      // If class is scheduled but not yet live, still allow navigating to waiting room
      const classDateTime = getClassDateTime(booking.classId.scheduledDate, booking.classId.scheduledTime);
      const now = new Date();
      if (classDateTime && now < classDateTime) {
        navigate(`/class-room/${booking.classId._id}`);
      } else {
        alert(status.message);
      }
    }
  };

  const getStatusBadge = (booking) => {
    if (booking.bookingStatus === 'completed') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Completed</span>;
    }
    
    const classDateTime = getClassDateTime(booking.classId.scheduledDate, booking.classId.scheduledTime);
    if (!classDateTime) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Error</span>;
    }
    
    const now = new Date();
    const classEndTime = new Date(classDateTime.getTime() + (booking.classId.duration * 60000));
    
    if (now < classDateTime) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Upcoming</span>;
    } else if (now >= classDateTime && now < classEndTime) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Live Now</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">Past</span>;
    }
  };

  const ClassCard = ({ booking, isUpcoming }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#3f8554] hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#225533] mb-1">{booking.classId.title}</h3>
          <p className="text-gray-600 text-sm">{booking.classId.description}</p>
        </div>
        {getStatusBadge(booking)}
      </div>
      
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Date & Time</div>
          <div className="font-semibold text-[#225533] text-sm">
            {formatDateTime(booking.classId.scheduledDate, booking.classId.scheduledTime)}
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Duration</div>
          <div className="font-semibold text-[#225533]">
            {booking.classId.duration} min
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Trainer</div>
          <div className="font-semibold text-[#225533] text-sm">
            {booking.trainerId?.name || booking.classId?.trainerId?.name || 'N/A'}
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Cost</div>
          <div className="font-semibold text-[#3f8554] text-lg">
            ₹{booking.classId.cost}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Booked on: {new Date(booking.createdAt).toLocaleDateString()}
        </div>
        
        {isUpcoming && (
          <div className="text-sm">
            <span className="text-gray-500">Class Type: </span>
            <span className="bg-[#3f8554]/10 text-[#3f8554] px-2 py-1 rounded-full text-xs font-medium">
              {booking.classId.category || booking.classId.classType || 'General'}
            </span>
          </div>
        )}
      </div>
      
      {isUpcoming && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => handleJoinClass(booking)}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-[#3f8554] text-white hover:bg-[#225533] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {canJoinClass(booking).canJoin && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            )}
            {canJoinClass(booking).canJoin ? 'Join Live Stream' : 'Enter Waiting Room'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffff0] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto mb-4"></div>
              <p className="text-[#225533] font-medium">Loading your classes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffff0] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-4">My Live Classes</h1>
          <p className="text-lg text-gray-600">Track your upcoming classes and view your fitness history</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 border">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'upcoming'
                  ? 'bg-[#3f8554] text-white shadow-md'
                  : 'text-[#225533] hover:bg-gray-50'
              }`}
            >
              Upcoming Classes ({upcomingClasses.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'history'
                  ? 'bg-[#3f8554] text-white shadow-md'
                  : 'text-[#225533] hover:bg-gray-50'
              }`}
            >
              History ({completedClasses.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'upcoming' ? (
            <>
              {upcomingClasses.length > 0 ? (
                <>
                  <h2 className="text-2xl font-bold text-[#225533] mb-4">Upcoming Classes</h2>
                  <div className="grid gap-6">
                    {upcomingClasses.map((booking) => (
                      <ClassCard key={booking._id} booking={booking} isUpcoming={true} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-[#225533] mb-2">No Upcoming Classes</h3>
                  <p className="text-gray-600 mb-6">You haven't booked any upcoming classes yet.</p>
                  <a
                    href="/classes"
                    className="inline-block bg-[#3f8554] text-white px-6 py-3 rounded-lg hover:bg-[#225533] transition-colors duration-200 font-medium"
                  >
                    Browse Available Classes
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              {completedClasses.length > 0 ? (
                <>
                  <h2 className="text-2xl font-bold text-[#225533] mb-4">Class History</h2>
                  <div className="grid gap-6">
                    {completedClasses.map((booking) => (
                      <ClassCard key={booking._id} booking={booking} isUpcoming={false} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-[#225533] mb-2">No Class History</h3>
                  <p className="text-gray-600 mb-6">You haven't completed any classes yet.</p>
                  <a
                    href="/classes"
                    className="inline-block bg-[#3f8554] text-white px-6 py-3 rounded-lg hover:bg-[#225533] transition-colors duration-200 font-medium"
                  >
                    Join Your First Class
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Call to Action */}
        {(upcomingClasses.length > 0 || completedClasses.length > 0) && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 border">
              <h3 className="text-xl font-bold text-[#225533] mb-3">Ready for More Classes?</h3>
              <p className="text-gray-600 mb-6">Explore our wide range of fitness classes and continue your fitness journey!</p>
              <a
                href="/classes"
                className="inline-block bg-[#3f8554] text-white px-8 py-3 rounded-lg hover:bg-[#225533] transition-colors duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Explore More Classes
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClasses;