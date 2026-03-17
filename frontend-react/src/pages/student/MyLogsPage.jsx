// src/pages/student/MyLogsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse existing styles
import NotificationBell from '../../components/common/NotificationBell';

const MyLogsPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    approvedLogs: 0,
    pendingLogs: 0,
    rejectedLogs: 0
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'ST',
    role: 'student'
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/students/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const user = data.data.student;
          const initials = user.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          setUserData({
            name: user.fullName,
            initials: initials,
            role: user.role
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch logs data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        // Fetch logs
        const logsResponse = await fetch('http://localhost:5000/api/daily-logs/my-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsResponse.json();

        if (logsData.success) {
          const logsList = logsData.data.logs || [];
          setLogs(logsList);
          setFilteredLogs(logsList);

          // Calculate stats
          const total = logsList.length;
          const approved = logsList.filter(l => l.status === 'approved').length;
          const pending = logsList.filter(l => l.status === 'pending').length;
          const rejected = logsList.filter(l => l.status === 'rejected').length;

          setStats({
            totalLogs: total,
            approvedLogs: approved,
            pendingLogs: pending,
            rejectedLogs: rejected
          });
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logs when filter changes
  useEffect(() => {
    if (filter === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.status === filter));
    }
  }, [filter, logs]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#FFF4E5', color: '#f59e0b', text: 'Pending' },
      approved: { bg: '#E6F7E6', color: '#10b981', text: 'Approved' },
      rejected: { bg: '#fee2e2', color: '#dc2626', text: 'Rejected' }
    };
    const style = styles[status] || styles.pending;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const getFilterButtonStyle = (filterValue) => ({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    background: filter === filterValue ? '#2440F0' : '#f1f5f9',
    color: filter === filterValue ? 'white' : '#64748b',
    transition: 'all 0.2s ease'
  });

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
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => navigate('/student/dashboard')}
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
            className="nav-item"
            onClick={() => navigate('/student/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Browse Internships</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/student/applications')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="nav-item-text">My Applications</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/student/resume')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span className="nav-item-text">My Resume</span>
          </button>

          <button
            className="nav-item active"
            onClick={() => navigate('/student/active-internship')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="nav-item-text">My Internship</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/student/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">Student • Zoyaraa</div>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">My Daily Logs</h2>
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
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">My Daily Logs</h1>
            <p className="page-subtitle">Track your internship progress and mentor feedback</p>
          </div>

          {/* Stats Grid - Using same style as Dashboard */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Submissions</div>
                <div className="stat-value">{stats.totalLogs}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Approved Logs</div>
                <div className="stat-value">{stats.approvedLogs}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Pending Review</div>
                <div className="stat-value">{stats.pendingLogs}</div>
              </div>
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Needs Revision</div>
                <div className="stat-value">{stats.rejectedLogs}</div>
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

          {/* Filter Tabs - Matching Applications page style */}
          <div className="status-tabs" style={{ marginBottom: '2rem' }}>
            <button
              className={`status-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
              <span className="tab-badge">{logs.length}</span>
            </button>
            <button
              className={`status-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
              <span className="tab-badge">{stats.pendingLogs}</span>
            </button>
            <button
              className={`status-tab ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              Approved
              <span className="tab-badge">{stats.approvedLogs}</span>
            </button>
            <button
              className={`status-tab ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
              <span className="tab-badge">{stats.rejectedLogs}</span>
            </button>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="applications-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="applications-grid">
              {filteredLogs.map((log) => (
                <div key={log._id} className="application-card" style={{ cursor: 'default' }}>
                  <div className="app-card-header">
                    <div className="app-company-info">
                      <div className="app-company-logo">
                        {log.dayNumber || 'D'}
                      </div>
                      <div className="app-details">
                        <h3 className="app-title">Day {log.dayNumber || '?'}</h3>
                        <p className="app-company-name">
                          {formatDate(log.date)}
                        </p>
                        <div className="app-meta">
                          <span className="app-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {log.totalHours || 0} hours
                          </span>
                          <span className="app-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                              <path d="M3 9h18"></path>
                            </svg>
                            {log.tasksCompleted?.length || 0} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      {getStatusBadge(log.status)}
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Submitted: {formatDate(log.submittedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Log Content Preview */}
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                    {log.tasksCompleted && log.tasksCompleted.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                          Tasks:
                        </div>
                        {log.tasksCompleted.slice(0, 2).map((task, idx) => (
                          <div key={idx} style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>
                            • {task.description} ({task.hoursSpent} hrs)
                          </div>
                        ))}
                        {log.tasksCompleted.length > 2 && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                            +{log.tasksCompleted.length - 2} more tasks
                          </div>
                        )}
                      </div>
                    )}

                    {log.learnings && (
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        <span style={{ fontWeight: '600' }}>Learning:</span> {log.learnings.substring(0, 100)}
                        {log.learnings.length > 100 && '...'}
                      </div>
                    )}
                  </div>

                  {/* Mentor Feedback if exists */}
                  {log.mentorFeedback && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: '#f0f4fe',
                      borderRadius: '8px',
                      borderLeft: '4px solid #2440F0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                          Mentor Feedback
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                        {log.mentorFeedback.comment || 'No feedback provided'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <h3>No logs found</h3>
              <p>
                {filter !== 'all'
                  ? `No ${filter} logs match your current filter`
                  : 'Start submitting daily logs to track your progress'}
              </p>
              {filter !== 'all' && (
                <button
                  className="secondary-btn"
                  onClick={() => setFilter('all')}
                >
                  View All Logs
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyLogsPage;