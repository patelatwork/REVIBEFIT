import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const Analytics = () => {
  const [monthlyGrowthData, setMonthlyGrowthData] = useState([]);
  const [userDistributionData, setUserDistributionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('growth');

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('adminToken');
      const authHeaders = { Authorization: `Bearer ${token}` };

      // Fetch monthly growth data
      const growthResponse = await fetch(`${apiUrl}/api/admin/analytics/monthly-growth`, { headers: authHeaders });
      const growthData = await growthResponse.json();

      // Fetch user distribution data
      const distributionResponse = await fetch(`${apiUrl}/api/admin/analytics/user-distribution`, { headers: authHeaders });
      const distributionData = await distributionResponse.json();

      if (growthData.success) {
        setMonthlyGrowthData(growthData.data);
      }

      if (distributionData.success) {
        setUserDistributionData(distributionData.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${formatMonth(label)}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
        <span className="ml-3 text-lg">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-[#225533] mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Comprehensive insights into user growth and distribution</p>
      </div>

      {/* Chart Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveChart('growth')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeChart === 'growth'
                ? 'border-[#3f8554] text-[#3f8554]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly Growth
          </button>
          <button
            onClick={() => setActiveChart('distribution')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeChart === 'distribution'
                ? 'border-[#3f8554] text-[#3f8554]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            User Distribution
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth Chart */}
        {activeChart === 'growth' && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#225533] mb-4">Monthly User Registration</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="total" fill="#3f8554" name="Total Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#225533] mb-4">User Type Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="fitnessEnthusiasts" stroke="#0088FE" name="Fitness Enthusiasts" />
                  <Line type="monotone" dataKey="trainers" stroke="#00C49F" name="Trainers" />
                  <Line type="monotone" dataKey="labPartners" stroke="#FFBB28" name="Lab Partners" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* User Distribution Chart */}
        {activeChart === 'distribution' && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#225533] mb-4">User Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-[#225533] mb-4">User Statistics</h3>
              <div className="space-y-4">
                {userDistributionData.map((item, index) => (
                  <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#225533]">{item.value}</div>
                      <div className="text-sm text-gray-500">
                        {((item.value / userDistributionData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
          <div className="text-blue-600 text-sm font-medium">Total Users</div>
          <div className="text-2xl font-bold text-blue-800">
            {userDistributionData.reduce((sum, item) => sum + item.value, 0)}
          </div>
        </div>
        
        {userDistributionData.map((item, index) => (
          <div key={item.type} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
            <div className="text-green-600 text-sm font-medium">{item.name}</div>
            <div className="text-2xl font-bold text-green-800">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analytics;