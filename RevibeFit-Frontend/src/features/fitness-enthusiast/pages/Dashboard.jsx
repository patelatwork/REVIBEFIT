import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  UtensilsCrossed,
  Video,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Clock,
  CalendarDays,
  Trophy,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Activity,
  Heart,
  Star,
  CheckCircle2,
  Timer,
  Flame,
} from 'lucide-react';

/* ───── animation helpers ───── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ───── greeting helper ───── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '🌅', message: 'Rise and grind! Your fitness journey continues today.' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️', message: 'Keep the momentum going — you\'re doing great!' };
  return { text: 'Good Evening', emoji: '🌙', message: 'Wind down right. Recovery is part of the journey.' };
};

const FitnessEnthusiastDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('User');
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [readBlogs, setReadBlogs] = useState([]);
  const [allReadBlogs, setAllReadBlogs] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [classBookings, setClassBookings] = useState([]);

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      const userData = JSON.parse(user);
      setUserName(userData.name || 'User');
      fetchBookings();
      fetchReadBlogs();
      loadCompletedWorkouts();
      fetchClassBookings();
    }
  }, [navigate]);

  useEffect(() => {
    const handleFocus = () => {
      fetchReadBlogs();
      loadCompletedWorkouts();
      fetchClassBookings();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (location.pathname === '/fitness-enthusiast/dashboard') {
      fetchReadBlogs();
      loadCompletedWorkouts();
      fetchClassBookings();
    }
  }, [location.pathname]);

  /* ───── data fetchers (unchanged logic, cleaner) ───── */
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = () => localStorage.getItem('accessToken');

  const loadCompletedWorkouts = async () => {
    try {
      const res = await fetch(`${API}/api/workouts/completed`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setTotalWorkouts(data.data.length);
        setCompletedWorkouts(data.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading completed workouts:', err);
    }
  };

  const fetchReadBlogs = async () => {
    try {
      setBlogsLoading(true);
      const res = await fetch(`${API}/api/blogs/read-blogs`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setAllReadBlogs(data.data);
        setReadBlogs(data.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching read blogs:', err);
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API}/api/lab-partners/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setAllBookings(data.data);
        const active = data.data.filter(
          (b) => b.status === 'pending' || b.status === 'confirmed'
        );
        setBookings(active.slice(0, 2));
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassBookings = async () => {
    try {
      const res = await fetch(`${API}/api/classes/my-bookings`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        const upcoming = data.data.filter(
          (c) => new Date(c.classId?.scheduledAt) > new Date()
        );
        setClassBookings(upcoming.slice(0, 2));
      }
    } catch (err) {
      console.error('Error fetching class bookings:', err);
    }
  };

  /* ───── formatters ───── */
  const fmtBlogDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtWorkoutDT = (d) => {
    const dt = new Date(d);
    return {
      date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  const fmtClassDate = (d) => {
    const dt = new Date(d);
    return {
      date: dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  const difficultyStyle = (d) => {
    const map = {
      beginner: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      intermediate: 'bg-amber-100 text-amber-700 border border-amber-200',
      advanced: 'bg-rose-100 text-rose-700 border border-rose-200',
    };
    return map[d?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const statusStyle = (s) => {
    const map = {
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      confirmed: 'bg-sky-50 text-sky-700 border border-sky-200',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* ───── stat cards data ───── */
  const stats = [
    {
      label: 'Workouts Done',
      value: totalWorkouts,
      icon: Dumbbell,
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Classes Booked',
      value: classBookings.length,
      icon: Video,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Blogs Read',
      value: allReadBlogs.length,
      icon: BookOpen,
      gradient: 'from-sky-500 to-blue-600',
      bg: 'bg-sky-50',
    },
    {
      label: 'Active Lab Tests',
      value: bookings.length,
      icon: FlaskConical,
      gradient: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
    },
  ];

  /* ───── quick action cards ───── */
  const quickActions = [
    {
      label: 'Start Workout',
      desc: 'Browse exercises & routines',
      icon: Flame,
      to: '/workouts',
      color: 'text-orange-600',
      bg: 'bg-orange-50 hover:bg-orange-100',
      border: 'border-orange-200',
    },
    {
      label: 'Nutrition Plan',
      desc: 'Meals, tracking & plans',
      icon: UtensilsCrossed,
      to: '/nutrition',
      color: 'text-green-600',
      bg: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-200',
    },
    {
      label: 'Live Classes',
      desc: 'Upcoming sessions',
      icon: Video,
      to: '/fitness-enthusiast/live-classes',
      color: 'text-violet-600',
      bg: 'bg-violet-50 hover:bg-violet-100',
      border: 'border-violet-200',
    },
    {
      label: 'Lab Tests',
      desc: 'Book & track reports',
      icon: FlaskConical,
      to: '/fitness-enthusiast/care',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 hover:bg-cyan-100',
      border: 'border-cyan-200',
    },
    {
      label: 'Find Trainers',
      desc: 'Expert guidance',
      icon: Star,
      to: '/trainers',
      color: 'text-amber-600',
      bg: 'bg-amber-50 hover:bg-amber-100',
      border: 'border-amber-200',
    },
    {
      label: 'Read Blogs',
      desc: 'Tips & inspiration',
      icon: BookOpen,
      to: '/blog',
      color: 'text-sky-600',
      bg: 'bg-sky-50 hover:bg-sky-100',
      border: 'border-sky-200',
    },
  ];

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ─── HERO / GREETING ─── */}
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#225533] via-[#2d6b42] to-[#3f8554] p-6 sm:p-8 mb-8 text-white shadow-lg"
        >
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* avatar */}
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold tracking-wide border-2 border-white/30 shadow-inner">
                {initials}
              </div>
              <div>
                <p className="text-emerald-200 text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> {today}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-0.5">
                  {greeting.text}, {userName.split(' ')[0]}! {greeting.emoji}
                </h1>
                <p className="text-emerald-100/80 text-sm mt-1 max-w-md">{greeting.message}</p>
              </div>
            </div>
            <Link
              to="/workouts"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/20 shadow-sm"
            >
              <Flame className="w-4 h-4" /> Start a Workout
            </Link>
          </div>
        </motion.div>

        {/* ─── STAT CARDS ─── */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-5 h-5 bg-gradient-to-br ${s.gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ─── QUICK ACTIONS ─── */}
        <motion.div variants={item} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className={`group flex flex-col items-center text-center p-4 rounded-xl border ${a.border} ${a.bg} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
              >
                <a.icon className={`w-6 h-6 ${a.color} mb-2`} />
                <span className="text-sm font-semibold text-gray-800">{a.label}</span>
                <span className="text-[11px] text-gray-500 mt-0.5 leading-tight">{a.desc}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ─── MAIN CONTENT: 2-COL ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LEFT COL — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Workouts */}
            <motion.div
              variants={item}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Dumbbell className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="font-semibold text-gray-800">Recent Workouts</h2>
                </div>
                <button
                  onClick={() => navigate('/fitness-enthusiast/completed-workouts')}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {completedWorkouts.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {completedWorkouts.map((w, i) => {
                    const { date, time } = fmtWorkoutDT(w.completedAt);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{w.workoutTitle}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" /> {date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {w.exercisesCompleted} exercises
                            </span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyStyle(w.difficulty)}`}>
                          {w.difficulty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Dumbbell className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No workouts completed yet</p>
                  <Link
                    to="/workouts"
                    className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    Start Exercising <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Active Lab Tests */}
            {!loading && bookings.length > 0 && (
              <motion.div
                variants={item}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-50 rounded-lg">
                      <FlaskConical className="w-4 h-4 text-cyan-600" />
                    </div>
                    <h2 className="font-semibold text-gray-800">Active Lab Tests</h2>
                  </div>
                  <button
                    onClick={() => navigate('/fitness-enthusiast/care')}
                    className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                  >
                    All Bookings <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <div key={b._id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {b.labPartnerId?.laboratoryName || 'Lab Partner'}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{b.labPartnerId?.laboratoryAddress}</p>
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle(b.status)}`}>
                          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {b.selectedTests.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {t.testName}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />{' '}
                            {new Date(b.bookingDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {b.timeSlot}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-800">₹{b.totalAmount}</span>
                      </div>

                      {b.expectedReportDeliveryTime && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 rounded-lg px-2.5 py-1.5 border border-violet-100">
                          <Timer className="w-3 h-3" />
                          Report expected: {b.expectedReportDeliveryTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Read Blogs */}
            <motion.div
              variants={item}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 rounded-lg">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                  </div>
                  <h2 className="font-semibold text-gray-800">Recently Read</h2>
                </div>
                <button
                  onClick={() => navigate('/fitness-enthusiast/read-blogs')}
                  className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {blogsLoading ? (
                <div className="px-5 py-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-sky-500 rounded-full animate-spin" />
                </div>
              ) : readBlogs.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {readBlogs.map((br) => (
                    <div
                      key={br._id}
                      onClick={() => navigate(`/blog/${br.blogId._id}`)}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate group-hover:text-sky-700 transition-colors">
                          {br.blogId.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Read on {fmtBlogDate(br.readAt)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-sky-500 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No blogs read yet</p>
                  <Link
                    to="/blog"
                    className="mt-2 text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                  >
                    Browse Blogs <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT COL — 1/3 (sidebar) */}
          <div className="space-y-6">
            {/* Upcoming Classes */}
            <motion.div
              variants={item}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-50 rounded-lg">
                    <Video className="w-4 h-4 text-violet-600" />
                  </div>
                  <h2 className="font-semibold text-gray-800">Upcoming Classes</h2>
                </div>
              </div>

              {classBookings.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {classBookings.map((cb) => {
                    const cls = cb.classId;
                    if (!cls) return null;
                    const { date, time } = fmtClassDate(cls.scheduledAt);
                    return (
                      <div key={cb._id} className="px-5 py-4">
                        <h3 className="font-medium text-gray-800 text-sm">{cls.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {cls.trainerName && `by ${cls.trainerName}`}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> {date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center px-5">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <Video className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No upcoming classes</p>
                  <Link
                    to="/classes"
                    className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                  >
                    Browse Classes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Nutrition Quick Card */}
            <motion.div variants={item}>
              <Link
                to="/nutrition"
                className="group block bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white rounded-lg shadow-sm">
                    <UtensilsCrossed className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Nutrition Plan</h3>
                    <p className="text-xs text-gray-500">Track meals & generate plans</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600 font-medium group-hover:gap-2 transition-all">
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>

            {/* Motivation Card */}
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold text-gray-800">Daily Motivation</h3>
              </div>
              <p className="text-sm text-gray-700 italic leading-relaxed">
                "The only bad workout is the one that didn't happen. Show up for yourself today."
              </p>
              <div className="flex items-center gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </motion.div>

            {/* Lab Tests Quick Card (when no active) */}
            {!loading && bookings.length === 0 && (
              <motion.div variants={item}>
                <Link
                  to="/fitness-enthusiast/care"
                  className="group block bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl border border-cyan-100 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <FlaskConical className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Lab Tests</h3>
                      <p className="text-xs text-gray-500">Book tests & view reports</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-cyan-600 font-medium group-hover:gap-2 transition-all">
                    Explore Lab Partners <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FitnessEnthusiastDashboard;