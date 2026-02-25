import { useState, useEffect } from 'react';

const LiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    monthlyBookings: 0,
    totalClasses: 0,
    activeClasses: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classType: '',
    otherClassType: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    cost: '',
    maxParticipants: 20,
    requirements: '',
    equipment: '',
    difficultyLevel: 'beginner'
  });

  const classTypes = [
    'cycling', 'strength', 'running', 'yoga', 'meditation', 
    'rowing', 'outdoor', 'stretching', 'other'
  ];

  useEffect(() => {
    fetchTrainerClasses();
    fetchEarnings();
  }, []);

  const fetchTrainerClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/trainer/my-classes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/trainer/earnings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEarnings(data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = showEditModal 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/${selectedClass._id}` 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes`;
      const method = showEditModal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(showEditModal ? 'Class updated successfully!' : 'Class created successfully!');
        setShowCreateModal(false);
        setShowEditModal(false);
        resetForm();
        fetchTrainerClasses();
        fetchEarnings();
      } else {
        alert(data.message || 'Error saving class');
      }
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error saving class');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description || '',
      classType: classItem.classType,
      otherClassType: classItem.otherClassType || '',
      scheduledDate: new Date(classItem.scheduledDate).toISOString().split('T')[0],
      scheduledTime: classItem.scheduledTime,
      duration: classItem.duration,
      cost: classItem.cost,
      maxParticipants: classItem.maxParticipants,
      requirements: classItem.requirements || '',
      equipment: classItem.equipment || '',
      difficultyLevel: classItem.difficultyLevel
    });
    setShowEditModal(true);
  };

  const handleDelete = async (classId) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchTrainerClasses();
        fetchEarnings();
      } else {
        alert(data.message || 'Error deleting class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Error deleting class');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      classType: '',
      otherClassType: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: 60,
      cost: '',
      maxParticipants: 20,
      requirements: '',
      equipment: '',
      difficultyLevel: 'beginner'
    });
    setSelectedClass(null);
  };

  const formatDateTime = (date, time) => {
    const classDate = new Date(date);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return `${classDate.toLocaleDateString('en-US', options)} at ${time}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes</h1>
          <p className="text-gray-600">Manage your live fitness classes</p>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
            <p className="text-2xl font-bold text-green-600">₹{earnings.totalEarnings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">This Month</h3>
            <p className="text-2xl font-bold text-blue-600">₹{earnings.monthlyEarnings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Monthly Bookings</h3>
            <p className="text-2xl font-bold text-purple-600">{earnings.monthlyBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Total Classes</h3>
            <p className="text-2xl font-bold text-indigo-600">{earnings.totalClasses}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500">Active Classes</h3>
            <p className="text-2xl font-bold text-orange-600">{earnings.activeClasses}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Schedule New Class
          </button>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Classes</h2>
          </div>
          
          {classes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No classes scheduled yet. Create your first class to get started!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {classes.map((classItem) => (
                <div key={classItem._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                          {classItem.status}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {classItem.classType === 'other' ? classItem.otherClassType : classItem.classType}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Date & Time:</span><br />
                          {formatDateTime(classItem.scheduledDate, classItem.scheduledTime)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span><br />
                          {classItem.duration} minutes
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span><br />
                          ₹{classItem.cost}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Participants:</span><br />
                          {classItem.currentParticipants} / {classItem.maxParticipants}
                        </div>
                        <div>
                          <span className="font-medium">Difficulty:</span><br />
                          {classItem.difficultyLevel}
                        </div>
                      </div>

                      {classItem.description && (
                        <p className="text-gray-600 text-sm mb-3">{classItem.description}</p>
                      )}

                      {classItem.totalEarnings > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-green-600">Earnings from this class: ₹{classItem.totalEarnings}</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex gap-2">
                      {classItem.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(classItem._id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showEditModal ? 'Edit Class' : 'Schedule New Class'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Title*
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Morning Yoga Session"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Type*
                      </label>
                      <select
                        name="classType"
                        value={formData.classType}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select class type</option>
                        {classTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.classType === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specify Other Class Type*
                      </label>
                      <input
                        type="text"
                        name="otherClassType"
                        value={formData.otherClassType}
                        onChange={handleInputChange}
                        required={formData.classType === 'other'}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Dance Fitness"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the class"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date*
                      </label>
                      <input
                        type="date"
                        name="scheduledDate"
                        value={formData.scheduledDate}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time*
                      </label>
                      <input
                        type="time"
                        name="scheduledTime"
                        value={formData.scheduledTime}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)*
                      </label>
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        required
                        min="15"
                        max="180"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost (₹)*
                      </label>
                      <input
                        type="number"
                        name="cost"
                        value={formData.cost}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="10000"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Participants
                      </label>
                      <input
                        type="number"
                        name="maxParticipants"
                        value={formData.maxParticipants}
                        onChange={handleInputChange}
                        min="1"
                        max="200"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      name="difficultyLevel"
                      value={formData.difficultyLevel}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requirements
                      </label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Basic fitness level required"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment Needed
                      </label>
                      <textarea
                        name="equipment"
                        value={formData.equipment}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Yoga mat, water bottle"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (showEditModal ? 'Update Class' : 'Schedule Class')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClasses;