import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPartnerNavbar from '../components/LabPartnerNavbar';

const ManageTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [labName, setLabName] = useState('');
  const [showOfferedTestsModal, setShowOfferedTestsModal] = useState(false);
  const [offeredTests, setOfferedTests] = useState([]);
  const [selectedOfferedTests, setSelectedOfferedTests] = useState([]);
  const [savingOfferedTests, setSavingOfferedTests] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    testName: '',
    description: '',
    price: '',
    duration: '',
    category: 'Other',
    preparationInstructions: '',
  });

  const categories = [
    'Blood Test',
    'Urine Test',
    'Imaging',
    'Fitness Assessment',
    'Cardiac Test',
    'Other',
  ];

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(user);
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    fetchTests();
    fetchOfferedTests();
  }, [navigate]);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/tests/my-tests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTests(data.data);
      } else {
        setError('Failed to load tests');
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferedTests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/offered-tests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        const offeredTestIds = data.data.map((test) => test._id);
        setOfferedTests(offeredTestIds);
        setSelectedOfferedTests(offeredTestIds);
      }
    } catch (err) {
      console.error('Error fetching offered tests:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const url = editingTest
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/tests/${editingTest._id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/tests/add`;

      console.log('Submitting to:', url);
      console.log('Form data:', formData);

      const response = await fetch(url, {
        method: editingTest ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        setShowAddModal(false);
        setEditingTest(null);
        resetForm();
        fetchTests();
      } else {
        setError(data.message || 'Failed to save test');
      }
    } catch (err) {
      console.error('Error saving test:', err);
      setError(`Failed to save test: ${err.message}`);
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      testName: test.testName,
      description: test.description,
      price: test.price,
      duration: test.duration,
      category: test.category,
      preparationInstructions: test.preparationInstructions || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (testId) => {
    if (!confirm('Are you sure you want to delete this test?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/tests/${testId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        fetchTests();
      } else {
        setError('Failed to delete test');
      }
    } catch (err) {
      console.error('Error deleting test:', err);
      setError('Failed to delete test');
    }
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      description: '',
      price: '',
      duration: '',
      category: 'Other',
      preparationInstructions: '',
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTest(null);
    resetForm();
    setError('');
  };

  const handleOpenOfferedTestsModal = () => {
    setSelectedOfferedTests([...offeredTests]);
    setShowOfferedTestsModal(true);
  };

  const handleCloseOfferedTestsModal = () => {
    setShowOfferedTestsModal(false);
    setSelectedOfferedTests([...offeredTests]);
  };

  const handleToggleOfferedTest = (testId) => {
    setSelectedOfferedTests((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const handleSaveOfferedTests = async () => {
    setSavingOfferedTests(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/lab-partners/offered-tests`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ testIds: selectedOfferedTests }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOfferedTests(selectedOfferedTests);
        setShowOfferedTestsModal(false);
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = 'Offered tests updated successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        setError(data.message || 'Failed to update offered tests');
      }
    } catch (err) {
      console.error('Error updating offered tests:', err);
      setError('Failed to update offered tests');
    } finally {
      setSavingOfferedTests(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <LabPartnerNavbar labName={labName} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#225533] mb-2">Manage Tests</h1>
            <p className="text-gray-600">Add and manage the tests you offer</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOpenOfferedTestsModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Select Tests to Offer
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#3f8554] hover:bg-[#225533] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Test
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Tests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
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
            <h3 className="text-2xl font-semibold text-gray-500 mb-2">No tests added yet</h3>
            <p className="text-gray-400 mb-6">Start by adding the tests your lab offers</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#3f8554] hover:bg-[#225533] text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Add Your First Test
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test._id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[#225533]">{test.testName}</h3>
                  {test.category && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      {test.category}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{test.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Price:</span>
                    <span className="font-semibold text-[#3f8554]">₹{test.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Duration:</span>
                    <span className="font-semibold text-gray-700">{test.duration}</span>
                  </div>
                </div>

                {test.preparationInstructions && (
                  <p className="text-xs text-gray-500 mb-4 italic border-l-2 border-blue-300 pl-2">
                    {test.preparationInstructions}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(test)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="sticky top-0 bg-[#225533] text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {editingTest ? 'Edit Test' : 'Add New Test'}
                </h2>
                <button onClick={handleCloseModal} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[#225533] font-semibold mb-2">
                    Test Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="testName"
                    value={formData.testName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                    placeholder="e.g., Complete Blood Count (CBC)"
                  />
                </div>

                <div>
                  <label className="block text-[#225533] font-semibold mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                    placeholder="Brief description of the test..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#225533] font-semibold mb-2">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="block text-[#225533] font-semibold mb-2">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                      placeholder="e.g., 30 minutes, 2-3 days"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#225533] font-semibold mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#225533] font-semibold mb-2">
                    Preparation Instructions
                  </label>
                  <textarea
                    name="preparationInstructions"
                    value={formData.preparationInstructions}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554]"
                    placeholder="e.g., Fasting required for 8-12 hours..."
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#3f8554] hover:bg-[#225533] text-white font-bold rounded-lg transition-colors"
                >
                  {editingTest ? 'Update Test' : 'Add Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offered Tests Selection Modal */}
      {showOfferedTestsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Select Tests to Offer</h2>
                  <p className="text-sm opacity-90">
                    Choose which tests fitness enthusiasts can see and book
                  </p>
                </div>
                <button onClick={handleCloseOfferedTestsModal} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only the tests you select here will be visible to fitness enthusiasts
                  when they try to book appointments with your lab. You can change this selection at any time.
                </p>
              </div>

              {tests.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-300 mb-4"
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
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">No tests available</h3>
                  <p className="text-gray-400 mb-4">Add tests first before selecting which ones to offer</p>
                  <button
                    onClick={() => {
                      handleCloseOfferedTestsModal();
                      setShowAddModal(true);
                    }}
                    className="bg-[#3f8554] hover:bg-[#225533] text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Add a Test
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedOfferedTests.length} of {tests.length} test{tests.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOfferedTests(tests.map(t => t._id))}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        onClick={() => setSelectedOfferedTests([])}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tests.map((test) => (
                      <div
                        key={test._id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedOfferedTests.includes(test._id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleToggleOfferedTest(test._id)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedOfferedTests.includes(test._id)}
                            onChange={() => handleToggleOfferedTest(test._id)}
                            className="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-[#225533]">{test.testName}</h4>
                              {test.category && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                  {test.category}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-[#3f8554] font-semibold">₹{test.price}</span>
                              <span className="text-gray-500">Duration: {test.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseOfferedTestsModal}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveOfferedTests}
                      disabled={savingOfferedTests}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingOfferedTests ? 'Saving...' : 'Save Selection'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTests;
