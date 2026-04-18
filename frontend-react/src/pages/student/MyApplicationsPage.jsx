// src/pages/student/MyApplicationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentApplications.css';
import NotificationBell from '../../components/common/NotificationBell';
import StudentSidebar from '../../components/layout/StudentSidebar';

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
    name: 'Loading...',
    initials: 'ST',
    role: 'student'
  });
  const [hasActiveInternship, setHasActiveInternship] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    shortlisted: 0,
    pending: 0,
    rejected: 0,
    accepted: 0,
    interview: 0
  });

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
    fetchApplications();
    checkActiveInternship();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/students/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

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

  // 1️⃣ FETCH APPLICATIONS
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (data.success) {
        const apps = data.data.applications || [];
        console.log('✅ Applications loaded:', apps.length);

        const mappedApps = apps.map(app => ({
          ...app,
          internship: app.internshipId || app.internship
        }));

        setApplications(mappedApps);
        setFilteredApps(mappedApps);
        setActiveStatus('all');
        calculateStats(mappedApps);

        // ✅ URL ID Handling: If URL has ?id=xxx, auto-select that application
        const queryParams = new URLSearchParams(location.search);
        const appId = queryParams.get('id');
        if (appId) {
          const targetApp = mappedApps.find(a => a._id === appId);
          if (targetApp) {
            setSelectedApplication(targetApp);
            // Optionally, switch filter to match the app status if you want
            // setActiveStatus(targetApp.status);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 👇 ADD THIS FUNCTION (around line 110)
  const checkActiveInternship = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) return;

      const data = await response.json();

      if (data.success) {
        const hasAccepted = data.data.applications.some(app => app.status === 'accepted');
        setHasActiveInternship(hasAccepted);
      }
    } catch (error) {
      console.error('Error checking active internship:', error);
    }
  };

  // CALCULATE STATS
  const calculateStats = (apps) => {
    const stats = {
      total: apps.length,
      shortlisted: apps.filter(app => app.status === 'shortlisted').length,
      pending: apps.filter(app => app.status === 'pending' || app.status === 'applied').length,
      rejected: apps.filter(app => app.status === 'rejected').length,
      accepted: apps.filter(app => app.status === 'accepted').length,
      interview: apps.filter(app => app.status === 'interview').length
    };
    setStats(stats);
  };

  // 2️⃣ FILTER APPLICATIONS
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

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(app =>
        app.internship?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.internship?.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApps(filtered);
  };

  // 3️⃣ SEARCH EFFECT
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  // ✅ FIXED: View Resume with proper URL handling for localhost
  const handleViewResume = (url) => {
    if (!url) {
      showNotification('No resume available', 'error');
      return;
    }

    // Ensure URL is absolute
    const fullUrl = url.startsWith('http')
      ? url
      : `http://localhost:5000${url}`;

    // Open directly (since localhost cannot be accessed remotely by Google Docs Viewer)
    window.open(fullUrl, '_blank');
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

  // Get badge count
  const getBadgeCount = (status) => {
    if (status === 'all') return stats.total;
    if (status === 'pending') return stats.pending;
    if (status === 'shortlisted') return stats.shortlisted;
    if (status === 'rejected') return stats.rejected;
    if (status === 'accepted') return stats.accepted;
    if (status === 'interview') return stats.interview;
    return 0;
  };

  // Get company initials for logo
  const getInitials = (companyName) => {
    if (!companyName) return 'Z';
    return companyName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
                placeholder="Search by title or department..."
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
            <h1 className="page-title">My Applications</h1>
            <p className="page-subtitle">Track your internship applications at Zoyaraa</p>
          </div>

          {/* Stats Row - 5 cards now */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <div className="stat-card-small" onClick={() => filterApplications('all')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>All</h4>
                  <div className="stat-card-value">{stats.total}</div>
                </div>
                <div className="stat-card-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
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

            <div className="stat-card-small" onClick={() => filterApplications('accepted')}>
              <div className="stat-card-content">
                <div className="stat-card-info">
                  <h4>Accepted</h4>
                  <div className="stat-card-value">{stats.accepted}</div>
                </div>
                <div className="stat-card-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9 12 2 2 4-5"></path>
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
              All
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
              className={`status-tab ${activeStatus === 'accepted' ? 'active' : ''}`}
              onClick={() => filterApplications('accepted')}
            >
              Accepted
              <span className="tab-badge">{getBadgeCount('accepted')}</span>
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
                  </svg>
                </div>
                <h3>No applications found</h3>
                <p>
                  {searchQuery || activeStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start applying to internships at Zoyaraa to see your applications here'}
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
                const companyInitials = getInitials('Zoyaraa');

                return (
                  <div key={app._id} className="application-card">
                    <div className="app-card-header">
                      <div className="app-company-info">
                        <div className="app-company-logo">
                          Z
                        </div>
                        <div className="app-details">
                          <h3 className="app-title">{app.internship?.title || 'Internship Position'}</h3>
                          <p className="app-company-name">
                            Zoyaraa · {app.internship?.department || 'Department'}
                          </p>
                          <div className="app-meta">
                            {app.internship?.stipend && (
                              <span className="app-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="12" y1="1" x2="12" y2="23"></line>
                                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                                {typeof app.internship.stipend === 'number'
                                  ? `₹${app.internship.stipend.toLocaleString()}/month`
                                  : app.internship.stipend}
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
                            <span className="timeline-title">Shortlisted</span>
                            <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                          </div>
                        </div>
                      )}

                      {app.status === 'accepted' && (
                        <>
                          <div className="timeline-item">
                            <div className="timeline-dot completed"></div>
                            <div className="timeline-content">
                              <span className="timeline-title">Shortlisted</span>
                              <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                            </div>
                          </div>
                          <div className="timeline-item">
                            <div className="timeline-dot completed"></div>
                            <div className="timeline-content">
                              <span className="timeline-title">Accepted</span>
                              <span className="timeline-date">{formatDate(app.updatedAt || app.appliedAt)}</span>
                            </div>
                          </div>
                        </>
                      )}

                      {app.status === 'rejected' && (
                        <div className="timeline-item">
                          <div className="timeline-dot inactive"></div>
                          <div className="timeline-content">
                            <span className="timeline-title">Rejected</span>
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
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            padding: '0.25rem 0.75rem',
                            background: '#f3f4f6',
                            borderRadius: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <span>⏳</span> Awaiting review
                          </div>
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

      {/* Application Details Modal - FIXED with correct resume field */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
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
              {/* Company Header */}
              <div className="company-header">
                <div className="company-logo-large">
                  Z
                </div>
                <div className="company-info">
                  <h3>Zoyaraa</h3>
                  <p className="company-department">{selectedApplication.internship?.department || 'Department'}</p>
                  <div className="status-badge" style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: selectedApplication.status === 'accepted' ? '#E6F7E6' :
                      selectedApplication.status === 'shortlisted' ? '#EEF2FF' :
                        selectedApplication.status === 'rejected' ? '#fee2e2' : '#FFF4E5',
                    color: selectedApplication.status === 'accepted' ? '#10b981' :
                      selectedApplication.status === 'shortlisted' ? '#2440F0' :
                        selectedApplication.status === 'rejected' ? '#dc2626' : '#f59e0b'
                  }}>
                    {selectedApplication.status === 'accepted' ? '✓ Accepted' :
                      selectedApplication.status === 'shortlisted' ? '⭐ Shortlisted' :
                        selectedApplication.status === 'rejected' ? '✗ Rejected' : '⏳ Under Review'}
                  </div>
                </div>
              </div>

              {/* Application Status Timeline */}
              <div className="modal-section">
                <h3>📋 Application Timeline</h3>
                <div className="status-timeline-vertical">
                  <div className="timeline-item-vertical">
                    <div className="timeline-dot-vertical completed"></div>
                    <div className="timeline-content-vertical">
                      <span className="timeline-title">Application Submitted</span>
                      <span className="timeline-date">{formatDate(selectedApplication.appliedAt)}</span>
                    </div>
                  </div>

                  {(selectedApplication.status === 'shortlisted' || selectedApplication.status === 'accepted') && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical completed"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Shortlisted</span>
                        <span className="timeline-date">{formatDate(selectedApplication.updatedAt || selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  )}

                  {selectedApplication.status === 'accepted' && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical completed"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Accepted</span>
                        <span className="timeline-date">{formatDate(selectedApplication.updatedAt || selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  )}

                  {selectedApplication.status === 'rejected' && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical inactive"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Rejected</span>
                        <span className="timeline-date">{formatDate(selectedApplication.updatedAt || selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  )}

                  {(selectedApplication.status === 'pending' || selectedApplication.status === 'applied') && (
                    <div className="timeline-item-vertical">
                      <div className="timeline-dot-vertical active"></div>
                      <div className="timeline-content-vertical">
                        <span className="timeline-title">Under Review</span>
                        <span className="timeline-date">Awaiting decision</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Internship Details */}
              <div className="modal-section">
                <h3>💼 Internship Details</h3>

                {/* Basic Info Grid */}
                <div className="details-grid-2col" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div className="detail-card" style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Position</span>
                    <span className="detail-value" style={{ fontSize: '1rem', fontWeight: '600' }}>
                      {selectedApplication.internship?.title || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-card" style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Department</span>
                    <span className="detail-value" style={{ fontSize: '1rem', fontWeight: '600' }}>
                      {selectedApplication.internship?.department || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-card" style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Work Mode</span>
                    <span className="detail-value" style={{ fontSize: '1rem', fontWeight: '600' }}>
                      {selectedApplication.internship?.workMode || 'Not specified'}
                    </span>
                  </div>
                  <div className="detail-card" style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Location</span>
                    <span className="detail-value" style={{ fontSize: '1rem', fontWeight: '600' }}>
                      {selectedApplication.internship?.location || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Work Details */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>Work Details</h4>
                  <div className="work-details" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Start Date</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{formatDate(selectedApplication.internship?.startDate)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>End Date</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{formatDate(selectedApplication.internship?.endDate)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Duration</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{selectedApplication.internship?.duration} months</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Daily Timings</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{selectedApplication.internship?.dailyTimings || '10 AM - 6 PM'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Weekly Off</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{selectedApplication.internship?.weeklyOff || 'Saturday, Sunday'}</p>
                    </div>
                    {selectedApplication.internship?.officeLocation && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Office Location</span>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{selectedApplication.internship.officeLocation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compensation */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>Compensation</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '0.75rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Stipend</span>
                      <p style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
                        {selectedApplication.internship?.stipend
                          ? typeof selectedApplication.internship.stipend === 'number'
                            ? `₹${selectedApplication.internship.stipend.toLocaleString()}/month`
                            : selectedApplication.internship.stipend
                          : 'Unpaid'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Positions</span>
                      <p style={{ fontSize: '1rem', fontWeight: '500' }}>
                        {selectedApplication.internship?.positions || 1} available
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Deadline</span>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: getDaysRemaining(selectedApplication.internship?.deadline) === 'Expired' ? '#dc2626' : '#059669'
                      }}>
                        {formatDate(selectedApplication.internship?.deadline)}
                        <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                          ({getDaysRemaining(selectedApplication.internship?.deadline)})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills Required */}
                {selectedApplication.internship?.skillsRequired && selectedApplication.internship.skillsRequired.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>🛠️ Required Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedApplication.internship.skillsRequired.map((skill, idx) => {
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        const skillLevel = typeof skill === 'string' ? 'beginner' : skill.level;
                        const levelColors = {
                          beginner: { bg: '#f0f9ff', color: '#0284c7' },
                          intermediate: { bg: '#fef3c7', color: '#d97706' },
                          advanced: { bg: '#fee2e2', color: '#dc2626' }
                        };
                        const colors = levelColors[skillLevel] || levelColors.beginner;

                        return (
                          <span key={idx} style={{
                            background: colors.bg,
                            color: colors.color,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            {skillName}
                            <span style={{ opacity: 0.7 }}>•</span>
                            <span style={{ fontSize: '0.7rem' }}>{skillLevel}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>📝 Your Cover Letter</h4>
                    <div className="cover-letter-preview" style={{
                      background: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedApplication.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* ✅ FIXED: Resume - using correct field name submittedResume */}
                {selectedApplication.submittedResume && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>📎 Resume</h4>
                    <button
                      className="resume-view-btn"
                      onClick={() => handleViewResume(selectedApplication.submittedResume.url)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        background: '#EEF2FF',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#2440F0',
                        cursor: 'pointer',
                        width: 'fit-content'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                      </svg>
                      {selectedApplication.submittedResume.fileName || 'View Resume'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
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