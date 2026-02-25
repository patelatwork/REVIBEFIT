import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Leaf,
  Activity,
  Utensils,
  ChevronRight,
  Target,
  Heart,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import NutritionProfileForm from '../components/NutritionProfileForm';
import MealPlanGenerator from '../components/MealPlanGenerator';
import MealPlanDisplay from '../components/MealPlanDisplay';
import SavedMealPlans from '../components/SavedMealPlans';

const NutritionPlan = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [nutritionProfile, setNutritionProfile] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [selectedSavedPlan, setSelectedSavedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchNutritionProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNutritionProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:8000/api/nutrition/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNutritionProfile(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setNutritionProfile(null);
      } else {
        console.error('Error fetching nutrition profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    navigate('/login', { state: { returnTo: '/nutrition' } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffff0] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Leaf className="w-12 h-12 text-[#3f8554]" />
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // LANDING PAGE (Unauthenticated)
  // ----------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-[#fffff0] overflow-hidden selection:bg-[#3f8554] selection:text-white">

        {/* Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#3f8554]/10 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-[#225533]/10 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        </div>

        {/* Navbar Placeholder (if needed, or assume global navbar is present) */}

        {/* Hero Section */}
        <section className="relative z-10 pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-[#3f8554]/20 rounded-full px-4 py-2 mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-[#3f8554] animate-pulse"></span>
                  <span className="text-sm font-semibold text-[#225533] tracking-wide uppercase">Smart Nutrition</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-extrabold text-[#225533] leading-[1.1] mb-6 tracking-tight">
                  Fuel Your Body <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3f8554] to-[#88c498]">
                    With Intelligence
                  </span>
                </h1>

                <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
                  Stop guessing. Start thriving. Get personalized meal plans, macro tracking, and recipes tailored to your unique biology and goals.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleGetStarted}
                    className="group relative px-8 py-4 bg-[#3f8554] text-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl shadow-[#3f8554]/30 hover:shadow-2xl hover:shadow-[#3f8554]/40 transition-all hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative flex items-center">
                      Start Your Journey
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                  <button className="px-8 py-4 bg-white text-[#225533] border-2 border-[#225533]/10 rounded-2xl font-bold text-lg hover:bg-[#225533]/5 transition-colors">
                    View Demo
                  </button>
                </div>

                <div className="mt-12 flex items-center space-x-8 text-gray-500">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-[#3f8554] mr-2" />
                    <span>Personalized</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-[#3f8554] mr-2" />
                    <span>Science-backed</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-[#3f8554] mr-2" />
                    <span>Easy to follow</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-8 shadow-2xl transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                  {/* Mock UI Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800">Today's Lunch</h3>
                        <p className="text-sm text-gray-500">Grilled Salmon Bowl</p>
                      </div>
                      <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                        540 kcal
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3f8554] w-[70%]" />
                      </div>
                      <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[45%]" />
                      </div>
                      <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 w-[30%]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <Utensils className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">1,850</div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Calories Left</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">145g</div>
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Protein Goal</div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-12 -right-12 bg-white p-4 rounded-2xl shadow-xl z-20"
                >
                  <Leaf className="w-8 h-8 text-[#3f8554]" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-8 -left-8 bg-[#225533] p-4 rounded-2xl shadow-xl z-20"
                >
                  <Heart className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 relative z-10">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-[#225533] mb-4">Everything You Need to Succeed</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Comprehensive tools designed to make nutrition simple, effective, and sustainable.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "Smart Goals",
                  desc: "We calculate your BMR and TDEE to set precise calorie and macro targets.",
                  color: "blue"
                },
                {
                  icon: Zap,
                  title: "Auto Generation",
                  desc: "Get instant, varied meal plans that fit your taste buds and schedule.",
                  color: "yellow"
                },
                {
                  icon: Utensils,
                  title: "Macro Tracking",
                  desc: "Log meals effortlessly and watch your progress in real-time.",
                  color: "green"
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2rem] p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-[#3f8554]/30 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold text-[#225533] mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="relative bg-[#225533] rounded-[3rem] p-12 md:p-20 overflow-hidden text-center">
              {/* Abstract Patterns */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#grid)" />
                </svg>
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
              </div>

              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform?
                </h2>
                <p className="text-green-100 text-xl mb-10 max-w-2xl mx-auto">
                  Join thousands of users who have already taken control of their nutrition.
                </p>
                <button
                  onClick={handleGetStarted}
                  className="bg-white text-[#225533] px-10 py-4 rounded-2xl font-bold text-lg hover:bg-green-50 transform hover:scale-105 transition-all shadow-xl"
                >
                  Get Started Now
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    );
  }

  // ----------------------------------------------------------------------
  // AUTHENTICATED APP (Dashboard)
  // ----------------------------------------------------------------------
  if (!nutritionProfile) {
    return (
      <div className="min-h-screen bg-[#fffff0] pt-20">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <NutritionProfileForm onProfileCreated={(profile) => {
              setNutritionProfile(profile);
              setActiveTab('overview');
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffff0] pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#225533] mb-2">Nutrition Dashboard</h1>
          <p className="text-gray-600">Track your nutrition and achieve your fitness goals</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'profile', label: 'My Profile' },
            { id: 'mealPlan', label: 'Generate Plan' },
            { id: 'savedPlans', label: 'My Plans' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-[#3f8554] text-white shadow-lg shadow-[#3f8554]/20'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Summary Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-100 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-[#225533]">Your Profile Summary</h2>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="text-[#3f8554] text-sm font-semibold hover:underline"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-gray-500 text-sm mb-4 font-bold uppercase tracking-wider">Physical Stats</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Height</span>
                        <span className="font-bold text-gray-900">{nutritionProfile.height} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight</span>
                        <span className="font-bold text-gray-900">{nutritionProfile.weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">BMI</span>
                        <span className="font-bold text-[#3f8554]">{nutritionProfile.bmi}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-gray-500 text-sm mb-4 font-bold uppercase tracking-wider">Goals</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goal</span>
                        <span className="font-bold text-gray-900 capitalize">{nutritionProfile.fitnessGoal.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Activity</span>
                        <span className="font-bold text-gray-900 capitalize">{nutritionProfile.activityLevel.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-gray-500 text-sm mb-4 font-bold uppercase tracking-wider">Preferences</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Diet</span>
                        <span className="font-bold text-gray-900 capitalize">{nutritionProfile.dietaryPreference.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Meals/Day</span>
                        <span className="font-bold text-gray-900">{nutritionProfile.mealsPerDay}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-1 gap-6">
                <button
                  onClick={() => setActiveTab('mealPlan')}
                  className="group relative overflow-hidden bg-gradient-to-br from-[#3f8554] to-[#225533] rounded-3xl p-8 text-left shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                      <ChevronRight className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Generate Meal Plan</h3>
                    <p className="text-green-100">Get personalized recommendations tailored to your goals.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <h2 className="text-2xl font-bold text-[#225533] mb-6">Update Your Profile</h2>
              <NutritionProfileForm
                existingProfile={nutritionProfile}
                onProfileCreated={(profile) => {
                  setNutritionProfile(profile);
                  setActiveTab('overview');
                }}
              />
            </div>
          )}

          {activeTab === 'mealPlan' && (
            generatedPlan ? (
              <MealPlanDisplay
                mealPlan={generatedPlan}
                onReset={() => setGeneratedPlan(null)}
              />
            ) : (
              <MealPlanGenerator
                nutritionProfile={nutritionProfile}
                onPlanGenerated={(plan) => {
                  setGeneratedPlan(plan);
                  setActiveTab('savedPlans');
                }}
              />
            )
          )}

          {activeTab === 'savedPlans' && (
            selectedSavedPlan ? (
              <MealPlanDisplay
                mealPlan={selectedSavedPlan}
                onReset={() => setSelectedSavedPlan(null)}
              />
            ) : (
              <SavedMealPlans
                onSelectPlan={(plan) => setSelectedSavedPlan(plan)}
              />
            )
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NutritionPlan;
