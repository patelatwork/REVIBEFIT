import { useState } from 'react';
import { RefreshCw, Table, LayoutList } from 'lucide-react';
import WeeklyMealTable from './WeeklyMealTable';

const MealPlanDisplay = ({ mealPlan, onReset }) => {
  const [viewMode, setViewMode] = useState('table');

  if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Meal Plan Found</h3>
        <p className="text-gray-600 mb-6">Generate a personalized nutrition plan.</p>
        <button
          onClick={onReset}
          className="bg-[#3f8554] hover:bg-[#225533] text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Generate Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#225533]">Your Meal Plan</h2>
          <p className="text-gray-600 mt-1">{mealPlan.planName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#3f8554] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Table className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[#3f8554] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Cards
            </button>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-[#3f8554] hover:bg-[#225533] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && <WeeklyMealTable mealPlan={mealPlan} />}

      {/* Cards View - Simple day-by-day */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {mealPlan.meals.map((day, index) => (
            <div key={index} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-[#225533] capitalize">{day.dayOfWeek}</h3>
                <p className="text-gray-600 text-sm">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {/* Breakfast */}
                {day.breakfast && (
                  <div className="border-2 border-orange-100 rounded-xl p-4">
                    <div className="text-xs font-bold text-orange-600 uppercase mb-2">Breakfast</div>
                    <h4 className="font-bold text-gray-800 mb-1">{day.breakfast.name}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {day.breakfast.calories} cal • {day.breakfast.protein}g protein
                    </div>
                    {day.breakfast.instructions && (
                      <p className="text-xs text-gray-500 line-clamp-2">{day.breakfast.instructions}</p>
                    )}
                  </div>
                )}

                {/* Lunch */}
                {day.lunch && (
                  <div className="border-2 border-blue-100 rounded-xl p-4">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-2">Lunch</div>
                    <h4 className="font-bold text-gray-800 mb-1">{day.lunch.name}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {day.lunch.calories} cal • {day.lunch.protein}g protein
                    </div>
                    {day.lunch.instructions && (
                      <p className="text-xs text-gray-500 line-clamp-2">{day.lunch.instructions}</p>
                    )}
                  </div>
                )}

                {/* Dinner */}
                {day.dinner && (
                  <div className="border-2 border-purple-100 rounded-xl p-4">
                    <div className="text-xs font-bold text-purple-600 uppercase mb-2">Dinner</div>
                    <h4 className="font-bold text-gray-800 mb-1">{day.dinner.name}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {day.dinner.calories} cal • {day.dinner.protein}g protein
                    </div>
                    {day.dinner.instructions && (
                      <p className="text-xs text-gray-500 line-clamp-2">{day.dinner.instructions}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Snacks */}
              {day.snacks && day.snacks.length > 0 && (
                <div className="border-t pt-4">
                  <div className="text-xs font-bold text-green-600 uppercase mb-2">Snacks</div>
                  <div className="flex flex-wrap gap-2">
                    {day.snacks.map((snack, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg px-3 py-2">
                        <div className="font-semibold text-sm text-gray-800">{snack.name}</div>
                        <div className="text-xs text-gray-600">{snack.calories} cal</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Totals */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm font-bold text-gray-700">Daily Total</div>
                <div className="flex gap-4 text-sm">
                  <span className="font-bold text-orange-600">{day.totalDailyCalories || 0} cal</span>
                  <span className="text-gray-600">{day.totalDailyProtein || 0}g protein</span>
                  <span className="text-gray-600">{day.totalDailyCarbs || 0}g carbs</span>
                  <span className="text-gray-600">{day.totalDailyFats || 0}g fats</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealPlanDisplay;
