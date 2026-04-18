// src/pages/student/MyLogsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse existing styles
import NotificationBell from '../../components/common/NotificationBell';
import StudentSidebar from '../../components/layout/StudentSidebar';

const MyLogsPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 3,
    pages: 1
  });
  const [stats, setStats] = useState({
    totalLogs: 0,
    approvedLogs: 0,
    pendingLogs: 0,
    rejectedLogs: 0
  });
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

  // Fetch logs data (Whenever page or filter changes)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        // Fetch logs with pagination and status filter
        const logsResponse = await fetch(`http://localhost:5000/api/daily-logs/my-logs?page=${page}&limit=3&status=${filter}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsResponse.json();

        if (logsData.success) {
          setLogs(logsData.data.logs || []);
          if (logsData.data.pagination) {
            setPagination(logsData.data.pagination);
          }

          // Update stats (These are totals for all logs of the student)
          const s = logsData.data.stats;
          if (s) {
            setStats({
              totalLogs: s.total,
              approvedLogs: s.approved,
              pendingLogs: s.pending,
              rejectedLogs: s.rejected
            });
          }
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, filter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
      window.scrollTo(0, 0); // Scroll to top for new results
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Always reset to page 1 for new filter
  };

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
      {/* Unified Sidebar */}
      <StudentSidebar
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
              onClick={() => handleFilterChange('all')}
            >
              All
              <span className="tab-badge">{stats.totalLogs}</span>
            </button>
            <button
              className={`status-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => handleFilterChange('pending')}
            >
              Pending
              <span className="tab-badge">{stats.pendingLogs}</span>
            </button>
            <button
              className={`status-tab ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => handleFilterChange('approved')}
            >
              Approved
              <span className="tab-badge">{stats.approvedLogs}</span>
            </button>
            <button
              className={`status-tab ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => handleFilterChange('rejected')}
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
          ) : logs.length > 0 ? (
            <>
              <div className="applications-grid">
                {logs.map((log) => (
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

              {/* Pagination UI */}
              {pagination.pages > 1 && (
                <div className="pagination" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '3rem',
                  paddingBottom: '2rem'
                }}>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      opacity: page === 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[...Array(pagination.pages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Only show current, first, last, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.pages ||
                        Math.abs(pageNum - page) <= 1
                      ) {
                        return (
                          <button
                            key={pageNum}
                            className={`pagination-num ${page === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: page === pageNum ? '#2440F0' : 'white',
                              color: page === pageNum ? 'white' : '#1e293b',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        (pageNum === 2 && page > 3) ||
                        (pageNum === pagination.pages - 1 && page < pagination.pages - 2)
                      ) {
                        return <span key={pageNum} style={{ padding: '0 0.5rem' }}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pagination.pages}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      cursor: page === pagination.pages ? 'not-allowed' : 'pointer',
                      opacity: page === pagination.pages ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
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
                  onClick={() => handleFilterChange('all')}
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