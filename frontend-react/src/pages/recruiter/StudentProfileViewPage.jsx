// src/pages/recruiter/StudentProfileViewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const StudentProfileViewPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: 'Recruiter',
    initials: 'R',
    role: 'recruiter'
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchStudentDetails();
  }, [studentId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data?.user || data.user;
        const initials = (user.fullName || user.name || 'Recruiter')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        setUserData({
          name: user.fullName || user.name,
          initials: initials,
          role: 'recruiter'
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
        fetch(`https://internhub-backend-d879.onrender.com/api/hr/students/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`https://internhub-backend-d879.onrender.com/api/hr/students/${studentId}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ]);

      if (studentResponse.success) {
        setStudent(studentResponse.data?.student || studentResponse.student);
      } else {
        setError('Student not found.');
      }

      if (appsResponse.success) {
        setApplications(appsResponse.data?.applications || appsResponse.applications || []);
      }
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/login');
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
        <RecruiterSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} userData={userData} />
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
      <RecruiterSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} userData={userData} />

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="menu-toggle" onClick={toggleMobileMenu}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        </header>

        <div className="content-area">
          {error && (
            <div className="section" style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <button className="secondary-btn" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>

          {student ? (
            <>
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span style={{ opacity: 0.9 }}>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                          <span style={{ opacity: 0.9 }}>{student.phone}</span>
                        </div>
                      )}
                      {(student.linkedin || student.github || student.portfolio) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                          {student.linkedin && (
                            <a href={student.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>
                              LinkedIn
                            </a>
                          )}
                          {student.github && (
                            <a href={student.github} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '4px' }}>
                                GitHub
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
                  </div>
                </div>
              </div>

              <div className="status-tabs" style={{ marginBottom: '2rem' }}>
                <button className={`status-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile & Education</button>
                <button className={`status-tab ${activeTab === 'experience' ? 'active' : ''}`} onClick={() => setActiveTab('experience')}>Experience & Projects</button>
                <button className={`status-tab ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills & Certifications</button>
                <button className={`status-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Applications ({applications.length})</button>
              </div>

              {activeTab === 'profile' && (
                <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <section className="section">
                    <h2 className="section-title">Education</h2>
                    <div className="title-underline"></div>
                    {student.resume?.education && student.resume.education.length > 0 ? (
                      <div className="applications-grid">
                        {student.resume.education.map((edu, index) => (
                          <div key={index} className="application-card">
                            <h3 className="app-title">{edu.degree} in {edu.field}</h3>
                            <p className="app-company-name">{edu.institution}</p>
                            <p className="app-meta-item">{formatMonthYear(edu.startDate)} - {formatMonthYear(edu.endDate)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state"><h3>No education details</h3></div>
                    )}
                  </section>
                  <section className="section">
                    <h2 className="section-title">Resume</h2>
                    <div className="title-underline"></div>
                    {student.resume?.resumeUrl ? (
                      <div className="application-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <button className="primary-btn" onClick={() => handleViewResume(student.resume.resumeUrl)} style={{ width: '100%' }}>View Resume</button>
                      </div>
                    ) : (
                      <div className="empty-state"><h3>No resume uploaded</h3></div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <section className="section">
                    <h2 className="section-title">Work Experience</h2>
                    <div className="title-underline"></div>
                    {student.resume?.experience && student.resume.experience.length > 0 ? (
                      <div className="applications-grid">
                        {student.resume.experience.map((exp, index) => (
                          <div key={index} className="application-card">
                            <h3 className="app-title">{exp.title}</h3>
                            <p className="app-company-name">{exp.company}</p>
                            <p className="app-meta-item">{formatMonthYear(exp.startDate)} - {formatMonthYear(exp.endDate)}</p>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state"><h3>No experience added</h3></div>
                    )}
                  </section>
                  <section className="section">
                    <h2 className="section-title">Projects</h2>
                    <div className="title-underline"></div>
                    {student.resume?.projects && student.resume.projects.length > 0 ? (
                        <div className="applications-grid">
                          {student.resume.projects.map((project, index) => (
                            <div key={index} className="application-card">
                              <h3 className="app-title">{project.title}</h3>
                              <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>{project.description}</p>
                            </div>
                          ))}
                        </div>
                    ) : (
                        <div className="empty-state"><h3>No projects added</h3></div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <section className="section">
                    <h2 className="section-title">Skills</h2>
                    <div className="title-underline"></div>
                    {student.resume?.skills && student.resume.skills.map((cat, i) => (
                        <div key={i} className="application-card" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>{cat.category}</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {cat.items.map((skill, j) => (
                                    <span key={j} className="badge badge-info">{skill}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                  </section>
                  <section className="section">
                    <h2 className="section-title">Certifications</h2>
                    <div className="title-underline"></div>
                    {student.resume?.certifications && student.resume.certifications.length > 0 ? (
                        <div className="applications-grid">
                          {student.resume.certifications.map((cert, index) => (
                            <div key={index} className="application-card">
                                <h3 className="app-title">{cert.name}</h3>
                                <p className="app-company-name">{cert.issuer}</p>
                                <button className="secondary-btn" onClick={() => handleViewCertificate(cert.certificateUrl)} style={{ marginTop: '0.5rem' }}>View</button>
                            </div>
                          ))}
                        </div>
                    ) : (
                        <div className="empty-state"><h3>No certifications</h3></div>
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
                          <div key={app._id} className="application-card">
                            <div className="app-card-header">
                              <div className="app-details">
                                <h3 className="app-title">{internship.title || 'Internship'}</h3>
                                <p className="app-company-name">{internship.companyName || 'Zoyaraa'}</p>
                                <p className="app-meta-item">Applied on {formatDate(app.appliedAt)}</p>
                              </div>
                              <span className={`badge ${status.class}`} style={{ background: status.bg, color: status.color }}>{status.text}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-state"><h3>No applications found</h3></div>
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

export default StudentProfileViewPage;