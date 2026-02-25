import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerNavbar from '../components/TrainerNavbar';

const TrainerEarnings = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainerName, setTrainerName] = useState('Trainer');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    setTrainerName(userData.name || 'Trainer');
    fetchEarnings();
  }, [navigate]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/trainers/dashboard/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEarnings(data.data);
      } else {
        setError(data.message || 'Failed to fetch earnings');
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to load earnings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <TrainerNavbar trainerName={trainerName} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#225533]">Earnings</h1>
          <p className="text-gray-600 mt-2">Track your earnings and revenue</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
            <p className="mt-4 text-gray-600">Loading earnings...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Earnings</p>
                    <p className="text-3xl font-bold mt-2">₹{earnings?.totalEarnings?.toFixed(2) || 0}</p>
                  </div>
                  <svg className="h-12 w-12 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Monthly Earnings</p>
                    <p className="text-3xl font-bold mt-2">₹{earnings?.monthlyEarnings?.toFixed(2) || 0}</p>
                    <p className="text-blue-100 text-xs mt-1">{earnings?.monthlyBookings || 0} bookings</p>
                  </div>
                  <svg className="h-12 w-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Average per Class</p>
                    <p className="text-3xl font-bold mt-2">
                      ₹{earnings?.monthlyBookings > 0 
                        ? (earnings.monthlyEarnings / earnings.monthlyBookings).toFixed(2) 
                        : 0}
                    </p>
                  </div>
                  <svg className="h-12 w-12 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Earnings by Class */}
            {earnings?.earningsByClass && earnings.earningsByClass.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#225533] mb-4">Top Earning Classes</h2>
                <div className="space-y-3">
                  {earnings.earningsByClass.map((classItem, index) => (
                    <div key={classItem._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-[#3f8554] text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{classItem.classTitle}</p>
                          <p className="text-sm text-gray-500 capitalize">{classItem.classType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#3f8554]">₹{classItem.totalEarnings?.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{classItem.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Earnings by Date (Last 30 Days) */}
            {earnings?.earningsByDate && earnings.earningsByDate.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#225533] mb-4">Earnings Over Time (Last 30 Days)</h2>
                <div className="space-y-2">
                  {earnings.earningsByDate.map((day) => (
                    <div key={day._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(day._id).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">{day.bookings} bookings</p>
                      </div>
                      <p className="font-semibold text-[#3f8554]">₹{day.dailyEarnings?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {earnings?.recentTransactions && earnings.recentTransactions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-[#225533] mb-4">Recent Transactions</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {earnings.recentTransactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.userId?.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.classId?.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#3f8554]">
                            ₹{transaction.amountPaid?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {transaction.bookingStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {earnings && !earnings.earningsByClass?.length && !earnings.recentTransactions?.length && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No earnings yet</h3>
                <p className="mt-2 text-gray-500">Start hosting classes to track your earnings.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerEarnings;
