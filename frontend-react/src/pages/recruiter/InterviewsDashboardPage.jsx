// src/pages/recruiter/InterviewsDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import FeedbackModal from '../../components/modals/FeedbackModal';
import '../../styles/StudentDashboard.css';

const InterviewsDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingSchedule: 0,
    upcoming: 0,
    pendingFeedback: 0,
    completed: 0,
    selected: 0,
    rejected: 0
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    department: '',
    company: 'Zoyaraa'
  });

  useEffect(() => {
    fetchRecruiterProfile();
    fetchInterviews();
  }, []);

  const fetchRecruiterProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        const initials = user.fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        setUserData({
          name: user.fullName,
          initials: initials,
          department: user.department || '',
          company: 'Zoyaraa'
        });
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/interviews/recruiter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setInterviews(data.data.interviews || []);
        setStats(data.data.stats || {
          total: 0,
          pendingSchedule: 0,
          upcoming: 0,
          pendingFeedback: 0,
          completed: 0,
          selected: 0,
          rejected: 0
        });
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      showNotification('Failed to load interviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openScheduleModal = (interview, round) => {
    setSelectedInterview(interview);
    setSelectedRound(round);
    setShowScheduleModal(true);
  };

  const openFeedbackModal = (interview, round) => {
    setSelectedInterview(interview);
    setSelectedRound(round);
    setShowFeedbackModal(true);
  };

  const handleScheduleSubmit = async (scheduleData) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/interviews/${selectedInterview._id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`Round ${scheduleData.roundNumber} scheduled successfully!`, 'success');
        setShowScheduleModal(false);
        fetchInterviews(); // Refresh list
      } else {
        showNotification(data.message || 'Failed to schedule', 'error');
      }
    } catch (error) {
      console.error('Error scheduling:', error);
      showNotification('Network error', 'error');
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/interviews/${selectedInterview._id}/result`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`Round ${feedbackData.roundNumber} result submitted!`, 'success');
        setShowFeedbackModal(false);
        fetchInterviews(); // Refresh list
      } else {
        showNotification(data.message || 'Failed to submit', 'error');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showNotification('Network error', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#FFF4E5', color: '#f59e0b', text: 'Pending' };
      case 'scheduled':
        return { bg: '#EEF2FF', color: '#2440F0', text: 'Scheduled' };
      case 'completed':
        return { bg: '#E6F7E6', color: '#10b981', text: 'Completed' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#dc2626', text: 'Cancelled' };
      case 'rescheduled':
        return { bg: '#f3e8ff', color: '#9333ea', text: 'Rescheduled' };
      default:
        return { bg: '#f3f4f6', color: '#1f2937', text: status };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || '';
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : type === 'info'
        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
        : 'linear-gradient(135deg, #2440F0, #0B1DC1)';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getFilteredInterviews = () => {
    if (filterStatus === 'all') return interviews;

    return interviews.filter(interview => {
      if (filterStatus === 'pending') {
        return interview.rounds.some(r => r.status === 'pending');
      } else if (filterStatus === 'scheduled') {
        return interview.rounds.some(r => r.status === 'scheduled');
      } else if (filterStatus === 'completed') {
        return interview.rounds.every(r => r.status === 'completed');
      } else if (filterStatus === 'selected') {
        return interview.overallStatus === 'selected';
      } else if (filterStatus === 'rejected') {
        return interview.overallStatus === 'rejected';
      }
      return true;
    });
  };

  const filteredInterviews = getFilteredInterviews();

  return (
    <div className="app-container">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <span className="sidebar-logo-text">Zoyaraa</span>
          </div>
          {/* Department Badge - Like PostInternshipPage */}
          <div className="department-badge" style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            textAlign: 'center',
            color: 'white'
          }}>
            {userData.department || 'Department'}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${location.pathname === '/recruiter/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span className="nav-item-text">Dashboard</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/internships') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Manage Internships</span>
          </button>
          <button
            className={`nav-item ${location.pathname.includes('/recruiter/mentor-dashboard') || location.pathname.includes('/recruiter/review-logs') || location.pathname.includes('/recruiter/mentees') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/mentor-dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.2 19L18 24M18 24L22.8 19M18 24V14M12 12A5 5 0 1 0 12 2A5 5 0 1 0 12 12Z" />
            </svg>
            <span className="nav-item-text">Mentor Dashboard</span>
          </button>


          <button
            className={`nav-item ${location.pathname.includes('/recruiter/post-internship') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/post-internship')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="nav-item-text">Post Internship</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/applicants') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/applicants')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="nav-item-text">View Applicants</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/interviews') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/interviews')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="nav-item-text">Interviews</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/mentees') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/mentees')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span className="nav-item-text">My Mentees</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/recruiter/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">
                {userData.department} • Zoyaraa
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button
              className="menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">
              Interview Management
            </h2>
          </div>
          <div className="top-bar-right">
            <NotificationBell />
            <button className="logout-btn" onClick={handleLogout}>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Interviews</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Need Schedule</div>
                <div className="stat-value">{stats.pendingSchedule}</div>
              </div>
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M3 9h18"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Upcoming</div>
                <div className="stat-value">{stats.upcoming}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Pending Feedback</div>
                <div className="stat-value">{stats.pendingFeedback}</div>
              </div>
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'all' ? '#2440F0' : 'white',
                color: filterStatus === 'all' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'pending' ? '#f59e0b' : 'white',
                color: filterStatus === 'pending' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Pending ({stats.pendingSchedule})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'scheduled' ? '#2440F0' : 'white',
                color: filterStatus === 'scheduled' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Upcoming ({stats.upcoming})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'completed' ? '#10b981' : 'white',
                color: filterStatus === 'completed' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilterStatus('selected')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'selected' ? '#10b981' : 'white',
                color: filterStatus === 'selected' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Selected ({stats.selected})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'rejected' ? '#dc2626' : 'white',
                color: filterStatus === 'rejected' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          {/* Interviews List */}
          {loading ? (
            <div className="loading-placeholder">Loading interviews...</div>
          ) : filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>No interviews found</h3>
              <p>Start by shortlisting candidates from the Applicants page</p>
              <button
                className="primary-btn"
                onClick={() => navigate('/recruiter/applicants')}
              >
                Go to Applicants
              </button>
            </div>
          ) : (
            <div className="interviews-list">
              {filteredInterviews.map((interview) => (
                <div key={interview._id} className="interview-card" style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {interview.studentId?.fullName || 'Unknown'}
                      </h3>
                      <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                        {interview.internshipId?.title || 'Internship'} • Round {interview.currentRound}/{interview.rounds.length}
                      </p>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: interview.overallStatus === 'selected' ? '#E6F7E6' :
                        interview.overallStatus === 'rejected' ? '#fee2e2' : '#EEF2FF',
                      color: interview.overallStatus === 'selected' ? '#10b981' :
                        interview.overallStatus === 'rejected' ? '#dc2626' : '#2440F0'
                    }}>
                      {interview.overallStatus === 'selected' ? 'SELECTED' :
                        interview.overallStatus === 'rejected' ? 'REJECTED' : 'IN PROGRESS'}
                    </div>
                  </div>

                  {/* Rounds */}
                  <div style={{ marginTop: '1rem' }}>
                    {interview.rounds.map((round, index) => {
                      const badge = getStatusBadge(round.status);
                      const isCurrentRound = round.roundNumber === interview.currentRound;
                      const isCompleted = round.status === 'completed';
                      const isScheduled = round.status === 'scheduled';
                      const isPending = round.status === 'pending';

                      return (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          background: isCurrentRound ? '#f5f3ff' : '#f9fafb',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          border: isCurrentRound ? '1px solid #8b5cf6' : '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '12px',
                              background: isCurrentRound ? '#8b5cf6' : '#d1d5db',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {round.roundNumber}
                            </div>
                            <div>
                              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                {round.roundType}
                                {isCurrentRound && !isCompleted && (
                                  <span style={{
                                    marginLeft: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#8b5cf6',
                                    fontWeight: '500'
                                  }}>
                                    ● Current Round
                                  </span>
                                )}
                              </p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {round.status === 'scheduled' ? (
                                  <>📅 {formatDate(round.scheduledDate)} at {formatTime(round.scheduledTime)}</>
                                ) : round.status === 'completed' ? (
                                  <>✓ Completed {round.result === 'pass' ? '• Passed' : round.result === 'fail' ? '• Failed' : ''}</>
                                ) : (
                                  <>⏳ Not scheduled</>
                                )}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {isPending && (
                              <button
                                onClick={() => openScheduleModal(interview, round)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  border: 'none',
                                  borderRadius: '4px',
                                  background: '#2440F0',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Schedule
                              </button>
                            )}
                            {isScheduled && (
                              <>
                                <button
                                  onClick={() => openScheduleModal(interview, round)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '4px',
                                    background: 'white',
                                    color: '#f59e0b',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => openFeedbackModal(interview, round)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    border: 'none',
                                    borderRadius: '4px',
                                    background: '#10b981',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Add Result
                                </button>
                              </>
                            )}
                            {isCompleted && round.result === 'pending' && (
                              <button
                                onClick={() => openFeedbackModal(interview, round)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  border: 'none',
                                  borderRadius: '4px',
                                  background: '#f59e0b',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Add Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showScheduleModal && selectedInterview && selectedRound && (
        <ScheduleInterviewModal
          interview={selectedInterview}
          round={selectedRound}
          onClose={() => setShowScheduleModal(false)}
          onSubmit={handleScheduleSubmit}
        />
      )}

      {showFeedbackModal && selectedInterview && selectedRound && (
        <FeedbackModal
          interview={selectedInterview}
          round={selectedRound}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default InterviewsDashboardPage;