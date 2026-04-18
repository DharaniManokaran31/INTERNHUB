// src/pages/student/MilestonesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse existing styles
import NotificationBell from '../../components/common/NotificationBell';
import StudentSidebar from '../../components/layout/StudentSidebar';

const MilestonesPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internshipTitle, setInternshipTitle] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
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

  // Fetch milestones
  useEffect(() => {
    const fetchMilestones = async () => {
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

        const acceptedApp = appsData.data.applications?.find(app => app.status === 'accepted');

        if (!acceptedApp) {
          // No active internship, redirect to dashboard
          navigate('/student/dashboard');
          return;
        }

        const internshipId = acceptedApp.internshipId || acceptedApp.internship?._id;

        // Fetch internship details with milestones
        const internshipResponse = await fetch(`http://localhost:5000/api/progress/milestones/${internshipId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const internshipData = await internshipResponse.json();

        if (internshipData.success) {
          const milestoneList = internshipData.data.milestones || [];
          setMilestones(milestoneList);
          setInternshipTitle(internshipData.data.internship?.title || 'Internship');

          // Calculate stats
          const completed = milestoneList.filter(m => m.status === 'completed').length;
          const pending = milestoneList.filter(m => m.status === 'pending').length;
          const overdue = milestoneList.filter(m => m.status === 'overdue').length;

          setStats({
            total: milestoneList.length,
            completed,
            pending,
            overdue
          });
        }
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: { bg: '#E6F7E6', color: '#10b981', text: 'Completed' },
      pending: { bg: '#EEF2FF', color: '#2440F0', text: 'In Progress' },
      overdue: { bg: '#fee2e2', color: '#dc2626', text: 'Overdue' }
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

  const getStatusIcon = (status) => {
    if (status === 'completed') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
    } else if (status === 'overdue') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      );
    }
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
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">Project Milestones</h2>
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
            <h1 className="page-title">Project Milestones</h1>
            <p className="page-subtitle">Track your key deliverables and deadlines for {internshipTitle}</p>
          </div>

          {/* Stats Grid - Only show if there are milestones */}
          {stats.total > 0 && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Total Milestones</div>
                  <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                  </svg>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{stats.completed}</div>
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
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{stats.pending}</div>
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
                  <div className="stat-label">Overdue</div>
                  <div className="stat-value">{stats.overdue}</div>
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
          )}

          {/* Milestones List */}
          {loading ? (
            <div className="applications-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : milestones.length > 0 ? (
            <div className="applications-grid">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className="application-card" 
                  style={{ 
                    borderLeft: `5px solid ${
                      milestone.status === 'completed' ? '#10b981' :
                      milestone.status === 'overdue' ? '#dc2626' :
                      '#2440F0'
                    }`
                  }}
                >
                  <div className="app-card-header">
                    <div className="app-company-info">
                      <div 
                        className="app-company-logo"
                        style={{
                          background: milestone.status === 'completed' ? '#def7ec' :
                                    milestone.status === 'overdue' ? '#fde8e8' :
                                    '#eef1fe',
                          color: milestone.status === 'completed' ? '#046c4e' :
                                 milestone.status === 'overdue' ? '#9b1c1c' :
                                 '#2440F0'
                        }}
                      >
                        {milestone.status === 'completed' ? '✓' :
                         milestone.status === 'overdue' ? '⚠' :
                         '🏁'}
                      </div>
                      <div className="app-details">
                        <h3 className="app-title">{milestone.title}</h3>
                        <p className="app-company-name">
                          {milestone.description}
                        </p>
                        <div className="app-meta">
                          {milestone.dueDate && (
                            <span className="app-meta-item">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              Due: {formatDate(milestone.dueDate)}
                            </span>
                          )}
                          {milestone.completedDate && (
                            <span className="app-meta-item" style={{ color: '#10b981' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                              Completed: {formatDate(milestone.completedDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(milestone.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                </svg>
              </div>
              <h3>No Milestones Yet</h3>
              <p>
                Your mentor hasn't assigned any specific milestones to your internship yet.<br />
                Focus on submitting your daily logs in the meantime!
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate('/student/daily-log')}
              >
                Submit Daily Log
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MilestonesPage;