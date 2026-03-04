import { Link } from 'react-router-dom';
import { Users, Target, Calendar, Trophy, ArrowRight, Clock } from 'lucide-react';

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const categoryIcons = {
  strength: '💪',
  cardio: '🏃',
  flexibility: '🧘',
  nutrition: '🥗',
  mindfulness: '🧠',
  general: '⭐',
};

const ChallengeCard = ({ challenge, onJoin, basePath = '/community', hideJoin = false }) => {
  const now = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const isUpcoming = startDate > now;
  const isActive = startDate <= now && endDate >= now;
  const isEnded = endDate < now;

  const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const progressPercent = challenge.participation?.joined
    ? Math.min(100, Math.round((challenge.participation.progress / challenge.goalTarget) * 100))
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Cover Image or Gradient */}
      <div className="h-36 relative overflow-hidden">
        {challenge.coverImage ? (
          <img
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${challenge.coverImage}`}
            alt={challenge.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.parentElement.classList.add('bg-gradient-to-br', 'from-[#225533]', 'to-[#3f8554]');
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#225533] to-[#3f8554] flex items-center justify-center">
            <span className="text-5xl">{categoryIcons[challenge.category] || '⭐'}</span>
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {isActive && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow">
              🟢 Active
            </span>
          )}
          {isUpcoming && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white shadow">
              🔵 Upcoming
            </span>
          )}
          {isEnded && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white shadow">
              Ended
            </span>
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2">
            {challenge.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Target size={13} className="text-[#3f8554]" />
            {challenge.goalTarget} {challenge.goalUnit}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} className="text-[#3f8554]" />
            {challenge.participantsCount} joined
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} className="text-[#3f8554]" />
            {totalDays} days
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-amber-600">
              <Clock size={13} />
              {daysLeft}d left
            </span>
          )}
        </div>

        {/* Progress Bar (if joined) */}
        {challenge.participation?.joined && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Your Progress</span>
              <span className="font-semibold text-[#225533]">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  challenge.participation.isCompleted
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-[#225533] to-[#3f8554]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {challenge.participation.isCompleted && (
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Trophy size={12} /> Challenge Completed! 🎉
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            to={`${basePath}/challenge/${challenge._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium border border-[#225533] text-[#225533] hover:bg-[#225533] hover:text-white transition-all duration-200"
          >
            View Details <ArrowRight size={14} />
          </Link>
          {!hideJoin && !challenge.participation?.joined && isActive && (
            <button
              onClick={() => onJoin && onJoin(challenge._id)}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold bg-[#225533] text-white hover:bg-[#3f8554] transition-colors"
            >
              Join Challenge
            </button>
          )}
        </div>

        {/* Creator */}
        <p className="text-xs text-gray-400 pt-1 border-t border-gray-50">
          By <span className="font-medium text-gray-500">{challenge.creatorName}</span>
        </p>
      </div>
    </div>
  );
};

export default ChallengeCard;
