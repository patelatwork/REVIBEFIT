import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

/**
 * Monthly revenue comparison bar chart showing gross, commission, and net payout.
 * Uses Recharts BarChart for a professional grouped bar visualization.
 */
const MonthlyRevenueChart = ({ earningsByDate = [] }) => {
  // Group by week for a cleaner bar chart
  const weeklyData = useMemo(() => {
    if (!earningsByDate.length) return [];

    // Group earnings by week
    const weeks = {};
    earningsByDate.forEach((entry) => {
      const date = new Date(entry._id);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];

      if (!weeks[key]) {
        weeks[key] = {
          week: weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          gross: 0,
          commission: 0,
          payout: 0,
          bookings: 0,
        };
      }
      weeks[key].gross += entry.dailyBookingValue || 0;
      weeks[key].commission += entry.dailyCommission || 0;
      weeks[key].payout += entry.dailyEarnings || 0;
      weeks[key].bookings += entry.bookings || 0;
    });

    return Object.values(weeks);
  }, [earningsByDate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-xs">
        <p className="font-semibold text-gray-800 mb-2">Week of {label}</p>
        {payload.map((p) => (
          <p key={p.name} className="flex items-center gap-1.5 mb-0.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}: ₹{p.value?.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Weekly Revenue Breakdown</h3>
        </div>
        <span className="text-xs text-gray-400">Last 30 days</span>
      </div>

      <div className="h-[250px]">
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="gross" name="Gross" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="payout" name="Net Payout" fill="#3f8554" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="commission" name="Commission" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No weekly revenue data available
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
