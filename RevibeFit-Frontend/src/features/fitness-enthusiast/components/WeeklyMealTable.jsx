import { Calendar, Utensils, Clock, Flame } from 'lucide-react';

const WeeklyMealTable = ({ mealPlan }) => {
  if (!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No meal plan data available
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMealInfo = (meal) => {
    if (!meal) return { name: '-', calories: 0 };
    return {
      name: meal.name || '-',
      calories: meal.calories || 0
    };
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3f8554] to-[#225533] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{mealPlan.planName}</h2>
              <p className="text-green-100 text-sm">
                {formatDate(mealPlan.startDate)} - {formatDate(mealPlan.endDate)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{mealPlan.targetCalories}</div>
            <div className="text-green-100 text-sm">cal/day target</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3f8554]" />
                  <span className="font-bold text-gray-700 uppercase text-sm">Day</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-gray-700 uppercase text-sm">Breakfast</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-gray-700 uppercase text-sm">Lunch</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-gray-700 uppercase text-sm">Dinner</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="font-bold text-gray-700 uppercase text-sm">Snacks</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-gray-700 uppercase text-sm">Total Cal</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mealPlan.meals.map((day, index) => {
              const breakfast = getMealInfo(day.breakfast);
              const lunch = getMealInfo(day.lunch);
              const dinner = getMealInfo(day.dinner);
              const snacksCalories = day.snacks?.reduce((sum, snack) => sum + (snack.calories || 0), 0) || 0;
              const totalCalories = breakfast.calories + lunch.calories + dinner.calories + snacksCalories;

              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 capitalize">
                        {day.dayOfWeek}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(day.date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-sm">
                        {breakfast.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {breakfast.calories} cal
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-sm">
                        {lunch.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {lunch.calories} cal
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-sm">
                        {dinner.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dinner.calories} cal
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {day.snacks && day.snacks.length > 0 ? (
                        <>
                          <span className="font-semibold text-gray-800 text-sm">
                            {day.snacks[0].name}
                            {day.snacks.length > 1 && ` +${day.snacks.length - 1} more`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {snacksCalories} cal
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
                        {totalCalories}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 border-t-2 border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#3f8554]">{mealPlan.meals.length}</div>
            <div className="text-xs text-gray-600 uppercase font-semibold">Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{mealPlan.targetCalories}</div>
            <div className="text-xs text-gray-600 uppercase font-semibold">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{mealPlan.targetProtein}g</div>
            <div className="text-xs text-gray-600 uppercase font-semibold">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{mealPlan.targetCarbs}g</div>
            <div className="text-xs text-gray-600 uppercase font-semibold">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{mealPlan.targetFats}g</div>
            <div className="text-xs text-gray-600 uppercase font-semibold">Fats</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyMealTable;
