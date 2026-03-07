import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './features/landing-page/pages/LandingPage'
import Login from './features/auth/Login'
import Signup from './features/auth/Signup'
import FitnessEnthusiastDashboard from './features/fitness-enthusiast/pages/Dashboard'
import FitnessEnthusiastNavbar from './features/fitness-enthusiast/components/FitnessEnthusiastNavbar'
import Trainers from './features/fitness-enthusiast/pages/Trainers'
import Blog from './features/fitness-enthusiast/pages/Blog'
import BlogDetail from './features/fitness-enthusiast/pages/BlogDetail'
import ReadBlogs from './features/fitness-enthusiast/pages/ReadBlogs'
import CompletedWorkouts from './features/fitness-enthusiast/pages/CompletedWorkouts'
import Care from './features/fitness-enthusiast/pages/Care'
import FitnessEnthusiastCare from './features/fitness-enthusiast/pages/FitnessEnthusiastCare'
import MyBookings from './features/fitness-enthusiast/pages/MyBookings'
import Workouts from './features/fitness-enthusiast/pages/Workouts'
import NutritionPlan from './features/fitness-enthusiast/pages/NutritionPlan'
import TrainerDashboard from './features/trainer/pages/Dashboard'
import UploadBlog from './features/trainer/pages/UploadBlog'
import TrainerLiveClasses from './features/trainer/pages/TrainerLiveClasses'
import MyClients from './features/trainer/pages/MyClients'
import TrainerSchedule from './features/trainer/pages/TrainerSchedule'
import TrainerEarnings from './features/trainer/pages/TrainerEarnings'
import TrainerProfile from './features/trainer/pages/TrainerProfile'
import LabPartnerDashboard from './features/lab-partner/pages/Dashboard'
import ManageTests from './features/lab-partner/pages/ManageTests'
import ManageBookings from './features/lab-partner/pages/ManageBookings'
import MyInvoices from './features/lab-partner/pages/MyInvoices'
import LabReports from './features/lab-partner/pages/LabReports'
import LabProfile from './features/lab-partner/pages/LabProfile'
import Settlements from './features/lab-partner/pages/Settlements'

import AdminDashboard from './features/admin/pages/AdminDashboard'
import PendingApprovals from './features/admin/pages/PendingApprovals'
import InvoiceManagement from './features/admin/pages/InvoiceManagement'
import Classes from './features/fitness-enthusiast/pages/Classes'
import LiveClasses from './features/fitness-enthusiast/pages/LiveClasses'
import ClassVideoRoom from './features/fitness-enthusiast/pages/ClassVideoRoom'
import TrainerVideoRoom from './features/trainer/pages/TrainerVideoRoom'
import LabEarningsAnalytics from './features/admin/pages/LabEarningsAnalytics'

import ManagerDashboard from './features/manager/pages/ManagerDashboard'
import ManagerPendingApprovals from './features/manager/pages/ManagerPendingApprovals'
import ManagerUsers from './features/manager/pages/ManagerUsers'
import ManagerInvoices from './features/manager/pages/ManagerInvoices'
import ManagerEarnings from './features/manager/pages/ManagerEarnings'
import ManagerCommissionRequests from './features/manager/pages/ManagerCommissionRequests'
import ManagerProfile from './features/manager/pages/ManagerProfile'
import AdminManagers from './features/admin/pages/AdminManagers'
import ManagerArchive from './features/admin/pages/ManagerArchive'
import ForgotPassword from './features/auth/ForgotPassword'
import ResetPassword from './features/auth/ResetPassword'

import CommunityFeed from './features/community/pages/CommunityFeed'
import PostDetail from './features/community/pages/PostDetail'
import Challenges from './features/community/pages/Challenges'
import ChallengeDetail from './features/community/pages/ChallengeDetail'
import CreateChallenge from './features/community/pages/CreateChallenge'

import TrainerCommunity from './features/trainer/pages/TrainerCommunity'
import TrainerPostDetail from './features/trainer/pages/TrainerPostDetail'
import TrainerChallenges from './features/trainer/pages/TrainerChallenges'
import TrainerChallengeDetail from './features/trainer/pages/TrainerChallengeDetail'
import TrainerCreateChallenge from './features/trainer/pages/TrainerCreateChallenge'

import AdminCommunity from './features/admin/pages/AdminCommunity'
import AdminPostDetail from './features/admin/pages/AdminPostDetail'
import AdminChallenges from './features/admin/pages/AdminChallenges'
import AdminChallengeDetail from './features/admin/pages/AdminChallengeDetail'
import AdminCreateChallenge from './features/admin/pages/AdminCreateChallenge'

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check user on mount
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user:', error);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();

    // Check for user changes every second
    const interval = setInterval(checkUser, 1000);

    return () => clearInterval(interval);
  }, []);

  const isFitnessEnthusiast = user && user.userType === 'fitness-enthusiast';


  return (
    <>
      <Routes>
        {/* Routes without Navbar and Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin Routes (no navbar/footer) */}

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pending-approvals" element={<PendingApprovals />} />
        <Route path="/admin/invoices" element={<InvoiceManagement />} />
        <Route path="/admin/analytics/lab-earnings" element={<LabEarningsAnalytics />} />
        <Route path="/admin/earnings" element={<LabEarningsAnalytics />} />
        <Route path="/admin/managers" element={<AdminManagers />} />
        <Route path="/admin/managers/all" element={<ManagerArchive />} />

        {/* Admin Community */}
        <Route path="/admin/community" element={<AdminCommunity />} />
        <Route path="/admin/community/post/:postId" element={<AdminPostDetail />} />
        <Route path="/admin/community/challenges" element={<AdminChallenges />} />
        <Route path="/admin/community/challenge/create" element={<AdminCreateChallenge />} />
        <Route path="/admin/community/challenge/:challengeId" element={<AdminChallengeDetail />} />

        {/* Manager Routes (no navbar/footer) */}

        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/pending-approvals" element={<ManagerPendingApprovals />} />
        <Route path="/manager/users" element={<ManagerUsers />} />
        <Route path="/manager/invoices" element={<ManagerInvoices />} />
        <Route path="/manager/earnings" element={<ManagerEarnings />} />
        <Route path="/manager/commission-requests" element={<ManagerCommissionRequests />} />
        <Route path="/manager/profile" element={<ManagerProfile />} />

        {/* Trainer Dashboard (custom navbar, no footer) */}
        <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
        <Route path="/trainer/upload-blog" element={<UploadBlog />} />
        <Route path="/trainer/live-classes" element={<TrainerLiveClasses />} />
        <Route path="/trainer/class-room/:classId" element={<TrainerVideoRoom />} />
        <Route path="/trainer/clients" element={<MyClients />} />
        <Route path="/trainer/schedule" element={<TrainerSchedule />} />
        <Route path="/trainer/earnings" element={<TrainerEarnings />} />
        <Route path="/trainer/profile" element={<TrainerProfile />} />

        {/* Trainer Community */}
        <Route path="/trainer/community" element={<TrainerCommunity />} />
        <Route path="/trainer/community/post/:postId" element={<TrainerPostDetail />} />
        <Route path="/trainer/community/challenges" element={<TrainerChallenges />} />
        <Route path="/trainer/community/challenge/create" element={<TrainerCreateChallenge />} />
        <Route path="/trainer/community/challenge/:challengeId" element={<TrainerChallengeDetail />} />

        {/* Lab Partner Dashboard (custom navbar, no footer) */}
        <Route path="/lab-partner/dashboard" element={<LabPartnerDashboard />} />
        <Route path="/lab-partner/manage-tests" element={<ManageTests />} />
        <Route path="/lab-partner/manage-bookings" element={<ManageBookings />} />
        <Route path="/lab-partner/invoices" element={<MyInvoices />} />
        <Route path="/lab-partner/settlements" element={<Settlements />} />
        <Route path="/lab-partner/reports" element={<LabReports />} />
        <Route path="/lab-partner/profile" element={<LabProfile />} />

        {/* Fitness Enthusiast Dashboard (custom navbar with footer) */}
        <Route path="/fitness-enthusiast/dashboard" element={
          <>
            <FitnessEnthusiastNavbar userName={user?.name} />
            <FitnessEnthusiastDashboard />
            <Footer />
          </>
        } />

        {/* Fitness Enthusiast Care - My Lab Bookings */}
        <Route path="/fitness-enthusiast/care" element={
          <>
            <FitnessEnthusiastNavbar userName={user?.name} />
            <FitnessEnthusiastCare />
            <Footer />
          </>
        } />

        {/* WebRTC Video Room — Participant (full screen, no nav/footer) */}
        <Route path="/class-room/:classId" element={<ClassVideoRoom />} />

        {/* Classes Page */}
        <Route path="/classes" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <Classes />
            <Footer />
          </>
        } />

        {/* Workouts Page */}
        <Route path="/workouts" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <Workouts />
            <Footer />
          </>
        } />

        {/* Nutrition Plan Page */}
        <Route path="/nutrition" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <NutritionPlan />
            <Footer />
          </>
        } />

        {/* Community Routes */}
        <Route path="/community" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <CommunityFeed />
            <Footer />
          </>
        } />
        <Route path="/community/post/:postId" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <PostDetail />
            <Footer />
          </>
        } />
        <Route path="/community/challenges" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <Challenges />
            <Footer />
          </>
        } />
        <Route path="/community/challenge/:challengeId" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <ChallengeDetail />
            <Footer />
          </>
        } />
        <Route path="/community/challenge/create" element={
          <>
            {isFitnessEnthusiast ? (
              <FitnessEnthusiastNavbar userName={user?.name} />
            ) : (
              <Navbar />
            )}
            <CreateChallenge />
            <Footer />
          </>
        } />

        {/* Routes with Navbar and Footer */}
        <Route
          path="*"
          element={
            <>
              {isFitnessEnthusiast ? (
                <FitnessEnthusiastNavbar userName={user?.name} />
              ) : (
                <Navbar />
              )}
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/trainers" element={<Trainers />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogDetail />} />
                <Route path="/fitness-enthusiast/read-blogs" element={<ReadBlogs />} />
                <Route path="/fitness-enthusiast/completed-workouts" element={<CompletedWorkouts />} />
                <Route path="/fitness-enthusiast/live-classes" element={<LiveClasses />} />
                <Route path="/care" element={<Care />} />
                <Route path="/my-bookings" element={<MyBookings />} />

                {/* Add more routes here as needed */}
              </Routes>
              <Footer />
            </>
          }
        />
      </Routes>
    </>
  )
}

export default App
