// src/pages/recruiter/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const RecruiterDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internships, setInternships] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [stats, setStats] = useState({
    activeInternships: 0,
    totalApplications: 0,
    shortlisted: 0,
    hired: 0,
    pending: 0,
    rejected: 0
  });
  const [userData, setUserData] = useState({
    name: 'Demo Recruiter',
    email: 'recruiter@company.com',
    initials: 'DR',
    role: 'recruiter',
    company: ''
  });
  const [loading, setLoading] = useState({
    profile: true,
    internships: true,
    stats: true,
    applications: true
  });
  const [greeting, setGreeting] = useState('Welcome back');

  // Get REAL user profile from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/recruiters/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          const user = data.data.user;
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
            role: user.role,
            company: user.company || ''
          });

          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(prev => ({ ...prev, profile: false }));
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

  // Get REAL internship and application stats from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Fetch internships posted by this recruiter
        const internshipsResponse = await fetch('http://localhost:5000/api/internships/recruiter', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const internshipsData = await internshipsResponse.json();

        if (internshipsData.success) {
          const internshipsList = internshipsData.data.internships || [];
          setInternships(internshipsList.slice(0, 3)); // Show only 3 recent

          const activeCount = internshipsList.filter(internship =>
            internship.status === 'active'
          ).length;

          setStats(prev => ({
            ...prev,
            activeInternships: activeCount
          }));
        }
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setLoading(prev => ({ ...prev, internships: false }));
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch application stats using new API
  useEffect(() => {
    const fetchApplicationStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/applications/recruiter/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setStats(prev => ({
            ...prev,
            totalApplications: data.data.totalApplications || 0,
            shortlisted: data.data.shortlisted || 0,
            hired: data.data.hired || 0,
            pending: data.data.pending || 0,
            rejected: data.data.rejected || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching application stats:', error);
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchApplicationStats();
  }, []);

  // Fetch recent applications using new API
  useEffect(() => {
    const fetchRecentApplications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/applications/recruiter/recent?limit=3', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success) {
          setRecentApplications(data.data.applications || []);
        }
      } catch (error) {
        console.error('Error fetching recent applications:', error);
      } finally {
        setLoading(prev => ({ ...prev, applications: false }));
      }
    };

    fetchRecentApplications();
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
      navigate(`/recruiter/internships?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/recruiter/internships');
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  const postInternship = () => {
    navigate('/recruiter/post-internship');
  };

  const viewAllInternships = () => {
    navigate('/recruiter/internships');
  };

  const viewAllApplications = () => {
    navigate('/recruiter/applicants');
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

  const handleNotificationClick = () => {
    showNotification('You have no new notifications');
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

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'shortlisted': return 'status-shortlisted';
      case 'rejected': return 'status-rejected';
      case 'accepted': return 'status-accepted';
      case 'active': return 'status-active';
      case 'closed': return 'status-closed';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if any loading state is true
  const isLoading = Object.values(loading).some(state => state === true);

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
            <span className="sidebar-logo-text">InternHub</span>
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
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/recruiter/profile')}
            style={{ width: '100%', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))' }}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">
                {userData.company ? `${userData.role} • ${userData.company}` : 'Recruiter'}
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
            {/* NEW CODE - ADD THIS */}
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
            <p className="welcome-subtext">Manage your internship postings and track applicants</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card" id="activeInternshipsCard">
              <div className="stat-info">
                <div className="stat-label">Active Internships</div>
                <div className="stat-value" id="activeInternships">
                  {isLoading ? '...' : stats.activeInternships}
                </div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="totalApplicationsCard">
              <div className="stat-info">
                <div className="stat-label">Total Applications</div>
                <div className="stat-value" id="totalApplications">
                  {isLoading ? '...' : stats.totalApplications}
                </div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="shortlistedCard">
              <div className="stat-info">
                <div className="stat-label">Shortlisted</div>
                <div className="stat-value" id="shortlistedCount">
                  {isLoading ? '...' : stats.shortlisted}
                </div>
              </div>
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"></circle>
                  <path d="M5.5 20v-2a6 6 0 0 1 12 0v2"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" id="hiredCard">
              <div className="stat-info">
                <div className="stat-label">Hired</div>
                <div className="stat-value" id="hiredCount">
                  {isLoading ? '...' : stats.hired}
                </div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="primary-btn"
              onClick={(e) => { createRippleEffect(e); postInternship(); }}
              aria-label="Post new internship"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Post New Internship
            </button>
            <button
              className="secondary-btn"
              onClick={(e) => { createRippleEffect(e); viewAllInternships(); }}
              aria-label="Manage internships"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Manage Internships
            </button>
          </div>

          {/* Two Column Grid for Recent Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Recent Internships Section */}
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-header">
                <h2 className="section-title">Recent Internships</h2>
                {internships.length > 0 && (
                  <button
                    className="view-all-link"
                    onClick={() => navigate('/recruiter/internships')}
                  >
                    View All ({internships.length})
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="loading-placeholder">Loading internships...</div>
              ) : internships.length === 0 ? (
                <div className="empty-state" id="emptyInternships">
                  <div className="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <h3>No internships posted yet</h3>
                  <p>Post your first internship to start receiving applications</p>
                  <button
                    className="primary-btn"
                    onClick={(e) => { createRippleEffect(e); postInternship(); }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Post Internship
                  </button>
                </div>
              ) : (
                <div className="recent-applications-list">
                  {internships.map((internship) => (
                    <div key={internship._id} className="recent-application-card">
                      <div className="recent-app-header">
                        <h4>{internship.title}</h4>
                        <span className={`status-badge ${getStatusClass(internship.status)}`}>
                          {internship.status || 'Active'}
                        </span>
                      </div>
                      <div className="recent-app-company">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        {internship.type || 'Internship'} • {internship.location || 'Location'}
                      </div>
                      <div className="recent-app-meta">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Posted: {formatDate(internship.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Applications Section */}
            <section className="section" style={{ marginBottom: 0 }}>
              <div className="section-header">
                <h2 className="section-title">Recent Applications</h2>
                {recentApplications.length > 0 && (
                  <button
                    className="view-all-link"
                    onClick={() => navigate('/recruiter/applicants')}
                  >
                    View All ({recentApplications.length})
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="loading-placeholder">Loading applications...</div>
              ) : recentApplications.length === 0 ? (
                <div className="empty-state" id="emptyApplications">
                  <div className="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h3>No applications yet</h3>
                  <p>When students apply to your internships, they'll appear here</p>
                </div>
              ) : (
                <div className="recent-applications-list">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="recent-application-card">
                      <div className="recent-app-header">
                        <h4>{app.studentName}</h4>
                        <span className={`status-badge ${getStatusClass(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="recent-app-company">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        {app.internshipTitle || app.internship}
                      </div>
                      <div className="recent-app-meta">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Applied: {formatDate(app.appliedDate || app.appliedAt)}
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

export default RecruiterDashboardPage;