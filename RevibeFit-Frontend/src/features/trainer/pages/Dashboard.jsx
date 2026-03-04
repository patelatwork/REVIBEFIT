import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrainerNavbar from '../components/TrainerNavbar';
import EarningsChartCard from '../components/dashboard/EarningsChartCard';
import ClassDistributionCard from '../components/dashboard/ClassDistributionCard';
import BookingsOverviewCard from '../components/dashboard/BookingsOverviewCard';
import RevenueCard from '../components/dashboard/RevenueCard';
import UpcomingClassesTable from '../components/dashboard/UpcomingClassesTable';
import RecentActivitySidebar from '../components/dashboard/RecentActivitySidebar';
import TopClassesCard from '../components/dashboard/TopClassesCard';
import MonthlyRevenueChart from '../components/dashboard/MonthlyRevenueChart';
import QuickActionsGrid from '../components/dashboard/QuickActionsGrid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [trainerName, setTrainerName] = useState('Trainer');
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchDashboardData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const [statsRes, earningsRes, scheduleRes] = await Promise.all([
        fetch(`${API_URL}/api/trainers/dashboard/stats`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/api/trainers/dashboard/earnings`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/api/trainers/dashboard/schedule`, { headers }).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (earningsRes.success) setEarnings(earningsRes.data);
      if (scheduleRes.success) setSchedule(scheduleRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(user);
    setTrainerName(userData.name || 'Trainer');
    fetchDashboardData();
  }, [navigate, fetchDashboardData]);

  // Greeting based on time of day
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TrainerNavbar trainerName={trainerName} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {/* Hero skeleton */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="h-7 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/4" />
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-24 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            {/* Table & sidebar skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 h-80" />
              <div className="bg-white rounded-2xl p-5 border border-gray-100 h-80" />
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Hero/Greeting Section */}
            <motion.div variants={itemVariants}>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#225533] via-[#3f8554] to-emerald-600 rounded-2xl p-6 sm:p-8 text-white">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold text-white border border-white/20">
                      {trainerName?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        {getGreeting()}, {trainerName}! 💪
                      </h1>
                      <p className="text-emerald-100 text-sm mt-1">{today}</p>
                    </div>
                  </div>

                  {/* Quick stats in hero */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats?.totalClients || 0}</p>
                      <p className="text-[11px] text-emerald-200 uppercase tracking-wide">Clients</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats?.upcomingClasses || 0}</p>
                      <p className="text-[11px] text-emerald-200 uppercase tracking-wide">Upcoming</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                      <p className="text-2xl font-bold">₹{(stats?.monthlyEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-[11px] text-emerald-200 uppercase tracking-wide">This Month</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <QuickActionsGrid stats={stats} />
            </motion.div>

            {/* Stat Cards Row — 4 cards */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <ClassDistributionCard schedule={schedule} stats={stats} />
                <RevenueCard earnings={earnings} stats={stats} />
                <BookingsOverviewCard stats={stats} />
                <TopClassesCard earningsByClass={earnings?.earningsByClass || []} />
              </div>
            </motion.div>

            {/* Charts Row — Earnings Trend + Weekly Revenue */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <EarningsChartCard earningsByDate={earnings?.earningsByDate || []} />
                <MonthlyRevenueChart earningsByDate={earnings?.earningsByDate || []} />
              </div>
            </motion.div>

            {/* Bottom: Table + Sidebar */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <UpcomingClassesTable schedule={schedule} />
                </div>
                <div>
                  <RecentActivitySidebar recentTransactions={earnings?.recentTransactions || []} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default TrainerDashboard;
