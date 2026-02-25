import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkoutCard from '../components/WorkoutCard';
import WorkoutDetailModal from '../components/WorkoutDetailModal';
import ExerciseTimerModal from '../components/ExerciseTimerModal';

// Import workout images
import meditationImg from '../../../assets/workouts/meditation.png';
import yogaImg from '../../../assets/workouts/yoga.png';
import bodyweightImg from '../../../assets/workouts/bodyweight.png';
import dumbbellsImg from '../../../assets/workouts/dumbbells.png';
import kettlebellImg from '../../../assets/workouts/kettlebell.png';
import stretchingImg from '../../../assets/workouts/stretching.png';
import cardioImg from '../../../assets/workouts/cardio.png';
import eveningRelaxationImg from '../../../assets/workouts/Evening Relaxation.webp';
import deepBreathingImg from '../../../assets/workouts/Deep Breathing.webp';
import morningMeditationImg from '../../../assets/workouts/Morning Meditation.webp';

const Workouts = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutInProgress, setWorkoutInProgress] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Sample workout data - this would typically come from an API
  const workouts = [
    {
      _id: '1',
      title: 'Morning Meditation',
      description: 'Start your day with calm and focus. This gentle meditation practice helps you center yourself and set positive intentions for the day ahead.',
      difficulty: 'Intermediate',
      duration: 12,
      trainer: 'Sarah Lee',
      category: 'Meditation',
      image: morningMeditationImg,
      exercises: [
        {
          name: 'Counting Breaths',
          description: 'Count each inhale and exhale',
          duration: 4,
        },
        {
          name: 'Body Awareness',
          description: 'Notice sensations in body',
          duration: 4,
        },
        {
          name: 'Thought Observation',
          description: 'Observe thoughts without judgment',
          duration: 4,
        },
      ],
    },
    {
      _id: '2',
      title: 'Evening Relaxation',
      description: 'Wind down and prepare for restful sleep with calming breathing techniques and gentle body awareness.',
      difficulty: 'Beginner',
      duration: 12,
      trainer: 'Kristen McGee',
      category: 'Meditation',
      image: eveningRelaxationImg,
      exercises: [
        {
          name: 'Deep Breathing',
          description: 'Slow, deep breaths to relax',
          duration: 4,
        },
        {
          name: 'Progressive Relaxation',
          description: 'Release tension from each body part',
          duration: 4,
        },
        {
          name: 'Loving-kindness Meditation',
          description: 'Send positive wishes to self and others',
          duration: 4,
        },
      ],
    },
    {
      _id: '3',
      title: 'Deep Breathing',
      description: 'Master the art of conscious breathing to reduce stress, increase energy, and improve overall wellbeing.',
      difficulty: 'Intermediate',
      duration: 12,
      trainer: 'Sarah Lee',
      category: 'Meditation',
      image: deepBreathingImg,
      exercises: [
        {
          name: 'Box Breathing',
          description: 'Breathe in for 4, hold for 4, out for 4, hold for 4',
          duration: 4,
        },
        {
          name: 'Alternate Nostril Breathing',
          description: 'Balance energy through alternating nostrils',
          duration: 4,
        },
        {
          name: 'Belly Breathing',
          description: 'Deep diaphragmatic breathing',
          duration: 4,
        },
      ],
    },
    {
      _id: '4',
      title: 'Hip Opening Flow',
      description: 'Release tension in your hips with this flowing sequence designed to increase flexibility and mobility.',
      difficulty: 'Intermediate',
      duration: 15,
      trainer: 'Kristen McGee',
      category: 'Body Parts Focused',
      image: yogaImg,
      exercises: [
        {
          name: 'Low Lunge',
          description: 'Deep hip flexor stretch',
          duration: 3,
        },
        {
          name: 'Pigeon Pose',
          description: 'Hip opener',
          duration: 4,
        },
        {
          name: 'Butterfly Stretch',
          description: 'Inner thigh and hip stretch',
          duration: 3,
        },
        {
          name: 'Figure Four Stretch',
          description: 'Glute and hip stretch',
          duration: 3,
        },
        {
          name: 'Happy Baby Pose',
          description: 'Gentle hip opening',
          duration: 2,
        },
      ],
    },
    {
      _id: '5',
      title: 'Shoulder Stretch',
      description: 'Perfect for desk workers! Release shoulder tension and improve posture with targeted stretches.',
      difficulty: 'Beginner',
      duration: 10,
      trainer: 'Sarah Lee',
      category: 'Body Parts Focused',
      image: stretchingImg,
      exercises: [
        {
          name: 'Shoulder Rolls',
          description: 'Roll shoulders forward and backward',
          duration: 2,
          reps: 10,
        },
        {
          name: 'Cross-body Shoulder Stretch',
          description: 'Pull arm across chest',
          duration: 2,
        },
        {
          name: 'Overhead Shoulder Stretch',
          description: 'Reach arms overhead and side to side',
          duration: 2,
        },
        {
          name: 'Doorway Chest Stretch',
          description: 'Open chest and shoulders',
          duration: 2,
        },
        {
          name: 'Eagle Arms',
          description: 'Wrap arms and lift elbows',
          duration: 2,
        },
      ],
    },
    {
      _id: '6',
      title: 'Back Strengthening',
      description: 'Build a strong, healthy back with exercises designed to improve posture and prevent pain.',
      difficulty: 'Intermediate',
      duration: 18,
      trainer: 'Mike Johnson',
      category: 'Body Parts Focused',
      image: bodyweightImg,
      exercises: [
        {
          name: 'Superman Hold',
          description: 'Lift arms and legs while lying on stomach',
          duration: 3,
          reps: 12,
        },
        {
          name: 'Bird Dog',
          description: 'Opposite arm and leg extension',
          duration: 4,
          reps: 10,
          sets: 2,
        },
        {
          name: 'Cat-Cow Stretch',
          description: 'Spinal mobility exercise',
          duration: 3,
        },
        {
          name: 'Bridge Pose',
          description: 'Strengthen lower back and glutes',
          duration: 4,
          reps: 15,
        },
        {
          name: 'Child\'s Pose',
          description: 'Gentle back stretch',
          duration: 4,
        },
      ],
    },
    {
      _id: '7',
      title: 'Bodyweight Workout',
      description: 'No equipment needed! Full-body strength training using just your bodyweight.',
      difficulty: 'Intermediate',
      duration: 25,
      trainer: 'Richard Harris',
      category: 'No Equipment',
      image: bodyweightImg,
      exercises: [
        {
          name: 'Push-ups',
          description: 'Standard push-ups or modified on knees',
          duration: 4,
          reps: 15,
          sets: 3,
        },
        {
          name: 'Squats',
          description: 'Bodyweight squats',
          duration: 4,
          reps: 20,
          sets: 3,
        },
        {
          name: 'Plank',
          description: 'Hold plank position',
          duration: 3,
        },
        {
          name: 'Lunges',
          description: 'Alternating forward lunges',
          duration: 4,
          reps: 12,
          sets: 2,
        },
        {
          name: 'Mountain Climbers',
          description: 'Quick alternating knee drives',
          duration: 3,
          reps: 30,
        },
        {
          name: 'Burpees',
          description: 'Full body explosive movement',
          duration: 4,
          reps: 10,
        },
        {
          name: 'Cool Down Stretch',
          description: 'Gentle stretching',
          duration: 3,
        },
      ],
    },
    {
      _id: '8',
      title: 'Beginner Bodyweight',
      description: 'Perfect for beginners! Learn fundamental movements and build strength at your own pace.',
      difficulty: 'Beginner',
      duration: 20,
      trainer: 'John Smith',
      category: 'No Equipment',
      image: bodyweightImg,
      exercises: [
        {
          name: 'Wall Push-ups',
          description: 'Push-ups against a wall',
          duration: 3,
          reps: 12,
        },
        {
          name: 'Chair Squats',
          description: 'Squat to a chair',
          duration: 3,
          reps: 15,
        },
        {
          name: 'Knee Plank',
          description: 'Plank on knees',
          duration: 3,
        },
        {
          name: 'Step-ups',
          description: 'Step up onto a low surface',
          duration: 4,
          reps: 10,
        },
        {
          name: 'Standing Crunches',
          description: 'Bring knee to opposite elbow',
          duration: 3,
          reps: 20,
        },
        {
          name: 'Gentle Stretching',
          description: 'Full body stretches',
          duration: 4,
        },
      ],
    },
    {
      _id: '9',
      title: 'Advanced Bodyweight',
      description: 'Challenge yourself with advanced calisthenics and explosive movements.',
      difficulty: 'Advanced',
      duration: 30,
      trainer: 'Mike Johnson',
      category: 'No Equipment',
      image: cardioImg,
      exercises: [
        {
          name: 'Diamond Push-ups',
          description: 'Close-grip push-ups',
          duration: 3,
          reps: 15,
          sets: 3,
        },
        {
          name: 'Pistol Squats',
          description: 'Single-leg squats',
          duration: 4,
          reps: 8,
          sets: 2,
        },
        {
          name: 'Decline Push-ups',
          description: 'Feet elevated push-ups',
          duration: 3,
          reps: 12,
          sets: 3,
        },
        {
          name: 'Jump Squats',
          description: 'Explosive squat jumps',
          duration: 4,
          reps: 15,
          sets: 3,
        },
        {
          name: 'Plank to Pike',
          description: 'From plank, pike hips up',
          duration: 3,
          reps: 12,
        },
        {
          name: 'Burpee Pull-ups',
          description: 'Burpee with jump reach',
          duration: 4,
          reps: 10,
        },
        {
          name: 'L-Sit Hold',
          description: 'Hold L position',
          duration: 3,
        },
        {
          name: 'Cool Down',
          description: 'Deep stretching',
          duration: 6,
        },
      ],
    },
    {
      _id: '10',
      title: 'Dumbbell Routine',
      description: 'Build strength and muscle with a complete dumbbell workout targeting all major muscle groups.',
      difficulty: 'Intermediate',
      duration: 28,
      trainer: 'Adrian Williams',
      category: 'Minimal Equipment',
      image: dumbbellsImg,
      exercises: [
        {
          name: 'Dumbbell Chest Press',
          description: 'Lying chest press',
          duration: 4,
          reps: 12,
          sets: 3,
        },
        {
          name: 'Dumbbell Rows',
          description: 'Bent-over rows',
          duration: 4,
          reps: 12,
          sets: 3,
        },
        {
          name: 'Shoulder Press',
          description: 'Overhead press',
          duration: 4,
          reps: 10,
          sets: 3,
        },
        {
          name: 'Goblet Squats',
          description: 'Squat holding dumbbell',
          duration: 4,
          reps: 15,
          sets: 3,
        },
        {
          name: 'Bicep Curls',
          description: 'Alternating curls',
          duration: 3,
          reps: 12,
          sets: 2,
        },
        {
          name: 'Tricep Extensions',
          description: 'Overhead extensions',
          duration: 3,
          reps: 12,
          sets: 2,
        },
        {
          name: 'Cool Down Stretch',
          description: 'Stretch all muscle groups',
          duration: 6,
        },
      ],
    },
    {
      _id: '11',
      title: 'Resistance Band Workout',
      description: 'Versatile resistance band training for strength and toning anywhere, anytime.',
      difficulty: 'Beginner',
      duration: 22,
      trainer: 'John Smith',
      category: 'Minimal Equipment',
      image: stretchingImg,
      exercises: [
        {
          name: 'Band Chest Press',
          description: 'Press band forward from chest',
          duration: 3,
          reps: 15,
        },
        {
          name: 'Band Rows',
          description: 'Pull band to chest',
          duration: 3,
          reps: 15,
        },
        {
          name: 'Band Squats',
          description: 'Squat with band resistance',
          duration: 4,
          reps: 20,
        },
        {
          name: 'Band Bicep Curls',
          description: 'Curl against band',
          duration: 3,
          reps: 15,
        },
        {
          name: 'Band Tricep Extensions',
          description: 'Extend arms against band',
          duration: 3,
          reps: 15,
        },
        {
          name: 'Band Lateral Raises',
          description: 'Raise arms to sides',
          duration: 3,
          reps: 12,
        },
        {
          name: 'Stretch',
          description: 'Use band for assisted stretching',
          duration: 3,
        },
      ],
    },
    {
      _id: '12',
      title: 'Kettlebell Flow',
      description: 'Dynamic kettlebell movements to build strength, power, and endurance.',
      difficulty: 'Intermediate',
      duration: 26,
      trainer: 'Mike Johnson',
      category: 'Minimal Equipment',
      image: kettlebellImg,
      exercises: [
        {
          name: 'Kettlebell Swings',
          description: 'Hip hinge swing',
          duration: 4,
          reps: 20,
          sets: 3,
        },
        {
          name: 'Goblet Squats',
          description: 'Hold kettlebell at chest',
          duration: 4,
          reps: 15,
          sets: 2,
        },
        {
          name: 'Kettlebell Press',
          description: 'Single arm overhead press',
          duration: 3,
          reps: 10,
          sets: 2,
        },
        {
          name: 'Turkish Get-ups',
          description: 'Complex full-body movement',
          duration: 5,
          reps: 5,
        },
        {
          name: 'Kettlebell Rows',
          description: 'Single arm rows',
          duration: 3,
          reps: 12,
          sets: 2,
        },
        {
          name: 'Farmer Carries',
          description: 'Walk with kettlebells',
          duration: 3,
        },
        {
          name: 'Cool Down',
          description: 'Stretching',
          duration: 4,
        },
      ],
    },
  ];

  const categories = [
    'All',
    'Meditation',
    'Body Parts Focused',
    'No Equipment',
    'Minimal Equipment',
  ];

  const filteredWorkouts = activeCategory === 'All'
    ? workouts
    : workouts.filter(workout => workout.category === activeCategory);

  const handleWorkoutClick = (workout) => {
    setSelectedWorkout(workout);
    setShowDetailModal(true);
  };

  const handleStartWorkout = (workout) => {
    setWorkoutInProgress(workout);
    setShowDetailModal(false);
    setShowTimerModal(true);
  };

  const handleWorkoutComplete = () => {
    // You could add logic here to save workout completion to backend
    console.log('Workout completed:', workoutInProgress.title);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedWorkout(null);
  };

  const handleCloseTimerModal = () => {
    setShowTimerModal(false);
    setWorkoutInProgress(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-green-200 selection:text-green-900">
      {/* Hero Section */}
      <div className="relative bg-[#225533] text-white py-24 px-4 sm:px-6 lg:px-8 mb-12 overflow-hidden shadow-xl">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-linear-to-br from-[#225533] via-[#2a6b40] to-[#3f8554] opacity-95"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#a7f3d0] opacity-10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto text-center z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-sm text-green-50 text-sm font-semibold tracking-wider uppercase mb-6 border border-white/20">
            Elevate Your Fitness
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight drop-shadow-sm">
            Transform Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-green-200">
              Body & Mind
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-green-50 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            Discover a curated collection of workouts tailored to your journey.
            From calming meditation to high-intensity strength training.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => document.getElementById('workouts-grid').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-[#225533] rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Training
            </button>
          </div>
        </div>
      </div>

      <div id="workouts-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 sticky top-4 z-20 py-4 bg-gray-50/80 backdrop-blur-md rounded-2xl">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full font-medium text-sm md:text-base transition-all duration-300 border ${activeCategory === category
                  ? 'bg-[#225533] text-white border-[#225533] shadow-md transform scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#3f8554] hover:text-[#225533] hover:shadow-sm'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Workouts Grid */}
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-12 w-12 text-[#225533]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Workouts Found
            </h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              We couldn't find any workouts in this category. Try selecting a different one to explore more options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout._id}
                workout={workout}
                onClick={handleWorkoutClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailModal && selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          onClose={handleCloseDetailModal}
          onStartWorkout={handleStartWorkout}
        />
      )}

      {showTimerModal && workoutInProgress && (
        <ExerciseTimerModal
          workout={workoutInProgress}
          onClose={handleCloseTimerModal}
          onComplete={handleWorkoutComplete}
        />
      )}
    </div>
  );
};

export default Workouts;
