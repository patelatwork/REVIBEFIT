import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const ExerciseTimerModal = ({ workout, onClose, onComplete }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioContextRef = useRef(null);

  const currentExercise = workout.exercises[currentExerciseIndex];

  // Play completion sound - celebratory ascending chime
  const playBuzzer = () => {
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Create ascending celebratory notes (C-E-G chord)
      const notes = [
        { time: 0, frequency: 523.25 },    // C5
        { time: 0.15, frequency: 659.25 }, // E5
        { time: 0.3, frequency: 783.99 }   // G5
      ];
      
      notes.forEach(({ time, frequency }) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Use sine wave for pleasant tone
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Smooth envelope for pleasant sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.2);
        
        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + 0.2);
      });
    } catch (error) {
      console.error('Error playing completion sound:', error);
    }
  };

  // Initialize timer when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setTimeRemaining(currentExercise.duration * 60); // Convert minutes to seconds
      setIsPaused(true);
    }
  }, [currentExerciseIndex, currentExercise]);

  // Timer countdown
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto advance to next exercise when timer reaches 0
          if (currentExerciseIndex < workout.exercises.length - 1) {
            setTimeout(() => {
              setCurrentExerciseIndex((idx) => idx + 1);
            }, 1000);
          } else {
            // Workout completed
            playBuzzer();
            setIsCompleted(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeRemaining, currentExerciseIndex, workout.exercises.length]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleNext = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      // Last exercise - mark as completed
      playBuzzer();
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      playBuzzer();
      setIsCompleted(true);
    }
  };

  const handleFinish = async () => {
    // Save workout completion to backend only if user is logged in
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      const completedWorkout = {
        workoutId: workout.id || workout.title,
        workoutTitle: workout.title,
        duration: workout.duration,
        difficulty: workout.difficulty,
        category: workout.category,
        exercisesCompleted: workout.exercises.length
      };

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/workouts/complete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(completedWorkout),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save workout completion');
        }
      } catch (error) {
        console.error('Error saving workout completion:', error);
        // Continue even if save fails
      }
    }
    
    onComplete();
    onClose();
  };

  // Overall progress including current exercise progress
  const completedExercisesProgress = (currentExerciseIndex / workout.exercises.length) * 100;
  const currentExerciseProgress = currentExercise 
    ? ((1 - (timeRemaining / (currentExercise.duration * 60))) / workout.exercises.length) * 100 
    : 0;
  const progressPercentage = isCompleted ? 100 : Math.min(100, completedExercisesProgress + currentExerciseProgress);
  
  const timerPercentage = currentExercise 
    ? (1 - (timeRemaining / (currentExercise.duration * 60))) * 100 
    : 0;

  if (!currentExercise && !isCompleted) {
    return null;
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        {isCompleted ? (
          // Completion Screen
          <div className="p-6 text-center">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 text-green-500 mx-auto" 
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
            <h2 className="text-2xl font-bold text-[#225533] mb-3">
              Workout Completed!
            </h2>
            <p className="text-gray-700 text-base mb-6">
              Great job! You've completed the {workout.title} workout.
            </p>
            <button
              onClick={handleFinish}
              className="bg-[#3f8554] text-white px-6 py-2.5 rounded-lg font-bold text-base hover:bg-[#225533] transition-colors duration-200"
            >
              Finish
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-linear-to-r from-[#225533] to-[#3f8554] p-4 text-white">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold">{workout.title}</h2>
                <button
                  onClick={onClose}
                  className="bg-white text-gray-700 rounded-full p-1.5 hover:bg-gray-100 transition-colors duration-200 shadow-lg"
                >
                  <svg 
                    className="w-5 h-5" 
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
              </div>

              {/* Progress Bar */}
              <div className="mb-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>Exercise {currentExerciseIndex + 1} of {workout.exercises.length}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Exercise Content */}
            <div className="p-5">
              {/* Exercise Name */}
              <h3 className="text-2xl font-bold text-[#225533] mb-3 text-center">
                {currentExercise.name}
              </h3>

              {/* Description */}
              {currentExercise.description && (
                <p className="text-gray-700 text-center mb-4 text-sm">
                  {currentExercise.description}
                </p>
              )}

              {/* Timer Circle */}
              <div className="flex justify-center mb-4">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="66"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="66"
                      stroke="#3f8554"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 66}`}
                      strokeDashoffset={`${2 * Math.PI * 66 * (1 - timerPercentage / 100)}`}
                      className="transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#225533]">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        {currentExercise.duration} min
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercise Details */}
              <div className="flex justify-center gap-6 mb-5">
                {currentExercise.reps && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#3f8554]">
                      {currentExercise.reps}
                    </div>
                    <div className="text-gray-600 text-xs">Reps</div>
                  </div>
                )}
                {currentExercise.sets && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#3f8554]">
                      {currentExercise.sets}
                    </div>
                    <div className="text-gray-600 text-xs">Sets</div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-3 mb-4">
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={currentExerciseIndex === 0}
                  className="bg-gray-200 text-gray-700 p-3 rounded-full hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>

                {/* Play/Pause Button */}
                {isPaused ? (
                  <button
                    onClick={handleStart}
                    className="bg-[#3f8554] text-white p-4 rounded-full hover:bg-[#225533] transition-colors duration-200 shadow-lg"
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="bg-[#3f8554] text-white p-4 rounded-full hover:bg-[#225533] transition-colors duration-200 shadow-lg"
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                )}

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="bg-gray-200 text-gray-700 p-3 rounded-full hover:bg-gray-300 transition-colors duration-200"
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" 
                      clipRule="evenodd" 
                    />
                    <path 
                      fillRule="evenodd" 
                      d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
              </div>

              {/* Skip Button */}
              <div className="text-center">
                <button
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-[#3f8554] font-semibold transition-colors duration-200"
                >
                  Skip Exercise →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

ExerciseTimerModal.propTypes = {
  workout: PropTypes.shape({
    title: PropTypes.string.isRequired,
    exercises: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        duration: PropTypes.number.isRequired,
        reps: PropTypes.number,
        sets: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default ExerciseTimerModal;
