// src/App.js
import React, { lazy, Suspense } from 'react';
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
import ActiveInternshipPage from './pages/student/ActiveInternshipPage';
import DailyLogFormPage from './pages/student/DailyLogFormPage';
import MyLogsPage from './pages/student/MyLogsPage';
import MilestonesPage from './pages/student/MilestonesPage';

// Recruiter Dashboard Pages
import RecruiterDashboard from './pages/recruiter/DashboardPage';
import RecruiterManageInternships from './pages/recruiter/ManageInternshipsPage';
import RecruiterPostInternship from './pages/recruiter/PostInternshipPage';
import RecruiterProfile from './pages/recruiter/ProfilePage';
import RecruiterViewApplicants from './pages/recruiter/ViewApplicantsPage';
import StudentProfileViewPage from './pages/recruiter/StudentProfileViewPage';
import MyMenteesPage from './pages/recruiter/MyMenteesPage';
import InterviewsDashboardPage from './pages/recruiter/InterviewsDashboardPage';
import ReviewLogsPage from './pages/recruiter/ReviewLogsPage';
import InternProgressPage from './pages/recruiter/InternProgressPage';
import MentorDashboardPage from './pages/recruiter/MentorDashboardPage';

// Admin Dashboard Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminManageUsers from './pages/admin/ManageUsersPage';
import AdminManageInternships from './pages/admin/ManageInternshipsPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminProfilePage from './pages/admin/ProfilePage';

// Common Components
import LoadingSpinner from './components/common/LoadingSpinner';

// Placeholder Pages (for development)
import PlaceholderPage from './pages/PlaceholderPage';

// HR Dashboard Pages - Lazy Loaded
const HRDashboard = lazy(() => import('./pages/hr/DashboardPage'));
const HrManageRecruitersPage = lazy(() => import('./pages/hr/ManageRecruitersPage'));
const HrInternshipsPage = lazy(() => import('./pages/hr/InternshipsPage'));
const HrApplicantsPage = lazy(() => import('./pages/hr/ApplicantsPage'));
const HrInternshipDetailsPage = lazy(() => import('./pages/hr/InternshipDetailsPage'));
const HrReportsPage = lazy(() => import('./pages/hr/ReportsPage'));
const HrCertificatesPage = lazy(() => import('./pages/hr/CertificatesPage'));
const HrActiveInternsPage = lazy(() => import('./pages/hr/ActiveInternsPage'));
const HrNotificationCenterPage = lazy(() => import('./pages/hr/NotificationCenterPage'));
const HrProfilePage = lazy(() => import('./pages/hr/ProfilePage'));
const HrActiveInternProgressPage = lazy(() => import('./pages/hr/ActiveInternProgressPage'));
const HrApplicationDetailsPage = lazy(() => import('./pages/hr/ApplicationDetailsPage'));
const HrCompletedInternsPage = lazy(() => import('./pages/hr/CompletedInternsPage'));
const HrStudentsPage = lazy(() => import('./pages/hr/StudentsPage'));
const HrAnalyticsPage = lazy(() => import('./pages/hr/AnalyticsPage'));
const HrSettingsPage = lazy(() => import('./pages/hr/SettingsPage'));

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
    if (userRole === 'student') return <Navigate to="/student/dashboard" replace />;
    if (userRole === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'hr') return <Navigate to="/hr/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Dashboard Redirect Component
const DashboardRedirect = () => {
    const userRole = getUserRole();
    if (userRole === 'student') return <Navigate to="/student/dashboard" replace />;
    if (userRole === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'hr') return <Navigate to="/hr/dashboard" replace />;
    return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes with MainLayout */}
          <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />

          {/* Auth Routes with AuthLayout */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
          <Route path="/reset-password/:token" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
          <Route path="/accept-invite/:token" element={<AuthLayout><AcceptInvitePage /></AuthLayout>} />

          {/* Student Routes - Protected */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout role="student"><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout role="student"><ProfilePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/active-internship" element={<ProtectedRoute allowedRoles={['student']}><ActiveInternshipPage /></ProtectedRoute>} />
          <Route path="/student/daily-log" element={<ProtectedRoute allowedRoles={['student']}><DailyLogFormPage /></ProtectedRoute>} />
          <Route path="/student/my-logs" element={<ProtectedRoute allowedRoles={['student']}><MyLogsPage /></ProtectedRoute>} />
          <Route path="/student/milestones" element={<ProtectedRoute allowedRoles={['student']}><MilestonesPage /></ProtectedRoute>} />
          <Route path="/student/internships" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout role="student"><StudentInternships /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout role="student"><StudentApplications /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/resume" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout role="student"><StudentResume /></DashboardLayout></ProtectedRoute>} />

          {/* Recruiter Routes - Protected */}
          <Route path="/recruiter/dashboard" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><RecruiterDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/internships" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><RecruiterManageInternships /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/post-internship" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><RecruiterPostInternship /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/edit-internship/:internshipId" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><RecruiterPostInternship /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/applicants" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><RecruiterViewApplicants /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/interviews" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><InterviewsDashboardPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/profile" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><RecruiterProfile /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/student/:studentId" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><StudentProfileViewPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/mentees" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><MyMenteesPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/mentor-dashboard" element={<ProtectedRoute allowedRoles={['recruiter', 'hr']}><MentorDashboardPage /></ProtectedRoute>} />
          <Route path="/recruiter/review-logs" element={<ProtectedRoute allowedRoles={['recruiter', 'hr']}><ReviewLogsPage /></ProtectedRoute>} />
          <Route path="/recruiter/intern-progress/:id" element={<ProtectedRoute allowedRoles={['recruiter', 'hr']}><InternProgressPage /></ProtectedRoute>} />

          {/* HR Routes - Protected */}
          <Route path="/hr/*" element={
            <ProtectedRoute allowedRoles={['hr']}>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="dashboard" element={<DashboardLayout role="hr"><HRDashboard /></DashboardLayout>} />
                  <Route path="recruiters" element={<DashboardLayout role="hr"><HrManageRecruitersPage /></DashboardLayout>} />
                  <Route path="internships" element={<DashboardLayout role="hr"><HrInternshipsPage /></DashboardLayout>} />
                  <Route path="internships/:id" element={<DashboardLayout role="hr"><HrInternshipDetailsPage /></DashboardLayout>} />
                  <Route path="applicants" element={<DashboardLayout role="hr"><HrApplicantsPage /></DashboardLayout>} />
                  <Route path="applicants/:id" element={<DashboardLayout role="hr"><HrApplicationDetailsPage /></DashboardLayout>} />
                  <Route path="reports" element={<DashboardLayout role="hr"><HrReportsPage /></DashboardLayout>} />
                  <Route path="certificates" element={<DashboardLayout role="hr"><HrCertificatesPage /></DashboardLayout>} />
                  <Route path="active-interns" element={<DashboardLayout role="hr"><HrActiveInternsPage /></DashboardLayout>} />
                  <Route path="active-interns/:id" element={<DashboardLayout role="hr"><HrActiveInternProgressPage /></DashboardLayout>} />
                  <Route path="notifications" element={<DashboardLayout role="hr"><HrNotificationCenterPage /></DashboardLayout>} />
                  <Route path="profile" element={<DashboardLayout role="hr"><HrProfilePage /></DashboardLayout>} />
                  <Route path="completed-interns" element={<DashboardLayout role="hr"><HrCompletedInternsPage /></DashboardLayout>} />
                  <Route path="students" element={<DashboardLayout role="hr"><HrStudentsPage /></DashboardLayout>} />
                  <Route path="analytics" element={<DashboardLayout role="hr"><HrAnalyticsPage /></DashboardLayout>} />
                  <Route path="settings" element={<DashboardLayout role="hr"><HrSettingsPage /></DashboardLayout>} />
                </Routes>
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Admin Routes - Protected */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin"><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin"><AdminManageUsers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/internships" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin"><AdminManageInternships /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin"><AdminReports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout role="admin"><AdminProfilePage /></DashboardLayout></ProtectedRoute>} />

          {/* Placeholder Routes */}
          <Route path="/student/settings" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout role="student"><PlaceholderPage title="Student Settings" /></DashboardLayout></ProtectedRoute>} />
          <Route path="/recruiter/settings" element={<ProtectedRoute allowedRoles={['recruiter']}><DashboardLayout role="recruiter"><PlaceholderPage title="Recruiter Settings" /></DashboardLayout></ProtectedRoute>} />

          {/* Smart Redirects */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
          <Route path="/recruiter" element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />

          {/* 404 Redirect */}
          <Route path="*" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;