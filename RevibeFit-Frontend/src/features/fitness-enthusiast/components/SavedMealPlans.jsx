import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Utensils, Trash2, Eye, Star } from 'lucide-react';

const SavedMealPlans = ({ onSelectPlan }) => {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:8000/api/nutrition/meal-plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMealPlans(response.data.data);
    } catch (err) {
      setError('Failed to load meal plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this meal plan?')) return;

    setDeletingId(planId);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:8000/api/nutrition/meal-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMealPlans(mealPlans.filter(plan => plan._id !== planId));
    } catch (err) {
      setError('Failed to delete meal plan');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f8554] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your meal plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (mealPlans.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 text-center">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Utensils className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Meal Plans Yet</h3>
        <p className="text-gray-600 mb-6">
          Generate your first personalized meal plan to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#225533]">My Meal Plans</h2>
        <span className="text-sm text-gray-600">{mealPlans.length} plan{mealPlans.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {mealPlans.map((plan) => (
          <div
            key={plan._id}
            className="border-2 border-gray-100 rounded-2xl p-6 hover:border-[#3f8554]/30 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-bold text-gray-800">{plan.planName}</h3>
                  {plan.isActive && (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Active
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                    {plan.planType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[#3f8554]" />
                    <span>{formatDate(plan.startDate)} - {formatDate(plan.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[#3f8554]" />
                    <span>Generated {formatDate(plan.generationDate)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Calories</div>
                    <div className="text-lg font-bold text-blue-600">{plan.targetCalories}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Protein</div>
                    <div className="text-lg font-bold text-red-600">{plan.targetProtein}g</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Carbs</div>
                    <div className="text-lg font-bold text-yellow-600">{plan.targetCarbs}g</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Fats</div>
                    <div className="text-lg font-bold text-purple-600">{plan.targetFats}g</div>
                  </div>
                </div>

                {plan.dietaryPreference && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Diet:</span>
                    <span className="capitalize">{plan.dietaryPreference.replace('-', ' ')}</span>
                  </div>
                )}

                {plan.meals && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{plan.meals.length} day{plan.meals.length !== 1 ? 's' : ''}</span> of meals included
                  </div>
                )}

                {plan.rating && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < plan.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">Your rating</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => onSelectPlan(plan)}
                  className="bg-[#3f8554] hover:bg-[#225533] text-white p-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
                  title="View details"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  disabled={deletingId === plan._id}
                  className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                  title="Delete plan"
                >
                  {deletingId === plan._id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedMealPlans;
