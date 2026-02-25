import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LabPartnerNavbar from '../components/LabPartnerNavbar';

const LabProfile = () => {
  const navigate = useNavigate();
  const [labData, setLabData] = useState(null);
  const [labName, setLabName] = useState('Lab Partner');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    laboratoryName: '',
    laboratoryAddress: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    setLabName(userData.laboratoryName || userData.name || 'Lab Partner');
    setLabData(userData);
    setFormData({
      name: userData.name || '',
      phone: userData.phone || '',
      laboratoryName: userData.laboratoryName || '',
      laboratoryAddress: userData.laboratoryAddress || '',
    });
    setLoading(false);
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset form data
    setFormData({
      name: labData.name || '',
      phone: labData.phone || '',
      laboratoryName: labData.laboratoryName || '',
      laboratoryAddress: labData.laboratoryAddress || '',
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/lab-partners/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data.data));
        setLabData(data.data);
        setLabName(data.data.laboratoryName || data.data.name);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffff0]">
      <LabPartnerNavbar labName={labName} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#225533]">Lab Profile</h1>
          <p className="text-gray-600 mt-2">Manage your laboratory information</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554]"></div>
          </div>
        ) : labData ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-[#3f8554] to-[#225533] h-32"></div>
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4">
                <div className="inline-block h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg">
                  <div className="h-full w-full rounded-full bg-[#3f8554] flex items-center justify-center text-white text-4xl font-bold">
                    {labData.laboratoryName?.charAt(0).toUpperCase() || labData.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{labData.laboratoryName || labData.name}</h2>
                    <p className="text-gray-600 capitalize">Laboratory Partner</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.email}</div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        maxLength="10"
                        placeholder="10 digit phone number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.phone || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.licenseNumber || 'Not provided'}</div>
                    <p className="text-xs text-gray-500 mt-1">License number cannot be changed</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="laboratoryName"
                        value={formData.laboratoryName}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.laboratoryName || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Address</label>
                    {isEditing ? (
                      <textarea
                        name="laboratoryAddress"
                        value={formData.laboratoryAddress}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.laboratoryAddress || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">{labData.commissionRate || 10}%</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        labData.isApproved 
                          ? labData.isSuspended
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {labData.isSuspended ? 'Suspended' : labData.approvalStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {labData.isSuspended && labData.suspensionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800 mb-1">Suspension Reason:</p>
                    <p className="text-sm text-red-700">{labData.suspensionReason}</p>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`flex-1 px-6 py-3 bg-[#3f8554] text-white rounded-lg hover:bg-[#225533] transition-colors font-medium ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Partner since {new Date(labData.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No profile data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabProfile;
