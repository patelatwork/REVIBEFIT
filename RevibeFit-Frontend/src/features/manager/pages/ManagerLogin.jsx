import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../../../assets/exercise_8407005.png';

const ManagerLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/manager/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('manager', JSON.stringify(data.data.user));
            localStorage.setItem('managerToken', data.data.accessToken);
            localStorage.setItem('user', JSON.stringify({ ...data.data.user, userType: 'manager' }));
            navigate('/manager/dashboard');
        } catch (error) {
            setErrors({ submit: error.message || 'Login failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#2d4a6a]">
            <motion.div
                className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <img src={logo} alt="RevibeFit Logo" className="h-20 w-20 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-[#1a2a3a] mb-2">Manager Login</h1>
                    <p className="text-gray-600">RevibeFit Manager Panel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email" name="email" value={formData.email} onChange={handleChange}
                            className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent`}
                            placeholder="manager@revibefit.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password" name="password" value={formData.password} onChange={handleChange}
                            className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent`}
                            placeholder="Enter your password"
                        />
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-[#3b82f6] text-white py-3 rounded-lg font-semibold hover:bg-[#2563eb] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Login to Manager Panel'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Manager access only</p>
                </div>
            </motion.div>
        </div>
    );
};

export default ManagerLogin;
