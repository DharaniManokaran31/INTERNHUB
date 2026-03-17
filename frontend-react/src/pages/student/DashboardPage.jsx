// src/pages/student/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState([]);
  const [recommendedInternships, setRecommendedInternships] = useState([]);
  const [hasActiveInternship, setHasActiveInternship] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    shortlisted: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  const [userData, setUserData] = useState({
    name: 'Loading...',
    email: '',
    initials: 'ST',
    role: 'student'
  });
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: []
  });
  const [greeting, setGreeting] = useState('Welcome back');


  const checkActiveInternship = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const hasAccepted = data.data.applications.some(app => app.status === 'accepted');
        setHasActiveInternship(hasAccepted);
      }
    } catch (error) {
      console.error('Error checking active internship:', error);
    }
  };

  // Get REAL user profile from backend

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/students/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          const user = data.data.student;
          const fullName = user.fullName;
          const initials = fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          setUserData({
            name: fullName,
            email: user.email,
            initials: initials,
            role: user.role
          });

          localStorage.setItem('user', JSON.stringify(user));

          // Profile completion comes from the same endpoint
          setProfileCompletion({
            percentage: data.data.profileCompletion || 0,
            missingFields: data.data.missingFields || []
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Update greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    const firstName = userData.name.split(' ')[0];
    let greetingText = 'Welcome back';

    if (hour < 12) {
      greetingText = 'Good morning';
    } else if (hour < 18) {
      greetingText = 'Good afternoon';
    } else {
      greetingText = 'Good evening';
    }

    setGreeting(`${greetingText}, ${firstName}!`);
  }, [userData]);

  // Get REAL application stats
  useEffect(() => {
    const fetchApplicationStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/applications/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          const applicationsData = data.data.applications || [];
          setApplications(applicationsData);
          setStats({
            total: applicationsData.length,
            shortlisted: applicationsData.filter(app => app.status === 'shortlisted').length,
            pending: applicationsData.filter(app => app.status === 'pending').length,
            accepted: applicationsData.filter(app => app.status === 'accepted').length,
            rejected: applicationsData.filter(app => app.status === 'rejected').length
          });
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };

    fetchApplicationStats();
  }, []);

  // Fetch recommended internships
  useEffect(() => {
    const fetchRecommendedInternships = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/internships?limit=3', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setRecommendedInternships(data.data.internships || []);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendedInternships();
    checkActiveInternship();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }

      if (e.key === 'Escape' && document.activeElement?.id === 'searchInput') {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const performSearch = (query) => {
    if (query.trim()) {
      navigate(`/student/internships?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/student/internships');
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  const browseInternships = () => {
    navigate('/student/internships');
  };

  const viewAllApplications = () => {
    navigate('/student/applications');
  };

  const viewInternshipDetails = (internshipId) => {
    navigate(`/student/internship/${internshipId}`);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('registeredEmail');
      showNotification('You have been logged out successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    }
  };

  const showNotification = (message) => {
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #2440F0, #0B1DC1);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  };

  const createRippleEffect = (e) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#FFF4E5', color: '#f59e0b', text: 'Pending' },
      shortlisted: { bg: '#EEF2FF', color: '#2440F0', text: 'Shortlisted' },
      accepted: { bg: '#E6F7E6', color: '#10b981', text: 'Accepted' },
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="app-container">
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
            className={`nav-item ${location.pathname.includes('/student/applications') ? 'active' : ''}`}
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
          {/* ✅ NEW CODE - Wrapped with condition */}
          {hasActiveInternship && (
            <button
              className={`nav-item ${location.pathname.includes('/student/active-internship') || location.pathname.includes('/student/daily-log') || location.pathname.includes('/student/my-logs') || location.pathname.includes('/student/milestones') ? 'active' : ''}`}
              onClick={() => navigate('/student/active-internship')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="nav-item-text">My Internship</span>
            </button>
          )}

        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/student/profile')}
            style={{ width: '100%', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))' }}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">
                Student • Zoyaraa
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        id="sidebarOverlay"
        onClick={toggleMobileMenu}
      ></div>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button
              className="menu-toggle"
              id="menuToggle"
              aria-label="Toggle menu"
              onClick={toggleMobileMenu}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search internships..."
                id="searchInput"
                aria-label="Search internships"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchSubmit}
              />
              <span className="keyboard-hint" id="keyboardHint">Press / to search</span>
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
          <div className="welcome-section">
            <h1 className="welcome-heading" id="greeting">{greeting}</h1>
            <p className="welcome-subtext">Track your applications and discover opportunities at Zoyaraa</p>
          </div>

          {/* Stats Grid - 5 cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="stat-card" id="totalApplicationsCard">
              <div className="stat-info">
                <div className="stat-label">Total Applications</div>
                <div className="stat-value" id="totalApplications">{stats.total}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="pendingCard">
              <div className="stat-info">
                <div className="stat-label">Pending</div>
                <div className="stat-value" id="pendingCount">{stats.pending}</div>
              </div>
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M3 9h18"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="shortlistedCard">
              <div className="stat-info">
                <div className="stat-label">Shortlisted</div>
                <div className="stat-value" id="shortlistedCount">{stats.shortlisted}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M5.5 20v-2a6 6 0 0 1 12 0v2"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="acceptedCard">
              <div className="stat-info">
                <div className="stat-label">Accepted</div>
                <div className="stat-value" id="acceptedCount">{stats.accepted}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="rejectedCard">
              <div className="stat-info">
                <div className="stat-label">Rejected</div>
                <div className="stat-value" id="rejectedCount">{stats.rejected}</div>
              </div>
              <div className="stat-icon red" style={{ background: '#fee2e2' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="primary-btn"
              onClick={(e) => { createRippleEffect(e); browseInternships(); }}
              aria-label="Browse internships"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Browse Internships
            </button>
            <button
              className="secondary-btn"
              onClick={(e) => { createRippleEffect(e); viewAllApplications(); }}
              aria-label="View all applications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              View All Applications
            </button>
          </div>

          {/* Two Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Recent Applications Section */}
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-header">
                <h2 className="section-title">Recent Applications</h2>
                {applications.length > 0 && (
                  <button
                    className="view-all-link"
                    onClick={() => navigate('/student/applications')}
                  >
                    View All ({applications.length})
                  </button>
                )}
              </div>

              {applications.length === 0 ? (
                <div className="empty-state" id="emptyApplications">
                  <div className="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <h3>No applications yet</h3>
                  <p>Start exploring internships and apply to positions that match your skills</p>
                  <button
                    className="primary-btn"
                    onClick={(e) => { createRippleEffect(e); browseInternships(); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    Browse Internships
                  </button>
                </div>
              ) : (
                <div className="recent-applications-list">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app._id} className="recent-application-card">
                      <div className="recent-app-header">
                        <h4>{app.internship?.title || 'Internship'}</h4>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="recent-app-company">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        {app.internship?.companyName || 'Zoyaraa'} • {app.internship?.department || 'Department'}
                      </div>
                      <div className="recent-app-meta">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Applied: {formatDate(app.appliedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recommended Internships Section */}
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-header">
                <h2 className="section-title">Recommended for You</h2>
                {recommendedInternships.length > 0 && (
                  <button
                    className="view-all-link"
                    onClick={() => navigate('/student/internships')}
                  >
                    View All
                  </button>
                )}
              </div>

              {recommendedInternships.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <h3>Check back later</h3>
                  <p>New internships will appear here as they're posted</p>
                </div>
              ) : (
                <div className="recent-applications-list">
                  {recommendedInternships.slice(0, 3).map((internship) => (
                    <div
                      key={internship._id}
                      className="recent-application-card"
                      onClick={() => viewInternshipDetails(internship._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="recent-app-header">
                        <h4>{internship.title}</h4>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#EEF2FF',
                          color: '#2440F0',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          {internship.department}
                        </span>
                      </div>
                      <div className="recent-app-company">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        {internship.workMode} • {internship.location}
                      </div>
                      <div className="recent-app-meta">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Starts: {formatDate(internship.startDate)}
                        </span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>
                          ₹{internship.stipend?.toLocaleString() || 'Unpaid'}/mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;