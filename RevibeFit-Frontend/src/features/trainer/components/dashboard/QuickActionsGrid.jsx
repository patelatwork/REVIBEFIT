import { useNavigate } from 'react-router-dom';

/**
 * Quick action cards grid for fast navigation.
 * Matches fitness enthusiast Dashboard pattern.
 */
const QuickActionsGrid = ({ stats }) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Create Live Class',
      description: 'Schedule a new class session',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      path: '/trainer/live-classes',
      color: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Write a Blog',
      description: 'Share your expertise',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      path: '/trainer/upload-blog',
      color: 'from-purple-500 to-violet-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badge: stats?.totalBlogs ? `${stats.totalBlogs} published` : null,
    },
    {
      title: 'View Schedule',
      description: 'Check upcoming sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      path: '/trainer/schedule',
      color: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      badge: stats?.upcomingClasses ? `${stats.upcomingClasses} upcoming` : null,
    },
    {
      title: 'My Clients',
      description: 'Manage your client base',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      path: '/trainer/clients',
      color: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badge: stats?.totalClients ? `${stats.totalClients} clients` : null,
    },
    {
      title: 'Earnings',
      description: 'Track your revenue',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      path: '/trainer/earnings',
      color: 'from-amber-500 to-yellow-600',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'My Profile',
      description: 'Update your details',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      path: '/trainer/profile',
      color: 'from-slate-500 to-gray-600',
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {actions.map((action) => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          className="group relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left"
        >
          <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center ${action.iconColor} mb-3 group-hover:scale-110 transition-transform`}>
            {action.icon}
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">{action.title}</p>
          <p className="text-[11px] text-gray-400 leading-tight">{action.description}</p>

          {action.badge && (
            <span className="absolute top-3 right-3 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#e8f5ec] text-[#3f8554]">
              {action.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default QuickActionsGrid;
