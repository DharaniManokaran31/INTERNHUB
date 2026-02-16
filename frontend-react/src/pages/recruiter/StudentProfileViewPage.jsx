// src/pages/recruiter/StudentProfileViewPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const StudentProfileViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    company: ''
  });

  useEffect(() => {
    fetchRecruiterProfile();
    if (studentId) {
      fetchStudentProfile();
      fetchStudentApplications();
    }
  }, [studentId]);

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
          company: user.company || ''
        });
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setStudent(data.data.student);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      showNotification('Failed to load student profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentApplications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/applications/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        // Handle both possible response formats
        if (Array.isArray(data.applications)) {
          setApplications(data.applications);
        } else if (data.data?.applications) {
          setApplications(data.data.applications);
        } else {
          setApplications([]);
        }
      }
    } catch (error) {
      console.error('Error fetching student applications:', error);
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleViewResume = (url) => {
    if (!url) {
      showNotification('No resume available', 'error');
      return;
    }

    let fullUrl = url;
    if (url.startsWith('/')) {
      fullUrl = `http://localhost:5000${url}`;
    }

    window.open(fullUrl, '_blank');
  };

  const handleViewCertificate = (url) => {
    if (!url) {
      showNotification('No certificate file available', 'error');
      return;
    }

    let cleanUrl = url;

    if (url.includes('http://localhost:5000http://')) {
      cleanUrl = url.replace('http://localhost:5000http://', 'http://');
    }
    else if (url.includes('http://localhost:5000http//')) {
      cleanUrl = url.replace('http://localhost:5000http//', 'http://');
    }
    else if (url.startsWith('/uploads')) {
      cleanUrl = `http://localhost:5000${url}`;
    }

    window.open(cleanUrl, '_blank');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#FFF4E5', color: '#f59e0b' };
      case 'shortlisted':
        return { bg: '#EEF2FF', color: '#2440F0' };
      case 'accepted':
        return { bg: '#E6F7E6', color: '#10b981' };
      case 'rejected':
        return { bg: '#fee2e2', color: '#dc2626' };
      default:
        return { bg: '#f3f4f6', color: '#1f2937' };
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
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">
                {userData.company ? `Recruiter • ${userData.company}` : 'Recruiter'}
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
            <h2 className="page-title">Student Profile</h2>
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
          {loading ? (
            <div className="loading-placeholder">Loading student profile...</div>
          ) : !student ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h3>Student not found</h3>
              <p>The student profile you're looking for doesn't exist.</p>
              <button
                className="primary-btn"
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="student-profile-container">
              {/* Profile Header */}
              <div className="profile-header" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap'
              }}>
                <div className="profile-avatar" style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2.5rem',
                  fontWeight: '600'
                }}>
                  {getInitials(student.fullName)}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    {student.fullName}
                  </h1>
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                    📧 {student.email}
                  </p>
                  {student.phone && (
                    <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                      📞 {student.phone}
                    </p>
                  )}
                  {student.location && (
                    <p style={{ color: '#4b5563', marginBottom: '0.25rem' }}>
                      📍 {student.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => setActiveTab('profile')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === 'profile' ? '2px solid #2440F0' : 'none',
                    color: activeTab === 'profile' ? '#2440F0' : '#666',
                    fontWeight: activeTab === 'profile' ? '600' : '500',
                    cursor: 'pointer'
                  }}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('resume')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === 'resume' ? '2px solid #2440F0' : 'none',
                    color: activeTab === 'resume' ? '#2440F0' : '#666',
                    fontWeight: activeTab === 'resume' ? '600' : '500',
                    cursor: 'pointer'
                  }}
                >
                  Resume & Certificates
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === 'applications' ? '2px solid #2440F0' : 'none',
                    color: activeTab === 'applications' ? '#2440F0' : '#666',
                    fontWeight: activeTab === 'applications' ? '600' : '500',
                    cursor: 'pointer'
                  }}
                >
                  Applications ({applications.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="profile-tab-content">
                {activeTab === 'profile' && (
                  <div className="profile-section">
                    {/* Education */}
                    <div className="profile-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                        🎓 Education
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            College/University
                          </p>
                          <p style={{ fontWeight: '500' }}>{student.education?.college || 'Not provided'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Department
                          </p>
                          <p style={{ fontWeight: '500' }}>{student.education?.department || 'Not provided'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Course
                          </p>
                          <p style={{ fontWeight: '500' }}>{student.education?.course || 'Not provided'}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Year of Study
                          </p>
                          <p style={{ fontWeight: '500' }}>{student.education?.yearOfStudy || 'Not provided'}</p>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Specialization
                          </p>
                          <p style={{ fontWeight: '500' }}>{student.education?.specialization || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="profile-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                        🛠️ Skills
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(() => {
                          // Collect all skills from different possible locations
                          const allSkills = [];

                          // From student.skills (simple array)
                          if (student.skills && Array.isArray(student.skills)) {
                            allSkills.push(...student.skills);
                          }

                          // From student.resume.skills (category based)
                          if (student.resume?.skills && Array.isArray(student.resume.skills)) {
                            student.resume.skills.forEach(category => {
                              if (category.items && Array.isArray(category.items)) {
                                allSkills.push(...category.items);
                              }
                            });
                          }

                          return allSkills.length > 0 ? (
                            allSkills.map((skill, index) => (
                              <span key={index} style={{
                                background: '#EEF2FF',
                                color: '#2440F0',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem'
                              }}>
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p style={{ color: '#9ca3af' }}>No skills listed</p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Social Links */}
                    {(student.linkedin || student.github || student.portfolio) && (
                      <div className="profile-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                          🔗 Social Links
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {student.linkedin && (
                            <a href={student.linkedin} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2440F0', textDecoration: 'none' }}>
                              LinkedIn Profile →
                            </a>
                          )}
                          {student.github && (
                            <a href={student.github} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2440F0', textDecoration: 'none' }}>
                              GitHub Profile →
                            </a>
                          )}
                          {student.portfolio && (
                            <a href={student.portfolio} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2440F0', textDecoration: 'none' }}>
                              Portfolio →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'resume' && (
                  <div className="profile-section">
                    {/* Resume */}
                    <div className="profile-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                        📄 Resume
                      </h3>
                      {student.resume?.resumeFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ color: '#1f2937' }}>{student.resume.resumeFileName || 'Resume'}</span>
                          <button
                            onClick={() => handleViewResume(student.resume.resumeFile)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#EEF2FF',
                              color: '#2440F0',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            View Resume
                          </button>
                        </div>
                      ) : (
                        <p style={{ color: '#9ca3af' }}>No resume uploaded</p>
                      )}
                    </div>

                    {/* Certificates */}
                    <div className="profile-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                        🏅 Certificates
                      </h3>
                      {student.resume?.certifications && student.resume.certifications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {student.resume.certifications.map((cert, index) => (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              background: '#f9fafb',
                              borderRadius: '8px'
                            }}>
                              <div>
                                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{cert.name}</p>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{cert.issuer}</p>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  Issued: {formatDate(cert.date)}
                                </p>
                              </div>
                              {cert.certificateUrl && (
                                <button
                                  onClick={() => handleViewCertificate(cert.certificateUrl)}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    background: '#EEF2FF',
                                    color: '#2440F0',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  View
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#9ca3af' }}>No certificates uploaded</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'applications' && (
                  <div className="profile-section">
                    <div className="profile-card" style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                        📋 Application History
                      </h3>
                      {applications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {applications.map((app) => {
                            const statusStyle = getStatusStyle(app.status);
                            return (
                              <div key={app._id} style={{
                                padding: '1rem',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                      {app.internship?.title || 'Internship'}
                                    </p>
                                    <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                      {app.internship?.companyName || 'Company'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                      Applied: {formatDate(app.appliedAt)}
                                    </p>
                                  </div>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    background: statusStyle.bg,
                                    color: statusStyle.color
                                  }}>
                                    {app.status?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ color: '#9ca3af' }}>No applications yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentProfileViewPage;