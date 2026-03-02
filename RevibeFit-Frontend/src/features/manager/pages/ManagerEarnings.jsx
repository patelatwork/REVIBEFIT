import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Building2, BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api/manager';

const ManagerEarnings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [overTime, setOverTime] = useState([]);
    const [topPartners, setTopPartners] = useState([]);
    const [revenue, setRevenue] = useState(null);
    const [timePeriod, setTimePeriod] = useState('12');

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        if (manager.managerType !== 'lab_manager') { navigate('/manager/dashboard'); return; }
        fetchAll();
    }, [timePeriod]);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };
            const [otRes, tpRes, revRes] = await Promise.all([
                fetch(`${API}/analytics/lab-earnings/over-time?months=${timePeriod}`, { headers }),
                fetch(`${API}/analytics/lab-earnings/top-partners?limit=10`, { headers }),
                fetch(`${API}/analytics/platform-revenue`, { headers }),
            ]);
            const [otData, tpData, revData] = await Promise.all([otRes.json(), tpRes.json(), revRes.json()]);

            if (otRes.ok) setOverTime(otData.data || []);
            if (tpRes.ok) setTopPartners(tpData.data || []);
            if (revRes.ok) setRevenue(revData.data || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (a) => `₹${(a || 0).toLocaleString('en-IN')}`;

    // SVG Chart
    const maxVal = Math.max(...overTime.map(d => d.totalRevenue || d.revenue || 0), 1);
    const chartHeight = 200;
    const chartWidth = Math.max(overTime.length * 72, 400);

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegions={manager.assignedRegions} managerType={manager.managerType} />

            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Lab Earnings & Analytics</h1>
                            <p className="text-gray-500 mt-1">Revenue overview for lab partners in your region</p>
                        </div>
                        <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                            <option value="3">Last 3 months</option>
                            <option value="6">Last 6 months</option>
                            <option value="12">Last 12 months</option>
                            <option value="24">Last 2 years</option>
                        </select>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Total Revenue', value: formatCurrency(revenue?.totalRevenue || revenue?.totalBookingValue), icon: DollarSign, color: 'bg-blue-500', change: null },
                                    { label: 'Platform Commission', value: formatCurrency(revenue?.totalCommission), icon: TrendingUp, color: 'bg-green-500', change: null },
                                    { label: 'Active Lab Partners', value: revenue?.activeLabPartners ?? topPartners.length, icon: Building2, color: 'bg-teal-500', change: null },
                                    { label: 'Avg Commission Rate', value: `${(revenue?.avgCommissionRate || 10).toFixed(1)}%`, icon: BarChart3, color: 'bg-purple-500', change: null },
                                ].map(c => (
                                    <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                                                <h3 className="text-xl font-bold text-gray-900">{c.value}</h3>
                                            </div>
                                            <div className={`p-2.5 rounded-xl ${c.color}`}>
                                                <c.icon size={18} className="text-white" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Revenue Over Time Chart */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Over Time</h3>
                                <p className="text-sm text-gray-500 mb-6">Monthly lab revenue in your region</p>

                                {overTime.length === 0 ? (
                                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available for this period</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full" style={{ minWidth: chartWidth }}>
                                            {/* Grid lines */}
                                            {[0, 0.25, 0.5, 0.75, 1].map(frac => (
                                                <g key={frac}>
                                                    <line x1="40" y1={chartHeight - frac * chartHeight + 10} x2={chartWidth - 10} y2={chartHeight - frac * chartHeight + 10} stroke="#f0f0f0" strokeWidth="1" />
                                                    <text x="35" y={chartHeight - frac * chartHeight + 14} textAnchor="end" fill="#999" fontSize="10">
                                                        {formatCurrency(Math.round(maxVal * frac))}
                                                    </text>
                                                </g>
                                            ))}

                                            {/* Bars */}
                                            {overTime.map((d, i) => {
                                                const val = d.totalRevenue || d.revenue || 0;
                                                const barHeight = (val / maxVal) * chartHeight;
                                                const x = 50 + i * 72;
                                                const commVal = d.totalCommission || d.commission || 0;
                                                const commHeight = (commVal / maxVal) * chartHeight;
                                                return (
                                                    <g key={i}>
                                                        {/* Revenue bar */}
                                                        <rect x={x} y={chartHeight - barHeight + 10} width="28" height={barHeight} fill="#3b82f6" rx="4" opacity="0.8" />
                                                        {/* Commission bar */}
                                                        <rect x={x + 30} y={chartHeight - commHeight + 10} width="28" height={commHeight} fill="#10b981" rx="4" opacity="0.8" />
                                                        {/* Label */}
                                                        <text x={x + 29} y={chartHeight + 28} textAnchor="middle" fill="#666" fontSize="10">
                                                            {d.month || d._id?.month || ''}/{(d.year || d._id?.year || '').toString().slice(-2)}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                        <div className="flex items-center gap-6 justify-center mt-2">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <div className="w-3 h-3 rounded-sm bg-blue-500" />Revenue
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <div className="w-3 h-3 rounded-sm bg-green-500" />Commission
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Top Lab Partners */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Top Lab Partners</h3>
                                <p className="text-sm text-gray-500 mb-5">Ranked by total revenue</p>

                                {topPartners.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400 text-sm">No lab partner data available</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                                                    <th className="pb-3 pr-4">#</th>
                                                    <th className="pb-3 pr-4">Lab Partner</th>
                                                    <th className="pb-3 pr-4 text-right">Total Revenue</th>
                                                    <th className="pb-3 pr-4 text-right">Commission</th>
                                                    <th className="pb-3 pr-4 text-right">Bookings</th>
                                                    <th className="pb-3 text-right">Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topPartners.map((lp, i) => (
                                                    <tr key={lp._id || i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                                        <td className="py-3 pr-4 text-gray-400 font-medium">{i + 1}</td>
                                                        <td className="py-3 pr-4">
                                                            <p className="font-medium text-gray-900">{lp.laboratoryName || lp.name || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-400">{lp.email || ''}</p>
                                                        </td>
                                                        <td className="py-3 pr-4 text-right font-semibold text-gray-900">{formatCurrency(lp.totalRevenue || lp.totalEarnings)}</td>
                                                        <td className="py-3 pr-4 text-right text-green-600 font-medium">{formatCurrency(lp.totalCommission || lp.commission)}</td>
                                                        <td className="py-3 pr-4 text-right text-gray-700">{lp.totalBookings || lp.bookings || 0}</td>
                                                        <td className="py-3 text-right text-gray-700">{lp.commissionRate || 10}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerEarnings;
