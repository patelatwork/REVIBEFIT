import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Earnings trend chart showing daily earnings over the last 30 days.
 * Uses Recharts AreaChart for a clean, professional look.
 */
const EarningsChartCard = ({ earningsByDate = [] }) => {
  const chartData = useMemo(() => {
    if (!earningsByDate.length) return [];

    // Fill gaps — build full 30-day array
    const now = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push(key);
    }

    const earningsMap = {};
    earningsByDate.forEach((e) => {
      earningsMap[e._id] = e;
    });

    return days.map((day) => {
      const entry = earningsMap[day];
      return {
        date: day,
        label: new Date(day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        earnings: entry?.dailyEarnings || 0,
        bookings: entry?.bookings || 0,
        commission: entry?.dailyCommission || 0,
      };
    });
  }, [earningsByDate]);

  const totalInPeriod = chartData.reduce((s, d) => s + d.earnings, 0);
  const totalBookings = chartData.reduce((s, d) => s + d.bookings, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-xs">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-[#3f8554]">Earnings: ₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
        {payload[1] && <p className="text-blue-500">Bookings: {payload[1]?.value}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Earnings Trend</h3>
        </div>
        <span className="text-xs text-gray-400">Last 30 days</span>
      </div>

      <div className="flex items-baseline gap-4 mb-4">
        <div>
          <span className="text-2xl font-bold text-gray-800">₹{totalInPeriod.toLocaleString('en-IN')}</span>
          <span className="text-xs text-gray-400 ml-1">earned</span>
        </div>
        <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
          {totalBookings} bookings
        </div>
      </div>

      <div className="h-[220px] -mx-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3f8554" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3f8554" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#3f8554"
                strokeWidth={2.5}
                fill="url(#earningsGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#3f8554', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No earnings data available
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsChartCard;
