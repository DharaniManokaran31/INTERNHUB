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
  const [loading, setLoading] = useState({
    profile: true,
    applications: true
  });
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    name: '',
    initials: '',
    department: '',
    company: 'Zoyaraa',
    email: ''
  });

  // Pagination state for applications
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRecruiterProfile();
  }, []);

  useEffect(() => {
    if (userData.email && studentId) {
      fetchStudentProfile();
      fetchStudentApplications();
    }
  }, [userData.email, studentId]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchRecruiterProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        const fullName = user.fullName || user.name || '';
        const initials = fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'R';

        setUserData({
          name: fullName,
          initials: initials,
          department: user.department || '',
          company: 'Zoyaraa',
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const token = localStorage.getItem('authToken');

      console.log(`🔍 Fetching student profile for ID: ${studentId}`);
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Student Profile Response:', data);

      if (data.success) {
        const studentData = data.data.student;
        
        // If student has currentInternship ID, fetch the internship details
        if (studentData.currentInternship && typeof studentData.currentInternship === 'string') {
          try {
            const internshipId = studentData.currentInternship;
            
            const internshipResponse = await fetch(
              `http://localhost:5000/api/internships/${internshipId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const internshipData = await internshipResponse.json();
            
            if (internshipData.success) {
              studentData.currentInternship = internshipData.data.internship;
            }
          } catch (err) {
            console.error('Error fetching internship details:', err);
          }
        }
        
        setStudent(studentData);
      } else {
        showNotification('Student not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      showNotification('Failed to load student profile', 'error');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchStudentApplications = async () => {
    try {
      setLoading(prev => ({ ...prev, applications: true }));
      const token = localStorage.getItem('authToken');
      
      let applicationsData = [];
      
      // Try the student-specific endpoint
      const response = await fetch(`http://localhost:5000/api/applications/student/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Applications Response:', data);

      if (data.success) {
        if (Array.isArray(data.applications)) {
          applicationsData = data.applications;
        } else if (data.data?.applications) {
          applicationsData = data.data.applications;
        }
      }
      
      // If no applications found, try the general endpoint
      if (applicationsData.length === 0) {
        const response2 = await fetch(`http://localhost:5000/api/applications/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await response2.json();
        console.log('📊 Applications Response (alt):', data2);
        
        if (data2.success) {
          if (Array.isArray(data2.applications)) {
            applicationsData = data2.applications;
          } else if (data2.data?.applications) {
            applicationsData = data2.data.applications;
          }
        }
      }
      
      setApplications(applicationsData);
      setTotalPages(Math.ceil(applicationsData.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching student applications:', error);
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.applications-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
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

  const showNotification = (message, type = 'success') => {
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'error'
        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
        : 'linear-gradient(135deg, #2440F0, #0B1DC1)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-size: 0.9375rem;
      font-weight: 500;
    `;
    notification.textContent = message;
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

  // Pagination logic for applications
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;
  const currentApplications = applications.slice(indexOfFirstItem, indexOfLastItem);

  const isLoading = loading.profile;

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
          {userData.department && (
            <div className="department-badge" style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              textAlign: 'center'
            }}>
              {userData.department}
            </div>
          )}
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
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="nav-item-text">Manage Internships</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/mentor-dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/mentor-dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span className="nav-item-text">Mentor Dashboard</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/review-logs') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/review-logs')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span className="nav-item-text">Review Logs</span>
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
            </svg>
            <span className="nav-item-text">View Applicants</span>
          </button>

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
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/recruiter/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials || 'R'}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name || 'Recruiter'}</div>
              <div className="user-role-sidebar">
                {userData.department || 'Recruiter'} • {userData.company}
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">
              Student Profile
              {userData.department && (
                <span style={{ 
                  fontSize: '0.9rem', 
                  marginLeft: '1rem', 
                  color: '#666',
                  background: '#EEF2FF',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px'
                }}>
                  {userData.department} Department
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
          {/* Back Button */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              className="secondary-btn"
              onClick={() => navigate(-1)}
              style={{ 
                padding: '0.6rem 1.2rem', 
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClickCapture={(e) => createRippleEffect(e)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Back
            </button>
          </div>

          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div className="loading-spinner"></div>
              <p style={{ color: '#666' }}>Loading student profile...</p>
            </div>
          ) : !student ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Student not found</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                The student profile you're looking for doesn't exist.
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate(-1)}
                style={{ padding: '0.75rem 2rem' }}
                onClickCapture={(e) => createRippleEffect(e)}
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
                flexWrap: 'wrap',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
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
                    {student.fullName || 'Unknown Student'}
                  </h1>
                  <p style={{ color: '#4b5563', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    {student.email || 'No email provided'}
                  </p>
                  {student.phone && (
                    <p style={{ color: '#4b5563', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                      {student.phone}
                    </p>
                  )}
                  {student.location && (
                    <p style={{ color: '#4b5563', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {student.location}
                    </p>
                  )}
                  
                  {/* Current Internship Display */}
                  {student.currentInternship && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem',
                      background: '#E6F7E6',
                      borderRadius: '8px',
                      border: '1px solid #10b981'
                    }}>
                      <p style={{ 
                        color: '#10b981', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: 0,
                        fontSize: '1rem'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>🟢</span>
                        <span>
                          <strong>Active Intern:</strong>{' '}
                          {student.currentInternship.title || 'Internship'}{' '}
                          {student.currentInternship.companyName && (
                            <>at <strong>{student.currentInternship.companyName}</strong></>
                          )}
                        </span>
                      </p>
                      
                      {student.currentInternship.department && (
                        <p style={{ 
                          color: '#4b5563', 
                          fontSize: '0.9rem',
                          marginLeft: '2rem',
                          marginTop: '0.5rem',
                          marginBottom: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>📍</span> {student.currentInternship.department} Department
                        </p>
                      )}
                      
                      {(student.currentInternship.startDate || student.currentInternship.endDate) && (
                        <p style={{ 
                          color: '#6b7280', 
                          fontSize: '0.85rem',
                          marginLeft: '2rem',
                          marginTop: '0.25rem',
                          marginBottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>📅</span> 
                          {student.currentInternship.startDate ? formatDate(student.currentInternship.startDate) : 'Start date'} 
                          {' - '} 
                          {student.currentInternship.endDate ? formatDate(student.currentInternship.endDate) : 'Present'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '2rem', 
                borderBottom: '1px solid #e5e7eb',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setActiveTab('profile')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === 'profile' ? '2px solid #2440F0' : 'none',
                    color: activeTab === 'profile' ? '#2440F0' : '#666',
                    fontWeight: activeTab === 'profile' ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onClickCapture={(e) => createRippleEffect(e)}
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
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onClickCapture={(e) => createRippleEffect(e)}
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
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onClickCapture={(e) => createRippleEffect(e)}
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
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🎓</span> Education
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
                        {student.expectedGraduation && (
                          <div>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                              Expected Graduation
                            </p>
                            <p style={{ fontWeight: '500' }}>{formatDate(student.expectedGraduation)}</p>
                          </div>
                        )}
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
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🛠️</span> Skills
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(() => {
                          const allSkills = [];

                          if (student.skills && Array.isArray(student.skills)) {
                            allSkills.push(...student.skills);
                          }

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

                    {/* Experience */}
                    {student.resume?.experience && student.resume.experience.length > 0 && (
                      <div className="profile-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>💼</span> Experience
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {student.resume.experience.map((exp, index) => (
                            <div key={index} style={{
                              padding: '1rem',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div>
                                <p style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                  {exp.title}
                                </p>
                                <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                  {exp.company} • {exp.location}
                                </p>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                  {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                </p>
                              </div>
                              {exp.description && (
                                <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                  {exp.description}
                                </p>
                              )}
                              {exp.skills && exp.skills.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                  {exp.skills.map((skill, idx) => (
                                    <span key={idx} style={{
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
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {student.resume?.projects && student.resume.projects.length > 0 && (
                      <div className="profile-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>🚀</span> Projects
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {student.resume.projects.map((project, index) => (
                            <div key={index} style={{
                              padding: '1rem',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                  <p style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>
                                    {project.title}
                                  </p>
                                  {project.technologies && (
                                    <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                      Tech: {project.technologies}
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {project.github && (
                                    <a
                                      href={project.github}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        background: '#EEF2FF',
                                        color: '#2440F0',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        textDecoration: 'none'
                                      }}
                                    >
                                      GitHub
                                    </a>
                                  )}
                                  {project.demo && (
                                    <a
                                      href={project.demo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        background: '#10b981',
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        textDecoration: 'none'
                                      }}
                                    >
                                      Live Demo
                                    </a>
                                  )}
                                </div>
                              </div>
                              {project.description && (
                                <p style={{ color: '#4b5563', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: '1.5' }}>
                                  {project.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {(student.linkedin || student.github || student.portfolio) && (
                      <div className="profile-card" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>🔗</span> Social Links
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {student.linkedin && (
                            <a href={student.linkedin} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2440F0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                <rect x="2" y="9" width="4" height="12"></rect>
                                <circle cx="4" cy="4" r="2"></circle>
                              </svg>
                              LinkedIn Profile →
                            </a>
                          )}
                          {student.github && (
                            <a href={student.github} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2440F0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                              </svg>
                              GitHub Profile →
                            </a>
                          )}
                          {student.portfolio && (
                            <a href={student.portfolio} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#2440F0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                              </svg>
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
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📄</span> Resume
                      </h3>
                      {student.resume?.resumeFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ color: '#1f2937' }}>{student.resume.resumeFileName || 'Resume'}</span>
                          <button
                            onClick={() => handleViewResume(student.resume.resumeFile)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#EEF2FF',
                              color: '#2440F0',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#E0E7FF'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#EEF2FF'}
                            onClickCapture={(e) => createRippleEffect(e)}
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
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🏅</span> Certificates
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
                              borderRadius: '8px',
                              flexWrap: 'wrap',
                              gap: '1rem'
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
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#E0E7FF'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#EEF2FF'}
                                  onClickCapture={(e) => createRippleEffect(e)}
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
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📋</span> Application History
                      </h3>
                      {loading.applications ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <div className="loading-spinner-small"></div>
                          <p style={{ color: '#666', marginTop: '1rem' }}>Loading applications...</p>
                        </div>
                      ) : applications.length > 0 ? (
                        <>
                          <div className="applications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {currentApplications.map((app) => {
                              const statusStyle = getStatusStyle(app.status);
                              return (
                                <div key={app._id} style={{
                                  padding: '1rem',
                                  background: '#f9fafb',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                      <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                        {app.internship?.title || 'Internship'}
                                      </p>
                                      <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                                        {app.internship?.companyName || 'Company'}
                                      </p>
                                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        Applied: {formatDate(app.appliedAt || app.createdAt)}
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
                                      {app.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Pagination for Applications */}
                          {totalPages > 1 && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '2rem'
                            }}>
                              <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                  padding: '0.5rem 1rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  background: currentPage === 1 ? '#f3f4f6' : 'white',
                                  color: currentPage === 1 ? '#9ca3af' : '#1f2937',
                                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                Previous
                              </button>

                              {[...Array(totalPages)].map((_, index) => {
                                const pageNumber = index + 1;
                                if (
                                  pageNumber === 1 ||
                                  pageNumber === totalPages ||
                                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={pageNumber}
                                      onClick={() => handlePageChange(pageNumber)}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        background: currentPage === pageNumber ? '#2440F0' : 'white',
                                        color: currentPage === pageNumber ? 'white' : '#1f2937',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        minWidth: '40px'
                                      }}
                                    >
                                      {pageNumber}
                                    </button>
                                  );
                                } else if (
                                  pageNumber === currentPage - 2 ||
                                  pageNumber === currentPage + 2
                                ) {
                                  return <span key={pageNumber} style={{ color: '#9ca3af' }}>...</span>;
                                }
                                return null;
                              })}

                              <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                  padding: '0.5rem 1rem',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  background: currentPage === totalPages ? '#f3f4f6' : 'white',
                                  color: currentPage === totalPages ? '#9ca3af' : '#1f2937',
                                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Items per page info */}
                          {applications.length > 0 && (
                            <div style={{
                              textAlign: 'center',
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginTop: '1rem'
                            }}>
                              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, applications.length)} of {applications.length} applications
                            </div>
                          )}
                        </>
                      ) : (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No applications yet</p>
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