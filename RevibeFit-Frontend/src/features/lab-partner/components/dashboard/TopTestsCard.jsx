import { useMemo } from 'react';

const COLORS = ['#3f8554', '#225533', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6'];
const CATEGORY_COLORS = {
  'Blood Test': '#3f8554',
  'Urine Test': '#60a5fa',
  'Imaging': '#f59e0b',
  'Fitness Assessment': '#8b5cf6',
  'Cardiac Test': '#ef4444',
  'Other': '#94a3b8',
};

/**
 * Donut chart showing test distribution by category.
 * Mimics the "Top treatment" card from the reference.
 */
const TopTestsCard = ({ tests = [], bookings = [] }) => {
  const { categoryData, total } = useMemo(() => {
    // Count bookings per test category
    const catMap = {};
    bookings.forEach((b) => {
      b.selectedTests?.forEach((t) => {
        const cat = t.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
    });

    // If no bookings, fall back to offered test counts by category
    if (Object.keys(catMap).length === 0) {
      tests.forEach((t) => {
        const cat = t.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
    }

    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const sum = entries.reduce((acc, [, v]) => acc + v, 0);
    return {
      categoryData: entries.map(([name, count]) => ({
        name,
        count,
        pct: sum > 0 ? ((count / sum) * 100).toFixed(0) : 0,
        color: CATEGORY_COLORS[name] || COLORS[entries.indexOf([name, count]) % COLORS.length],
      })),
      total: sum,
    };
  }, [tests, bookings]);

  // SVG Donut
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#3f8554]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Top Tests</h3>
        </div>
        <span className="text-xs text-[#3f8554] font-medium cursor-pointer hover:underline">View more</span>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut SVG */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
            {categoryData.length > 0 ? (
              categoryData.map((cat, i) => {
                const pctValue = total > 0 ? cat.count / total : 0;
                const dashLen = pctValue * circumference;
                const dashOffset = -(accumulated * circumference);
                accumulated += pctValue;
                return (
                  <circle
                    key={cat.name}
                    cx="64" cy="64" r={radius}
                    fill="none"
                    stroke={CATEGORY_COLORS[cat.name] || COLORS[i % COLORS.length]}
                    strokeWidth="16"
                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700"
                  />
                );
              })
            ) : (
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="16" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{total}</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {categoryData.slice(0, 5).map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#94a3b8' }}
              />
              <span className="text-gray-600 truncate">{cat.name}</span>
              <span className="font-semibold text-gray-800 ml-auto">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopTestsCard;
