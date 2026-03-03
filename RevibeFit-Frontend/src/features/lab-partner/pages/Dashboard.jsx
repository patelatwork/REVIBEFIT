import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import TopTestsCard from '../components/dashboard/TopTestsCard';
import RevenueGaugeCard from '../components/dashboard/RevenueGaugeCard';
import TotalBookingsCard from '../components/dashboard/TotalBookingsCard';
import InvoiceOverviewCard from '../components/dashboard/InvoiceOverviewCard';
import UpcomingBookingsTable from '../components/dashboard/UpcomingBookingsTable';
import BookingRequestsSidebar from '../components/dashboard/BookingRequestsSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LabPartnerDashboard = () => {
  const navigate = useNavigate();
  const [labName, setLabName] = useState('Lab Partner');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [tests, setTests] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);

  const getToken = () => localStorage.getItem('accessToken');

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [bookingsRes, testsRes, financialRes] = await Promise.all([
        fetch(`${API_URL}/api/lab-partners/bookings/lab-bookings`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/api/lab-partners/offered-tests`, { headers }).then((r) => r.json()),
        fetch(`${API_URL}/api/lab-partners/financial-summary`, { headers }).then((r) => r.json()),
      ]);

      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (testsRes.success) setTests(testsRes.data || []);
      if (financialRes.success) setFinancialSummary(financialRes.data);
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
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    fetchData();
  }, [navigate, fetchData]);

  // Greeting based on time of day
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <DashboardNavbar labName={labName} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {getGreeting()}, {labName}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Here's what's happening with your lab today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20 focus:border-[#3f8554] transition-all"
              />
            </div>

            {/* Period badge */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Monthly
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-20 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-80" />
              <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-80" />
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <TopTestsCard tests={tests} bookings={bookings} />
              <RevenueGaugeCard financialSummary={financialSummary} />
              <TotalBookingsCard bookings={bookings} />
              <InvoiceOverviewCard financialSummary={financialSummary} />
            </div>

            {/* Bottom: Table + Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <UpcomingBookingsTable bookings={bookings} />
              </div>
              <div>
                <BookingRequestsSidebar bookings={bookings} onStatusUpdate={fetchData} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LabPartnerDashboard;
