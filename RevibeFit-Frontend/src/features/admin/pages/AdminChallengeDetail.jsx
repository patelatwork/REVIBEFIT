import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Users, Target, Medal, Trash2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminChallengeDetail = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('accessToken');
  const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

  useEffect(() => { fetchChallenge(); fetchLeaderboard(); }, [challengeId]);

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/community/challenges/${challengeId}`, { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) setChallenge(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/challenges/${challengeId}/leaderboard`);
      const data = await res.json();
      if (data.success) setLeaderboard(data.data || []);
    } catch {}
  };





  const deleteChallenge = async () => {
    if (!window.confirm('Delete this challenge?')) return;
    try {
      const token = getToken();
      await fetch(`${API_URL}/api/community/challenges/${challengeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
      navigate('/admin/community/challenges');
    } catch {}
  };

  const currentUser = getCurrentUser();
  const now = new Date();
  const isActive = challenge && new Date(challenge.startDate) <= now && new Date(challenge.endDate) >= now;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <AdminSidebar activeSection="community" onSectionChange={() => {}} />

      <div className="lg:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 lg:pt-8">
          <Link to="/admin/community/challenges" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#225533] text-sm mb-6 transition-colors">
            <ArrowLeft size={15} /> Back to Challenges
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#225533]"></div></div>
          ) : !challenge ? (
            <div className="text-center py-20 text-gray-400">Challenge not found</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {challenge.coverImage && (
                    <img src={challenge.coverImage.startsWith('http') ? challenge.coverImage : `${API_URL}/${challenge.coverImage}`} alt="" className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{challenge.title}</h1>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-[#225533]/10 text-[#225533] rounded-full text-xs font-medium capitalize">{challenge.category}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-700' : challenge.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{challenge.difficulty}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isActive ? 'Active' : new Date(challenge.startDate) > now ? 'Upcoming' : 'Ended'}
                          </span>
                        </div>
                      </div>
                      <button onClick={deleteChallenge} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                    <p className="text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
                    {challenge.rules?.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Rules</h3>
                        <ul className="space-y-1">
                          {challenge.rules.map((r, i) => <li key={i} className="text-sm text-gray-500 flex items-start gap-2"><span className="text-[#225533] mt-0.5">•</span>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>



                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Medal size={20} className="text-[#225533]" /> Leaderboard</h3>
                  {leaderboard.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No participants yet</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry, i) => (
                        <div key={entry._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i < 3 ? 'bg-[#225533]/5' : 'bg-gray-50'}`}>
                          <span className="text-lg w-8 text-center">{medals[i] || `#${i + 1}`}</span>
                          <div className="w-8 h-8 rounded-full bg-[#225533] flex items-center justify-center text-white text-xs font-bold">{(entry.userName || 'U')[0].toUpperCase()}</div>
                          <span className="flex-1 font-medium text-sm text-gray-700">{entry.userName}</span>
                          <span className="text-sm font-semibold text-[#225533]">{entry.progress} {challenge.goalUnit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Target size={16} className="text-[#225533]" /><span className="font-medium">Goal:</span>{challenge.goalTarget} {challenge.goalUnit}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={16} className="text-[#225533]" /><span className="font-medium">Start:</span>{new Date(challenge.startDate).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={16} className="text-[#225533]" /><span className="font-medium">End:</span>{new Date(challenge.endDate).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Users size={16} className="text-[#225533]" /><span className="font-medium">Participants:</span>{challenge.participantsCount}{challenge.maxParticipants ? ` / ${challenge.maxParticipants}` : ''}</div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChallengeDetail;
