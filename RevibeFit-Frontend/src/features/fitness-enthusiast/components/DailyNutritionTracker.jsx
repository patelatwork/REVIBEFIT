import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const MEAL_COLORS = {
  breakfast: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  lunch: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  dinner: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  snack: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
};

const DailyNutritionTracker = ({ nutritionProfile, refreshKey }) => {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const targets = {
    calories: nutritionProfile?.dailyCalorieTarget || 2000,
    protein: nutritionProfile?.dailyProteinTarget || 150,
    carbs: nutritionProfile?.dailyCarbsTarget || 250,
    fats: nutritionProfile?.dailyFatsTarget || 65,
  };

  const fetchToday = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/nutrition/meals/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodayData(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to load today\'s data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday, refreshKey]);

  const handleDelete = async (logId) => {
    setDeleting(logId);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/api/nutrition/meals/log/${logId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchToday();
    } catch {
      setError('Failed to delete meal');
    } finally {
      setDeleting(null);
    }
  };

  const getPercent = (consumed, target) => Math.min(Math.round((consumed / target) * 100), 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#3f8554]" />
      </div>
    );
  }

  const totals = todayData?.dailyTotals || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const meals = todayData?.mealLogs || [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
          <button onClick={fetchToday} className="ml-auto">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Macro Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Calories', icon: Flame, consumed: totals.calories, target: targets.calories, unit: 'kcal', gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
          { label: 'Protein', icon: Beef, consumed: totals.protein, target: targets.protein, unit: 'g', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
          { label: 'Carbs', icon: Wheat, consumed: totals.carbs, target: targets.carbs, unit: 'g', gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
          { label: 'Fat', icon: Droplets, consumed: totals.fats, target: targets.fats, unit: 'g', gradient: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-50' },
        ].map((macro) => {
          const pct = getPercent(macro.consumed, macro.target);
          return (
            <motion.div
              key={macro.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${macro.bg} rounded-xl flex items-center justify-center`}>
                  <macro.icon className={`w-5 h-5 bg-gradient-to-r ${macro.gradient} text-transparent`} style={{ WebkitBackgroundClip: 'text' }} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase">{macro.label}</span>
              </div>

              <div className="mb-2">
                <span className="text-2xl font-bold text-gray-800">{Math.round(macro.consumed)}</span>
                <span className="text-sm text-gray-400 ml-1">/ {macro.target}{macro.unit}</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${macro.gradient}`}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{pct}%</span>
                <span className="text-xs text-gray-400">{Math.max(0, Math.round(macro.target - macro.consumed))} left</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Meals Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#225533] flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Today's Meals
          </h3>
          <button
            onClick={fetchToday}
            className="text-[#3f8554] hover:bg-green-50 p-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No meals logged yet today</p>
            <p className="text-sm mt-1">Use the "Log Meal" tab to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => {
              const MealIcon = MEAL_ICONS[meal.mealType] || Coffee;
              const colors = MEAL_COLORS[meal.mealType] || MEAL_COLORS.breakfast;

              return (
                <div
                  key={meal._id}
                  className={`border ${colors.border} rounded-xl overflow-hidden`}
                >
                  {/* Meal Header */}
                  <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <MealIcon className={`w-4 h-4 ${colors.text}`} />
                      <span className={`font-semibold capitalize ${colors.text}`}>
                        {meal.mealType}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(meal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700">
                        {meal.totalCalories || meal.foodItems?.reduce((s, f) => s + (f.calories || 0), 0)} cal
                      </span>
                      <button
                        onClick={() => handleDelete(meal._id)}
                        disabled={deleting === meal._id}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {deleting === meal._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Food Items */}
                  <div className="px-4 py-2 divide-y divide-gray-50">
                    {meal.foodItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 text-sm">
                        <span className="text-gray-700">
                          {item.name}
                          <span className="text-gray-400 ml-1 text-xs">
                            ({item.quantity} {item.unit})
                          </span>
                        </span>
                        <span className="text-gray-500 shrink-0 ml-3">
                          {item.calories} cal · P:{item.protein}g · C:{item.carbs}g · F:{item.fats}g
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {meal.notes && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-gray-400 italic">{meal.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyNutritionTracker;
