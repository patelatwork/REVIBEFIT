import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import ManageUsers from '../components/ManageUsers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  AreaChart, Area,
} from 'recharts';
import {
  Users, TrendingUp, Activity, Dumbbell, CalendarCheck,
  FlaskConical, FileText, BookOpen, Utensils, AlertTriangle, Clock,
  ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw, Zap,
  Trophy, Target, Heart, UserCheck,
} from 'lucide-react';

const COLORS = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const CHART_GREEN = '#4ade80';
const CHART_BLUE = '#3b82f6';
const CHART_AMBER = '#f59e0b';
const CHART_RED = '#ef4444';
const CHART_PURPLE = '#8b5cf6';

const BarChart3 = Activity;
const ShieldCheck = UserCheck;

// ── Stat Card Component ─────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'green', onClick }) => {
  const colorMap = {
    green: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-100' },
    red: { bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', border: 'border-purple-100' },
    teal: { bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', border: 'border-teal-100' },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <div
      onClick={onClick}
      className={`${c.bg} border ${c.border} rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${c.iconBg} p-2.5 rounded-xl`}>
          <Icon size={20} className={c.iconColor} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trendValue || trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

// ── Chart Card Wrapper ──────────────────────────────────
const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    <div className="px-6 py-4 border-b border-gray-50">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ── Custom Tooltip ──────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="text-xs font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500">{entry.name || entry.dataKey}</span>
          </div>
          <span className="font-semibold text-gray-800">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Leaderboard Row ─────────────────────────────────────
const LeaderboardRow = ({ rank, name, subtitle, value, valueLabel, color = '#4ade80' }) => (
  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: rank <= 3 ? ['#fef3c7', '#e5e7eb', '#fde68a'][rank - 1] : '#f3f4f6', color: rank <= 3 ? ['#b45309', '#4b5563', '#92400e'][rank - 1] : '#6b7280' }}>
      {rank}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
      {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
    </div>
    <div className="text-right">
      <p className="text-sm font-bold" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {valueLabel && <p className="text-[10px] text-gray-400">{valueLabel}</p>}
    </div>
  </div>
);

// ── Mini Progress Ring ──────────────────────────────────
const ProgressRing = ({ value, size = 80, strokeWidth = 8, color = '#4ade80' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-bold text-gray-800">{value}%</span>
    </div>
  );
};

// ── Main Dashboard ──────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    return section || 'overview';
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Pick up ?section= param when navigating from other pages
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['overview', 'analytics', 'users'].includes(section)) {
      setActiveSection(section);
      // Clean up the URL param
      searchParams.delete('section');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const admin = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (!admin || !token) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/admin/dashboard-analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setData(result.data);
        setError('');
        setLastUpdated(new Date());
      } else if (response.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        navigate('/login');
      } else {
        setError(result.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Could not reach server');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const formatLabel = (str) =>
    str?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';

  // ── Overview Section ────────────────────────────────
  const renderOverview = () => {
    if (!data) return null;
    const { overview, userBreakdown, workouts, liveClasses, labs, invoices, blogs, nutrition,
      registrationTrend, topTrainers, mostActiveUsers, recentRegistrations, platformHealth } = data;

    return (
      <div className="space-y-6">
        {/* Alert Banners */}
        {overview.pendingApprovals > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {overview.pendingApprovals} registration{overview.pendingApprovals !== 1 ? 's' : ''} pending approval
                </p>
                <p className="text-xs text-amber-600">Review and approve trainer/lab partner registrations</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/pending-approvals')}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-sm">
              Review <ChevronRight size={14} />
            </button>
          </div>
        )}

        {invoices.overdue > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <FileText size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">{invoices.overdue} overdue invoice{invoices.overdue !== 1 ? 's' : ''}</p>
                <p className="text-xs text-red-600">Action required for payment enforcement</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin/invoices')}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5 shadow-sm">
              View <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={overview.totalUsers} subtitle={`+${overview.newUsersThisWeek} this week`}
            icon={Users} trend={overview.userGrowthRate} trendValue={overview.userGrowthRate} color="green" />
          <StatCard title="Active Users" value={overview.activeUsers} subtitle={`${overview.retentionRate}% retention`}
            icon={UserCheck} color="blue" />
          <StatCard title="Total Revenue" value={formatCurrency(platformHealth.totalRevenue)}
            subtitle={`Commission: ${formatCurrency(platformHealth.platformCommission || 0)}`} icon={TrendingUp} color="purple" />
          <StatCard title="Pending Approvals" value={overview.pendingApprovals}
            subtitle="Require review" icon={Clock} color={overview.pendingApprovals > 0 ? 'amber' : 'green'}
            onClick={() => navigate('/admin/pending-approvals')} />
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Workouts Completed" value={workouts.totalCompleted}
            subtitle={`${workouts.thisMonth} this month`} icon={Dumbbell} color="teal" />
          <StatCard title="Live Classes" value={liveClasses.total}
            subtitle={`${liveClasses.scheduled} upcoming`} icon={CalendarCheck} color="blue" />
          <StatCard title="Lab Bookings" value={labs.totalBookings}
            subtitle={`${labs.bookingsThisMonth} this month`} icon={FlaskConical} color="purple" />
          <StatCard title="Blog Articles" value={blogs.totalPublished}
            subtitle={`${blogs.totalReads} total reads`} icon={BookOpen} color="amber" />
        </div>

        {/* Platform Health + User Distribution + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Health */}
          <ChartCard title="Platform Health" subtitle="Key performance indicators">
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <ProgressRing value={parseFloat(overview.retentionRate) || 0} color={CHART_GREEN} />
                <p className="text-xs text-gray-500 mt-2 font-medium">Retention</p>
              </div>
              <div className="text-center">
                <ProgressRing value={parseFloat(platformHealth.engagementRate) || 0} color={CHART_BLUE} />
                <p className="text-xs text-gray-500 mt-2 font-medium">Engagement</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{overview.suspendedUsers}</p>
                <p className="text-[10px] text-gray-500 font-medium">Suspended</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{overview.newUsersThisMonth}</p>
                <p className="text-[10px] text-gray-500 font-medium">New (30d)</p>
              </div>
            </div>
          </ChartCard>

          {/* User Distribution Donut */}
          <ChartCard title="User Distribution" subtitle="By user type">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { name: 'Fitness Enthusiasts', value: userBreakdown.fitnessEnthusiasts },
                  { name: 'Trainers', value: userBreakdown.trainers },
                  { name: 'Lab Partners', value: userBreakdown.labPartners },
                ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {[CHART_GREEN, CHART_BLUE, CHART_PURPLE].map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-5 -mt-2">
              {[
                { label: 'Enthusiasts', value: userBreakdown.fitnessEnthusiasts, color: CHART_GREEN },
                { label: 'Trainers', value: userBreakdown.trainers, color: CHART_BLUE },
                { label: 'Lab Partners', value: userBreakdown.labPartners, color: CHART_PURPLE },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Quick Actions */}
          <ChartCard title="Quick Actions" subtitle="Common admin tasks">
            <div className="space-y-2">
              {[
                { label: 'Manage Approvals', desc: 'Review pending registrations', icon: ShieldCheck, path: '/admin/pending-approvals', color: 'text-amber-600 bg-amber-50' },
                { label: 'Invoice Management', desc: 'Track payments & generate invoices', icon: FileText, path: '/admin/invoices', color: 'text-blue-600 bg-blue-50' },
                { label: 'Lab Earnings', desc: 'Commission analytics', icon: FlaskConical, path: '/admin/analytics/lab-earnings', color: 'text-purple-600 bg-purple-50' },
                { label: 'Manage Users', desc: 'View & manage all users', icon: Users, action: () => setActiveSection('users'), color: 'text-emerald-600 bg-emerald-50' },
                { label: 'View Analytics', desc: 'Detailed reports & charts', icon: BarChart3, action: () => setActiveSection('analytics'), color: 'text-teal-600 bg-teal-50' },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <button key={i}
                    onClick={() => item.path ? navigate(item.path) : item.action?.()}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <ItemIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</p>
                      <p className="text-[10px] text-gray-400">{item.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                );
              })}
            </div>
          </ChartCard>
        </div>

        {/* Registration Trend */}
        <ChartCard title="User Registration Trend" subtitle="Monthly new user registrations (last 12 months)">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={registrationTrend}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_GREEN} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_GREEN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradFE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_BLUE} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="total" stroke={CHART_GREEN} fill="url(#gradTotal)" strokeWidth={2.5} name="Total" />
              <Area type="monotone" dataKey="fitnessEnthusiasts" stroke={CHART_BLUE} fill="url(#gradFE)" strokeWidth={1.5} name="Enthusiasts" />
              <Line type="monotone" dataKey="trainers" stroke={CHART_AMBER} strokeWidth={1.5} dot={false} name="Trainers" />
              <Line type="monotone" dataKey="labPartners" stroke={CHART_PURPLE} strokeWidth={1.5} dot={false} name="Lab Partners" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue + Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Class Revenue Trend" subtitle="Monthly class booking revenue">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={liveClasses.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill={CHART_GREEN} radius={[6, 6, 0, 0]} name="Revenue (₹)" />
                <Bar dataKey="bookings" fill={CHART_BLUE} radius={[6, 6, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Class Types" subtitle="Distribution of live class categories">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={liveClasses.byType} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => percent > 0.03 ? `${formatLabel(name)} ${(percent * 100).toFixed(0)}%` : ''}>
                  {liveClasses.byType?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Workout Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Daily Workout Activity" subtitle="Last 30 days" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={workouts.dailyTrend}>
                <defs>
                  <linearGradient id="gradWorkout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(d) => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="workouts" stroke="#14b8a6" fill="url(#gradWorkout)" strokeWidth={2} name="Workouts" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Workout Difficulty" subtitle="Breakdown by level">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={workouts.byDifficulty} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                  {workouts.byDifficulty?.map((_, i) => (
                    <Cell key={i} fill={[CHART_GREEN, CHART_AMBER, CHART_RED][i] || COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Activity Heatmap + Blog + Nutrition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Weekly Activity Pattern" subtitle="Workouts by day of week">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={workouts.activityHeatmap}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="workouts" fill={CHART_BLUE} radius={[6, 6, 0, 0]} name="Workouts">
                  {workouts.activityHeatmap?.map((entry, i) => (
                    <Cell key={i} fill={entry.workouts > (workouts.avgPerDay || 5) ? CHART_GREEN : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Blog Categories" subtitle="Content distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={blogs.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={CHART_PURPLE} radius={[0, 6, 6, 0]} name="Articles" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Fitness Goals" subtitle="User nutrition goal preferences">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={nutrition.goalDistribution} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {nutrition.goalDistribution?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} formatter={(value, name) => [value, formatLabel(name)]} />
                <Legend wrapperStyle={{ fontSize: '10px' }} formatter={(value) => formatLabel(value)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Lab & Invoice Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Lab Revenue" value={formatCurrency(labs.totalRevenue)} icon={FlaskConical} color="purple" />
          <StatCard title="Commission Earned" value={formatCurrency(labs.commissionEarned)} icon={TrendingUp} color="green" />
          <StatCard title="Pending Commission" value={formatCurrency(labs.pendingCommission)} icon={Clock} color="amber" />
          <StatCard title="Invoices Paid" value={invoices.paid} subtitle={`of ${invoices.total} total`} icon={FileText} color="blue" />
          <StatCard title="Overdue Invoices" value={invoices.overdue} icon={AlertTriangle}
            color={invoices.overdue > 0 ? 'red' : 'green'} onClick={() => navigate('/admin/invoices')} />
        </div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Top Trainers" subtitle="By class bookings">
            {topTrainers?.length > 0 ? (
              <div className="space-y-1">
                {topTrainers.map((t, i) => (
                  <LeaderboardRow key={i} rank={i + 1} name={t.name}
                    subtitle={t.specialization} value={t.totalBookings} valueLabel="bookings" color={CHART_BLUE} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No trainer data yet</p>
            )}
          </ChartCard>

          <ChartCard title="Most Active Users" subtitle="By workouts completed">
            {mostActiveUsers?.length > 0 ? (
              <div className="space-y-1">
                {mostActiveUsers.map((u, i) => (
                  <LeaderboardRow key={i} rank={i + 1} name={u.name}
                    subtitle={u.email} value={u.workoutsCompleted} valueLabel="workouts" color={CHART_GREEN} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No workout data yet</p>
            )}
          </ChartCard>

          <ChartCard title="Top Blog Articles" subtitle="Most read content">
            {blogs.topBlogs?.length > 0 ? (
              <div className="space-y-1">
                {blogs.topBlogs.map((b, i) => (
                  <LeaderboardRow key={i} rank={i + 1} name={b.title}
                    subtitle={`${b.category} • ${b.author}`} value={b.reads} valueLabel="reads" color={CHART_PURPLE} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No blog data yet</p>
            )}
          </ChartCard>
        </div>

        {/* Lab Booking Status + Diet Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Lab Booking Status" subtitle="Current booking pipeline">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={labs.bookingsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={formatLabel} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Bookings">
                  {labs.bookingsByStatus?.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.name === 'completed' ? CHART_GREEN :
                        entry.name === 'confirmed' ? CHART_BLUE :
                          entry.name === 'pending' ? CHART_AMBER : CHART_RED
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Dietary Preferences" subtitle="User nutrition preferences distribution">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={nutrition.dietDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => percent > 0.05 ? formatLabel(name) : ''}>
                  {nutrition.dietDistribution?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} formatter={(value, name) => [value, formatLabel(name)]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Recent Registrations Table */}
        <ChartCard title="Recent Registrations" subtitle="Latest user sign-ups">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2.5 px-3">User</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2.5 px-3">Type</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2.5 px-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-2.5 px-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations?.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold rounded-lg
                        ${user.userType === 'fitness-enthusiast' ? 'bg-blue-50 text-blue-700' :
                          user.userType === 'trainer' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-purple-50 text-purple-700'}`}>
                        {formatLabel(user.userType)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-red-400' : user.isApproved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="text-xs text-gray-600">
                          {user.isSuspended ? 'Suspended' : user.isApproved ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Nutrition Profiles" value={nutrition.totalProfiles} icon={Heart} color="red" />
          <StatCard title="Meal Logs" value={nutrition.totalMealLogs} subtitle={`${nutrition.mealLogsThisMonth} this month`} icon={Utensils} color="amber" />
          <StatCard title="Class Revenue" value={formatCurrency(liveClasses.totalRevenue)} icon={Zap} color="blue" />
          <StatCard title="Avg Workouts/Day" value={workouts.avgPerDay} icon={Target} color="teal" />
        </div>
      </div>
    );
  };

  // ── Analytics Section ───────────────────────────────
  const renderAnalytics = () => {
    if (!data) return null;
    const { userBreakdown, workouts, liveClasses, labs, invoices, blogs, nutrition,
      registrationTrend, platformHealth } = data;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xl font-bold text-gray-800">Detailed Analytics</h2>
          <p className="text-sm text-gray-400 mt-1">Deep dive into all platform metrics and trends</p>
        </div>

        {/* User growth over time */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="User Growth (Stacked Area)" subtitle="Cumulative registrations by type">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={registrationTrend}>
                <defs>
                  <linearGradient id="gradFE2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_GREEN} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_GREEN} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradT2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_BLUE} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_BLUE} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradLP2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PURPLE} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_PURPLE} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="fitnessEnthusiasts" stackId="1" stroke={CHART_GREEN} fill="url(#gradFE2)" name="Enthusiasts" />
                <Area type="monotone" dataKey="trainers" stackId="1" stroke={CHART_BLUE} fill="url(#gradT2)" name="Trainers" />
                <Area type="monotone" dataKey="labPartners" stackId="1" stroke={CHART_PURPLE} fill="url(#gradLP2)" name="Lab Partners" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue Comparison */}
          <ChartCard title="Revenue Streams" subtitle="Booking revenue & platform commission">
            <div className="space-y-5 py-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">Live Class Revenue</span>
                  <span className="text-sm font-bold text-gray-800">{formatCurrency(liveClasses.totalRevenue)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${platformHealth.totalRevenue > 0 ? Math.min((liveClasses.totalRevenue / platformHealth.totalRevenue) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">Lab Test Revenue</span>
                  <span className="text-sm font-bold text-gray-800">{formatCurrency(labs.totalRevenue)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${platformHealth.totalRevenue > 0 ? Math.min((labs.totalRevenue / platformHealth.totalRevenue) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">Trainer Commission Earned</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(platformHealth.trainerCommission || 0)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${liveClasses.totalRevenue > 0 ? Math.min(((platformHealth.trainerCommission || 0) / liveClasses.totalRevenue) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">Lab Commission Earned</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(platformHealth.labCommission || labs.commissionEarned || 0)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${labs.totalRevenue > 0 ? Math.min(((platformHealth.labCommission || labs.commissionEarned || 0) / labs.totalRevenue) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 mt-2 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">Total Booking Revenue</span>
                  <span className="text-lg font-bold text-gray-800">{formatCurrency(platformHealth.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-700">Platform Commission Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(platformHealth.platformCommission || 0)}</span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Workout categories + Class difficulty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Workout Categories" subtitle="Most popular workout types">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workouts.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={120}
                  tickFormatter={formatLabel} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Completed">
                  {workouts.byCategory?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Class Difficulty Distribution" subtitle="Beginner vs Intermediate vs Advanced">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={liveClasses.byDifficulty} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${formatLabel(name)} ${(percent * 100).toFixed(0)}%`}>
                  {liveClasses.byDifficulty?.map((_, i) => (
                    <Cell key={i} fill={[CHART_GREEN, CHART_AMBER, CHART_RED][i] || COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} formatter={(value, name) => [value, formatLabel(name)]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Invoice Pipeline */}
        <ChartCard title="Invoice Pipeline" subtitle="Current invoice status breakdown">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2">
            {[
              { label: 'Payment Due', value: invoices.pending, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Paid', value: invoices.paid, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Overdue', value: invoices.overdue, color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Collected', value: formatCurrency(invoices.totalRevenue), color: 'bg-blue-50 text-blue-700 border-blue-200' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded-xl p-4 text-center`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-medium mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Content Engagement" subtitle="Blog reading activity">
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <span className="text-sm text-purple-700 font-medium">Total Articles</span>
                <span className="text-lg font-bold text-purple-800">{blogs.totalPublished}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm text-blue-700 font-medium">Total Reads</span>
                <span className="text-lg font-bold text-blue-800">{blogs.totalReads?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-sm text-emerald-700 font-medium">Published This Month</span>
                <span className="text-lg font-bold text-emerald-800">{blogs.publishedThisMonth}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-sm text-amber-700 font-medium">Avg Reads/Article</span>
                <span className="text-lg font-bold text-amber-800">
                  {blogs.totalPublished > 0 ? Math.round(blogs.totalReads / blogs.totalPublished) : 0}
                </span>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Nutrition Insights" subtitle="Meal tracking engagement">
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <span className="text-sm text-red-700 font-medium">Nutrition Profiles</span>
                <span className="text-lg font-bold text-red-800">{nutrition.totalProfiles}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-sm text-amber-700 font-medium">Total Meal Logs</span>
                <span className="text-lg font-bold text-amber-800">{nutrition.totalMealLogs?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl">
                <span className="text-sm text-teal-700 font-medium">Logs This Month</span>
                <span className="text-lg font-bold text-teal-800">{nutrition.mealLogsThisMonth}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm text-blue-700 font-medium">Profile Adoption</span>
                <span className="text-lg font-bold text-blue-800">
                  {userBreakdown.fitnessEnthusiasts > 0
                    ? `${Math.round((nutrition.totalProfiles / userBreakdown.fitnessEnthusiasts) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Class Performance" subtitle="Live class metrics">
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm text-blue-700 font-medium">Scheduled</span>
                <span className="text-lg font-bold text-blue-800">{liveClasses.scheduled}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-sm text-emerald-700 font-medium">Completed</span>
                <span className="text-lg font-bold text-emerald-800">{liveClasses.completed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-sm text-amber-700 font-medium">Ongoing Now</span>
                <span className="text-lg font-bold text-amber-800">{liveClasses.ongoing}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <span className="text-sm text-purple-700 font-medium">Avg Revenue/Class</span>
                <span className="text-lg font-bold text-purple-800">
                  {liveClasses.total > 0 ? formatCurrency(Math.round(liveClasses.totalRevenue / liveClasses.total)) : '₹0'}
                </span>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  // ── Render Content ──────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 text-sm font-medium">Loading dashboard data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
            <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button onClick={fetchDashboard}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'analytics': return renderAnalytics();
      case 'users': return <ManageUsers />;
      case 'overview':
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 mt-16 lg:mt-0">
          <div className="flex items-center justify-between max-w-[1600px] mx-auto">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {activeSection === 'overview' ? 'Dashboard Overview' :
                  activeSection === 'analytics' ? 'Analytics & Reports' :
                    activeSection === 'users' ? 'User Management' : 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchDashboard}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 font-medium transition-colors border border-gray-200">
                <RefreshCw size={14} />
                Refresh
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-700">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
