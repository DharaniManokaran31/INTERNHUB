// src/pages/recruiter/InterviewsDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import FeedbackModal from '../../components/modals/FeedbackModal';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import '../../styles/StudentDashboard.css';

const InterviewsDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState({
    interviews: true,
    action: false
  });
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
  const [selectedRound, setSelectedRound] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    initials: '',
    department: '',
    company: 'Zoyaraa',
    email: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 3,
    totalPages: 1
  });

  // Fetch recruiter profile on mount
  useEffect(() => {
    fetchRecruiterProfile();
  }, []);

  // Fetch interviews when profile is loaded
  useEffect(() => {
    if (userData.email) {
      fetchInterviews();
    }
  }, [userData.email]);

  // Reset to first page when filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filterStatus]);

  const fetchRecruiterProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        const fullName = user.fullName || user.name || '';
        const initials = fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'R';

        setUserData({
          name: fullName,
          initials: initials,
          department: user.department || '',
          company: 'Zoyaraa',
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(prev => ({ ...prev, interviews: true }));
      const token = localStorage.getItem('authToken');

      const response = await fetch('https://internhub-backend-d870.onrender.com/api/interviews/recruiter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      console.log('📊 Interviews response:', data);

      if (data.success) {
        const interviewsList = data.data.interviews || [];
        console.log(`✅ Found ${interviewsList.length} interviews`);
        
        setInterviews(interviewsList);
        
        // Calculate stats properly
        const stats = calculateStats(interviewsList);
        setStats(stats);
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(interviewsList.length / prev.itemsPerPage)
        }));
      } else {
        console.log('❌ Failed to fetch interviews:', data.message);
        showNotification('Failed to load interviews', 'error');
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, interviews: false }));
    }
  };

  const calculateStats = (interviewsList) => {
    let pendingSchedule = 0;
    let upcoming = 0;
    let pendingFeedback = 0;
    let completed = 0;
    let selected = 0;
    let rejected = 0;

    interviewsList.forEach(interview => {
      // Check overall status
      if (interview.overallStatus === 'selected') selected++;
      else if (interview.overallStatus === 'rejected') rejected++;
      
      // Flags per interview to prevent double counting
      let hasPendingSchedule = false;
      let hasUpcoming = false;
      let hasPendingFeedback = false;

      // Check rounds
      interview.rounds?.forEach(round => {
        if (round.status === 'pending' && round.roundNumber === interview.currentRound) {
          hasPendingSchedule = true;
        }
        else if (round.status === 'scheduled') {
          hasUpcoming = true;
        }
        else if (round.status === 'completed') {
          completed++; // Completed rounds sum up
          if (round.result === 'pending') {
            hasPendingFeedback = true;
          }
        }
      });

      if (hasPendingSchedule) pendingSchedule++;
      if (hasUpcoming) upcoming++;
      if (hasPendingFeedback) pendingFeedback++;
    });

    return {
      total: interviewsList.length,
      pendingSchedule,
      upcoming,
      pendingFeedback,
      completed,
      selected,
      rejected
    };
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
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('authToken');

      console.log('📤 Scheduling round:', scheduleData);

      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/interviews/${selectedInterview._id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scheduleData)
      });

      const data = await response.json();
      console.log('📊 Schedule response:', data);

      if (data.success) {
        showNotification(`Round ${scheduleData.roundNumber} scheduled successfully!`, 'success');
        setShowScheduleModal(false);
        await fetchInterviews(); // Refresh list
      } else {
        console.error('❌ Schedule failed:', data);
        showNotification(data.message || 'Failed to schedule interview', 'error');
      }
    } catch (error) {
      console.error('Error scheduling:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('authToken');

      console.log('📤 Submitting feedback:', feedbackData);

      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/interviews/${selectedInterview._id}/result`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      const data = await response.json();
      console.log('📊 Feedback response:', data);

      if (data.success) {
        showNotification(`Round ${feedbackData.roundNumber} result submitted!`, 'success');
        setShowFeedbackModal(false);
        await fetchInterviews(); // Refresh list
      } else {
        console.error('❌ Feedback failed:', data);
        showNotification(data.message || 'Failed to submit feedback', 'error');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const getFilteredInterviews = useCallback(() => {
    if (filterStatus === 'all') return interviews;

    return interviews.filter(interview => {
      if (filterStatus === 'pending') {
        return interview.rounds?.some(r => r.status === 'pending');
      } else if (filterStatus === 'scheduled') {
        return interview.rounds?.some(r => r.status === 'scheduled');
      } else if (filterStatus === 'completed') {
        return interview.rounds?.every(r => r.status === 'completed');
      } else if (filterStatus === 'selected') {
        return interview.overallStatus === 'selected';
      } else if (filterStatus === 'rejected') {
        return interview.overallStatus === 'rejected';
      }
      return true;
    });
  }, [interviews, filterStatus]);

  const showNotification = (message, type = 'success') => {
    // Remove existing notifications
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'error'
        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
        : type === 'info'
          ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
          : 'linear-gradient(135deg, #2440F0, #0B1DC1)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-size: 0.9375rem;
      font-weight: 500;
    `;
    notification.textContent = message;
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

  const handlePageChange = (pageNumber) => {
    setPagination(prev => ({ ...prev, currentPage: pageNumber }));
    document.querySelector('.interviews-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredInterviews = getFilteredInterviews();
  const indexOfLastItem = pagination.currentPage * pagination.itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - pagination.itemsPerPage;
  const currentInterviews = filteredInterviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInterviews.length / pagination.itemsPerPage);

  return (
    <div className="app-container">
      <RecruiterSidebar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        userData={userData} 
      />

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">
              Interview Management
              {userData.department && (
                <span style={{ 
                  fontSize: '0.9rem', 
                  marginLeft: '1rem', 
                  color: '#666',
                  background: '#EEF2FF',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px'
                }}>
                  {userData.department} Department
                </span>
              )}
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
          <div className="stats-grid" style={{ 
            marginBottom: '2rem',
            gridTemplateColumns: 'repeat(4, 1fr)'
          }}>
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

          {/* Second Row Stats - Selection Status */}
          <div className="stats-grid" style={{ 
            marginBottom: '2rem',
            gridTemplateColumns: 'repeat(3, 1fr)'
          }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Selected</div>
                <div className="stat-value">{stats.selected}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Rejected</div>
                <div className="stat-value">{stats.rejected}</div>
              </div>
              <div className="stat-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ 
            marginBottom: '1.5rem', 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap' 
          }}>
            <button
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                background: filterStatus === 'all' ? '#2440F0' : 'white',
                color: filterStatus === 'all' ? 'white' : '#1f2937',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
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
                fontWeight: '500',
                transition: 'all 0.2s'
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
                fontWeight: '500',
                transition: 'all 0.2s'
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
                fontWeight: '500',
                transition: 'all 0.2s'
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
                fontWeight: '500',
                transition: 'all 0.2s'
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
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          {/* Interviews List */}
          {loading.interviews ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div className="loading-spinner"></div>
              <p style={{ color: '#666' }}>Loading interviews...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No interviews found</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Start by shortlisting candidates from the Applicants page
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate('/recruiter/applicants')}
                style={{ padding: '0.75rem 2rem' }}
              >
                Go to Applicants
              </button>
            </div>
          ) : (
            <>
              <div className="interviews-list">
                {currentInterviews.map((interview) => {
                  const student = interview.studentId || interview.student || {};
                  const internship = interview.internshipId || interview.internship || {};

                  return (
                    <div key={interview._id} className="interview-card" style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      {/* Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: '1rem' 
                      }}>
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                            {student.fullName || student.name || 'Unknown Candidate'}
                          </h3>
                          <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                            {internship.title || 'Internship'} • Round {interview.currentRound || 1}/{interview.rounds?.length || 1}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            📧 {student.email || 'No email'}
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
                        {(interview.rounds || []).map((round, index) => {
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
                                      <>📅 {formatDate(round.scheduledDate)} at {round.scheduledTime || 'TBD'}</>
                                    ) : round.status === 'completed' ? (
                                      <>✓ Completed {round.result === 'pass' ? '• Passed' : round.result === 'fail' ? '• Failed' : ''}</>
                                    ) : (
                                      <>⏳ Not scheduled</>
                                    )}
                                  </p>
                                </div>
                              </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {isPending && isCurrentRound && round.roundType !== 'HR Interview' && (
                                    <button
                                      onClick={() => openScheduleModal(interview, round)}
                                      disabled={loading.action}
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        border: 'none',
                                        borderRadius: '4px',
                                        background: '#2440F0',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#0B1DC1'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = '#2440F0'}
                                    >
                                      Schedule
                                    </button>
                                  )}
                                  {isPending && isCurrentRound && round.roundType === 'HR Interview' && (
                                    <button
                                      onClick={() => {
                                        showNotification('HR Department has been notified to schedule this round.', 'success');
                                      }}
                                      disabled={loading.action}
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        border: '1px solid #10b981',
                                        borderRadius: '4px',
                                        background: '#e6f7e6',
                                        color: '#10b981',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#10b981';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#e6f7e6';
                                        e.currentTarget.style.color = '#10b981';
                                      }}
                                    >
                                      Notify HR
                                    </button>
                                  )}
                                  {isPending && !isCurrentRound && (
                                    <div style={{
                                        padding: '0.25rem 0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        background: '#f9fafb',
                                        color: '#6b7280',
                                        fontSize: '0.75rem',
                                      }}>
                                      Complete previous round
                                    </div>
                                  )}
                                  {isScheduled && round.roundType !== 'HR Interview' && (
                                  <>
                                    <button
                                      onClick={() => openScheduleModal(interview, round)}
                                      disabled={loading.action}
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '4px',
                                        background: 'white',
                                        color: '#f59e0b',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f59e0b';
                                        e.currentTarget.style.color = 'white';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.color = '#f59e0b';
                                      }}
                                    >
                                      Reschedule
                                    </button>
                                    <button
                                      onClick={() => openFeedbackModal(interview, round)}
                                      disabled={loading.action}
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        border: 'none',
                                        borderRadius: '4px',
                                        background: '#10b981',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                                    >
                                        Add Result
                                      </button>
                                    </>
                                  )}
                                  {isScheduled && round.roundType === 'HR Interview' && (
                                    <div style={{
                                        padding: '0.25rem 0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        background: '#f9fafb',
                                        color: '#6b7280',
                                        fontSize: '0.75rem',
                                      }}>
                                      Scheduled by HR
                                    </div>
                                  )}
                                  {isCompleted && round.result === 'pending' && round.roundType !== 'HR Interview' && (
                                  <button
                                    onClick={() => openFeedbackModal(interview, round)}
                                    disabled={loading.action}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      border: 'none',
                                      borderRadius: '4px',
                                      background: '#f59e0b',
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
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
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '2rem',
                  marginBottom: '1rem'
                }}>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: pagination.currentPage === 1 ? '#f3f4f6' : 'white',
                      color: pagination.currentPage === 1 ? '#9ca3af' : '#1f2937',
                      cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= pagination.currentPage - 1 && pageNumber <= pagination.currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            background: pagination.currentPage === pageNumber ? '#2440F0' : 'white',
                            color: pagination.currentPage === pageNumber ? 'white' : '#1f2937',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            minWidth: '40px'
                          }}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === pagination.currentPage - 2 ||
                      pageNumber === pagination.currentPage + 2
                    ) {
                      return <span key={pageNumber} style={{ color: '#9ca3af' }}>...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: pagination.currentPage === totalPages ? '#f3f4f6' : 'white',
                      color: pagination.currentPage === totalPages ? '#9ca3af' : '#1f2937',
                      cursor: pagination.currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}

              {/* Items per page info */}
              {filteredInterviews.length > 0 && (
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginTop: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInterviews.length)} of {filteredInterviews.length} interviews
                </div>
              )}
            </>
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
          loading={loading.action}
        />
      )}

      {showFeedbackModal && selectedInterview && selectedRound && (
        <FeedbackModal
          interview={selectedInterview}
          round={selectedRound}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
          loading={loading.action}
        />
      )}
    </div>
  );
};

export default InterviewsDashboardPage;