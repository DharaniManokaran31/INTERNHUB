// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/main.css';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import LandingPage from './pages/public/Landing';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AcceptInvitePage from './pages/auth/AcceptInvitePage';

// Student Dashboard Pages
import StudentDashboard from './pages/student/DashboardPage';
import StudentInternships from './pages/student/BrowseInternshipsPage';
import StudentApplications from './pages/student/MyApplicationsPage';
import StudentResume from './pages/student/MyResumePage';
import ProfilePage from './pages/student/ProfilePage';

// Recruiter Dashboard Pages
import RecruiterDashboard from './pages/recruiter/DashboardPage';
import RecruiterManageInternships from './pages/recruiter/ManageInternshipsPage';
import RecruiterPostInternship from './pages/recruiter/PostInternshipPage';
import RecruiterProfile from './pages/recruiter/ProfilePage';
import RecruiterViewApplicants from './pages/recruiter/ViewApplicantsPage';
import StudentProfileViewPage from './pages/recruiter/StudentProfileViewPage';
import MyMenteesPage from './pages/recruiter/MyMenteesPage';
import InterviewsDashboardPage from './pages/recruiter/InterviewsDashboardPage';

// Admin Dashboard Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminManageUsers from './pages/admin/ManageUsersPage';
import AdminManageInternships from './pages/admin/ManageInternshipsPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminProfilePage from './pages/admin/ProfilePage';

// HR Dashboard Pages - ✅ ADD THIS IMPORT
import HRDashboard from './pages/hr/DashboardPage';

// Placeholder Pages (for development)
import PlaceholderPage from './pages/PlaceholderPage';

// Authentication helper functions
const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role;
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (userRole === 'recruiter') {
      return <Navigate to="/recruiter/dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'hr') {    // ✅ ADD THIS
      return <Navigate to="/hr/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes with MainLayout */}
          <Route path="/" element={
            <MainLayout>
              <LandingPage />
            </MainLayout>
          } />

          {/* Auth Routes with AuthLayout */}
          <Route path="/login" element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          } />

          <Route path="/register" element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          } />

          {/* Forgot Password Routes */}
          <Route path="/forgot-password" element={
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          } />

          <Route path="/reset-password/:token" element={
            <AuthLayout>
              <ResetPasswordPage />
            </AuthLayout>
          } />

          <Route path="/accept-invite/:token" element={
            <AuthLayout>
              <AcceptInvitePage />
            </AuthLayout>
          } />


          {/* Student Routes - Protected */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout role="student">
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout role="student">
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/student/internships" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout role="student">
                <StudentInternships />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/student/applications" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout role="student">
                <StudentApplications />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/student/resume" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout role="student">
                <StudentResume />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Recruiter Routes - Protected */}
          <Route path="/recruiter/dashboard" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <RecruiterDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/internships" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <RecruiterManageInternships />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/post-internship" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <RecruiterPostInternship />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/edit-internship/:internshipId" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <RecruiterPostInternship />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/applicants" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <RecruiterViewApplicants />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ✅ ADD THE INTERVIEWS ROUTE HERE */}
          <Route path="/recruiter/interviews" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <InterviewsDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />


          <Route path="/recruiter/profile" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <RecruiterProfile />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/student/:studentId" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <StudentProfileViewPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/mentees" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <MyMenteesPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ✅ HR Routes - Protected */}
          <Route path="/hr/dashboard" element={
            <ProtectedRoute allowedRoles={['hr']}>
              <DashboardLayout role="hr">
                <HRDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes - Protected */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <AdminManageUsers />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/internships" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <AdminManageInternships />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <AdminReports />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout role="admin">
                <AdminProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Placeholder Routes - Protected */}
          <Route path="/student/settings" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout role="student">
                <PlaceholderPage title="Student Settings" />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/recruiter/settings" element={
            <ProtectedRoute allowedRoles={['recruiter']}>
              <DashboardLayout role="recruiter">
                <PlaceholderPage title="Recruiter Settings" />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Smart Redirects */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {() => {
                const userRole = getUserRole();
                if (userRole === 'student') {
                  return <Navigate to="/student/dashboard" replace />;
                } else if (userRole === 'recruiter') {
                  return <Navigate to="/recruiter/dashboard" replace />;
                } else if (userRole === 'admin') {
                  return <Navigate to="/admin/dashboard" replace />;
                } else if (userRole === 'hr') {    // ✅ ADD THIS
                  return <Navigate to="/hr/dashboard" replace />;
                }
                return <Navigate to="/login" replace />;
              }}
            </ProtectedRoute>
          } />

          <Route path="/recruiter" element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} /> {/* ✅ ADD THIS */}

          {/* 404 Redirect */}
          <Route path="*" element={
            isAuthenticated() ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/" replace />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;