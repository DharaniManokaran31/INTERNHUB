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
  const [myMentees, setMyMentees] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({
    activeInternships: 0,
    totalApplications: 0,
    shortlisted: 0,
    hired: 0,
    pending: 0,
    rejected: 0,
    myMentees: 0,
    pendingInterviews: 0,
    upcomingInterviews: 0,
    totalInterviews: 0,
    conversionRate: 0
  });
  const [userData, setUserData] = useState({
    name: 'Loading...',
    email: '',
    initials: '',
    role: 'recruiter',
    department: '',
    company: 'Zoyaraa'
  });
  const [loading, setLoading] = useState({
    profile: true,
    internships: true,
    stats: true,
    applications: true,
    mentees: true,
    interviews: true
  });
  const [greeting, setGreeting] = useState('Welcome back');
  const [error, setError] = useState(null);

  // Get REAL user profile from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/recruiters/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
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
            department: user.department || '',
            company: 'Zoyaraa'
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
    const firstName = userData.name.split(' ')[0] || 'Recruiter';
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

  // Get REAL internship data
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/internships/recruiter/mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const internshipsList = data.data.internships || [];
          setInternships(internshipsList.slice(0, 3));

          const activeCount = internshipsList.filter(i => i.status === 'active').length;
          setStats(prev => ({ ...prev, activeInternships: activeCount }));
        }
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setLoading(prev => ({ ...prev, internships: false }));
      }
    };

    fetchInternships();
  }, []);

  // Fetch REAL application stats
  useEffect(() => {
    const fetchApplicationStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/recruiters/department-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const totalDecided = (data.data.shortlistedApplications || 0) + (data.data.rejectedApplications || 0);
          const conversionRate = totalDecided > 0 
            ? Math.round((data.data.shortlistedApplications || 0) / totalDecided * 100) 
            : 0;

          setStats(prev => ({
            ...prev,
            totalApplications: data.data.totalApplications || 0,
            shortlisted: data.data.shortlistedApplications || 0,
            hired: data.data.acceptedApplications || 0,
            pending: data.data.pendingApplications || 0,
            rejected: data.data.rejectedApplications || 0,
            conversionRate
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

  // Fetch REAL recent applications
  useEffect(() => {
    const fetchRecentApplications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/applications/recruiter/recent?limit=3', {
          headers: { 'Authorization': `Bearer ${token}` }
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

  // Fetch REAL interview data
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/interviews/recruiter', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          setInterviews(data.data.interviews?.slice(0, 3) || []);
          
          const pendingCount = data.data.interviews?.filter(i => 
            i.rounds?.some(r => r.status === 'pending')
          ).length || 0;

          setStats(prev => ({
            ...prev,
            pendingInterviews: pendingCount,
            totalInterviews: data.data.interviews?.length || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(prev => ({ ...prev, interviews: false }));
      }
    };

    fetchInterviews();
  }, []);

  // Fetch REAL mentees
  useEffect(() => {
    const fetchMentees = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/recruiters/mentees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          setMyMentees(data.data.mentees?.slice(0, 3) || []);
          setStats(prev => ({
            ...prev,
            myMentees: data.data.mentees?.length || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching mentees:', error);
      } finally {
        setLoading(prev => ({ ...prev, mentees: false }));
      }
    };

    fetchMentees();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(() => {
      navigate(`/recruiter/internships?search=${encodeURIComponent(searchQuery)}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate]);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/recruiter/internships?search=${encodeURIComponent(searchQuery)}`);
    }
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
    switch (status?.toLowerCase()) {
      case 'active': return { class: 'badge-success', text: 'Active' };
      case 'pending': return { class: 'badge-warning', text: 'Pending' };
      case 'shortlisted': return { class: 'badge-info', text: 'Shortlisted' };
      case 'accepted': return { class: 'badge-success', text: 'Accepted' };
      case 'rejected': return { class: 'badge-error', text: 'Rejected' };
      case 'closed': return { class: 'badge-error', text: 'Closed' };
      case 'scheduled': return { class: 'badge-info', text: 'Scheduled' };
      case 'completed': return { class: 'badge-success', text: 'Completed' };
      default: return { class: 'badge-info', text: status || 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'internship': return '💼';
      case 'application': return '📝';
      case 'mentee': return '👥';
      case 'interview': return '📅';
      default: return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'internship': return '#2440F0';
      case 'application': return '#f59e0b';
      case 'mentee': return '#10b981';
      case 'interview': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const isLoading = Object.values(loading).some(state => state === true);

  return (
    <div className="app-container">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Sidebar - Recruiter Specific */}
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
            className={`nav-item active`}
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
            className="nav-item"
            onClick={() => navigate('/recruiter/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="nav-item-text">Manage Internships</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/recruiter/post-internship')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="nav-item-text">Post Internship</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/recruiter/applicants')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span className="nav-item-text">View Applicants</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/recruiter/interviews')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="nav-item-text">Interviews</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/recruiter/mentees')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span className="nav-item-text">My Mentees</span>
            {stats.myMentees > 0 && (
              <span className="nav-badge">{stats.myMentees}</span>
            )}
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/recruiter/mentor-dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
            </svg>
            <span className="nav-item-text">Mentor Dashboard</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/recruiter/profile')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="nav-item-text">Profile</span>
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
                {userData.department || 'Recruiter'} • Zoyaraa
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="top-bar">
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
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                id="searchInput"
                placeholder="Search internships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
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
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Error Banner */}
          {error && (
            <div className="section" style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#b91c1c',
              marginBottom: '1.5rem',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Welcome Section */}
          <div className="welcome-section">
            <h1 className="welcome-heading">{greeting}</h1>
            <p className="welcome-subtext">
              {userData.department 
                ? `Manage your ${userData.department} department internships and track applicants`
                : 'Manage your internship postings and track applicants'}
            </p>
          </div>

          {/* Stats Grid - First Row: Application Overview */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Application Overview
            </h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Active Internships</div>
                  <div className="stat-value">
                    {loading.internships ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.activeInternships
                    )}
                  </div>
                </div>
                <div className="stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Total Applications</div>
                  <div className="stat-value">
                    {loading.stats ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.totalApplications
                    )}
                  </div>
                </div>
                <div className="stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Shortlisted</div>
                  <div className="stat-value">
                    {loading.stats ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.shortlisted
                    )}
                  </div>
                </div>
                <div className="stat-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M5.5 20v-2a6 6 0 0 1 12 0v2"></path>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Conversion Rate</div>
                  <div className="stat-value">
                    {loading.stats ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      `${stats.conversionRate}%`
                    )}
                  </div>
                </div>
                <div className="stat-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 20L22 20" />
                    <path d="M4 16L8 8L12 12L16 6L20 12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Second Row: Hiring Progress */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hiring Progress
            </h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Hired</div>
                  <div className="stat-value">
                    {loading.stats ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.hired
                    )}
                  </div>
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
                  <div className="stat-label">Pending</div>
                  <div className="stat-value">
                    {loading.stats ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.pending
                    )}
                  </div>
                </div>
                <div className="stat-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Rejected</div>
                  <div className="stat-value">
                    {loading.stats ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.rejected
                    )}
                  </div>
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
          </div>

          {/* Stats Grid - Third Row: Mentoring Overview */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mentoring Overview
            </h3>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">My Mentees</div>
                  <div className="stat-value">
                    {loading.mentees ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.myMentees
                    )}
                  </div>
                </div>
                <div className="stat-icon teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Pending Interviews</div>
                  <div className="stat-value">
                    {loading.interviews ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.pendingInterviews
                    )}
                  </div>
                </div>
                <div className="stat-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Total Interviews</div>
                  <div className="stat-value">
                    {loading.interviews ? (
                      <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                    ) : (
                      stats.totalInterviews
                    )}
                  </div>
                </div>
                <div className="stat-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons" style={{ marginBottom: '2rem' }}>
            <button
              className="primary-btn"
              onClick={(e) => { createRippleEffect(e); navigate('/recruiter/post-internship'); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Post New Internship
            </button>
            <button
              className="secondary-btn"
              onClick={(e) => { createRippleEffect(e); navigate('/recruiter/internships'); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              Manage Internships
            </button>
            <button
              className="secondary-btn"
              onClick={(e) => { createRippleEffect(e); navigate('/recruiter/applicants'); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              View All Applicants
            </button>
          </div>

          {/* Four Column Grid - Like HR Dashboard but Separate Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Recent Internships */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span style={{ marginRight: '0.5rem' }}>💼</span> 
                  Recent Internships
                </h2>
                <button
                  className="secondary-btn"
                  onClick={() => navigate('/recruiter/internships')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                >
                  View All
                </button>
              </div>

              <div className="recent-applications-list">
                {loading.internships ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: '100px' }}></div>
                  ))
                ) : internships.length > 0 ? (
                  internships.map(internship => {
                    const status = getStatusBadge(internship.status);
                    return (
                      <div
                        key={internship._id}
                        className="recent-application-card"
                        style={{
                          padding: '1rem',
                          borderLeft: '4px solid #2440F0',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: '600' }}>{internship.title}</h4>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                              {internship.department || userData.department} • {internship.location || 'Remote'}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                              <span>📅 Posted {formatDate(internship.createdAt)}</span>
                              <span>👥 {internship.applicationCount || 0} applicants</span>
                            </div>
                          </div>
                          <span className={`badge ${status.class}`}>{status.text}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <h3>No internships yet</h3>
                    <p>Post your first internship to get started.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Applications */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span style={{ marginRight: '0.5rem' }}>📝</span> 
                  Recent Applications
                </h2>
                <button
                  className="secondary-btn"
                  onClick={() => navigate('/recruiter/applicants')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                >
                  View All
                </button>
              </div>

              <div className="recent-applications-list">
                {loading.applications ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: '100px' }}></div>
                  ))
                ) : recentApplications.length > 0 ? (
                  recentApplications.map(app => {
                    const status = getStatusBadge(app.status);
                    const student = app.studentId || app.student || {};
                    const internship = app.internshipId || app.internship || {};
                    
                    return (
                      <div
                        key={app._id}
                        className="recent-application-card"
                        style={{
                          padding: '1rem',
                          borderLeft: '4px solid #f59e0b',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <div className="user-avatar-sidebar" style={{ width: '28px', height: '28px', fontSize: '0.7rem', background: '#f59e0b' }}>
                                {getInitials(student.fullName)}
                              </div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>{student.fullName || 'Student'}</h4>
                            </div>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                              {internship.title || 'Internship'} • {internship.department || 'Department'}
                            </p>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                              Applied {formatDate(app.appliedAt)}
                            </div>
                          </div>
                          <span className={`badge ${status.class}`}>{status.text}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <h3>No applications yet</h3>
                    <p>Applications will appear here when students apply.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Second Row - My Mentees & Pending Interviews */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* My Mentees */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span style={{ marginRight: '0.5rem' }}>👥</span> 
                  My Mentees
                </h2>
                <button
                  className="secondary-btn"
                  onClick={() => navigate('/recruiter/mentees')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                >
                  View All
                </button>
              </div>

              <div className="recent-applications-list">
                {loading.mentees ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: '90px' }}></div>
                  ))
                ) : myMentees.length > 0 ? (
                  myMentees.map(mentee => (
                    <div
                      key={mentee._id}
                      className="recent-application-card"
                      style={{
                        padding: '1rem',
                        borderLeft: '4px solid #10b981',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <div className="user-avatar-sidebar" style={{ width: '28px', height: '28px', fontSize: '0.7rem', background: '#10b981' }}>
                              {getInitials(mentee.fullName)}
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>{mentee.fullName}</h4>
                          </div>
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                            {mentee.internship?.title || 'Internship'} • {mentee.internship?.department || 'Department'}
                          </p>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Progress: {mentee.progress || 'Just started'}
                          </div>
                        </div>
                        <span className="badge badge-success">Active</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                    </div>
                    <h3>No mentees yet</h3>
                    <p>Accept interns to start mentoring them.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Pending Interviews */}
            <section className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title">
                  <span style={{ marginRight: '0.5rem' }}>📅</span> 
                  Pending Interviews
                </h2>
                <button
                  className="secondary-btn"
                  onClick={() => navigate('/recruiter/interviews')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                >
                  View All
                </button>
              </div>

              <div className="recent-applications-list">
                {loading.interviews ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="skeleton-card" style={{ height: '90px' }}></div>
                  ))
                ) : interviews.length > 0 ? (
                  interviews.map(interview => {
                    const student = interview.studentId || {};
                    const pendingRound = interview.rounds?.find(r => r.status === 'pending');
                    
                    return (
                      <div
                        key={interview._id}
                        className="recent-application-card"
                        style={{
                          padding: '1rem',
                          borderLeft: '4px solid #8b5cf6',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <div className="user-avatar-sidebar" style={{ width: '28px', height: '28px', fontSize: '0.7rem', background: '#8b5cf6' }}>
                                {getInitials(student.fullName)}
                              </div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>{student.fullName || 'Candidate'}</h4>
                            </div>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                              {interview.internshipId?.title || 'Internship'} • Round {interview.currentRound || 1}
                            </p>
                            <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>⏳</span>
                              {pendingRound ? `Need to schedule ${pendingRound.roundType}` : 'Awaiting response'}
                            </div>
                          </div>
                          <span className="badge badge-warning">Pending</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <h3>No pending interviews</h3>
                    <p>Shortlist candidates to schedule interviews.</p>
                    <button
                      className="secondary-btn"
                      onClick={() => navigate('/recruiter/applicants')}
                      style={{ marginTop: '1rem' }}
                    >
                      View Applicants
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecruiterDashboardPage;