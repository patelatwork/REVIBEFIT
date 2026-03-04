import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Plus } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ChallengeCard from '../../community/components/ChallengeCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const statusTabs = [
  { value: 'active', label: 'Active' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const categoryFilters = ['all', 'strength', 'cardio', 'flexibility', 'nutrition', 'mindfulness', 'general'];
const difficultyFilters = ['all', 'beginner', 'intermediate', 'advanced'];

const AdminChallenges = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('active');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getToken = () => localStorage.getItem('accessToken');

  useEffect(() => { fetchChallenges(); }, [status, category, difficulty, page]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page, limit: 9, status });
      if (category !== 'all') params.append('category', category);
      if (difficulty !== 'all') params.append('difficulty', difficulty);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/community/challenges?${params}`, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) { setChallenges(data.data.challenges || []); setTotalPages(data.data.totalPages || 1); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="community" onSectionChange={() => {}} />

      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#225533] mb-1">Fitness Challenges</h1>
              <p className="text-gray-500 text-sm">Create and manage challenges for the community.</p>
            </div>
            <Link to="/admin/community/challenge/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#225533] text-white rounded-xl font-medium hover:bg-[#3f8554] transition-colors">
              <Plus size={18} /> Create Challenge
            </Link>
          </div>

          <div className="flex gap-2 mb-6">
            {statusTabs.map((tab) => (
              <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === tab.value ? 'bg-[#225533] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              {categoryFilters.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
              {difficultyFilters.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#225533]"></div></div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No challenges found</h3>
              <p className="text-gray-400 text-sm mb-4">Create the first challenge to get started!</p>
              <Link to="/admin/community/challenge/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#225533] text-white rounded-xl font-medium hover:bg-[#3f8554] transition-colors">
                <Plus size={18} /> Create Challenge
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((ch) => <ChallengeCard key={ch._id} challenge={ch} basePath="/admin/community" hideJoin={true} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-[#225533] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChallenges;
