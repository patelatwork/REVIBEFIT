import { useState } from 'react';
import axios from 'axios';

const NutritionProfileForm = ({ onProfileCreated, existingProfile = null }) => {
  const [formData, setFormData] = useState({
    age: existingProfile?.age || '',
    gender: existingProfile?.gender || '',
    height: existingProfile?.height || '',
    weight: existingProfile?.weight || '',
    fitnessGoal: existingProfile?.fitnessGoal || '',
    targetWeight: existingProfile?.targetWeight || '',
    activityLevel: existingProfile?.activityLevel || '',
    dietaryPreference: existingProfile?.dietaryPreference || '',
    allergies: existingProfile?.allergies?.join(', ') || '',
    foodDislikes: existingProfile?.foodDislikes?.join(', ') || '',
    healthConditions: existingProfile?.healthConditions || ['none'],
    mealsPerDay: existingProfile?.mealsPerDay || 3,
    waterIntakeTarget: existingProfile?.waterIntakeTarget || 2.5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHealthConditionChange = (condition) => {
    setFormData((prev) => {
      let newConditions = [...prev.healthConditions];
      
      if (condition === 'none') {
        newConditions = ['none'];
      } else {
        newConditions = newConditions.filter(c => c !== 'none');
        if (newConditions.includes(condition)) {
          newConditions = newConditions.filter(c => c !== condition);
        } else {
          newConditions.push(condition);
        }
        if (newConditions.length === 0) {
          newConditions = ['none'];
        }
      }
      
      return { ...prev, healthConditions: newConditions };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        foodDislikes: formData.foodDislikes ? formData.foodDislikes.split(',').map(f => f.trim()).filter(f => f) : [],
        mealsPerDay: parseInt(formData.mealsPerDay),
        waterIntakeTarget: parseFloat(formData.waterIntakeTarget),
      };

      const response = await axios.post(
        'http://localhost:8000/api/nutrition/profile',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onProfileCreated(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/20 shadow-lg">
        <h3 className="text-2xl font-bold text-[#225533] mb-6">Basic Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="13"
              max="100"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Height (cm) *</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              required
              min="100"
              max="250"
              step="0.1"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Current Weight (kg) *</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
              min="30"
              max="300"
              step="0.1"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>
        </div>
      </div>

      {/* Fitness Goals */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/20 shadow-lg">
        <h3 className="text-2xl font-bold text-[#225533] mb-6">Fitness Goals</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Fitness Goal *</label>
            <select
              name="fitnessGoal"
              value={formData.fitnessGoal}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            >
              <option value="">Select Goal</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="muscle-gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="endurance">Endurance</option>
              <option value="general-health">General Health</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Target Weight (kg)</label>
            <input
              type="number"
              name="targetWeight"
              value={formData.targetWeight}
              onChange={handleChange}
              min="30"
              max="300"
              step="0.1"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2 font-semibold">Activity Level *</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            >
              <option value="">Select Activity Level</option>
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="lightly-active">Lightly Active (1-3 days/week)</option>
              <option value="moderately-active">Moderately Active (3-5 days/week)</option>
              <option value="very-active">Very Active (6-7 days/week)</option>
              <option value="extremely-active">Extremely Active (physical job + exercise)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/20 shadow-lg">
        <h3 className="text-2xl font-bold text-[#225533] mb-6">Dietary Preferences</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Dietary Preference *</label>
            <select
              name="dietaryPreference"
              value={formData.dietaryPreference}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            >
              <option value="">Select Preference</option>
              <option value="none">No Preference</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
              <option value="mediterranean">Mediterranean</option>
              <option value="low-carb">Low Carb</option>
              <option value="low-fat">Low Fat</option>
              <option value="gluten-free">Gluten Free</option>
              <option value="dairy-free">Dairy Free</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Allergies (comma-separated)</label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g., peanuts, shellfish, dairy"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Food Dislikes (comma-separated)</label>
            <input
              type="text"
              name="foodDislikes"
              value={formData.foodDislikes}
              onChange={handleChange}
              placeholder="e.g., broccoli, mushrooms, olives"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>
        </div>
      </div>

      {/* Health Conditions */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/20 shadow-lg">
        <h3 className="text-2xl font-bold text-[#225533] mb-6">Health Conditions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {['none', 'diabetes', 'hypertension', 'heart-disease', 'thyroid', 'pcos', 'kidney-disease'].map((condition) => (
            <label key={condition} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.healthConditions.includes(condition)}
                onChange={() => handleHealthConditionChange(condition)}
                className="w-5 h-5 rounded bg-white border-2 border-gray-300 text-[#3f8554] focus:ring-[#3f8554]"
              />
              <span className="text-gray-700 capitalize">{condition.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Meal Preferences */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/20 shadow-lg">
        <h3 className="text-2xl font-bold text-[#225533] mb-6">Meal Preferences</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Meals Per Day</label>
            <input
              type="number"
              name="mealsPerDay"
              value={formData.mealsPerDay}
              onChange={handleChange}
              min="2"
              max="6"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Water Intake Target (liters/day)</label>
            <input
              type="number"
              name="waterIntakeTarget"
              value={formData.waterIntakeTarget}
              onChange={handleChange}
              min="1"
              max="10"
              step="0.1"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#3f8554] hover:bg-[#225533] disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transform transition hover:scale-105 disabled:scale-100 shadow-lg"
        >
          {loading ? 'Saving...' : existingProfile ? 'Update Profile' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
};

export default NutritionProfileForm;
