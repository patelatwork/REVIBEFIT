import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, Dumbbell, FlaskConical,
  ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const COLORS = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const EarningsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, trainers, labs
  const [timeFilter, setTimeFilter] = useState('12months');

  // Platform revenue data
  const [platformRevenue, setPlatformRevenue] = useState(null);
  // Lab data
  const [labEarningsOverTime, setLabEarningsOverTime] = useState([]);
  const [labBreakdown, setLabBreakdown] = useState([]);
  const [labPartners, setLabPartners] = useState([]);
  const [topLabPartners, setTopLabPartners] = useState([]);
  // Trainer data
  const [trainerEarningsOverTime, setTrainerEarningsOverTime] = useState([]);
  const [trainerBreakdown, setTrainerBreakdown] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };

  useEffect(() => {
    fetchAllData();
  }, [timeFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [revenueRes, labOTRes, labBDRes, topLabRes, trainerOTRes, trainerBDRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/analytics/platform-revenue?period=${timeFilter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/admin/analytics/lab-earnings/over-time?period=${timeFilter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/admin/analytics/lab-earnings/breakdown?period=${timeFilter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/admin/analytics/lab-earnings/top-partners`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/admin/analytics/trainer-earnings/over-time?period=${timeFilter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/admin/analytics/trainer-earnings/breakdown`, { headers: authHeaders }),
      ]);

      const [revenueData, labOTData, labBDData, topLabData, trainerOTData, trainerBDData] = await Promise.all([
        revenueRes.json(), labOTRes.json(), labBDRes.json(), topLabRes.json(), trainerOTRes.json(), trainerBDRes.json(),
      ]);

      if (revenueRes.ok) setPlatformRevenue(revenueData.data);
      if (labOTRes.ok) setLabEarningsOverTime(labOTData.data);
      if (labBDRes.ok) { setLabBreakdown(labBDData.data.data || []); setLabPartners(labBDData.data.partners || []); }
      if (topLabRes.ok) setTopLabPartners(topLabData.data);
      if (trainerOTRes.ok) setTrainerEarningsOverTime(trainerOTData.data);
      if (trainerBDRes.ok) setTrainerBreakdown(trainerBDData.data);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'green', trend }) => {
    const colorMap = {
      green:  { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-100' },
      blue:   { bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-100' },
      purple: { bg: 'bg-purple-50',  iconBg: 'bg-purple-100',  text: 'text-purple-600',  border: 'border-purple-100' },
      amber:  { bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   text: 'text-amber-600',   border: 'border-amber-100' },
      red:    { bg: 'bg-red-50',     iconBg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-100' },
      teal:   { bg: 'bg-teal-50',    iconBg: 'bg-teal-100',    text: 'text-teal-600',    border: 'border-teal-100' },
    };
    const c = colorMap[color] || colorMap.green;
    return (
      <div className={`${c.bg} border ${c.border} rounded-2xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`${c.iconBg} p-2.5 rounded-xl`}><Icon size={20} className={c.text} /></div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    );
  };

  const summary = platformRevenue?.summary || {};
  const monthlyRev = platformRevenue?.monthlyRevenue || [];

  // Pie data for revenue split
  const revenueSplitData = [
    { name: 'Trainer Commission', value: summary.trainerCommissionTotal || 0 },
    { name: 'Lab Commission', value: summary.labCommissionTotal || 0 },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Platform Revenue"
          value={formatCurrency(summary.totalPlatformRevenue)}
          subtitle="All commission income"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Trainer Commission"
          value={formatCurrency(summary.trainerCommissionTotal)}
          subtitle={`${summary.totalClassBookings || 0} class bookings`}
          icon={Dumbbell}
          color="blue"
        />
        <StatCard
          title="Lab Commission"
          value={formatCurrency(summary.labCommissionTotal)}
          subtitle={`${summary.totalLabBookings || 0} lab bookings`}
          icon={FlaskConical}
          color="purple"
        />
        <StatCard
          title="Total Booking Value"
          value={formatCurrency((summary.totalClassBookingValue || 0) + (summary.totalLabBookingValue || 0))}
          subtitle="Classes + Labs combined"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Revenue Trend + Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Platform Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRev} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="trainerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="trainerCommission" name="Trainer Commission" stroke="#3b82f6" fill="url(#trainerGrad)" />
                <Area type="monotone" dataKey="labCommission" name="Lab Commission" stroke="#8b5cf6" fill="url(#labGrad)" />
                <Area type="monotone" dataKey="totalPlatformRevenue" name="Total Revenue" stroke="#4ade80" fill="url(#totalGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Split</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueSplitData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueSplitData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#8b5cf6'][i]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Trainers</span>
              <span className="font-semibold">{formatCurrency(summary.trainerCommissionTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span>Labs</span>
              <span className="font-semibold">{formatCurrency(summary.labCommissionTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trainer Payout Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Class Revenue</span>
              <span className="font-semibold">{formatCurrency(summary.totalClassBookingValue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Platform Commission</span>
              <span className="font-semibold text-green-600">{formatCurrency(summary.trainerCommissionTotal)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Paid to Trainers</span>
              <span className="font-semibold text-blue-600">{formatCurrency(summary.totalTrainerPayout)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lab Payout Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Lab Revenue</span>
              <span className="font-semibold">{formatCurrency(summary.totalLabBookingValue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Platform Commission</span>
              <span className="font-semibold text-green-600">{formatCurrency(summary.labCommissionTotal)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Paid to Lab Partners</span>
              <span className="font-semibold text-purple-600">{formatCurrency((summary.totalLabBookingValue || 0) - (summary.labCommissionTotal || 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrainers = () => (
    <div className="space-y-6">
      {/* Trainer Earnings Over Time */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Trainer Revenue Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trainerEarningsOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="totalBookingValue" name="Total Booking Value" stroke="#3b82f6" fill="#3b82f620" />
              <Area type="monotone" dataKey="platformCommission" name="Platform Commission" stroke="#4ade80" fill="#4ade8020" strokeWidth={2} />
              <Area type="monotone" dataKey="trainerPayout" name="Trainer Payout" stroke="#f59e0b" fill="#f59e0b20" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trainer Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Trainer Earnings Breakdown</h3>
          <p className="text-sm text-gray-500 mt-1">Individual trainer contributions and platform commission</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Booking Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Platform Commission</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trainer Payout</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trainerBreakdown.map((t, i) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{t.specialization || '-'}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(t.totalBookingValue)}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-green-600">{formatCurrency(t.platformCommission)}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-blue-600">{formatCurrency(t.trainerPayout)}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {t.commissionRate || t.avgCommissionRate?.toFixed(1) || 15}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">{t.totalBookings}</td>
                </tr>
              ))}
              {trainerBreakdown.length === 0 && (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">No trainer earnings data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLabs = () => (
    <div className="space-y-6">
      {/* Lab Earnings Over Time */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lab Revenue Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={labEarningsOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="totalEarnings" name="Total Booking Value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="platformCommission" name="Platform Commission" stroke="#4ade80" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partner Contribution Over Time */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Partner Contribution Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={labBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                {labPartners.map((partner, index) => (
                  <Bar key={partner} dataKey={partner} stackId="a" fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Lab Partners */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Lab Partners (by Commission)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topLabPartners} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="totalCommission" name="Commission Earned">
                  {topLabPartners.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Revenue Overview' },
    { id: 'trainers', label: 'Trainer Earnings' },
    { id: 'labs', label: 'Lab Partner Earnings' },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="earnings" onSectionChange={() => {}} />

      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings &amp; Revenue</h1>
              <p className="text-gray-500 mt-1">Platform revenue from trainer &amp; lab partner commissions</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchAllData} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                {['30days', '12months', 'all'].map((f) => (
                  <button key={f} onClick={() => setTimeFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      timeFilter === f ? 'bg-[#225533] text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    {f === '30days' ? '30 Days' : f === '12months' ? '12 Months' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 mb-6 w-fit">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#225533] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'trainers' && renderTrainers()}
              {activeTab === 'labs' && renderLabs()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
export { EarningsPage as LabEarningsAnalytics };
