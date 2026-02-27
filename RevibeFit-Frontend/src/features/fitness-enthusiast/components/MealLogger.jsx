import { useState } from 'react';
import axios from 'axios';
import { Trash2, Plus, Save, Loader2, Coffee, Sun, Moon, Cookie, UtensilsCrossed, AlertCircle, CheckCircle2, X } from 'lucide-react';
import FoodSearch from './FoodSearch';

const API_URL = 'http://localhost:8000';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'amber' },
  { id: 'lunch', label: 'Lunch', icon: Sun, color: 'orange' },
  { id: 'dinner', label: 'Dinner', icon: Moon, color: 'indigo' },
  { id: 'snack', label: 'Snack', icon: Cookie, color: 'pink' },
];

const MealLogger = ({ onMealLogged }) => {
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodItems, setFoodItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState({
    name: '',
    quantity: 1,
    unit: 'serving',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const handleAddFromSearch = (food) => {
    setFoodItems((prev) => [...prev, food]);
    setSuccess(`Added ${food.name}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleAddManual = () => {
    if (!manualFood.name.trim()) return;
    setFoodItems((prev) => [...prev, { ...manualFood }]);
    setManualFood({ name: '', quantity: 1, unit: 'serving', calories: 0, protein: 0, carbs: 0, fats: 0 });
    setShowManualEntry(false);
    setSuccess(`Added ${manualFood.name}`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleRemoveFood = (index) => {
    setFoodItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getTotals = () => {
    return foodItems.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const handleSave = async () => {
    if (foodItems.length === 0) {
      setError('Add at least one food item');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `${API_URL}/api/nutrition/meals/log`,
        { date, mealType, foodItems, notes: notes || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFoodItems([]);
      setNotes('');
      setSuccess('Meal logged successfully!');
      setTimeout(() => setSuccess(''), 3000);
      onMealLogged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      {/* Date & Meal Type Selector */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554] transition-colors"
            />
          </div>
        </div>

        {/* Meal Type Tabs */}
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setMealType(type.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                mealType === type.id
                  ? 'bg-[#3f8554] text-white shadow-lg shadow-[#3f8554]/20'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <type.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Food Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#225533]">Search & Add Foods</h3>
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="text-sm text-[#3f8554] font-semibold hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {showManualEntry ? 'Use Search' : 'Manual Entry'}
          </button>
        </div>

        {showManualEntry ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Food name"
                  value={manualFood.name}
                  onChange={(e) => setManualFood((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
                />
              </div>
              <input
                type="number"
                placeholder="Quantity"
                value={manualFood.quantity}
                onChange={(e) => setManualFood((p) => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
              />
              <input
                type="text"
                placeholder="Unit (g, cup, piece...)"
                value={manualFood.unit}
                onChange={(e) => setManualFood((p) => ({ ...p, unit: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
              />
              <input
                type="number"
                placeholder="Calories"
                value={manualFood.calories || ''}
                onChange={(e) => setManualFood((p) => ({ ...p, calories: parseInt(e.target.value) || 0 }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
              />
              <input
                type="number"
                placeholder="Protein (g)"
                value={manualFood.protein || ''}
                onChange={(e) => setManualFood((p) => ({ ...p, protein: parseFloat(e.target.value) || 0 }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={manualFood.carbs || ''}
                onChange={(e) => setManualFood((p) => ({ ...p, carbs: parseFloat(e.target.value) || 0 }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
              />
              <input
                type="number"
                placeholder="Fat (g)"
                value={manualFood.fats || ''}
                onChange={(e) => setManualFood((p) => ({ ...p, fats: parseFloat(e.target.value) || 0 }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3f8554]"
              />
            </div>
            <button
              onClick={handleAddManual}
              disabled={!manualFood.name.trim()}
              className="w-full py-3 bg-[#3f8554] text-white rounded-xl font-semibold hover:bg-[#225533] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Food Item
            </button>
          </div>
        ) : (
          <FoodSearch onAddFood={handleAddFromSearch} />
        )}
      </div>

      {/* Food Items List */}
      {foodItems.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-[#225533] mb-4">
            {MEAL_TYPES.find((t) => t.id === mealType)?.label} Items ({foodItems.length})
          </h3>

          <div className="space-y-2 mb-4">
            {foodItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UtensilsCrossed className="w-4 h-4 text-[#3f8554] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-gray-800 font-medium block truncate">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-800">{item.calories} cal</span>
                    <div className="text-xs text-gray-500">
                      P:{item.protein}g · C:{item.carbs}g · F:{item.fats}g
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFood(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Bar */}
          <div className="bg-[#225533] rounded-xl p-4 text-white grid grid-cols-4 gap-4 text-center mb-4">
            <div>
              <div className="text-xl font-bold">{totals.calories}</div>
              <div className="text-xs text-green-200 uppercase font-medium">Calories</div>
            </div>
            <div>
              <div className="text-xl font-bold">{totals.protein}g</div>
              <div className="text-xs text-green-200 uppercase font-medium">Protein</div>
            </div>
            <div>
              <div className="text-xl font-bold">{totals.carbs}g</div>
              <div className="text-xs text-green-200 uppercase font-medium">Carbs</div>
            </div>
            <div>
              <div className="text-xl font-bold">{totals.fats}g</div>
              <div className="text-xs text-green-200 uppercase font-medium">Fat</div>
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes (optional)..."
            rows={2}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-[#3f8554] resize-none text-sm"
          />

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#3f8554] text-white rounded-xl font-bold text-lg hover:bg-[#225533] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#3f8554]/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Log This Meal
              </>
            )}
          </button>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}
    </div>
  );
};

export default MealLogger;
