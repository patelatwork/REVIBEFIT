import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import AdminNavbar from '../components/AdminNavbar';

const LabEarningsAnalytics = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [earningsOverTime, setEarningsOverTime] = useState([]);
    const [earningsBreakdown, setEarningsBreakdown] = useState([]);
    const [partners, setPartners] = useState([]);
    const [topPartners, setTopPartners] = useState([]);
    const [timeFilter, setTimeFilter] = useState('12months'); // 30days, 12months, all

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [overTimeRes, breakdownRes, topPartnersRes] = await Promise.all([
                    fetch(`http://localhost:8000/api/admin/analytics/lab-earnings/over-time?period=${timeFilter}`),
                    fetch(`http://localhost:8000/api/admin/analytics/lab-earnings/breakdown?period=${timeFilter}`),
                    fetch('http://localhost:8000/api/admin/analytics/lab-earnings/top-partners')
                ]);

                const overTimeData = await overTimeRes.json();
                const breakdownData = await breakdownRes.json();
                const topPartnersData = await topPartnersRes.json();

                if (overTimeRes.ok) setEarningsOverTime(overTimeData.data);
                if (breakdownRes.ok) {
                    setEarningsBreakdown(breakdownData.data.data);
                    setPartners(breakdownData.data.partners);
                }
                if (topPartnersRes.ok) setTopPartners(topPartnersData.data);

            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeFilter]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="min-h-screen bg-[#fffff0]">
            <AdminNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-[#3f8554] hover:underline mb-2 flex items-center gap-1"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-[#225533]">Lab Earnings Analytics</h1>
                        <p className="text-gray-600">Detailed insights into lab test commissions and revenue</p>
                    </div>

                    <div className="flex bg-white rounded-lg shadow p-1">
                        <button
                            onClick={() => setTimeFilter('30days')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeFilter === '30days'
                                ? 'bg-[#3f8554] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Last 30 Days
                        </button>
                        <button
                            onClick={() => setTimeFilter('12months')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeFilter === '12months'
                                ? 'bg-[#3f8554] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Last 12 Months
                        </button>
                        <button
                            onClick={() => setTimeFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeFilter === 'all'
                                ? 'bg-[#3f8554] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* 1. Line Chart: Total Earnings Over Time */}
                        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                            <h2 className="text-xl font-bold text-[#225533] mb-4">Revenue Trends</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={earningsOverTime}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="totalEarnings" name="Total Booking Value" stroke="#8884d8" activeDot={{ r: 8 }} />
                                        <Line yAxisId="right" type="monotone" dataKey="platformCommission" name="Platform Commission" stroke="#82ca9d" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Stacked Bar Chart: Partner Contribution by Time Period */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold text-[#225533] mb-4">Partner Contribution Over Time</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={earningsBreakdown}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        {partners.map((partner, index) => (
                                            <Bar
                                                key={partner}
                                                dataKey={partner}
                                                stackId="a"
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3. Horizontal Bar Chart: Top Lab Partners */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold text-[#225533] mb-4">Top Lab Partners (by Commission)</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={topPartners}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="totalCommission" name="Commission Earned">
                                            {topPartners.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default LabEarningsAnalytics;
