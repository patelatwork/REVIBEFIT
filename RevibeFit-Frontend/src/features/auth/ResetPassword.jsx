import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword || !confirmPassword) {
            setError('Both fields are required');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#225533] to-[#3f8554] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <ShieldCheck size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            {success ? 'Your password has been reset!' : 'Create a strong new password'}
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <p className="text-gray-700 text-sm mb-2">Your password has been reset successfully.</p>
                            <p className="text-gray-400 text-xs mb-6">Redirecting to login in 3 seconds...</p>
                            <Link to="/login" className="block text-[#3f8554] text-sm font-medium hover:text-[#225533] transition-colors">
                                Go to Login →
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                                    <p className="text-red-700 text-sm">{error}</p>
                                </motion.div>
                            )}

                            <div className="space-y-4 mb-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                                            autoFocus
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat your new password"
                                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Password strength hints */}
                            <div className="mb-5 bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-500 font-medium mb-1.5">Password Requirements:</p>
                                <div className="space-y-1">
                                    <div className={`flex items-center gap-2 text-xs ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle size={12} />At least 8 characters
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${newPassword && newPassword === confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle size={12} />Passwords match
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#225533] to-[#3f8554] text-white rounded-xl font-medium hover:from-[#1a4428] hover:to-[#357548] transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" />Resetting...</>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>

                            <Link to="/login" className="block text-center mt-5 text-[#3f8554] text-sm font-medium hover:text-[#225533] transition-colors">
                                ← Back to Login
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
