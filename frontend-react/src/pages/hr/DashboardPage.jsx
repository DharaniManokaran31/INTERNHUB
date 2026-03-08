// src/pages/hr/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';
import InviteRecruiterModal from '../../components/modals/InviteRecruiterModal';
import companyService from '../../services/companyService';

const HRDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [stats, setStats] = useState({
    totalRecruiters: 0,
    activeInternships: 0,
    totalApplicants: 0,
    activeInterns: 0
  });
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'HR',
    role: 'hr'
  });
  const [greeting, setGreeting] = useState('Welcome back');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchHRProfile();
    fetchDashboardData();
  }, []);

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

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHRProfile = async () => {
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
          role: user.role
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) return;

      const companyResponse = await fetch('http://localhost:5000/api/company/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const companyData = await companyResponse.json();

      if (companyData.success) {
        setCompany(companyData.data?.company || companyData.company);
      }

      const recruitersResponse = await fetch('http://localhost:5000/api/company/recruiters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recruitersData = await recruitersResponse.json();

      if (recruitersData.success) {
        const allActive = recruitersData.data.active || [];
        const allPending = recruitersData.data.pending || [];

        const currentUserEmail = userData.email;
        const hrEmail = 'dharani31082005@gmail.com'; // HR's actual email

        // ✅ FILTER HR OUT FROM ACTIVE LIST
        const filteredActive = allActive.filter(recruiter =>
          recruiter.email !== hrEmail && recruiter.email !== currentUserEmail
        );

        // ✅ FILTER HR OUT FROM PENDING LIST
        const filteredPending = allPending.filter(invite =>
          invite.email !== hrEmail && invite.email !== currentUserEmail
        );

        setRecruiters(filteredActive);  // ← NOW HR IS REMOVED
        setPendingInvites(filteredPending);

        setStats({
          totalRecruiters: filteredActive.length, // Count only real recruiters
          activeInternships: 0,
          totalApplicants: 0,
          activeInterns: 0
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (query) => {
    navigate(`/hr/search?q=${encodeURIComponent(query)}`);
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

  const handleInviteRecruiter = async (recruiterData) => {
    try {
      const response = await companyService.inviteRecruiter(recruiterData);
      showNotification(`Invitation sent to ${recruiterData.fullName}!`);
      setShowInviteModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Invite error:', error);
      showNotification(error.response?.data?.message || 'Failed to send invitation', 'error');
    }
  };

  // ✅ NEW: Handle resend invitation
  const handleResendInvite = async (recruiterId) => {
    try {
      const response = await companyService.resendInvitation(recruiterId);
      showNotification('Invitation resent successfully!');
      fetchDashboardData(); // Refresh the list
    } catch (error) {
      console.error('Resend error:', error);
      showNotification(error.response?.data?.message || 'Failed to resend invitation', 'error');
    }
  };

  const statCards = [
    {
      label: 'Total Recruiters',
      value: stats.totalRecruiters,
      gradient: 'linear-gradient(90deg, #2440F0, #8b5cf6)',
      bgColor: '#EEF2FF',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      label: 'Active Internships',
      value: stats.activeInternships,
      gradient: 'linear-gradient(90deg, #10b981, #34d399)',
      bgColor: '#E6F7E6',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      label: 'Total Applicants',
      value: stats.totalApplicants,
      gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      bgColor: '#FFF4E5',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      )
    },
    {
      label: 'Active Interns',
      value: stats.activeInterns,
      gradient: 'linear-gradient(90deg, #8b5cf6, #c084fc)',
      bgColor: '#f3e8ff',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="app-container">
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <span className="sidebar-logo-text">Zoyaraa HR</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item active"
            onClick={() => navigate('/hr/dashboard')}
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
            onClick={() => navigate('/hr/recruiters')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="nav-item-text">Recruiters</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/hr/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="nav-item-text">Internships</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/hr/reports')}
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
            onClick={() => navigate('/hr/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">HR Admin</div>
            </div>
          </button>
        </div>
      </aside>

      <main className="main-content">
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
                placeholder="Search recruiters, internships..."
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

        <div className="content-area">
          <div className="welcome-section">
            <h1 className="welcome-heading">{greeting}</h1>
            <p className="welcome-subtext">Manage your team and monitor internship progress</p>
          </div>

          {company && company.verificationStatus !== 'verified' && (
            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <span style={{ color: '#9A3412', fontSize: '0.9375rem' }}>
                Your company is pending verification. You cannot invite recruiters until verified.
              </span>
            </div>
          )}

          {loading ? (
            <div className="resume-loading">
              <div className="loading-spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {statCards.map((card, index) => (
                  <div
                    key={index}
                    style={{
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
                    }}
                  >
                    <div
                      className="hover-line"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: card.gradient,
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.4s ease',
                        width: '100%',
                        pointerEvents: 'none'
                      }}
                    ></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#666666', marginBottom: '0.25rem' }}>{card.label}</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#000' }}>{card.value}</h2>
                      </div>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        background: card.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {card.icon}
                      </div>
                    </div>

                    {index === 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem' }}>Active</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{stats.totalRecruiters}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#666666', marginBottom: '0.25rem' }}>Pending</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>{pendingInvites.length}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="action-buttons" style={{ marginBottom: '2rem' }}>
                <button
                  className="primary-btn"
                  onClick={(e) => {
                    createRippleEffect(e);
                    setShowInviteModal(true);
                  }}
                  disabled={!company || company.verificationStatus !== 'verified'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Invite New Recruiter
                </button>
                <button
                  className="secondary-btn"
                  onClick={(e) => { createRippleEffect(e); navigate('/hr/recruiters'); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  View All Recruiters
                </button>
                <button
                  className="secondary-btn"
                  onClick={(e) => { createRippleEffect(e); navigate('/hr/internships'); }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  View Internships
                </button>
              </div>

              <section className="section">
                <div className="section-header">
                  <h2 className="section-title">Recent Recruiters</h2>
                  {recruiters.length > 0 && (
                    <button
                      className="view-all-link"
                      onClick={() => navigate('/hr/recruiters')}
                    >
                      View All ({recruiters.length})
                    </button>
                  )}
                </div>

                <div className="recent-applications-list">
                  {recruiters.length === 0 ? (
                    <div className="empty-state small">
                      <div className="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M8 12h8"></path>
                        </svg>
                      </div>
                      <h3>No recruiters yet</h3>
                      <p>Invite your first recruiter to join Zoyaraa</p>
                      <button
                        className="primary-btn"
                        onClick={() => setShowInviteModal(true)}
                        style={{ marginTop: '1rem' }}
                      >
                        Invite Recruiter
                      </button>
                    </div>
                  ) : (
                    recruiters.slice(0, 3).map(recruiter => (
                      <div key={recruiter._id} className="recent-application-card">
                        <div className="recent-app-header">
                          <h4>{recruiter.fullName}</h4>
                          <span className="status-badge status-active">Active</span>
                        </div>
                        <div className="recent-app-company">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          {recruiter.department} • {recruiter.designation || 'Recruiter'}
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
              </section>

              {pendingInvites.length > 0 && (
                <section className="section">
                  <div className="section-header">
                    <h2 className="section-title">Pending Invitations</h2>
                    <span className="view-all-link" style={{ cursor: 'default' }}>
                      {pendingInvites.length} pending
                    </span>
                  </div>

                  <div className="recent-applications-list">
                    {pendingInvites.slice(0, 3).map(invite => (
                      <div key={invite._id} className="recent-application-card">
                        <div className="recent-app-header">
                          <h4>{invite.fullName}</h4>
                          <span className="status-badge status-pending">Pending</span>
                        </div>
                        <div className="recent-app-company">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          {invite.email}
                        </div>
                        <div className="recent-app-meta">
                          <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Invited {formatDate(invite.createdAt)}
                          </span>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                          <button
                            className="secondary-btn"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => handleResendInvite(invite._id)}  // ✅ FIXED: Now calls the function
                          >
                            Resend Invitation
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {showInviteModal && (
        <InviteRecruiterModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteRecruiter}
        />
      )}
    </div>
  );
};

export default HRDashboardPage;