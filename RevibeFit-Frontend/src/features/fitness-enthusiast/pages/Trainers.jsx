import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerCard from '../components/TrainerCard';

const Trainers = () => {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/trainers`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch trainers');
      }

      const data = await response.json();
      
      if (data.success) {
        setTrainers(data.data);
      } else {
        setError('Failed to load trainers');
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Unable to load trainers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#225533] mb-4">
            Meet Our Trainers
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Our certified and experienced trainers are here to guide you on your fitness journey.
            Each trainer is carefully vetted and approved to ensure you receive the best guidance.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#3f8554]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center max-w-2xl mx-auto">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchTrainers}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && trainers.length === 0 && (
          <div className="text-center py-20">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Trainers Available</h3>
            <p className="text-gray-600">Check back soon! We're onboarding new trainers.</p>
          </div>
        )}

        {/* Trainers Grid */}
        {!loading && !error && trainers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainers.map((trainer) => (
              <TrainerCard key={trainer._id} trainer={trainer} />
            ))}
          </div>
        )}

        {/* Stats Section */}
        {!loading && !error && trainers.length > 0 && (
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-4xl font-bold text-[#3f8554] mb-2">{trainers.length}</h3>
                <p className="text-gray-700 font-medium">Certified Trainers</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-[#3f8554] mb-2">100%</h3>
                <p className="text-gray-700 font-medium">Verified & Approved</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold text-[#3f8554] mb-2">
                  {new Set(trainers.map(t => t.specialization)).size}
                </h3>
                <p className="text-gray-700 font-medium">Specializations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trainers;
