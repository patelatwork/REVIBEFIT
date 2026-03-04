import { useMemo } from 'react';

const TYPE_COLORS = {
  yoga: { color: '#3f8554', bg: '#e8f5ec' },
  hiit: { color: '#ef4444', bg: '#fee2e2' },
  strength: { color: '#3b82f6', bg: '#dbeafe' },
  cardio: { color: '#f59e0b', bg: '#fef3c7' },
  pilates: { color: '#8b5cf6', bg: '#ede9fe' },
  dance: { color: '#ec4899', bg: '#fce7f3' },
  meditation: { color: '#06b6d4', bg: '#cffafe' },
  other: { color: '#94a3b8', bg: '#f1f5f9' },
};

/**
 * SVG Donut chart showing class distribution by type.
 * Consistent with lab partner TopTestsCard pattern.
 */
const ClassDistributionCard = ({ schedule = [], stats }) => {
  const { typeData, total } = useMemo(() => {
    const typeMap = {};
    schedule.forEach((cls) => {
      const type = cls.classType?.toLowerCase() || 'other';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    // If schedule is empty but stats has totalClasses
    if (Object.keys(typeMap).length === 0 && stats?.totalClasses > 0) {
      typeMap['scheduled'] = stats.totalClasses;
    }

    const entries = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
    const sum = entries.reduce((acc, [, v]) => acc + v, 0);
    return {
      typeData: entries.map(([name, count], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        pct: sum > 0 ? ((count / sum) * 100).toFixed(0) : 0,
        color: TYPE_COLORS[name]?.color || Object.values(TYPE_COLORS)[i % Object.keys(TYPE_COLORS).length]?.color || '#94a3b8',
      })),
      total: sum,
    };
  }, [schedule, stats]);

  // SVG Donut
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Class Types</h3>
        </div>
        <span className="text-xs text-[#3f8554] font-medium cursor-pointer hover:underline">View all</span>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut SVG */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
            {typeData.length > 0 ? (
              typeData.map((cat) => {
                const pctValue = total > 0 ? cat.count / total : 0;
                const dashLen = pctValue * circumference;
                const dashOffset = -(accumulated * circumference);
                accumulated += pctValue;
                return (
                  <circle
                    key={cat.name}
                    cx="64" cy="64" r={radius}
                    fill="none"
                    stroke={cat.color}
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
            <span className="text-[10px] text-gray-400">Classes</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {typeData.slice(0, 6).map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-gray-600 truncate">{cat.name}</span>
              <span className="font-semibold text-gray-800 ml-auto">{cat.count}</span>
            </div>
          ))}
          {typeData.length === 0 && (
            <span className="text-xs text-gray-400">No class data</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDistributionCard;
