import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSent(true);
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
                    {/* Logo / Brand */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#225533] to-[#3f8554] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Mail size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            {sent ? 'Check your inbox for the reset link' : 'Enter your email and we\'ll send you a reset link'}
                        </p>
                    </div>

                    {sent ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <p className="text-gray-700 text-sm mb-2">
                                If an account exists with <strong>{email}</strong>, a password reset link has been sent.
                            </p>
                            <p className="text-gray-400 text-xs mb-6">The link expires in 1 hour. Check your spam folder if you don't see it.</p>

                            <button onClick={() => { setSent(false); setEmail(''); }} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm mb-3">
                                Send Another Link
                            </button>
                            <Link to="/login" className="block text-[#3f8554] text-sm font-medium hover:text-[#225533] transition-colors">
                                ← Back to Login
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

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#3f8554] focus:border-transparent"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-[#225533] to-[#3f8554] text-white rounded-xl font-medium hover:from-[#1a4428] hover:to-[#357548] transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" />Sending...</>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>

                            <Link to="/login" className="flex items-center justify-center gap-1 mt-5 text-[#3f8554] text-sm font-medium hover:text-[#225533] transition-colors">
                                <ArrowLeft size={14} />Back to Login
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
