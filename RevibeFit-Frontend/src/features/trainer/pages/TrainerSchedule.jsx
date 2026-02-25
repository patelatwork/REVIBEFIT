import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerNavbar from '../components/TrainerNavbar';

const TrainerSchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainerName, setTrainerName] = useState('Trainer');
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    setTrainerName(userData.name || 'Trainer');
    fetchSchedule();
  }, [navigate]);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/trainers/dashboard/schedule`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSchedule(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch schedule');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <TrainerNavbar trainerName={trainerName} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#225533]">My Schedule</h1>
          <p className="text-gray-600 mt-2">View your upcoming training sessions</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : schedule.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No upcoming classes</h3>
            <p className="mt-2 text-gray-500">Schedule your first class to see it here.</p>
            <button
              onClick={() => navigate('/trainer/live-classes')}
              className="mt-4 px-4 py-2 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533]"
            >
              Create Class
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedule.map((classItem) => (
              <div key={classItem._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-[#225533]">{classItem.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                          {classItem.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{classItem.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatDate(classItem.scheduledDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <span className="ml-2 font-medium text-gray-900">{classItem.scheduledTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium text-gray-900">{classItem.duration} mins</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium text-gray-900 capitalize">{classItem.classType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Participants:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {classItem.currentParticipants} / {classItem.maxParticipants}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span className="ml-2 font-medium text-gray-900">₹{classItem.cost}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {classItem.participants && classItem.participants.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setSelectedClass(selectedClass === classItem._id ? null : classItem._id)}
                        className="text-[#3f8554] hover:text-[#225533] font-medium flex items-center gap-2"
                      >
                        <span>View Participants ({classItem.participants.length})</span>
                        <svg
                          className={`h-5 w-5 transform transition-transform ${selectedClass === classItem._id ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {selectedClass === classItem._id && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Registered Participants</h4>
                          <div className="space-y-2">
                            {classItem.participants.map((participant, index) => (
                              <div key={participant._id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-[#3f8554] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                                    <p className="text-xs text-gray-500">{participant.email}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Booked: {new Date(participant.bookedAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

export default TrainerSchedule;
