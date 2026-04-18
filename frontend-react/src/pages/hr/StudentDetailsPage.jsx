// src/pages/hr/StudentDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const StudentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: 'HR Manager',
    initials: 'HR',
    role: 'hr'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchStudentDetails();
  }, [id]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data?.user || data.user;
        const initials = user.fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        setUserData({
          name: user.fullName,
          initials: initials,
          role: 'hr'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');

      const [studentResponse, appsResponse] = await Promise.all([
        fetch(`https://internhub-backend-d879.onrender.com/api/hr/students/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`https://internhub-backend-d879.onrender.com/api/hr/students/${id}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ]);

      if (studentResponse.success) {
        setStudent(studentResponse.data.student);
        console.log('✅ Student with resume:', studentResponse.data.student);
      } else {
        setError('Student not found.');
      }

      if (appsResponse.success) {
        setApplications(appsResponse.data.applications);
        console.log('✅ Applications:', appsResponse.data.applications);
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

  const cleanUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads')) {
      return `https://internhub-backend-d879.onrender.com${url}`;
    }
    return url;
  };

  const handleViewResume = (url) => {
    if (!url) {
      showNotification('No resume uploaded', 'error');
      return;
    }
    window.open(cleanUrl(url), '_blank');
  };

  const handleViewCertificate = (url) => {
    if (!url) {
      showNotification('No certificate file', 'error');
      return;
    }
    window.open(cleanUrl(url), '_blank');
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return { class: 'badge-success', text: 'Accepted', color: '#10b981', bg: '#d1fae5' };
      case 'pending':
        return { class: 'badge-warning', text: 'Pending', color: '#f59e0b', bg: '#fef3c7' };
      case 'shortlisted':
        return { class: 'badge-info', text: 'Shortlisted', color: '#3b82f6', bg: '#dbeafe' };
      case 'rejected':
        return { class: 'badge-error', text: 'Rejected', color: '#ef4444', bg: '#fee2e2' };
      default:
        return { class: 'badge-info', text: status?.toUpperCase() || 'UNKNOWN', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon">Z</div>
              <span className="sidebar-logo-text">Zoyaraa</span>
            </div>
          </div>
        </aside>
        <main className="main-content">
          <div className="top-bar">
            <h2 className="page-title">Loading...</h2>
          </div>
          <div className="content-area" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="loading-spinner"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Sidebar - HR Specific */}
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
            className="nav-item"
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
            onClick={() => navigate('/hr/applicants')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span className="nav-item-text">Applications</span>
          </button>

          <button
            className="nav-item active"
            onClick={() => navigate('/hr/students')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="nav-item-text">Students</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/hr/certificates')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
            </svg>
            <span className="nav-item-text">Certificates</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/hr/analytics')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span className="nav-item-text">Analytics</span>
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
              <div className="user-role-sidebar">HR • Zoyaraa</div>
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
            <h2 className="page-title">
              Student Profile
            </h2>
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
              borderRadius: '8px'
            }}>
              {error}
            </div>
          )}

          {/* Back Button */}
          <button
            className="secondary-btn"
            style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={(e) => { createRippleEffect(e); navigate('/hr/students'); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Students
          </button>

          {student ? (
            <>
              {/* Student Header - Enhanced */}
              <div className="welcome-section" style={{
                background: 'linear-gradient(135deg, #2440F0, #7c3aed)',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    background: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2440F0',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}>
                    {getInitials(student.fullName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>{student.fullName}</h1>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span style={{ opacity: 0.9 }}>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                          </svg>
                          <span style={{ opacity: 0.9 }}>{student.phone}</span>
                        </div>
                      )}
                      {student.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span style={{ opacity: 0.9 }}>{student.location}</span>
                        </div>
                      )}
                      {/* Social Links */}
                      {(student.linkedin || student.github || student.portfolio) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                          {student.linkedin && (
                            <a href={student.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                              LinkedIn
                            </a>
                          )}
                          {student.github && (
                            <a href={student.github} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                              GitHub
                            </a>
                          )}
                          {student.portfolio && (
                            <a href={student.portfolio} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                              Portfolio
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{applications.length}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Applications</div>
                    {applications.filter(app => app.status === 'accepted').length > 0 && (
                      <div style={{ 
                        marginTop: '0.5rem',
                        background: '#10b981',
                        padding: '0.25rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {applications.filter(app => app.status === 'accepted').length} Accepted
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Tabs */}
              <div className="status-tabs" style={{ marginBottom: '2rem' }}>
                <button
                  className={`status-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile & Education
                </button>
                <button
                  className={`status-tab ${activeTab === 'experience' ? 'active' : ''}`}
                  onClick={() => setActiveTab('experience')}
                >
                  Experience & Projects
                </button>
                <button
                  className={`status-tab ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('skills')}
                >
                  Skills & Certifications
                </button>
                <button
                  className={`status-tab ${activeTab === 'applications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('applications')}
                >
                  Applications ({applications.length})
                </button>
              </div>

              {/* Tab Content - Enhanced with consistent styling */}
              {activeTab === 'profile' && (
                <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Education Section */}
                  <section className="section">
                    <h2 className="section-title">Education</h2>
                    <div className="title-underline"></div>
                    {student.resume?.education && student.resume.education.length > 0 ? (
                      <div className="applications-grid">
                        {student.resume.education.map((edu, index) => (
                          <div key={index} className="application-card">
                            <div className="app-card-header">
                              <div className="app-company-info">
                                <div className="app-company-logo" style={{ background: '#2440F0' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                  </svg>
                                </div>
                                <div className="app-details">
                                  <h3 className="app-title">{edu.degree} in {edu.field}</h3>
                                  <p className="app-company-name">{edu.institution}</p>
                                  <div className="app-meta">
                                    <span className="app-meta-item">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      {formatMonthYear(edu.startDate)} - {formatMonthYear(edu.endDate)}
                                    </span>
                                    {edu.gpa && (
                                      <span className="app-meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                          <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                          <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                        </svg>
                                        GPA: {edu.gpa}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {edu.description && (
                              <div style={{ 
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: '#475569',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {edu.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        </div>
                        <h3>No education details</h3>
                        <p>This student hasn't added any education information yet.</p>
                      </div>
                    )}
                  </section>

                  {/* Resume Section */}
                  <section className="section">
                    <h2 className="section-title">Resume</h2>
                    <div className="title-underline"></div>
                    {student.resume?.resumeUrl ? (
                      <div className="application-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          background: '#e0f2fe',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1.5rem'
                        }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Resume Uploaded</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                          Last updated: {formatDate(student.updatedAt)}
                        </p>
                        <button
                          className="primary-btn"
                          onClick={() => handleViewResume(student.resume.resumeUrl)}
                          style={{ width: '100%' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                          </svg>
                          View Resume
                        </button>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                        </div>
                        <h3>No resume uploaded</h3>
                        <p>This student hasn't uploaded their resume yet.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Experience Section */}
                  <section className="section">
                    <h2 className="section-title">Work Experience</h2>
                    <div className="title-underline"></div>
                    {student.resume?.experience && student.resume.experience.length > 0 ? (
                      <div className="applications-grid">
                        {student.resume.experience.map((exp, index) => (
                          <div key={index} className="application-card">
                            <div className="app-card-header">
                              <div className="app-company-info">
                                <div className="app-company-logo" style={{ background: '#f59e0b' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                  </svg>
                                </div>
                                <div className="app-details">
                                  <h3 className="app-title">{exp.title}</h3>
                                  <p className="app-company-name">{exp.company} • {exp.location}</p>
                                  <div className="app-meta">
                                    <span className="app-meta-item">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      {formatMonthYear(exp.startDate)} - {formatMonthYear(exp.endDate)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p style={{ 
                              margin: '0.75rem 0',
                              padding: '0.75rem',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              color: '#475569',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {exp.description}
                            </p>
                            {exp.skills && exp.skills.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {exp.skills.map((skill, i) => (
                                  <span key={i} className="badge badge-info" style={{ fontSize: '0.75rem' }}>{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                        </div>
                        <h3>No experience added</h3>
                        <p>This student hasn't added any work experience yet.</p>
                      </div>
                    )}
                  </section>

                  {/* Projects Section */}
                  <section className="section">
                    <h2 className="section-title">Projects</h2>
                    <div className="title-underline"></div>
                    {student.resume?.projects && student.resume.projects.length > 0 ? (
                      <div className="applications-grid">
                        {student.resume.projects.map((project, index) => (
                          <div key={index} className="application-card">
                            <div className="app-card-header">
                              <div className="app-company-info">
                                <div className="app-company-logo" style={{ background: '#8b5cf6' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                  </svg>
                                </div>
                                <div className="app-details">
                                  <h3 className="app-title">{project.title}</h3>
                                  <p className="app-company-name">
                                    {Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p style={{ 
                              margin: '0.75rem 0',
                              padding: '0.75rem',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              color: '#475569',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {project.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                              {project.github && (
                                <a 
                                  href={project.github} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="secondary-btn"
                                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                  </svg>
                                  GitHub
                                </a>
                              )}
                              {project.demo && (
                                <a 
                                  href={project.demo} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="secondary-btn"
                                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                  </svg>
                                  Live Demo
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </div>
                        <h3>No projects added</h3>
                        <p>This student hasn't added any projects yet.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Skills Section */}
                  <section className="section">
                    <h2 className="section-title">Skills & Expertise</h2>
                    <div className="title-underline"></div>
                    
                    {/* Categorized Skills */}
                    {student.resume?.skills && student.resume.skills.length > 0 && (
                      <div className="applications-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        {student.resume.skills.map((category, idx) => (
                          <div key={idx} className="application-card" style={{ padding: '1rem' }}>
                            <h3 style={{ 
                              margin: '0 0 0.75rem', 
                              fontSize: '0.9rem', 
                              color: '#1e293b',
                              fontWeight: '600'
                            }}>
                              {category.category}
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {category.items?.map((skill, i) => (
                                <span key={i} className="badge badge-info" style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '12px' 
                                }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* General Skills / Top-level Skills */}
                    {student.skills && student.skills.length > 0 && (
                      <div className="application-card" style={{ padding: '1rem' }}>
                        <h3 style={{ 
                          margin: '0 0 0.75rem', 
                          fontSize: '0.9rem', 
                          color: '#1e293b',
                          fontWeight: '600'
                        }}>
                          Other Skills
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {student.skills.map((skill, i) => (
                            <span key={i} className="badge badge-info" style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.3rem 0.75rem',
                              borderRadius: '12px',
                              background: '#f1f5f9',
                              color: '#475569'
                            }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!student.resume?.skills || student.resume.skills.length === 0) && (!student.skills || student.skills.length === 0) && (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        </div>
                        <h3>No skills listed</h3>
                        <p>This student hasn't added any skills yet.</p>
                      </div>
                    )}
                  </section>

                  {/* Certifications Section */}
                  <section className="section">
                    <h2 className="section-title">Certifications</h2>
                    <div className="title-underline"></div>
                    {student.resume?.certifications && student.resume.certifications.length > 0 ? (
                      <div className="applications-grid">
                        {student.resume.certifications.map((cert, index) => (
                          <div key={index} className="application-card">
                            <div className="app-card-header">
                              <div className="app-company-info">
                                <div className="app-company-logo" style={{ background: '#ec4899' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                                  </svg>
                                </div>
                                <div className="app-details">
                                  <h3 className="app-title">{cert.name}</h3>
                                  <p className="app-company-name">{cert.issuer}</p>
                                  <div className="app-meta">
                                    <span className="app-meta-item">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      Issued: {formatMonthYear(cert.date)}
                                    </span>
                                    {cert.expiryDate && (
                                      <span className="app-meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <line x1="12" y1="8" x2="12" y2="12"></line>
                                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                        Expires: {formatMonthYear(cert.expiryDate)}
                                      </span>
                                    )}
                                  </div>
                                  {cert.credentialId && (
                                    <div style={{ 
                                      marginTop: '0.5rem',
                                      fontSize: '0.8rem',
                                      color: '#64748b',
                                      background: '#f1f5f9',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      display: 'inline-block'
                                    }}>
                                      ID: {cert.credentialId}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                              {cert.certificateUrl && (
                                <button
                                  className="secondary-btn"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                  onClick={() => handleViewCertificate(cert.certificateUrl)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                                  </svg>
                                  View
                                </button>
                              )}
                              {cert.link && (
                                <a 
                                  href={cert.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="secondary-btn"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                  Verify
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                          </svg>
                        </div>
                        <h3>No certifications</h3>
                        <p>This student hasn't added any certifications yet.</p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'applications' && (
                <section className="section">
                  <h2 className="section-title">Application History</h2>
                  <div className="title-underline"></div>

                  {applications.length > 0 ? (
                    <div className="applications-grid">
                      {applications.map(app => {
                        const status = getStatusBadge(app.status);
                        const internship = app.internshipId || app.internship || {};

                        return (
                          <div 
                            key={app._id} 
                            className="application-card" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/hr/applicants/${app._id}`)}
                          >
                            <div className="app-card-header">
                              <div className="app-company-info">
                                <div className="app-company-logo" style={{
                                  background: status.class === 'badge-success' ? '#10b981' :
                                             status.class === 'badge-warning' ? '#f59e0b' :
                                             status.class === 'badge-info' ? '#3b82f6' :
                                             '#ef4444'
                                }}>
                                  {internship.title?.charAt(0) || 'I'}
                                </div>
                                <div className="app-details">
                                  <h3 className="app-title">{internship.title || 'Internship'}</h3>
                                  <p className="app-company-name">
                                    {internship.department || 'Department'} • {internship.companyName || 'Zoyaraa'}
                                  </p>
                                  <div className="app-meta">
                                    <span className="app-meta-item">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      Applied {formatDate(app.appliedAt)}
                                    </span>
                                    <span className="app-meta-item">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                      </svg>
                                      {internship.location || 'Remote'}
                                    </span>
                                    {internship.stipend !== undefined && (
                                      <span className="app-meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="12" y1="1" x2="12" y2="23"></line>
                                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                        </svg>
                                        {internship.stipend > 0 ? `₹${internship.stipend.toLocaleString()}` : 'Unpaid'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <span className={`badge ${status.class}`} style={{
                                  background: status.bg,
                                  color: status.color
                                }}>
                                  {status.text}
                                </span>
                              </div>
                            </div>

                            {app.coverLetter && (
                              <div style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: '#475569',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap'
                              }}>
                                <span style={{ fontWeight: '600' }}>Cover Letter: </span>
                                {app.coverLetter.length > 150
                                  ? app.coverLetter.substring(0, 150) + '...'
                                  : app.coverLetter}
                              </div>
                            )}

                            <div className="app-card-footer" style={{ marginTop: '0.75rem' }}>
                              <button
                                className="secondary-btn"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/hr/applicants/${app._id}`);
                                }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <path d="M12 16v-4"></path>
                                  <circle cx="12" cy="8" r="0.5" fill="currentColor"></circle>
                                </svg>
                                View Application Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <h3>No applications found</h3>
                      <p>This student hasn't applied to any internships yet.</p>
                    </div>
                  )}
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default StudentDetailsPage;