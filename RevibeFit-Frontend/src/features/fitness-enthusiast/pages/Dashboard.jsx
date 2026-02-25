import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const FitnessEnthusiastDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('User');
  const [bookings, setBookings] = useState([]);
  const [readBlogs, setReadBlogs] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      const userData = JSON.parse(user);
      setUserName(userData.name || 'User');
      fetchBookings();
      fetchReadBlogs();
      loadCompletedWorkouts();
    }
  }, [navigate]);

  // Refresh blogs when the page gains focus (when user comes back from blog detail)
  useEffect(() => {
    const handleFocus = () => {
      fetchReadBlogs();
      loadCompletedWorkouts(); // Also refresh workouts
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Also refresh blogs when returning to dashboard route
  useEffect(() => {
    if (location.pathname === '/fitness-enthusiast/dashboard') {
      fetchReadBlogs();
      loadCompletedWorkouts(); // Also refresh workouts
    }
  }, [location.pathname]);

  const loadCompletedWorkouts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/workouts/completed`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCompletedWorkouts(data.data.slice(0, 1)); // Show only last 1 for dashboard
      }
    } catch (err) {
      console.error('Error loading completed workouts:', err);
    }
  };

  const fetchReadBlogs = async () => {
    try {
      setBlogsLoading(true);
      const token = localStorage.getItem('accessToken');
      console.log('Fetching read blogs...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/blogs/read-blogs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Read blogs response status:', response.status);
      console.log('Read blogs response ok:', response.ok);
      const data = await response.json();
      console.log('Read blogs data:', data);
      if (data.success) {
        setReadBlogs(data.data.slice(0, 3)); // Show only last 3 for dashboard
        console.log('Read blogs set:', data.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching read blogs:', err);
    } finally {
      setBlogsLoading(false);
    }
  };

  const formatBlogDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatWorkoutDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
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
        // Filter only pending and confirmed bookings
        const activeBookings = data.data.filter(
          booking => booking.status === 'pending' || booking.status === 'confirmed'
        );
        setBookings(activeBookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to Your Fitness Dashboard
        </h1>
        <p className="text-gray-600 mb-8">Hello, {userName}!</p>

        {/* Lab Tests Section - Pending & Confirmed */}
        {loading ? (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <p>Loading lab tests...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">My Lab Tests</h2>
              <button
                onClick={() => navigate('/fitness-enthusiast/care')}
                className="text-[#3f8554] hover:text-[#225533] font-medium text-sm"
              >
                View All Bookings →
              </button>
            </div>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {booking.labPartnerId?.laboratoryName || 'Lab Partner'}
                      </h3>
                      <p className="text-sm text-gray-600">{booking.labPartnerId?.laboratoryAddress}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{booking.timeSlot}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Tests:</p>
                    <ul className="space-y-1">
                      {booking.selectedTests.map((test, index) => (
                        <li key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>• {test.testName}</span>
                          <span className="font-medium">₹{test.price}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 pt-2 border-t flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold text-lg">₹{booking.totalAmount}</span>
                    </div>
                  </div>
                  
                  {/* Expected Report Delivery Time */}
                  <div className={`mt-3 rounded-lg p-3 ${
                    booking.expectedReportDeliveryTime 
                      ? 'bg-purple-50 border border-purple-200' 
                      : 'bg-gray-50 border border-gray-200'
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
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Workouts Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Workouts</h2>
            <button
              onClick={() => navigate('/fitness-enthusiast/completed-workouts')}
              className="text-[#3f8554] hover:text-[#225533] font-medium text-sm"
            >
              View All →
            </button>
          </div>
          {completedWorkouts.length > 0 ? (
            <div className="space-y-4">
              {completedWorkouts.map((workout, index) => {
                const { date, time } = formatWorkoutDateTime(workout.completedAt);
                return (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{workout.workoutTitle}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(workout.difficulty)}`}>
                        {workout.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {date} at {time}
                    </p>
                    <p className="text-sm text-gray-500">{workout.exercisesCompleted} exercises</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No completed workouts yet. Start exercising!</p>
          )}
        </div>

        {/* Nutrition Plan */}
        <Link
          to="/nutrition"
          className="bg-white p-6 rounded-lg shadow mb-8 cursor-pointer hover:shadow-lg transition-shadow block"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Nutrition Plan</h2>
          <p className="text-gray-600">View your meal plans</p>
        </Link>

        {/* More sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/fitness-enthusiast/live-classes"
            className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow block"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Live Classes</h2>
            <p className="text-gray-600">View your upcoming classes and history</p>
          </Link>
          <Link
            to="/fitness-enthusiast/care"
            className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow border-2 border-teal-200 block"
          >
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xl font-semibold text-teal-900">My Lab Tests</h2>
            </div>
            <p className="text-teal-800">View all your lab bookings and test reports</p>
          </Link>
        </div>

        {/* My Read Blogs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">My Read Blogs</h2>
            <button
              onClick={() => navigate('/fitness-enthusiast/read-blogs')}
              className="text-[#3f8554] hover:text-[#225533] font-medium text-sm"
            >
              View All →
            </button>
          </div>
          {blogsLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : readBlogs.length > 0 ? (
            <div className="space-y-4">
              {readBlogs.map((blogReading) => (
                <div
                  key={blogReading._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/blog/${blogReading.blogId._id}`)}
                >
                  <h3 className="font-semibold text-lg mb-2">{blogReading.blogId.title}</h3>
                  <p className="text-sm text-green-600">
                    ✓ Completed Read on {formatBlogDate(blogReading.readAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No blogs read yet</p>
              <button
                onClick={() => navigate('/blog')}
                className="text-[#3f8554] hover:text-[#225533] font-medium text-sm"
              >
                Browse Blogs →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FitnessEnthusiastDashboard;