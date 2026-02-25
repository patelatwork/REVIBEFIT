import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import signupBg from '../../assets/escape_your_limits.jpg';

const Signup = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('fitness-enthusiast');
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    
    // Fitness Enthusiast specific
    fitnessGoal: '',
    
    // Trainer specific
    specialization: '',
    certifications: null,
    
    // Lab Partner specific
    laboratoryName: '',
    laboratoryAddress: '',
    licenseNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 13 || formData.age > 100) {
      newErrors.age = 'Age must be between 13 and 100';
    }

    // User type specific validations
    if (userType === 'fitness-enthusiast') {
      if (!formData.fitnessGoal || formData.fitnessGoal.trim().length < 10) {
        newErrors.fitnessGoal = 'Please describe your fitness goal (minimum 10 characters)';
      }
    }

    if (userType === 'trainer') {
      if (!formData.specialization || formData.specialization.trim().length < 5) {
        newErrors.specialization = 'Specialization is required (minimum 5 characters)';
      }
      if (!formData.certifications) {
        newErrors.certifications = 'Certification document is required';
      }
    }

    if (userType === 'lab-partner') {
      if (!formData.laboratoryName || formData.laboratoryName.trim().length < 2) {
        newErrors.laboratoryName = 'Laboratory name is required';
      }
      if (!formData.laboratoryAddress || formData.laboratoryAddress.trim().length < 10) {
        newErrors.laboratoryAddress = 'Complete laboratory address is required';
      }
      if (!formData.licenseNumber || formData.licenseNumber.trim().length < 5) {
        newErrors.licenseNumber = 'Valid license number is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      try {
        // Create FormData for file upload
        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== '') {
            submitData.append(key, formData[key]);
          }
        });
        submitData.append('userType', userType);
        
        console.log('Submitting signup data...');
        console.log('User Type:', userType);
        console.log('Form Data:', Object.fromEntries(submitData));
        
        // Make API call to backend
        const response = await fetch('http://localhost:8000/api/auth/signup', {
          method: 'POST',
          body: submitData,
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Signup failed');
        }

        // Show success message based on response and navigate to login
        alert(data.message || 'Account created successfully! Please login.');
        navigate('/login');
      } catch (error) {
        console.error('Signup error:', error);
        setErrors({ submit: error.message || 'Failed to connect to server. Please ensure the backend is running.' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div 
        className="hidden lg:block lg:w-2/5 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${signupBg})` }}
      >
        <div className="absolute inset-0 bg-[#225533] opacity-60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-6">Join RevibeFit</h1>
            <p className="text-xl">Start your transformation journey today</p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 bg-[#fffff0] overflow-y-auto">
        <motion.div 
          className="max-w-2xl w-full my-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[#225533] mb-2">Create Account</h2>
            <p className="text-gray-600">Join the RevibeFit community</p>
          </div>

          {/* User Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a *
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleUserTypeChange('fitness-enthusiast')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  userType === 'fitness-enthusiast'
                    ? 'border-[#3f8554] bg-[#3f8554] text-white'
                    : 'border-gray-300 hover:border-[#3f8554]'
                }`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-semibold text-sm">Fitness Enthusiast</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleUserTypeChange('trainer')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  userType === 'trainer'
                    ? 'border-[#3f8554] bg-[#3f8554] text-white'
                    : 'border-gray-300 hover:border-[#3f8554]'
                }`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span className="font-semibold text-sm">Trainer</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleUserTypeChange('lab-partner')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  userType === 'lab-partner'
                    ? 'border-[#3f8554] bg-[#3f8554] text-white'
                    : 'border-gray-300 hover:border-[#3f8554]'
                }`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="font-semibold text-sm">Lab Partner</span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="10-digit phone number"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.age ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="Enter your age"
                  min="13"
                  max="100"
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="Create a password"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Fitness Enthusiast Specific Fields */}
            {userType === 'fitness-enthusiast' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Fitness Goal *
                </label>
                <textarea
                  name="fitnessGoal"
                  value={formData.fitnessGoal}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 border ${errors.fitnessGoal ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                  placeholder="Describe your fitness goals (e.g., lose weight, build muscle, improve endurance)"
                ></textarea>
                {errors.fitnessGoal && <p className="text-red-500 text-sm mt-1">{errors.fitnessGoal}</p>}
              </div>
            )}

            {/* Trainer Specific Fields */}
            {userType === 'trainer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <textarea
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-3 border ${errors.specialization ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                    placeholder="Your training specialization (e.g., Strength Training, Yoga, CrossFit)"
                  ></textarea>
                  {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certifications (PDF) *
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="certifications"
                      onChange={handleChange}
                      accept=".pdf"
                      className={`w-full px-4 py-3 border ${errors.certifications ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3f8554] file:text-white hover:file:bg-[#225533]`}
                    />
                  </div>
                  {errors.certifications && <p className="text-red-500 text-sm mt-1">{errors.certifications}</p>}
                  <p className="text-gray-500 text-xs mt-1">Upload your training certifications in PDF format</p>
                </div>
              </>
            )}

            {/* Lab Partner Specific Fields */}
            {userType === 'lab-partner' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Laboratory Name *
                    </label>
                    <input
                      type="text"
                      name="laboratoryName"
                      value={formData.laboratoryName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.laboratoryName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                      placeholder="Laboratory name"
                    />
                    {errors.laboratoryName && <p className="text-red-500 text-sm mt-1">{errors.laboratoryName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                      placeholder="Laboratory license number"
                    />
                    {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Laboratory Address *
                  </label>
                  <textarea
                    name="laboratoryAddress"
                    value={formData.laboratoryAddress}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-3 border ${errors.laboratoryAddress ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3f8554] focus:border-transparent`}
                    placeholder="Complete laboratory address"
                  ></textarea>
                  {errors.laboratoryAddress && <p className="text-red-500 text-sm mt-1">{errors.laboratoryAddress}</p>}
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-4 h-4 mt-1 text-[#3f8554] border-gray-300 rounded focus:ring-[#3f8554]"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-[#3f8554] hover:text-[#225533]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#3f8554] hover:text-[#225533]">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3f8554] text-white py-3 rounded-lg font-semibold hover:bg-[#225533] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#3f8554] hover:text-[#225533] font-semibold">
                Sign In
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
