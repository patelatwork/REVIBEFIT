import { useState } from 'react';
import axios from 'axios';

const MealPlanGenerator = ({ nutritionProfile, onPlanGenerated }) => {
  const [planType, setPlanType] = useState('weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'http://localhost:8000/api/nutrition/meal-plan/generate',
        {
          planType,
          startDate,
          customPrompt: customPrompt || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onPlanGenerated(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/30 shadow-lg">
        <h3 className="text-xl font-bold text-[#225533] mb-4">Your Daily Targets</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#3f8554]">{nutritionProfile.dailyCalorieTarget}</div>
            <div className="text-gray-600 text-sm">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#225533]">{nutritionProfile.dailyProteinTarget}g</div>
            <div className="text-gray-600 text-sm">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#3f8554]">{nutritionProfile.dailyCarbsTarget}g</div>
            <div className="text-gray-600 text-sm">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#225533]">{nutritionProfile.dailyFatsTarget}g</div>
            <div className="text-gray-600 text-sm">Fats</div>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-xl p-6 border-2 border-[#3f8554]/20 shadow-lg">
        <h3 className="text-2xl font-bold text-[#225533] mb-6">Generate New Meal Plan</h3>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Plan Type</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
              >
                <option value="daily">Daily Plan (1 day)</option>
                <option value="weekly">Weekly Plan (7 days)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., I prefer quick meals under 30 minutes, avoid spicy food, include more breakfast protein..."
              rows={4}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-[#3f8554]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#3f8554] hover:bg-[#225533] disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-semibold transform transition hover:scale-105 disabled:scale-100 shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating your meal plan... This may take a minute
              </span>
            ) : (
              '✨ Generate Meal Plan'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#3f8554]/10 border border-[#3f8554]/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-[#3f8554] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-[#225533] mb-1">About Meal Generation</p>
            <p>Our system considers your profile, dietary preferences, allergies, and health conditions to create personalized meal plans with recipes, nutritional info, and cooking instructions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanGenerator;
