import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Image, Send } from 'lucide-react';
import TrainerNavbar from '../components/TrainerNavbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const categories = [
  { value: 'strength', label: '💪 Strength' },
  { value: 'cardio', label: '🏃 Cardio' },
  { value: 'flexibility', label: '🧘 Flexibility' },
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'mindfulness', label: '🧠 Mindfulness' },
  { value: 'general', label: '⭐ General' },
];

const goalTypes = [
  { value: 'count', label: 'Count', desc: 'E.g., 100 pushups total' },
  { value: 'duration', label: 'Duration', desc: 'E.g., 30 min daily' },
  { value: 'streak', label: 'Streak', desc: 'E.g., 30 consecutive days' },
];

const difficulties = [
  { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-700' },
];

const TrainerCreateChallenge = () => {
  const navigate = useNavigate();
  const [trainerName, setTrainerName] = useState('Trainer');
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'general', startDate: '', endDate: '',
    goalType: 'count', goalTarget: '', goalUnit: '', rules: '', maxParticipants: '', difficulty: 'beginner',
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setTrainerName(JSON.parse(stored).name || 'Trainer'); } catch {} }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => { if (val) fd.append(key, val); });
      if (coverImage) fd.append('coverImage', coverImage);
      const res = await fetch(`${API_URL}/api/community/challenges`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include', body: fd,
      });
      const data = await res.json();
      if (data.success) navigate(`/trainer/community/challenge/${data.data._id}`);
      else setError(data.message || 'Failed to create challenge');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TrainerNavbar trainerName={trainerName} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/trainer/community/challenges" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#225533] text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Challenges
        </Link>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#225533] to-[#3f8554] px-6 py-5">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy size={24} /> Create a Challenge</h1>
            <p className="text-green-100 text-sm mt-1">Inspire the community with a fitness challenge</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Challenge Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., 30-Day Pushup Challenge"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20 text-sm" required minLength={5} maxLength={200} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the challenge..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none focus:ring-2 focus:ring-[#3f8554]/20 text-sm resize-none" rows={4} required minLength={20} maxLength={5000} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Category *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {categories.map((cat) => (
                    <button key={cat.value} type="button" onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.category === cat.value ? 'bg-[#225533] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Difficulty *</label>
                <div className="space-y-1.5">
                  {difficulties.map((d) => (
                    <button key={d.value} type="button" onClick={() => setFormData({ ...formData, difficulty: d.value })}
                      className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.difficulty === d.value ? 'bg-[#225533] text-white' : `${d.color} hover:opacity-80`}`}>{d.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">End Date *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm" required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Goal Type *</label>
              <div className="flex gap-2">
                {goalTypes.map((gt) => (
                  <button key={gt.value} type="button" onClick={() => setFormData({ ...formData, goalType: gt.value })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium text-center transition-all ${formData.goalType === gt.value ? 'bg-[#225533] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <div>{gt.label}</div><div className="text-[10px] mt-0.5 opacity-80">{gt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Goal Target *</label>
                <input type="number" name="goalTarget" value={formData.goalTarget} onChange={handleChange} placeholder="e.g., 100"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm" required min={1} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Goal Unit *</label>
                <input type="text" name="goalUnit" value={formData.goalUnit} onChange={handleChange} placeholder="e.g., pushups, minutes, days"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm" required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Rules (separate with |)</label>
              <textarea name="rules" value={formData.rules} onChange={handleChange} placeholder="e.g., Must log daily | No skipping more than 2 days"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm resize-none" rows={2} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Max Participants (optional)</label>
              <input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} placeholder="e.g., 50"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#3f8554] focus:outline-none text-sm" min={1} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5"><Image size={14} className="inline mr-1" /> Cover Image (optional)</label>
              {coverPreview && (
                <div className="mb-2 relative rounded-lg overflow-hidden h-40">
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                    className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded hover:bg-red-500 transition-colors">Remove</button>
                </div>
              )}
              <label className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-[#3f8554] hover:bg-[#3f8554]/5 transition-all">
                <Image size={24} className="mx-auto text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload cover image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#225533] text-white font-bold hover:bg-[#3f8554] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <><Send size={18} /> Create Challenge</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainerCreateChallenge;
