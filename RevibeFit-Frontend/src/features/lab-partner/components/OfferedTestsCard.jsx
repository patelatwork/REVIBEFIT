import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OfferedTestsCard = () => {
  const navigate = useNavigate();
  const [offeredTests, setOfferedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOfferedTests();
  }, []);

  const fetchOfferedTests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching offered tests with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/offered-tests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log('Offered tests response:', data);
      
      if (data.success) {
        setOfferedTests(data.data);
      } else {
        setError(data.message || 'Failed to load offered tests');
      }
    } catch (err) {
      console.error('Error fetching offered tests:', err);
      setError(`Failed to load offered tests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManageTests = () => {
    navigate('/lab-partner/manage-tests');
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border-2 border-gray-200 hover:border-[#3f8554] transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[#3f8554] mb-2">Tests You Offer</h2>
          <p className="text-sm text-gray-600">
            Manage which tests are visible to fitness enthusiasts
          </p>
        </div>
        <button
          onClick={handleManageTests}
          className="bg-[#3f8554] hover:bg-[#225533] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        {offeredTests.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 font-semibold mb-2">No tests offered yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Start by selecting tests you want to offer to fitness enthusiasts
            </p>
            <button
              onClick={handleManageTests}
              className="bg-[#3f8554] hover:bg-[#225533] text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Select Tests to Offer
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Currently Offering: {offeredTests.length} test{offeredTests.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {offeredTests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#225533] text-sm">{test.testName}</h4>
                    <p className="text-xs text-gray-600 mt-1">{test.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span className="font-semibold text-[#3f8554]">₹{test.price}</span>
                      <span>•</span>
                      <span>{test.duration}</span>
                      {test.category && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">{test.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferedTestsCard;
