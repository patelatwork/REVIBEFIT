import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, Calendar, Camera, Lock, Eye, EyeOff, CheckCircle, AlertCircle, FileText, ArrowLeftRight } from 'lucide-react';
import ManagerSidebar from '../components/ManagerSidebar';

const API = 'http://localhost:8000/api';

const ManagerProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Change password state
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Stats
    const [stats, setStats] = useState(null);

    const [formData, setFormData] = useState({ phone: '', age: '' });

    const manager = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/manager/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setProfile(data.data);
            setFormData({
                phone: data.data.phone || '',
                age: data.data.age || '',
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // Fetch commission requests count
            const reqRes = await fetch(`${API}/manager/commission-requests/mine`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const reqData = await reqRes.json();
            const commissionRequests = reqRes.ok ? reqData.data?.length || 0 : 0;

            setStats({ commissionRequests });
        } catch { /* stats are optional */ }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            const body = new FormData();
            body.append('phone', formData.phone);
            body.append('age', formData.age);
            if (photoFile) body.append('profilePhoto', photoFile);

            const res = await fetch(`${API}/manager/profile`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setProfile(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));
            setIsEditing(false);
            setPhotoFile(null);
            setPhotoPreview(null);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({ phone: profile?.phone || '', age: profile?.age || '' });
        setPhotoFile(null);
        setPhotoPreview(null);
        setError('');
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('All fields are required');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        try {
            setChangingPassword(true);
            const res = await fetch(`${API}/auth/change-password`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPasswordSuccess('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(''), 5000);
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setChangingPassword(false);
        }
    };

    const getInitials = () => (profile?.name || 'M').charAt(0).toUpperCase();

    const managerTypeLabel = profile?.managerType === 'trainer_manager' ? '🏋️ Trainer Manager' : profile?.managerType === 'lab_manager' ? '🧪 Lab Manager' : 'Manager';

    return (
        <div className="min-h-screen bg-gray-50">
            <ManagerSidebar managerName={manager.name} assignedRegion={manager.assignedRegion} managerType={manager.managerType} />

            <div className="lg:ml-64 pt-16 lg:pt-0">
                <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-500 mt-1">Manage your account information</p>
                    </div>

                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-600" />
                            <p className="text-green-700 text-sm font-medium">{success}</p>
                        </motion.div>
                    )}

                    {error && !loading && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle size={20} className="text-red-600" />
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Profile Header Card */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-[#1a2a3a] to-[#2d4a5e] h-32 relative" />
                                <div className="px-6 pb-6">
                                    {/* Avatar row */}
                                    <div className="-mt-12 mb-4">
                                        <div className="relative inline-block">
                                            <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-[#60a5fa] to-[#2563eb] flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                                                {photoPreview ? (
                                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : profile.profilePhoto ? (
                                                    <img src={`http://localhost:8000/${profile.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitials()
                                                )}
                                            </div>
                                            {isEditing && (
                                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-md">
                                                    <Camera size={14} className="text-white" />
                                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    {/* Name, badges, and actions row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.managerType === 'trainer_manager' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                                    {managerTypeLabel}
                                                </span>
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    {profile.assignedRegion || 'No Region'}
                                                </span>
                                            </div>
                                        </div>
                                        {!isEditing ? (
                                            <button onClick={() => setIsEditing(true)} className="self-start sm:self-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center gap-2">
                                                <User size={16} />Edit Profile
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 self-start sm:self-auto">
                                                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50">
                                                    {saving ? 'Saving...' : 'Save'}
                                                </button>
                                                <button onClick={handleCancel} disabled={saving} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Profile Details */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-5">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name — Read-only */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <User size={14} />Name
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.name}</div>
                                        <p className="text-xs text-gray-400 mt-1">Contact admin to change</p>
                                    </div>

                                    {/* Email — Read-only */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <Mail size={14} />Email
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.email}</div>
                                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                    </div>

                                    {/* Phone — Editable */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <Phone size={14} />Phone
                                        </label>
                                        {isEditing ? (
                                            <input type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} maxLength="10" placeholder="10 digit phone number" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.phone || 'Not provided'}</div>
                                        )}
                                    </div>

                                    {/* Age — Editable */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <Calendar size={14} />Age
                                        </label>
                                        {isEditing ? (
                                            <input type="number" value={formData.age} onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))} min="13" max="100" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.age || 'Not provided'}</div>
                                        )}
                                    </div>

                                    {/* Region — Read-only */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <MapPin size={14} />Assigned Region
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.assignedRegion || 'Not assigned'}</div>
                                        <p className="text-xs text-gray-400 mt-1">Admin assigned</p>
                                    </div>

                                    {/* Manager Type — Read-only */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <Shield size={14} />Role
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm capitalize">{profile.managerType?.replace('_', ' ') || 'Manager'}</div>
                                        <p className="text-xs text-gray-400 mt-1">Admin assigned</p>
                                    </div>

                                    {/* City — Read-only */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <MapPin size={14} />City
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.city || 'Not provided'}</div>
                                    </div>

                                    {/* State — Read-only */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1.5">
                                            <MapPin size={14} />State
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">{profile.state || 'Not provided'}</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Account Stats */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-5">Account Overview</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                                        <Calendar size={20} className="mx-auto text-blue-500 mb-2" />
                                        <p className="text-xs text-gray-500 mb-1">Manager Since</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                                        <FileText size={20} className="mx-auto text-green-500 mb-2" />
                                        <p className="text-xs text-gray-500 mb-1">Account Status</p>
                                        <p className="text-sm font-semibold text-green-700">Active</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                                        <ArrowLeftRight size={20} className="mx-auto text-purple-500 mb-2" />
                                        <p className="text-xs text-gray-500 mb-1">Commission Requests</p>
                                        <p className="text-sm font-semibold text-gray-900">{stats?.commissionRequests ?? '—'}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Change Password */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    <Lock size={20} />Change Password
                                </h3>
                                <p className="text-sm text-gray-500 mb-5">Update your password to keep your account secure</p>

                                {passwordSuccess && (
                                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-600" />
                                        <p className="text-sm text-green-700">{passwordSuccess}</p>
                                    </div>
                                )}
                                {passwordError && (
                                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                        <AlertCircle size={16} className="text-red-600" />
                                        <p className="text-sm text-red-700">{passwordError}</p>
                                    </div>
                                )}

                                <div className="space-y-4 max-w-md">
                                    {['current', 'new', 'confirm'].map((field) => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword[field] ? 'text' : 'password'}
                                                    value={passwordData[field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']}
                                                    onChange={(e) => setPasswordData(p => ({
                                                        ...p,
                                                        [field === 'current' ? 'currentPassword' : field === 'new' ? 'newPassword' : 'confirmPassword']: e.target.value,
                                                    }))}
                                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    placeholder={field === 'current' ? 'Enter current password' : field === 'new' ? 'Min. 8 characters' : 'Repeat new password'}
                                                />
                                                <button type="button" onClick={() => setShowPassword(p => ({ ...p, [field]: !p[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showPassword[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button onClick={handleChangePassword} disabled={changingPassword} className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50">
                                        {changingPassword ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ManagerProfile;
