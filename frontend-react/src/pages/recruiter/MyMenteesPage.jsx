// src/pages/recruiter/MyMenteesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const MyMenteesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [filteredMentees, setFilteredMentees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState({}); // ✅ NEW: Track interview history for mentees
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgProgress: 0,
    totalInterviews: 0 // ✅ NEW
  });
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    department: '',
    company: 'Zoyaraa'
  });

  useEffect(() => {
    fetchRecruiterProfile();
    fetchMentees();
  }, []);

  useEffect(() => {
    filterMentees();
  }, [mentees, searchQuery]);

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

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/recruiters/mentees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const menteesList = data.data.mentees || [];
        setMentees(menteesList);

        // Fetch interview history for each mentee
        await fetchInterviewHistory(menteesList);

        // Calculate stats
        const active = menteesList.filter(m => m.internship?.progress?.includes('Week')).length;
        const completed = menteesList.filter(m => m.internship?.progress === 'Completed').length;
        const totalProgress = menteesList.reduce((acc, m) => {
          const progress = m.internship?.progress || 'Week 0/0';
          const match = progress.match(/Week (\d+)\/(\d+)/);
          if (match) {
            return acc + (parseInt(match[1]) / parseInt(match[2]) * 100);
          }
          return acc;
        }, 0);
        const avgProgress = menteesList.length ? Math.round(totalProgress / menteesList.length) : 0;

        setStats({
          total: menteesList.length,
          active,
          completed,
          avgProgress,
          totalInterviews: 0 // Will be updated after fetching interview history
        });
      }
    } catch (error) {
      console.error('Error fetching mentees:', error);
      showNotification('Failed to load mentees', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch interview history for each mentee
  const fetchInterviewHistory = async (menteesList) => {
    try {
      const token = localStorage.getItem('authToken');
      const historyMap = {};
      let totalInterviews = 0;

      for (const mentee of menteesList) {
        try {
          const response = await fetch(`http://localhost:5000/api/interviews/student`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success) {
            // Filter interviews for this mentee
            const menteeInterviews = data.data.upcoming?.filter(
              interview => interview.studentId?._id === mentee._id
            ) || [];

            const pastInterviews = data.data.past?.filter(
              interview => interview.studentId?._id === mentee._id
            ) || [];

            const allInterviews = [...menteeInterviews, ...pastInterviews];

            if (allInterviews.length > 0) {
              historyMap[mentee._id] = {
                total: allInterviews.length,
                completed: pastInterviews.length,
                upcoming: menteeInterviews.length,
                interviews: allInterviews.slice(0, 2) // Store last 2 interviews
              };
              totalInterviews += allInterviews.length;
            } else {
              historyMap[mentee._id] = null;
            }
          }
        } catch (error) {
          console.log(`No interviews for mentee ${mentee._id}`);
          historyMap[mentee._id] = null;
        }
      }

      setInterviewHistory(historyMap);
      setStats(prev => ({
        ...prev,
        totalInterviews
      }));
    } catch (error) {
      console.error('Error fetching interview history:', error);
    }
  };

  const filterMentees = () => {
    let filtered = [...mentees];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(mentee =>
        mentee.fullName?.toLowerCase().includes(query) ||
        mentee.email?.toLowerCase().includes(query) ||
        mentee.internship?.title?.toLowerCase().includes(query)
      );
    }

    setFilteredMentees(filtered);
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedMentee || !feedbackText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');

      // This endpoint would need to be created
      const response = await fetch(`http://localhost:5000/api/mentees/${selectedMentee._id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback: feedbackText,
          rating: feedbackRating
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Feedback sent successfully');
        setShowFeedbackModal(false);
        setFeedbackText('');
        setFeedbackRating(5);
        setSelectedMentee(null);
      } else {
        showNotification(data.message || 'Failed to send feedback', 'error');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      showNotification('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewMenteeProfile = (menteeId) => {
    navigate(`/recruiter/student/${menteeId}`);
  };

  const viewMenteeLogs = (menteeId) => {
    navigate(`/recruiter/mentee-logs/${menteeId}`);
  };

  // ✅ NEW: View mentee's interview history
  const viewMenteeInterviews = (menteeId) => {
    navigate(`/recruiter/interviews?student=${menteeId}`);
  };

  const getProgressColor = (progress) => {
    if (!progress) return '#e5e7eb';
    const match = progress.match(/Week (\d+)\/(\d+)/);
    if (match) {
      const percentage = (parseInt(match[1]) / parseInt(match[2])) * 100;
      if (percentage < 25) return '#f59e0b';
      if (percentage < 50) return '#3b82f6';
      if (percentage < 75) return '#8b5cf6';
      return '#10b981';
    }
    return '#e5e7eb';
  };

  const getProgressPercentage = (progress) => {
    if (!progress) return 0;
    const match = progress.match(/Week (\d+)\/(\d+)/);
    if (match) {
      return Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
    }
    return 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
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

  return (
    <div className="app-container">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <span className="sidebar-logo-text">Zoyaraa</span>
          </div>
          {/* ✅ ADD DEPARTMENT BADGE HERE */}
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

          {/* ✅ Interviews Menu Item */}
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
            className={`nav-item active`}
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
              My Mentees
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
          {/* Stats Cards - Now 5 cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Mentees</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Active Interns</div>
                <div className="stat-value">{stats.active}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Avg Progress</div>
                <div className="stat-value">{stats.avgProgress}%</div>
              </div>
              <div className="stat-icon purple" style={{ background: '#f3e8ff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <path d="M2 20L22 20" />
                  <path d="M4 16L8 8L12 12L16 6L20 12" />
                </svg>
              </div>
            </div>

            {/* ✅ NEW: Total Interviews Card */}
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Interviews</div>
                <div className="stat-value">{stats.totalInterviews}</div>
              </div>
              <div className="stat-icon purple" style={{ background: '#f3e8ff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              placeholder="Search mentees by name, email, or internship..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Mentees List */}
          {loading ? (
            <div className="loading-placeholder">Loading mentees...</div>
          ) : filteredMentees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3>No mentees yet</h3>
              <p>
                {searchQuery
                  ? 'No mentees match your search'
                  : 'When you accept interns, they will appear here for mentoring'}
              </p>
            </div>
          ) : (
            <div className="mentees-list">
              {filteredMentees.map((mentee) => {
                const progressPercentage = getProgressPercentage(mentee.internship?.progress);
                const progressColor = getProgressColor(mentee.internship?.progress);
                const interviewData = interviewHistory[mentee._id];

                return (
                  <div
                    key={mentee._id}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      {/* Left side - Mentee Info */}
                      <div style={{ flex: 2, minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                            {mentee.fullName}
                          </h3>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: progressPercentage > 0 ? '#E6F7E6' : '#f3f4f6',
                            color: progressPercentage > 0 ? '#10b981' : '#6b7280'
                          }}>
                            {mentee.internship?.progress || 'Not Started'}
                          </span>
                        </div>

                        <p style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
                          {mentee.email}
                        </p>

                        {mentee.education && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            🎓 {mentee.education.college} • {mentee.education.department}
                          </p>
                        )}

                        {mentee.internship && (
                          <div style={{
                            background: '#f8fafc',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginTop: '0.5rem'
                          }}>
                            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                              {mentee.internship.title}
                            </p>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: '0.5rem' }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                marginBottom: '0.25rem'
                              }}>
                                <span>Progress</span>
                                <span>{progressPercentage}%</span>
                              </div>
                              <div style={{
                                width: '100%',
                                height: '8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${progressPercentage}%`,
                                  height: '100%',
                                  background: progressColor,
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              gap: '1rem',
                              fontSize: '0.8125rem',
                              color: '#6b7280'
                            }}>
                              <span>📅 Start: {formatDate(mentee.internship.startDate)}</span>
                              <span>🏁 End: {formatDate(mentee.internship.endDate)}</span>
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {mentee.skills && mentee.skills.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {mentee.skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} style={{
                                  background: '#f3f4f6',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '16px',
                                  fontSize: '0.75rem',
                                  color: '#1f2937'
                                }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ✅ NEW: Interview History Preview */}
                        {interviewData && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.5rem',
                            background: '#f3e8ff',
                            borderRadius: '8px',
                            fontSize: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              <span style={{ fontWeight: '500' }}>
                                {interviewData.total} {interviewData.total === 1 ? 'Interview' : 'Interviews'} •
                                {interviewData.completed > 0 && ` ${interviewData.completed} completed`}
                                {interviewData.upcoming > 0 && ` • ${interviewData.upcoming} upcoming`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right side - Actions */}
                      <div style={{
                        flex: 1,
                        minWidth: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        alignItems: 'flex-end'
                      }}>
                        <button
                          onClick={() => viewMenteeProfile(mentee._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            color: '#2440F0',
                            border: '1px solid #2440F0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#EEF2FF'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          View Profile
                        </button>

                        <button
                          onClick={() => viewMenteeLogs(mentee._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#EEF2FF',
                            color: '#2440F0',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#E0E7FF'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#EEF2FF'}
                        >
                          View Logs
                        </button>

                        {/* ✅ NEW: View Interviews button */}
                        <button
                          onClick={() => viewMenteeInterviews(mentee._id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#f3e8ff',
                            color: '#8b5cf6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ede9fe'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f3e8ff'}
                        >
                          View Interviews
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMentee(mentee);
                            setShowFeedbackModal(true);
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                        >
                          Give Feedback
                        </button>

                        <button
                          onClick={() => {/* Schedule meeting */ }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            color: '#4b5563',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          Schedule Meeting
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedMentee && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Give Feedback to {selectedMentee.fullName}
              </h2>
              <button
                className="close-modal"
                onClick={() => setShowFeedbackModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedbackRating(rating)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: feedbackRating === rating ? '2px solid #2440F0' : '1px solid #d1d5db',
                        background: feedbackRating === rating ? '#EEF2FF' : 'white',
                        color: feedbackRating === rating ? '#2440F0' : '#4b5563',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback here..."
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                className="secondary-btn"
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleFeedbackSubmit}
                disabled={submitting || !feedbackText.trim()}
              >
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMenteesPage;