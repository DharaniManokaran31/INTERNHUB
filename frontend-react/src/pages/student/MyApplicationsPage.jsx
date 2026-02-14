import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentApplications.css';

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [userData, setUserData] = useState({
    name: 'Demo Student',
    initials: 'DS',
    role: 'student'
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    shortlisted: 0,
    pending: 0,
    rejected: 0,
    interview: 0
  });

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
    fetchApplications();
  }, []);

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

  // 1️⃣ FETCH APPLICATIONS - FIXED
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        const apps = data.data.applications || [];
        console.log('✅ Applications loaded:', apps.length);

        setApplications(apps);
        setFilteredApps(apps);
        setActiveStatus('all');
        calculateStats(apps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // CALCULATE STATS
  const calculateStats = (apps) => {
    const stats = {
      total: apps.length,
      shortlisted: apps.filter(app => app.status === 'shortlisted').length,
      pending: apps.filter(app => app.status === 'pending' || app.status === 'applied').length,
      rejected: apps.filter(app => app.status === 'rejected').length,
      interview: apps.filter(app => app.status === 'interview').length
    };
    setStats(stats);
  };

  // 2️⃣ FILTER APPLICATIONS - FIXED
  const filterApplications = (status) => {
    setActiveStatus(status);

    if (!applications || applications.length === 0) {
      setFilteredApps([]);
      return;
    }

    let filtered = [...applications];

    // Apply status filter
    if (status !== 'all') {
      if (status === 'pending') {
        filtered = applications.filter(app =>
          app.status === 'pending' || app.status === 'applied'
        );
      } else {
        filtered = applications.filter(app => app.status === status);
      }
    }

    // Apply search filter ONLY if searchQuery exists
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(app =>
        app.internship?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.internship?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApps(filtered);
  };

  // 3️⃣ SEARCH EFFECT - FIXED
  useEffect(() => {
    const timer = setTimeout(() => {
      if (applications.length > 0) {
        filterApplications(activeStatus);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Format date to relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return 'Today';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Get days remaining
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  // Get status badge config
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
      case 'applied':
        return {
          class: 'pending',
          label: 'Under Review',
          icon: '⏳',
          color: '#fef3c7',
          textColor: '#92400e'
        };
      case 'shortlisted':
        return {
          class: 'shortlisted',
          label: 'Shortlisted',
          icon: '✓',
          color: '#d1fae5',
          textColor: '#065f46'
        };
      case 'rejected':
        return {
          class: 'rejected',
          label: 'Rejected',
          icon: '✗',
          color: '#fee2e2',
          textColor: '#991b1b'
        };
      case 'interview':
        return {
          class: 'interview',
          label: 'Interview',
          icon: '📅',
          color: '#dbeafe',
          textColor: '#1e40af'
        };
      case 'accepted':
        return {
          class: 'accepted',
          label: 'Accepted',
          icon: '🎉',
          color: '#d1fae5',
          textColor: '#065f46'
        };
      default:
        return {
          class: 'pending',
          label: status,
          icon: '•',
          color: '#fef3c7',
          textColor: '#92400e'
        };
    }
  };

  // ✅ NEW: View Resume with Google Docs Viewer
  const handleViewResume = (url) => {
    if (!url) {
      showNotification('No resume available', 'error');
      return;
    }
    
    // Use Google Docs Viewer - 100% reliable!
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    window.open(googleViewerUrl, '_blank');
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : 'linear-gradient(135deg, #2440F0, #0B1DC1)';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  // Handle withdraw
  const handleWithdraw = async (applicationId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          showNotification('Application withdrawn successfully');
          fetchApplications();
        } else {
          throw new Error('Failed to withdraw');
        }
      } catch (error) {
        console.error('Error withdrawing application:', error);
        showNotification('Failed to withdraw application', 'error');
      }
    }
  };

  // Handle view details
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setSelectedApplication(null);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle notification click
  const handleNotificationClick = () => {
    showNotification('You have no new notifications');
  };

  // Get badge count
  const getBadgeCount = (status) => {
    if (status === 'all') return stats.total;
    if (status === 'pending') return stats.pending;
    if (status === 'shortlisted') return stats.shortlisted;
    if (status === 'interview') return stats.interview;
    if (status === 'rejected') return stats.rejected;
    return 0;
  };

  // Get company initials for logo
  const getInitials = (companyName) => {
    if (!companyName) return 'C';
    return companyName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="app-container">
      {/* Sidebar Overlay for Mobile */}
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
            <span className="sidebar-logo-text">InternHub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${location.pathname === '/student/dashboard' ? 'active' : ''}`}
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
            className={`nav-item ${location.pathname.includes('/student/internships') ? 'active' : ''}`}
            onClick={() => navigate('/student/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Browse Internships</span>
          </button>

          <button
            className={`nav-item active`}
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
            className={`nav-item ${location.pathname.includes('/student/resume') ? 'active' : ''}`}
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
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/student/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">Student</div>
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="search-bar" style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search applications"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="top-bar-right">
            <button
              className="notification-btn"
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge"></span>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">My Applications</h1>
            <p className="page-subtitle">Track and manage your internship applications</p>
          </div>

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-card-small" onClick={() => filterApplications('all')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>All Applications</h4>
                  <div className="stat-card-value">{stats.total}</div>
                </div>
                <div className="stat-card-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card-small" onClick={() => filterApplications('pending')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>Under Review</h4>
                  <div className="stat-card-value">{stats.pending}</div>
                </div>
                <div className="stat-card-icon yellow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <path d="M3 9h18"></path>
                    <path d="M9 21V9"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card-small" onClick={() => filterApplications('shortlisted')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>Shortlisted</h4>
                  <div className="stat-card-value">{stats.shortlisted}</div>
                </div>
                <div className="stat-card-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card-small" onClick={() => filterApplications('interview')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>Interview</h4>
                  <div className="stat-card-value">{stats.interview}</div>
                </div>
                <div className="stat-card-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.5"></path>
                    <path d="M16 2v4"></path>
                    <path d="M8 2v4"></path>
                    <path d="M3 10h18"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="stat-card-small" onClick={() => filterApplications('rejected')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>Rejected</h4>
                  <div className="stat-card-value">{stats.rejected}</div>
                </div>
                <div className="stat-card-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="status-tabs">
            <button
              className={`status-tab ${activeStatus === 'all' ? 'active' : ''}`}
              onClick={() => filterApplications('all')}
            >
              All Applications
              <span className="tab-badge">{getBadgeCount('all')}</span>
            </button>
            <button
              className={`status-tab ${activeStatus === 'pending' ? 'active' : ''}`}
              onClick={() => filterApplications('pending')}
            >
              Under Review
              <span className="tab-badge">{getBadgeCount('pending')}</span>
            </button>
            <button
              className={`status-tab ${activeStatus === 'shortlisted' ? 'active' : ''}`}
              onClick={() => filterApplications('shortlisted')}
            >
              Shortlisted
              <span className="tab-badge">{getBadgeCount('shortlisted')}</span>
            </button>
            <button
              className={`status-tab ${activeStatus === 'interview' ? 'active' : ''}`}
              onClick={() => filterApplications('interview')}
            >
              Interview
              <span className="tab-badge">{getBadgeCount('interview')}</span>
            </button>
            <button
              className={`status-tab ${activeStatus === 'rejected' ? 'active' : ''}`}
              onClick={() => filterApplications('rejected')}
            >
              Rejected
              <span className="tab-badge">{getBadgeCount('rejected')}</span>
            </button>
          </div>

          {/* Applications Grid */}
          <div className="applications-grid">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))
            ) : filteredApps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <h3>No applications found</h3>
                <p>
                  {searchQuery || activeStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start applying to internships to see your applications here'}
                </p>
                {!searchQuery && activeStatus === 'all' && (
                  <button
                    className="btn-primary"
                    onClick={() => navigate('/student/internships')}
                  >
                    Browse Internships
                  </button>
                )}
              </div>
            ) : (
              filteredApps.map((app) => {
                const status = getStatusConfig(app.status);
                const isExpired = getDaysRemaining(app.internship?.deadline) === 'Expired';
                const companyInitials = getInitials(app.internship?.companyName);

                return (
                  <div key={app._id} className="application-card">
                    <div className="app-card-header">
                      <div className="app-company-info">
                        <div className="app-company-logo">
                          {companyInitials}
                        </div>
                        <div className="app-details">
                          <h3 className="app-title">{app.internship?.title || 'Internship Position'}</h3>
                          <p className="app-company-name">
                            {app.internship?.companyName || 'Company'} · {app.internship?.location || 'Location'}
                          </p>
                          <div className="app-meta">
                            {app.internship?.stipend && (
                              <span className="app-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="12" y1="1" x2="12" y2="23"></line>
                                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                                {app.internship.stipend}
                              </span>
                            )}
                            <span className="app-meta-item">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              Applied {formatRelativeTime(app.appliedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`app-status-badge ${status.class}`}
                        style={{
                          backgroundColor: status.color,
                          color: status.textColor
                        }}
                      >
                        <span>{status.icon}</span>
                        {status.label}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="app-timeline">
                      <div className="timeline-item">
                        <div className="timeline-dot completed"></div>
                        <div className="timeline-content">
                          <span className="timeline-title">Application Submitted</span>
                          <span className="timeline-date">{formatDate(app.appliedAt)}</span>
                        </div>
                      </div>

                      {app.status === 'shortlisted' && (
                        <div className="timeline-item">
                          <div className="timeline-dot active"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Resume Shortlisted</span>
                            <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                          </div>
                        </div>
                      )}

                      {app.status === 'interview' && (
                        <>
                          <div className="timeline-item">
                            <div className="timeline-dot completed"></div>
                            <div className="timeline-content">
                              <span className="timeline-title">Resume Shortlisted</span>
                              <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                            </div>
                          </div>
                          <div className="timeline-item">
                            <div className="timeline-dot active"></div>
                            <div className="timeline-content">
                              <span className="timeline-title">Interview Scheduled</span>
                              <span className="timeline-date">{formatDate(app.interviewDate || app.updatedAt)}</span>
                            </div>
                          </div>
                        </>
                      )}

                      {app.status === 'rejected' && (
                        <div className="timeline-item">
                          <div className="timeline-dot inactive"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Application Rejected</span>
                            <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                          </div>
                        </div>
                      )}

                      {app.status === 'accepted' && (
                        <div className="timeline-item">
                          <div className="timeline-dot completed"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Application Accepted</span>
                            <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                          </div>
                        </div>
                      )}

                      {(app.status === 'pending' || app.status === 'applied') && (
                        <div className="timeline-item">
                          <div className="timeline-dot active"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Under Review</span>
                            <span className="timeline-date">Pending decision</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="app-card-footer">
                      {app.internship?.deadline && (
                        <div className={`deadline-info ${isExpired ? 'expired' : ''}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Deadline: {formatDate(app.internship.deadline)} ({getDaysRemaining(app.internship.deadline)})
                        </div>
                      )}

                      <div className="app-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => handleViewDetails(app)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                          </svg>
                          View Details
                        </button>

                        {(app.status === 'pending' || app.status === 'applied') && !isExpired && (
                          <button
                            className="btn-danger"
                            onClick={() => handleWithdraw(app._id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Withdraw Application
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Application Details Modal - FIXED with Google Viewer */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedApplication.internship?.title || 'Application Details'}</h2>
              <button
                className="close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="company-header">
                <div className="company-logo-large">
                  {getInitials(selectedApplication.internship?.companyName)}
                </div>
                <div className="company-info">
                  <h3>{selectedApplication.internship?.companyName || 'Company'}</h3>
                  <p>{selectedApplication.internship?.location || 'Location'}</p>
                </div>
              </div>

              <div className="modal-section">
                <h3>Application Status</h3>
                <div className="status-timeline-vertical">
                  <div className="timeline-item-vertical">
                    <div className="timeline-dot-vertical completed"></div>
                    <div className="timeline-content-vertical">
                      <span className="timeline-title">Application Submitted</span>
                      <span className="timeline-date">{formatDate(selectedApplication.appliedAt)}</span>
                    </div>
                  </div>

                  {(selectedApplication.status === 'shortlisted' || selectedApplication.status === 'interview' || selectedApplication.status === 'accepted') && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical completed"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Resume Shortlisted</span>
                        <span className="timeline-date">{formatDate(selectedApplication.updatedAt || selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  )}

                  {selectedApplication.status === 'interview' && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical active"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Interview Scheduled</span>
                        <span className="timeline-date">{formatDate(selectedApplication.interviewDate || selectedApplication.updatedAt)}</span>
                      </div>
                    </div>
                  )}

                  {selectedApplication.status === 'accepted' && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical completed"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Application Accepted</span>
                        <span className="timeline-date">{formatDate(selectedApplication.updatedAt || selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  )}

                  {selectedApplication.status === 'rejected' && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical inactive"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Application Rejected</span>
                        <span className="timeline-date">{formatDate(selectedApplication.updatedAt || selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  )}

                  {(selectedApplication.status === 'pending' || selectedApplication.status === 'applied') && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical active"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Under Review</span>
                        <span className="timeline-date">Pending decision</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-section">
                <h3>Internship Details</h3>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Position</span>
                    <span className="detail-value">{selectedApplication.internship?.title || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{selectedApplication.internship?.duration || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Stipend</span>
                    <span className="detail-value">{selectedApplication.internship?.stipend || 'Unpaid'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Deadline</span>
                    <span className="detail-value">
                      {formatDate(selectedApplication.internship?.deadline)}
                      {selectedApplication.internship?.deadline && (
                        <span className={`deadline-badge ${getDaysRemaining(selectedApplication.internship.deadline) === 'Expired' ? 'expired' : ''}`}>
                          {getDaysRemaining(selectedApplication.internship.deadline)}
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedApplication.internship?.skillsRequired && (
                    <div className="detail-row skills-row">
                      <span className="detail-label">Skills</span>
                      <div className="skills-tags">
                        {selectedApplication.internship.skillsRequired.slice(0, 5).map((skill, idx) => (
                          <span key={idx} className="skill-tag">
                            {typeof skill === 'string' ? skill : skill.name}
                          </span>
                        ))}
                        {selectedApplication.internship.skillsRequired.length > 5 && (
                          <span className="skill-tag more">
                            +{selectedApplication.internship.skillsRequired.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ✅ FIXED: Resume View with Google Docs Viewer */}
                  {selectedApplication.resume && (
                    <div className="detail-row">
                      <span className="detail-label">Resume</span>
                      <div className="detail-value">
                        <button 
                          className="resume-view-btn"
                          onClick={() => handleViewResume(selectedApplication.resume)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                          </svg>
                          View Resume
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {(selectedApplication.status === 'pending' || selectedApplication.status === 'applied') &&
                getDaysRemaining(selectedApplication.internship?.deadline) !== 'Expired' && (
                  <button
                    className="btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWithdraw(selectedApplication._id);
                      handleCloseModal();
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Withdraw Application
                  </button>
                )}
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;