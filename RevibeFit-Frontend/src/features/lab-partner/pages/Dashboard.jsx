import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LabPartnerNavbar from '../components/LabPartnerNavbar';
import OfferedTestsCard from '../components/OfferedTestsCard';
import FinancialSummary from '../components/FinancialSummary';

const LabPartnerDashboard = () => {
  const navigate = useNavigate();
  const [labName, setLabName] = useState('Lab Partner');

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      const userData = JSON.parse(user);
      setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <LabPartnerNavbar labName={labName} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-[#225533] mb-2">
          Lab Partner Dashboard
        </h1>
        <p className="text-gray-600 mb-8">Welcome back, {labName}!</p>

        {/* Offered Tests Card - Full Width */}
        <div className="mb-6">
          <OfferedTestsCard />
        </div>

        {/* Financial Summary - Full Width */}
        <div className="mb-6">
          <FinancialSummary />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Link 
            to="/lab-partner/manage-bookings"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Test Bookings</h2>
            <p className="text-gray-600">View booking requests</p>
          </Link>

          <Link 
            to="/lab-partner/invoices"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Invoices & Payments</h2>
            <p className="text-gray-600">View monthly invoices and payment history</p>
          </Link>

          {/* More sections */}
          <Link 
            to="/lab-partner/manage-tests"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Lab Services</h2>
            <p className="text-gray-600">Manage available tests</p>
          </Link>

          <Link to="/lab-partner/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Reports</h2>
            <p className="text-gray-600">Upload test reports</p>
          </Link>

          <Link to="/lab-partner/profile" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Lab Profile</h2>
            <p className="text-gray-600">Update lab information</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LabPartnerDashboard;
