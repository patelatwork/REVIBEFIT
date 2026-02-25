import PropTypes from 'prop-types';

const WorkoutCard = ({ workout, onClick }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'advanced':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      onClick={() => onClick(workout)}
      className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-gray-100 flex flex-col h-full hover:-translate-y-2"
    >
      {/* Workout Image */}
      <div className="h-64 relative overflow-hidden">
        {workout.image ? (
          <>
            <img
              src={workout.image}
              alt={workout.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#225533] to-[#3f8554] flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${getDifficultyColor(workout.difficulty)}`}>
            {workout.difficulty}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10 text-white transform transition-transform duration-300 group-hover:-translate-y-2">
          {workout.category && (
            <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/10 mb-3">
              {workout.category}
            </span>
          )}
          <h3 className="text-2xl font-bold leading-tight mb-2 group-hover:text-green-200 transition-colors">
            {workout.title}
          </h3>
          <div className="flex items-center text-gray-300 text-xs font-medium tracking-wide">
            <span className="flex items-center">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {workout.trainer}
            </span>
            <span className="mx-3 text-gray-500">•</span>
            <span className="flex items-center">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {workout.duration} min
            </span>
          </div>
        </div>
      </div>

      {/* Workout Info */}
      <div className="p-6 flex flex-col flex-grow bg-white relative">
        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-6 flex-grow">
          {workout.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#225533] transition-colors">
            Start Workout
          </span>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#225533] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
            <svg
              className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

WorkoutCard.propTypes = {
  workout: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    difficulty: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    trainer: PropTypes.string.isRequired,
    category: PropTypes.string,
    image: PropTypes.string,
    exercises: PropTypes.array,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default WorkoutCard;
