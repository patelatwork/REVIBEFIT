import { useState } from 'react';
import axios from 'axios';
import { Search, Plus, ChevronDown, ChevronUp, Loader2, UtensilsCrossed, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:8000';

const FoodSearch = ({ onAddFood }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [expandedFood, setExpandedFood] = useState(null);
  const [nutritionDetails, setNutritionDetails] = useState({});
  const [selectedServing, setSelectedServing] = useState({});
  const [quantities, setQuantities] = useState({});
  const [error, setError] = useState('');
  const [isApiError, setIsApiError] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setIsApiError(false);
    setResults([]);
    setExpandedFood(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/api/nutrition/food/search`, {
        params: { query: query.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(response.data.data || []);
      if (response.data.data?.length === 0) {
        setIsApiError(false);
        setError('No foods found. Try a different search term.');
      }
    } catch (err) {
      setIsApiError(true);
      setError(err.response?.data?.message || 'Failed to search foods. Make sure FatSecret is configured.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (foodId) => {
    if (expandedFood === foodId) {
      setExpandedFood(null);
      return;
    }

    if (nutritionDetails[foodId]) {
      setExpandedFood(foodId);
      return;
    }

    setAnalyzing(foodId);
    setExpandedFood(foodId);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/api/nutrition/food/analyze`,
        { foodId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNutritionDetails((prev) => ({ ...prev, [foodId]: response.data.data }));
      if (response.data.data?.allServings?.[0]) {
        setSelectedServing((prev) => ({
          ...prev,
          [foodId]: response.data.data.allServings[0].servingId,
        }));
      }
    } catch (err) {
      setError('Failed to get nutrition details');
      setExpandedFood(null);
    } finally {
      setAnalyzing(null);
    }
  };

  const getSelectedNutrients = (foodId) => {
    const details = nutritionDetails[foodId];
    if (!details) return null;

    const servingId = selectedServing[foodId];
    if (!servingId) return details.nutrients;

    const serving = details.allServings?.find((s) => s.servingId === servingId);
    if (!serving || serving.servingId === details.serving?.servingId) {
      return details.nutrients;
    }
    // If they picked a different serving, we only have calories for non-default servings
    // so fall back to the main nutrients object
    return details.nutrients;
  };

  const handleAddFood = (foodId) => {
    const details = nutritionDetails[foodId];
    if (!details) return;

    const nutrients = details.nutrients;
    const qty = quantities[foodId] || 1;
    const servingId = selectedServing[foodId];
    const serving = details.allServings?.find((s) => s.servingId === servingId);

    onAddFood({
      name: details.foodName,
      quantity: qty,
      unit: serving?.description || details.serving?.servingDescription || 'serving',
      calories: Math.round(nutrients.calories * qty),
      protein: Math.round(nutrients.protein * qty),
      carbs: Math.round(nutrients.carbs * qty),
      fats: Math.round(nutrients.fats * qty),
      fiber: Math.round((nutrients.fiber || 0) * qty),
      sugar: Math.round((nutrients.sugar || 0) * qty),
      sodium: Math.round((nutrients.sodium || 0) * qty),
      fatSecretFoodId: foodId,
      fatSecretServingId: servingId,
    });

    // Reset quantity for this food
    setQuantities((prev) => ({ ...prev, [foodId]: 1 }));
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods (e.g., chicken breast, banana, rice...)"
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3f8554] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-[#3f8554] text-white rounded-xl font-semibold hover:bg-[#225533] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Search
        </button>
      </form>

      {/* Error / No-results notice */}
      {error && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${
          isApiError
            ? 'text-red-700 bg-red-50 border-red-200'
            : 'text-amber-700 bg-amber-50 border-amber-200'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {results.map((food) => (
            <div
              key={food.foodId}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Food Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => handleAnalyze(food.foodId)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-[#3f8554]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{food.label}</h4>
                    <p className="text-sm text-gray-500 truncate">
                      {food.brand !== 'Generic' && <span className="text-[#3f8554] font-medium">{food.brand} · </span>}
                      {food.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {analyzing === food.foodId ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#3f8554]" />
                  ) : expandedFood === food.foodId ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Nutrition Details */}
              {expandedFood === food.foodId && nutritionDetails[food.foodId] && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                  {/* Macros Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Calories', value: nutritionDetails[food.foodId].nutrients.calories, unit: 'kcal', color: 'orange' },
                      { label: 'Protein', value: nutritionDetails[food.foodId].nutrients.protein, unit: 'g', color: 'blue' },
                      { label: 'Carbs', value: nutritionDetails[food.foodId].nutrients.carbs, unit: 'g', color: 'green' },
                      { label: 'Fat', value: nutritionDetails[food.foodId].nutrients.fats, unit: 'g', color: 'yellow' },
                    ].map((macro) => (
                      <div key={macro.label} className="bg-white rounded-lg p-3 text-center">
                        <div className={`text-lg font-bold text-${macro.color}-600`}>
                          {macro.value}{macro.unit === 'kcal' ? '' : macro.unit}
                        </div>
                        <div className="text-xs text-gray-500 uppercase font-medium">{macro.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Serving Selector + Quantity */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {nutritionDetails[food.foodId].allServings?.length > 1 && (
                      <select
                        value={selectedServing[food.foodId] || ''}
                        onChange={(e) =>
                          setSelectedServing((prev) => ({ ...prev, [food.foodId]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#3f8554]"
                      >
                        {nutritionDetails[food.foodId].allServings.map((s) => (
                          <option key={s.servingId} value={s.servingId}>
                            {s.description} ({s.calories} cal)
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 whitespace-nowrap">Qty:</label>
                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={quantities[food.foodId] || 1}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [food.foodId]: parseFloat(e.target.value) || 1,
                          }))
                        }
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center bg-white focus:outline-none focus:border-[#3f8554]"
                      />
                    </div>

                    <button
                      onClick={() => handleAddFood(food.foodId)}
                      className="flex items-center justify-center gap-2 px-5 py-2 bg-[#3f8554] text-white rounded-lg font-semibold text-sm hover:bg-[#225533] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Meal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !error && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Search for foods to see nutrition data</p>
          <p className="text-sm mt-1">Powered by FatSecret food database</p>
        </div>
      )}
    </div>
  );
};

export default FoodSearch;
