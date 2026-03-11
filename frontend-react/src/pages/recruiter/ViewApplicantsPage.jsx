// src/pages/recruiter/ViewApplicantsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const ViewApplicantsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { internshipId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState({}); // Track which apps have interviews
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedCoverLetter, setExpandedCoverLetter] = useState(null);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    department: '',
    company: 'Zoyaraa'
  });

  useEffect(() => {
    fetchRecruiterProfile();
    fetchInternships();
  }, []);

  useEffect(() => {
    if (selectedInternship) {
      fetchApplications(selectedInternship._id);
    }
  }, [selectedInternship]);

  useEffect(() => {
    if (internshipId && internships.length > 0) {
      const matched = internships.find(i => i._id === internshipId);
      if (matched) {
        setSelectedInternship(matched);
      } else if (internships.length > 0) {
        setSelectedInternship(internships[0]);
      }
    } else if (internships.length > 0 && !selectedInternship) {
      setSelectedInternship(internships[0]);
    }
  }, [internships, internshipId]);

  const fetchRecruiterProfile = async () => {
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
          department: user.department || '',
          company: 'Zoyaraa'
        });
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/internships/recruiter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setInternships(data.data.internships || []);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      showNotification('Failed to load internships', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (internshipId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/applications/internship/${internshipId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications || []);
        setStats(data.data.stats || {
          total: 0,
          pending: 0,
          shortlisted: 0,
          accepted: 0,
          rejected: 0
        });

        // Check which shortlisted applications already have interviews
        await checkInterviewStatus(data.data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check which shortlisted applications have interviews
  const checkInterviewStatus = async (apps) => {
    try {
      const token = localStorage.getItem('authToken');
      const interviewMap = {};

      // Only check shortlisted applications
      const shortlistedApps = apps.filter(app => app.status === 'shortlisted');

      for (const app of shortlistedApps) {
        try {
          const response = await fetch(`http://localhost:5000/api/interviews/application/${app.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success) {
            interviewMap[app.id] = {
              exists: true,
              interviewId: data.data.interview._id,
              currentRound: data.data.interview.currentRound
            };
          } else {
            interviewMap[app.id] = { exists: false };
          }
        } catch (error) {
          console.log(`No interview for app ${app.id}`);
          interviewMap[app.id] = { exists: false };
        }
      }

      setInterviews(interviewMap);
    } catch (error) {
      console.error('Error checking interview status:', error);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );

        // Update stats
        setStats(prev => {
          const newStats = { ...prev };
          const oldApp = applications.find(app => app.id === applicationId);

          if (oldApp) {
            // Decrement old status
            if (oldApp.status === 'pending') newStats.pending--;
            else if (oldApp.status === 'shortlisted') newStats.shortlisted--;
            else if (oldApp.status === 'accepted') newStats.accepted--;
            else if (oldApp.status === 'rejected') newStats.rejected--;

            // Increment new status
            if (newStatus === 'pending') newStats.pending++;
            else if (newStatus === 'shortlisted') newStats.shortlisted++;
            else if (newStatus === 'accepted') newStats.accepted++;
            else if (newStatus === 'rejected') newStats.rejected++;
          }

          return newStats;
        });

        // If new status is shortlisted, check if we need to refresh interview status
        if (newStatus === 'shortlisted') {
          setTimeout(() => checkInterviewStatus(applications), 500);
        }

        showNotification(`Application ${newStatus} successfully`);
      } else {
        showNotification(data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Network error', 'error');
    }
  };

  // Start interview process for shortlisted candidate
  const startInterviewProcess = async (applicationId) => {
    try {
      const token = localStorage.getItem('authToken');

      showNotification('Starting interview process...', 'info');

      const response = await fetch(`http://localhost:5000/api/interviews/application/${applicationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showNotification('✅ Interview process started successfully!', 'success');

        // Update interview map
        setInterviews(prev => ({
          ...prev,
          [applicationId]: {
            exists: true,
            interviewId: data.data.interview._id,
            currentRound: 1
          }
        }));

        // Refresh the applications list
        if (selectedInternship) {
          fetchApplications(selectedInternship._id);
        }

      } else {
        showNotification(data.message || 'Failed to start interview', 'error');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      showNotification('Network error. Please try again.', 'error');
    }
  };

  const viewStudentProfile = (studentId) => {
    navigate(`/recruiter/student/${studentId}`);
  };

  // View interview details
  const viewInterview = (interviewId) => {
    navigate(`/recruiter/interviews/${interviewId}`);
  };

  const toggleCoverLetter = (appId) => {
    setExpandedCoverLetter(expandedCoverLetter === appId ? null : appId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#FFF4E5', color: '#f59e0b' };
      case 'shortlisted': return { bg: '#EEF2FF', color: '#2440F0' };
      case 'accepted': return { bg: '#E6F7E6', color: '#10b981' };
      case 'rejected': return { bg: '#fee2e2', color: '#dc2626' };
      default: return { bg: '#f3f4f6', color: '#1f2937' };
    }
  };

  const getFilteredApplications = () => {
    if (filterStatus === 'all') return applications;
    return applications.filter(app => app.status === filterStatus);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : type === 'info'
        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const filteredApplications = getFilteredApplications();

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
            <span className="sidebar-logo-text">Zoyaraa</span>
          </div>
          {/* Department Badge - Like PostInternshipPage */}
          <div className="department-badge" style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            {userData.department || 'Department'}
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
            className={`nav-item ${location.pathname.includes('/recruiter/mentor-dashboard') || location.pathname.includes('/recruiter/review-logs') || location.pathname.includes('/recruiter/mentees') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/mentor-dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.2 19L18 24M18 24L22.8 19M18 24V14M12 12A5 5 0 1 0 12 2A5 5 0 1 0 12 12Z" />
            </svg>
            <span className="nav-item-text">Mentor Dashboard</span>
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

          {/* Interviews Menu Item */}
          <button
            className={`nav-item ${location.pathname.includes('/recruiter/interviews') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/interviews')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="nav-item-text">Interviews</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/mentees') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/mentees')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span className="nav-item-text">My Mentees</span>
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
                {userData.department} • Zoyaraa
              </div>
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
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">
              Applicants
              {userData.department && (
                <span style={{ fontSize: '0.9rem', marginLeft: '1rem', color: '#666' }}>
                  • {userData.department} Department
                </span>
              )}
            </h2>
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
          {loading && internships.length === 0 ? (
            <div className="loading-placeholder">Loading...</div>
          ) : internships.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3>No internships posted yet</h3>
              <p>Post an internship to start receiving applications</p>
              <button
                className="primary-btn"
                onClick={() => navigate('/recruiter/post-internship')}
              >
                Post Internship
              </button>
            </div>
          ) : (
            <>
              {/* Internship Selector */}
              <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <label htmlFor="internship-select" style={{ fontWeight: '600' }}>Select Internship:</label>
                <select
                  id="internship-select"
                  value={selectedInternship?._id || ''}
                  onChange={(e) => {
                    const selected = internships.find(i => i._id === e.target.value);
                    setSelectedInternship(selected);
                  }}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    minWidth: '300px',
                    flex: '1'
                  }}
                >
                  {internships.map(internship => (
                    <option key={internship._id} value={internship._id}>
                      {internship.title} - {internship.type} ({internship.status})
                    </option>
                  ))}
                </select>

                {/* Quick link to interviews dashboard */}
                <button
                  onClick={() => navigate('/recruiter/interviews')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #2440F0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#2440F0',
                    fontSize: '0.9375rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Manage Interviews
                </button>
              </div>

              {selectedInternship && (
                <>
                  {/* Stats Cards */}
                  <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card">
                      <div className="stat-info">
                        <div className="stat-label">Total Applications</div>
                        <div className="stat-value">{stats.total}</div>
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
                        <div className="stat-label">Pending</div>
                        <div className="stat-value">{stats.pending}</div>
                      </div>
                      <div className="stat-icon orange">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                          <path d="M3 9h18"></path>
                        </svg>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-info">
                        <div className="stat-label">Shortlisted</div>
                        <div className="stat-value">{stats.shortlisted}</div>
                      </div>
                      <div className="stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4"></circle>
                          <path d="M5.5 20v-2a6 6 0 0 1 12 0v2"></path>
                        </svg>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-info">
                        <div className="stat-label">Accepted</div>
                        <div className="stat-value">{stats.accepted}</div>
                      </div>
                      <div className="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setFilterStatus('all')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        background: filterStatus === 'all' ? '#2440F0' : 'white',
                        color: filterStatus === 'all' ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      All ({stats.total})
                    </button>
                    <button
                      onClick={() => setFilterStatus('pending')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        background: filterStatus === 'pending' ? '#f59e0b' : 'white',
                        color: filterStatus === 'pending' ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Pending ({stats.pending})
                    </button>
                    <button
                      onClick={() => setFilterStatus('shortlisted')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        background: filterStatus === 'shortlisted' ? '#2440F0' : 'white',
                        color: filterStatus === 'shortlisted' ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Shortlisted ({stats.shortlisted})
                    </button>
                    <button
                      onClick={() => setFilterStatus('accepted')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        background: filterStatus === 'accepted' ? '#10b981' : 'white',
                        color: filterStatus === 'accepted' ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Accepted ({stats.accepted})
                    </button>
                    <button
                      onClick={() => setFilterStatus('rejected')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        background: filterStatus === 'rejected' ? '#dc2626' : 'white',
                        color: filterStatus === 'rejected' ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Rejected ({stats.rejected})
                    </button>
                  </div>

                  {/* Applications List */}
                  {filteredApplications.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <h3>No applications found</h3>
                      <p>
                        {filterStatus === 'all'
                          ? 'No one has applied to this internship yet'
                          : `No ${filterStatus} applications found`}
                      </p>
                    </div>
                  ) : (
                    <div className="applications-list">
                      {filteredApplications.map((app) => {
                        const statusColors = getStatusColor(app.status);
                        const hasInterview = interviews[app.id]?.exists;
                        const interviewId = interviews[app.id]?.interviewId;

                        return (
                          <div key={app.id} className="application-card" style={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '1rem',
                            position: 'relative'
                          }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                              <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                  {app.student.name}
                                </h3>
                                <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>{app.student.email}</p>
                                {app.student.phone && (
                                  <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>📞 {app.student.phone}</p>
                                )}
                              </div>
                              <div style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                background: statusColors.bg,
                                color: statusColors.color
                              }}>
                                {app.status}
                              </div>
                            </div>

                            {/* Applied Date */}
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                              Applied: {formatDate(app.appliedDate)}
                            </p>

                            {/* Cover Letter Section */}
                            {app.coverLetter && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <div
                                  onClick={() => toggleCoverLetter(app.id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    color: '#2440F0',
                                    fontWeight: '500',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                  {expandedCoverLetter === app.id ? 'Hide Cover Letter' : 'View Cover Letter'}
                                </div>

                                {expandedCoverLetter === app.id && (
                                  <div style={{
                                    marginTop: '0.75rem',
                                    padding: '1rem',
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}>
                                    <p style={{
                                      fontSize: '0.875rem',
                                      color: '#1f2937',
                                      lineHeight: '1.6',
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {app.coverLetter}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Skills */}
                            {app.student.skills && app.student.skills.length > 0 && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Skills:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {app.student.skills.map((skill, index) => (
                                    <span key={index} style={{
                                      background: '#f3f4f6',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '16px',
                                      fontSize: '0.75rem',
                                      color: '#1f2937'
                                    }}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons - LOGICAL FLOW BASED ON STATUS */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>

                              {/* ===== PENDING applications ===== */}
                              {app.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      borderRadius: '6px',
                                      background: '#2440F0',
                                      color: 'white',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Shortlist
                                  </button>
                                  <button
                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      borderRadius: '6px',
                                      background: '#dc2626',
                                      color: 'white',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* ===== SHORTLISTED applications ===== */}
                              {app.status === 'shortlisted' && (
                                <>
                                  {!hasInterview ? (
                                    // No interview started - Show Start Interview Process button
                                    <button
                                      onClick={() => startInterviewProcess(app.id)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: '#8b5cf6', // Purple color for interview process
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      Start Interview Process
                                    </button>
                                  ) : (
                                    // Interview started - Show View Interview button
                                    <button
                                      onClick={() => viewInterview(interviewId)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #8b5cf6',
                                        borderRadius: '6px',
                                        background: '#f5f3ff',
                                        color: '#8b5cf6',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                                      </svg>
                                      View Interview
                                    </button>
                                  )}

                                  {/* Reject button - always visible for shortlisted */}
                                  <button
                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      borderRadius: '6px',
                                      background: '#dc2626',
                                      color: 'white',
                                      fontSize: '0.875rem',
                                      fontWeight: '500',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* ===== ACCEPTED applications ===== */}
                              {app.status === 'accepted' && (
                                <>
                                  <button
                                    disabled
                                    style={{
                                      padding: '0.5rem 1rem',
                                      border: 'none',
                                      borderRadius: '6px',
                                      background: '#E6F7E6',
                                      color: '#10b981',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      cursor: 'not-allowed',
                                      opacity: 0.8
                                    }}
                                  >
                                    ✓ Accepted
                                  </button>

                                  {/* Show View Interview button if interview exists */}
                                  {hasInterview && (
                                    <button
                                      onClick={() => viewInterview(interviewId)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        background: 'white',
                                        color: '#1f2937',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      View Interview History
                                    </button>
                                  )}
                                </>
                              )}

                              {/* ===== REJECTED applications ===== */}
                              {app.status === 'rejected' && (
                                <button
                                  disabled
                                  style={{
                                    padding: '0.5rem 1rem',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'not-allowed',
                                    opacity: 0.8
                                  }}
                                >
                                  ✗ Rejected
                                </button>
                              )}

                              {/* View Profile button - Always visible for all statuses */}
                              <button
                                onClick={() => viewStudentProfile(app.student.id)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  background: 'white',
                                  color: '#1f2937',
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                View Profile
                              </button>
                            </div>

                            {/* Interview Status Badge - Show for shortlisted with interview */}
                            {app.status === 'shortlisted' && hasInterview && (
                              <div style={{
                                position: 'absolute',
                                top: '1rem',
                                left: '50%', // Center horizontally
                                transform: 'translateX(-50%)', // Adjust for centering
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: '#EEF2FF',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                                color: '#2440F0',
                                fontWeight: '500',
                                zIndex: 1,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                              }}>
                                <span>🔄</span>
                                Round {interviews[app.id]?.currentRound || 1} in progress
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewApplicantsPage;