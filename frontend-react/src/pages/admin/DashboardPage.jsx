// src/pages/admin/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: {
      totalStudents: 0,
      totalRecruiters: 0,
      totalUsers: 0
    },
    internships: {
      total: 0,
      active: 0,
      closed: 0,
      draft: 0
    },
    applications: {
      total: 0,
      pending: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0
    }
  });
  const [recentData, setRecentData] = useState({
    students: [],
    recruiters: [],
    internships: []
  });
  const [activeTab, setActiveTab] = useState('all');
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'AD',
    role: 'admin'
  });
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    fetchAdminProfile();
    fetchDashboardStats();
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

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/admin/profile', {
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
          role: user.role
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setRecentData({
          students: data.data.recent?.students || [],
          recruiters: data.data.recent?.recruiters || [],
          internships: data.data.recent?.internships || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (query) => {
    // Global search across platform
    navigate(`/admin/search?q=${encodeURIComponent(query)}`);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: '#E6F7E6', color: '#10b981' };
      case 'closed': return { bg: '#fee2e2', color: '#dc2626' };
      case 'draft': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#1f2937' };
    }
  };

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
            <span className="sidebar-logo-text">InternHub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            onClick={() => navigate('/admin/dashboard')}
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
            onClick={() => navigate('/admin/users')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="nav-item-text">Manage Users</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/admin/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="nav-item-text">Internships</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/admin/reports')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span className="nav-item-text">Reports</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/admin/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">Admin</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar with Search */}
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
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search users, internships, applications..."
                id="searchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchSubmit}
              />
              <span className="keyboard-hint">Press / to search</span>
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
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-heading">{greeting}</h1>
            <p className="welcome-subtext">Monitor and manage your internship platform</p>
          </div>

          {loading ? (
            <div className="resume-loading">
              <div className="loading-spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid - Perfect with Hover Effects */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Total Users Card */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)';
                    const hoverLine = e.currentTarget.querySelector('.hover-line');
                    if (hoverLine) hoverLine.style.transform = 'scaleX(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    const hoverLine = e.currentTarget.querySelector('.hover-line');
                    if (hoverLine) hoverLine.style.transform = 'scaleX(0)';
                  }}>
                  {/* Top Gradient Line on Hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #2440F0, #8b5cf6)',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.4s ease',
                    width: '100%',
                    pointerEvents: 'none'
                  }} className="hover-line"></div>

                  {/* Header with Icon - Centered */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>Total Users</p>
                      <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#000' }}>{stats.users.totalUsers}</h2>
                    </div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>

                  {/* Stats Row - Perfect Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    {/* Students */}
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem' }}>Students</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2440F0' }}>{stats.users.totalStudents}</p>
                    </div>
                    {/* Recruiters */}
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem' }}>Recruiters</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{stats.users.totalRecruiters}</p>
                    </div>
                  </div>
                </div>

                {/* Internships Card */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)';
                    const hoverLine = e.currentTarget.querySelector('.hover-line');
                    if (hoverLine) hoverLine.style.transform = 'scaleX(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    const hoverLine = e.currentTarget.querySelector('.hover-line');
                    if (hoverLine) hoverLine.style.transform = 'scaleX(0)';
                  }}>
                  {/* Top Gradient Line on Hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.4s ease',
                    width: '100%',
                    pointerEvents: 'none'
                  }} className="hover-line"></div>

                  {/* Header with Icon - Centered */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>Internships</p>
                      <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#000' }}>{stats.internships.total}</h2>
                    </div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#E6F7E6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Stats Row - Perfect Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#666666', marginBottom: '0.25rem' }}>Active</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{stats.internships.active}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#666666', marginBottom: '0.25rem' }}>Closed</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>{stats.internships.closed || 0}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', color: '#666666', marginBottom: '0.25rem' }}>Draft</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#6b7280' }}>{stats.internships.draft || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Applications Card */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)';
                    const hoverLine = e.currentTarget.querySelector('.hover-line');
                    if (hoverLine) hoverLine.style.transform = 'scaleX(1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    const hoverLine = e.currentTarget.querySelector('.hover-line');
                    if (hoverLine) hoverLine.style.transform = 'scaleX(0)';
                  }}>
                  {/* Top Gradient Line on Hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.4s ease',
                    width: '100%',
                    pointerEvents: 'none'
                  }} className="hover-line"></div>

                  {/* Header with Icon - Centered */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>Applications</p>
                      <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#000' }}>{stats.applications.total}</h2>
                    </div>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: '#FFF4E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                  </div>

                  {/* Stats Row - Perfect Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#666666', marginBottom: '0.25rem' }}>Pending</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>{stats.applications.pending}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#666666', marginBottom: '0.25rem' }}>Shortlist</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2440F0' }}>{stats.applications.shortlisted}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#666666', marginBottom: '0.25rem' }}>Accepted</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>{stats.applications.accepted}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: '#666666', marginBottom: '0.25rem' }}>Rejected</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#dc2626' }}>{stats.applications.rejected}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons (Above Recent Activity) */}
              <div className="action-buttons" style={{ marginBottom: '2rem' }}>
                <button
                  className="primary-btn"
                  onClick={(e) => { createRippleEffect(e); navigate('/admin/users'); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Manage Users
                </button>
                <button
                  className="secondary-btn"
                  onClick={(e) => { createRippleEffect(e); navigate('/admin/internships'); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  View Internships
                </button>
                <button
                  className="secondary-btn"
                  onClick={(e) => { createRippleEffect(e); navigate('/admin/reports'); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  View Reports
                </button>
              </div>

              {/* Recent Activity Tabs */}
              <section className="section" style={{ padding: 0 }}>
                <div style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem 0' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      onClick={() => setActiveTab('all')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'all' ? '2px solid #2440F0' : 'none',
                        color: activeTab === 'all' ? '#2440F0' : '#666',
                        fontWeight: activeTab === 'all' ? '600' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      All Activity
                    </button>
                    <button
                      onClick={() => setActiveTab('students')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'students' ? '2px solid #2440F0' : 'none',
                        color: activeTab === 'students' ? '#2440F0' : '#666',
                        fontWeight: activeTab === 'students' ? '600' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      Students ({recentData.students.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('recruiters')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'recruiters' ? '2px solid #2440F0' : 'none',
                        color: activeTab === 'recruiters' ? '#2440F0' : '#666',
                        fontWeight: activeTab === 'recruiters' ? '600' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      Recruiters ({recentData.recruiters.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('internships')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'internships' ? '2px solid #2440F0' : 'none',
                        color: activeTab === 'internships' ? '#2440F0' : '#666',
                        fontWeight: activeTab === 'internships' ? '600' : '500',
                        cursor: 'pointer'
                      }}
                    >
                      Internships ({recentData.internships.length})
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {/* All Activity View */}
                  {activeTab === 'all' && (
                    <div className="recent-applications-list">
                      {recentData.students.length === 0 && recentData.recruiters.length === 0 && recentData.internships.length === 0 ? (
                        <div className="empty-state small">
                          <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12h8"></path>
                            </svg>
                          </div>
                          <h3>No recent activity</h3>
                          <p>Activities will appear here as users interact with the platform</p>
                        </div>
                      ) : (
                        <>
                          {/* Students */}
                          {recentData.students.map(student => (
                            <div key={student._id} className="recent-application-card">
                              <div className="recent-app-header">
                                <h4>👨‍🎓 New Student Registered</h4>
                                <span className="status-badge" style={{ background: '#EEF2FF', color: '#2440F0' }}>
                                  STUDENT
                                </span>
                              </div>
                              <div className="recent-app-company">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                                {student.fullName} • {student.email}
                              </div>
                              <div className="recent-app-meta">
                                <span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  {formatDate(student.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}

                          {/* Recruiters */}
                          {recentData.recruiters.map(recruiter => (
                            <div key={recruiter._id} className="recent-application-card">
                              <div className="recent-app-header">
                                <h4>👔 New Recruiter Registered</h4>
                                <span className="status-badge" style={{ background: '#E6F7E6', color: '#10b981' }}>
                                  RECRUITER
                                </span>
                              </div>
                              <div className="recent-app-company">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                                {recruiter.fullName} • {recruiter.company || recruiter.email}
                              </div>
                              <div className="recent-app-meta">
                                <span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  {formatDate(recruiter.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}

                          {/* Internships */}
                          {recentData.internships.map(internship => {
                            const statusStyle = getStatusColor(internship.status);
                            return (
                              <div key={internship._id} className="recent-application-card">
                                <div className="recent-app-header">
                                  <h4>💼 New Internship Posted</h4>
                                  <span className="status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                    {internship.status?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="recent-app-company">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                  </svg>
                                  {internship.title} at {internship.companyName}
                                </div>
                                <div className="recent-app-meta">
                                  <span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    Posted {formatDate(internship.createdAt)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}

                  {/* Students Only View */}
                  {activeTab === 'students' && (
                    <div className="recent-applications-list">
                      {recentData.students.length === 0 ? (
                        <div className="empty-state small">
                          <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12h8"></path>
                            </svg>
                          </div>
                          <h3>No students yet</h3>
                          <p>Students will appear here when they register</p>
                        </div>
                      ) : (
                        recentData.students.map(student => (
                          <div key={student._id} className="recent-application-card">
                            <div className="recent-app-header">
                              <h4>{student.fullName}</h4>
                              <span className="status-badge" style={{ background: '#EEF2FF', color: '#2440F0' }}>
                                STUDENT
                              </span>
                            </div>
                            <div className="recent-app-company">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                              {student.email}
                            </div>
                            <div className="recent-app-meta">
                              <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                Joined {formatDate(student.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Recruiters Only View */}
                  {activeTab === 'recruiters' && (
                    <div className="recent-applications-list">
                      {recentData.recruiters.length === 0 ? (
                        <div className="empty-state small">
                          <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12h8"></path>
                            </svg>
                          </div>
                          <h3>No recruiters yet</h3>
                          <p>Recruiters will appear here when they register</p>
                        </div>
                      ) : (
                        recentData.recruiters.map(recruiter => (
                          <div key={recruiter._id} className="recent-application-card">
                            <div className="recent-app-header">
                              <h4>{recruiter.fullName}</h4>
                              <span className="status-badge" style={{ background: '#E6F7E6', color: '#10b981' }}>
                                RECRUITER
                              </span>
                            </div>
                            <div className="recent-app-company">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                              {recruiter.company || recruiter.email}
                            </div>
                            <div className="recent-app-meta">
                              <span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                Joined {formatDate(recruiter.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Internships Only View */}
                  {activeTab === 'internships' && (
                    <div className="recent-applications-list">
                      {recentData.internships.length === 0 ? (
                        <div className="empty-state small">
                          <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12h8"></path>
                            </svg>
                          </div>
                          <h3>No internships yet</h3>
                          <p>Internships will appear here when recruiters post them</p>
                        </div>
                      ) : (
                        recentData.internships.map(internship => {
                          const statusStyle = getStatusColor(internship.status);
                          return (
                            <div key={internship._id} className="recent-application-card">
                              <div className="recent-app-header">
                                <h4>{internship.title}</h4>
                                <span className="status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                                  {internship.status?.toUpperCase()}
                                </span>
                              </div>
                              <div className="recent-app-company">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                                {internship.companyName} • {internship.type}
                              </div>
                              <div className="recent-app-meta">
                                <span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  Posted {formatDate(internship.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;