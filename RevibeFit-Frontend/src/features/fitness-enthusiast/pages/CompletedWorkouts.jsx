import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CompletedWorkouts = () => {
  const navigate = useNavigate();
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      const userData = JSON.parse(user);
      if (userData.userType !== 'fitness-enthusiast') {
        navigate('/login');
      } else {
        loadCompletedWorkouts();
      }
    }
  }, [navigate]);

  const loadCompletedWorkouts = async () => {
    try {
      setLoading(true);
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
        setCompletedWorkouts(data.data);
      }
    } catch (err) {
      console.error('Error loading completed workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-2">My Completed Workouts</h1>
          <p className="text-gray-600">Track your fitness journey and celebrate your achievements</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading your workout history...</span>
          </div>
        ) : completedWorkouts.length > 0 ? (
          <div className="space-y-6">
            {completedWorkouts.map((workout, index) => {
              const { date, time } = formatDateTime(workout.completedAt);
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full shrink-0">
                            <svg 
                              className="w-7 h-7 text-green-600" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                              />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-[#225533] mb-2">
                              {workout.workoutTitle}
                            </h2>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(workout.difficulty)}`}>
                                {workout.difficulty}
                              </span>
                              {workout.category && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                  {workout.category}
                                </span>
                              )}
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border-2 border-[#3f8554] rounded-full">
                          <svg className="w-5 h-5 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Date</p>
                          <p className="font-semibold text-gray-700">{date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border-2 border-[#3f8554] rounded-full">
                          <svg className="w-5 h-5 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Time</p>
                          <p className="font-semibold text-gray-700">{time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border-2 border-[#3f8554] rounded-full">
                          <svg className="w-5 h-5 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Exercises</p>
                          <p className="font-semibold text-gray-700">{workout.exercisesCompleted} completed</p>
                        </div>
                      </div>
                    </div>

                    {workout.duration && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-[#3f8554]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Duration: {workout.duration} minutes</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No workouts completed yet</h3>
            <p className="text-gray-500 mb-6">Start your fitness journey and complete your first workout!</p>
            <button
              onClick={() => navigate('/workouts')}
              className="px-6 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors duration-200 font-semibold"
            >
              Browse Workouts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedWorkouts;
