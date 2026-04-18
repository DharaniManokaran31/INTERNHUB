// src/pages/student/ActiveInternshipPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse existing styles
import NotificationBell from '../../components/common/NotificationBell';
import StudentSidebar from '../../components/layout/StudentSidebar';

const ActiveInternshipPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [internship, setInternship] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [hasCertificate, setHasCertificate] = useState(false);
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

  // Fetch active internship data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        // First, check if student has an accepted application
        const appsResponse = await fetch('http://localhost:5000/api/applications/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const appsData = await appsResponse.json();

        if (!appsData.success) {
          navigate('/student/dashboard');
          return;
        }

        // Find the active or completed application
        const activeApp = appsData.data.applications?.find(app => 
          app.status === 'accepted' || app.status === 'completed'
        );

        if (!activeApp) {
          // No active or completed internship, redirect to dashboard
          navigate('/student/dashboard');
          return;
        }

        setAppStatus(activeApp.status);
        const internshipId = activeApp.internshipId || activeApp.internship?._id;

        // Fetch internship details
        const internshipResponse = await fetch(`http://localhost:5000/api/internships/${internshipId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const internshipData = await internshipResponse.json();

        if (internshipData.success) {
          const internshipObj = internshipData.data.internship;
          setInternship(internshipObj);

          // Priority 1: Direct mentor object from populated internshipData
          if (internshipObj.mentorId && typeof internshipObj.mentorId === 'object' && internshipObj.mentorId.fullName) {
            setMentor(internshipObj.mentorId);
          }
        }

        // Fetch progress data
        const progressResponse = await fetch(`http://localhost:5000/api/progress/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const progressData = await progressResponse.json();

        if (progressData.success) {
          setProgress(progressData.data.progress);
          
          // Priority 2: Mentor object from progressData (populated via deep joins)
          if (progressData.data.internship?.mentor && !mentor) {
            setMentor(progressData.data.internship.mentor);
          }
        }

        // Check for issued certificate
        const certResponse = await fetch('http://localhost:5000/api/students/issued-certificates', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const certData = await certResponse.json();
        if (certData.success && certData.data.certificates?.length > 0) {
          setHasCertificate(true);
        }

        // Fetch recent logs
        const logsResponse = await fetch('http://localhost:5000/api/daily-logs/my-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsResponse.json();

        if (logsData.success) {
          const logs = logsData.data.logs || [];
          setRecentLogs(logs.slice(0, 3));

          // Calculate stats (Verified logs only for hours)
          const approved = logs.filter(l => l.status === 'approved').length;
          const pending = logs.filter(l => l.status === 'pending').length;
          const totalHours = logs.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.totalHours || 0), 0);

          setStats({
            approvedLogs: approved,
            pendingLogs: pending,
            totalHours: totalHours.toFixed(2)
          });
        }

      } catch (error) {
        console.error('Error fetching active internship data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  // Check if today's log is already submitted
  const todayStr = new Date().toDateString();
  const hasLoggedToday = recentLogs.some(log =>
    new Date(log.date).toDateString() === todayStr
  );

  if (loading) {
    return (
      <div className="app-container">
        {/* Sidebar Skeleton */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">Z</div>
              <span className="sidebar-logo-text">Zoyaraa</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-nav-item"></div>
            ))}
          </nav>
        </aside>
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your internship...</p>
          </div>
        </main>
      </div>
    );
  }

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
            <h2 className="page-title">My Internship</h2>
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
          {/* Hero Section - Matching Dashboard style */}
          <div className="welcome-section" style={{
            background: 'linear-gradient(135deg, #2440F0, #0a1a7a)',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  {internship?.title || 'Active Internship'}
                  {appStatus === 'completed' && (
                    <span style={{ 
                      marginLeft: '1rem', 
                      fontSize: '0.9rem', 
                      padding: '0.25rem 0.75rem', 
                      background: 'rgba(255, 255, 255, 0.2)', 
                      borderRadius: '20px',
                      border: '1px solid white',
                      verticalAlign: 'middle' 
                    }}>
                      ✓ COMPLETED
                    </span>
                  )}
                </h1>
                <p style={{ fontSize: '1rem', opacity: '0.9' }}>
                  {internship?.department || 'Department'} • {internship?.companyName || 'Zoyaraa'}
                </p>
              </div>
              {appStatus === 'completed' ? (
                <button
                  className="primary-btn"
                  onClick={() => navigate('/student/certificates')}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  View Certificate
                </button>
              ) : (
                <button
                  className="primary-btn"
                  onClick={() => navigate('/student/daily-log')}
                  disabled={hasLoggedToday}
                  style={{
                    background: hasLoggedToday ? '#9ca3af' : 'white',
                    color: hasLoggedToday ? '#4b5563' : '#2440F0',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: hasLoggedToday ? 'not-allowed' : 'pointer'
                  }}
                >
                  {hasLoggedToday ? '✓ Today\'s Log Submitted' : 'Submit Daily Log'}
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid - Matching Dashboard style */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Progress</div>
                <div className="stat-value">{progress?.percentage || 0}%</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Days Completed</div>
                <div className="stat-value">{progress?.daysPassed || 0}/{progress?.totalDays || 60}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Hours</div>
                <div className="stat-value">{stats?.totalHours || 0}h</div>
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
                <div className="stat-label">Pending Review</div>
                <div className="stat-value">{stats?.pendingLogs || 0}</div>
              </div>
              <div className="stat-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Recent Logs Section */}
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Recent Logs</h2>
                {recentLogs.length > 0 && (
                  <button
                    className="view-all-link"
                    onClick={() => navigate('/student/my-logs')}
                  >
                    View All ({recentLogs.length})
                  </button>
                )}
              </div>

              {recentLogs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <h3>No logs submitted yet</h3>
                  <p>Start logging your daily work to track your progress</p>
                  <button
                    className="primary-btn"
                    onClick={() => navigate('/student/daily-log')}
                  >
                    Submit First Log
                  </button>
                </div>
              ) : (
                <div className="recent-applications-list">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="recent-application-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                          <h4 style={{ marginBottom: '0.25rem' }}>{formatDate(log.date)}</h4>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                            <span>{log.totalHours || 0} hours</span>
                            <span>•</span>
                            <span>{log.tasksCompleted?.length || 0} tasks</span>
                          </div>
                        </div>
                        {getStatusBadge(log.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Mentor & Info Section */}
            <section className="section">
              <h2 className="section-title" style={{ marginBottom: '1rem' }}>Your Mentor</h2>

              {mentor ? (
                <div className="mentor-card" style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#2440F0',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: '600'
                    }}>
                      {mentor.fullName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h3 style={{ marginBottom: '0.25rem' }}>{mentor.fullName}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {mentor.designation || 'Mentor'} • {mentor.department}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{mentor.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mentor-card" style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <p>Mentor information will appear here</p>
                </div>
              )}

              <h2 className="section-title" style={{ marginBottom: '1rem' }}>Internship Rules</h2>
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '1.1rem', marginTop: '0.1rem', minWidth: '20px', textAlign: 'center' }}>⏰</span>
                    <span style={{ fontSize: '0.9rem', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>Submit your daily progress logs before <strong style={{ color: '#1e293b' }}>8:00 PM</strong> daily</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '1.1rem', marginTop: '0.1rem', minWidth: '20px', textAlign: 'center' }}>⏱️</span>
                    <span style={{ fontSize: '0.9rem', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>Consistently log a minimum of <strong style={{ color: '#1e293b' }}>4 working hours</strong> to track attendance</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '1.1rem', marginTop: '0.1rem', minWidth: '20px', textAlign: 'center' }}>✅</span>
                    <span style={{ fontSize: '0.9rem', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>Your contributions must be <strong style={{ color: '#10b981' }}>approved</strong> by your mentor to qualify for progress</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0' }}>
                    <span style={{ fontSize: '1.1rem', marginTop: '0.1rem', minWidth: '20px', textAlign: 'center' }}>⚠️</span>
                    <span style={{ fontSize: '0.9rem', color: '#475569', textAlign: 'left', lineHeight: '1.4' }}>Unreported absence for <strong style={{ color: '#ef4444' }}>3 consecutive days</strong> will trigger a status review</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActiveInternshipPage;