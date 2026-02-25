import { useState } from 'prop-types';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const WorkoutDetailModal = ({ workout, onClose, onStartWorkout }) => {
  const navigate = useNavigate();
  
  if (!workout) return null;

  const handleStartClick = () => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      // Redirect to login if not logged in
      navigate('/login');
      return;
    }
    
    // If logged in, start the workout
    onStartWorkout(workout);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTotalDuration = () => {
    if (!workout.exercises || workout.exercises.length === 0) return workout.duration;
    return workout.exercises.reduce((total, exercise) => {
      return total + (exercise.duration || 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[75vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header with Image */}
        <div className="relative h-40 bg-linear-to-br from-[#225533] to-[#3f8554] shrink-0">
          {workout.image ? (
            <img
              src={workout.image}
              alt={workout.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg 
                className="w-24 h-24 text-white opacity-50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white rounded-full p-1.5 hover:bg-gray-100 transition-colors duration-200 shadow-lg z-10"
          >
            <svg 
              className="w-5 h-5 text-gray-700" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>

          {/* Difficulty Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getDifficultyColor(workout.difficulty)}`}>
              {workout.difficulty}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Title and Info */}
          <h2 className="text-xl font-bold text-[#225533] mb-2">
            {workout.title}
          </h2>

          <div className="flex flex-wrap gap-3 mb-3 text-sm">
            <div className="flex items-center text-gray-700">
              <svg 
                className="w-4 h-4 mr-1.5 text-[#3f8554]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <span className="font-semibold">Trainer: </span>
              <span className="ml-1">{workout.trainer}</span>
            </div>

            <div className="flex items-center text-gray-700">
              <svg 
                className="w-4 h-4 mr-1.5 text-[#3f8554]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="font-semibold">Duration: </span>
              <span className="ml-1">{getTotalDuration()} min</span>
            </div>

            {workout.category && (
              <div className="flex items-center text-gray-700">
                <svg 
                  className="w-4 h-4 mr-1.5 text-[#3f8554]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
                  />
                </svg>
                <span className="font-semibold">Category: </span>
                <span className="ml-1">{workout.category}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[#225533] mb-1">About This Workout</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {workout.description || 'Focus on breath and present moment awareness.'}
            </p>
          </div>

          {/* Exercises List */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="mb-4">
              <h3 className="text-base font-semibold text-[#225533] mb-3">Exercises</h3>
              <div className="space-y-2">
                {workout.exercises.map((exercise, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 border-l-4 border-[#3f8554] p-3 rounded-r-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="bg-[#3f8554] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-[#225533] text-sm">
                            {exercise.name}
                          </h4>
                        </div>
                        {exercise.description && (
                          <p className="text-gray-600 text-xs mt-1 ml-8">
                            {exercise.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-3 text-right">
                        <div className="text-[#3f8554] font-bold text-sm">
                          {exercise.duration} min
                        </div>
                        {exercise.reps && (
                          <div className="text-gray-600 text-xs">
                            {exercise.reps} reps
                          </div>
                        )}
                        {exercise.sets && (
                          <div className="text-gray-600 text-xs">
                            {exercise.sets} sets
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Start Button - Fixed at bottom */}
        <div className="border-t border-gray-200 p-4 bg-white shrink-0">
          <button
            onClick={handleStartClick}
            className="w-full bg-[#3f8554] text-white py-3 rounded-lg font-bold text-base hover:bg-[#225533] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center justify-center">
              <svg 
                className="w-5 h-5 mr-2" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                  clipRule="evenodd" 
                />
              </svg>
              Start Workout
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

WorkoutDetailModal.propTypes = {
  workout: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    difficulty: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    trainer: PropTypes.string.isRequired,
    category: PropTypes.string,
    image: PropTypes.string,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        duration: PropTypes.number,
        reps: PropTypes.number,
        sets: PropTypes.number,
      })
    ),
  }),
  onClose: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
};

export default WorkoutDetailModal;
