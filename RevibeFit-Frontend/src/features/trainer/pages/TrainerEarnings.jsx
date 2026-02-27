import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerNavbar from '../components/TrainerNavbar';

const TrainerEarnings = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainerName, setTrainerName] = useState('Trainer');
  const [showCommissionInfo, setShowCommissionInfo] = useState(false);

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
            {/* Commission Rate Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Platform Commission Rate: <span className="text-lg">{earnings?.commissionRate || 15}%</span></p>
                  <p className="text-xs text-amber-600">This percentage is deducted from each booking as a platform service fee</p>
                </div>
              </div>
              <button onClick={() => setShowCommissionInfo(!showCommissionInfo)} className="text-amber-600 hover:text-amber-800 text-sm underline">
                {showCommissionInfo ? 'Hide details' : 'How it works'}
              </button>
            </div>
            {showCommissionInfo && (
              <div className="bg-white border border-amber-100 rounded-xl p-5 text-sm text-gray-600 space-y-2">
                <p><strong className="text-gray-800">How Commission Works:</strong></p>
                <p>• When a user books your class, the platform deducts <strong>{earnings?.commissionRate || 15}%</strong> as a service fee.</p>
                <p>• The remaining <strong>{100 - (earnings?.commissionRate || 15)}%</strong> is credited to your account as your payout.</p>
                <p>• For example, on a ₹1,000 booking: Platform takes ₹{((earnings?.commissionRate || 15) * 10).toFixed(0)}, you receive ₹{(1000 - (earnings?.commissionRate || 15) * 10).toFixed(0)}.</p>
                <p className="text-xs text-gray-400 pt-1">Commission rate is set by the platform admin and applies to all future bookings.</p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-green-100 text-sm font-medium">Your Total Payout</p>
                <p className="text-3xl font-bold mt-2">₹{(earnings?.allTime?.totalPayout || earnings?.totalEarnings || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-green-200 text-xs mt-1">After commission deduction</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-blue-100 text-sm font-medium">Monthly Payout</p>
                <p className="text-3xl font-bold mt-2">₹{(earnings?.monthlyEarnings || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-blue-200 text-xs mt-1">{earnings?.monthlyBookings || 0} bookings this month</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-indigo-100 text-sm font-medium">Gross Booking Value</p>
                <p className="text-3xl font-bold mt-2">₹{(earnings?.allTime?.totalBookingValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-indigo-200 text-xs mt-1">Total value of all bookings</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-amber-100 text-sm font-medium">Platform Commission Paid</p>
                <p className="text-3xl font-bold mt-2">₹{(earnings?.allTime?.totalCommission || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-amber-200 text-xs mt-1">{earnings?.commissionRate || 15}% of gross</p>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {earnings?.monthlyBookingValue > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-[#225533] mb-4">This Month's Breakdown</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">Gross Bookings</p>
                    <p className="text-2xl font-bold text-gray-800">₹{earnings.monthlyBookingValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-500">Commission Deducted</p>
                    <p className="text-2xl font-bold text-red-600">-₹{(earnings.monthlyCommission || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600">Your Payout</p>
                    <p className="text-2xl font-bold text-green-700">₹{(earnings.monthlyEarnings || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-4 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 transition-all" style={{ width: `${earnings.monthlyBookingValue > 0 ? ((earnings.monthlyEarnings / earnings.monthlyBookingValue) * 100) : 0}%` }} title="Your Payout"></div>
                  <div className="bg-amber-400 transition-all" style={{ width: `${earnings.monthlyBookingValue > 0 ? ((earnings.monthlyCommission / earnings.monthlyBookingValue) * 100) : 0}%` }} title="Platform Commission"></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Your Payout ({earnings.monthlyBookingValue > 0 ? ((earnings.monthlyEarnings / earnings.monthlyBookingValue) * 100).toFixed(0) : 0}%)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block"></span> Commission ({earnings.commissionRate || 15}%)</span>
                </div>
              </div>
            )}

            {/* Earnings by Class */}
            {earnings?.earningsByClass && earnings.earningsByClass.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
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
                        <p className="text-xs text-gray-400">Gross: ₹{classItem.totalBookingValue?.toFixed(2)} • Commission: ₹{classItem.totalCommission?.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{classItem.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Earnings by Date (Last 30 Days) */}
            {earnings?.earningsByDate && earnings.earningsByDate.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
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
                      <div className="text-right">
                        <p className="font-semibold text-[#3f8554]">₹{day.dailyEarnings?.toFixed(2)}</p>
                        {day.dailyCommission > 0 && (
                          <p className="text-xs text-gray-400">Commission: ₹{day.dailyCommission?.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {earnings?.recentTransactions && earnings.recentTransactions.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-semibold text-[#225533] mb-4">Recent Transactions</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Booking Amt</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Your Payout</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {earnings.recentTransactions.map((t) => (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {t.userId?.name}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {t.classId?.title}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                            ₹{t.amountPaid?.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-amber-600">
                            -₹{(t.commissionAmount || 0).toFixed(2)}
                            {t.commissionRate ? <span className="text-xs text-gray-400 ml-1">({t.commissionRate}%)</span> : null}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-[#3f8554]">
                            ₹{(t.trainerPayout || t.amountPaid || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {t.bookingStatus}
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
              <div className="bg-white rounded-xl shadow p-12 text-center">
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
