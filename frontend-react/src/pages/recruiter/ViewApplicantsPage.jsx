// src/pages/recruiter/ViewApplicantsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';

const ViewApplicantsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { internshipId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState({
    internships: true,
    applications: false,
    interviews: false
  });
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState({});
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
    name: '',
    initials: '',
    department: '',
    company: 'Zoyaraa',
    email: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);

  // Fetch recruiter profile on mount
  useEffect(() => {
    fetchRecruiterProfile();
  }, []);

  // Fetch internships when profile is loaded
  useEffect(() => {
    if (userData.email) {
      fetchInternships();
    }
  }, [userData.email]);

  // Set selected internship from URL param or first internship
  useEffect(() => {
    if (internships.length > 0) {
      if (internshipId) {
        const matched = internships.find(i => i._id === internshipId);
        if (matched) {
          setSelectedInternship(matched);
        } else {
          setSelectedInternship(internships[0]);
          navigate(`/recruiter/applicants?internship=${internships[0]._id}`, { replace: true });
        }
      } else {
        setSelectedInternship(internships[0]);
        navigate(`/recruiter/applicants?internship=${internships[0]._id}`, { replace: true });
      }
    }
  }, [internships, internshipId, navigate]);

  // Fetch applications when selected internship changes
  useEffect(() => {
    if (selectedInternship?._id) {
      fetchApplications(selectedInternship._id);
      setCurrentPage(1);
    }
  }, [selectedInternship]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const fetchRecruiterProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
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

  const fetchInternships = async () => {
    try {
      setLoading(prev => ({ ...prev, internships: true }));
      const token = localStorage.getItem('authToken');

      const response = await fetch('https://internhub-backend-d870.onrender.com/api/internships/recruiter/mine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      console.log('📊 Internships response:', data);

      if (data.success) {
        const internshipsList = data.data.internships || [];
        console.log(`✅ Found ${internshipsList.length} internships`);
        setInternships(internshipsList);
      } else {
        console.log('❌ API Error, trying fallback...');

        const profileRes = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();

        if (profileData.success) {
          const recruiterId = profileData.data.user._id;

          const allRes = await fetch('https://internhub-backend-d870.onrender.com/api/internships', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allData = await allRes.json();

          if (allData.success) {
            const allInternships = allData.data.internships || [];

            const filtered = allInternships.filter(internship => {
              const postedById = internship.postedBy?._id?.toString() ||
                internship.postedBy?.toString();
              const mentorId = internship.mentorId?._id?.toString() ||
                internship.mentorId?.toString();

              return postedById === recruiterId || mentorId === recruiterId;
            });

            console.log(`✅ Found ${filtered.length} internships via filter`);
            setInternships(filtered);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      showNotification('Failed to load internships', 'error');
    } finally {
      setLoading(prev => ({ ...prev, internships: false }));
    }
  };

  const fetchApplications = async (internshipId) => {
    try {
      setLoading(prev => ({ ...prev, applications: true }));
      const token = localStorage.getItem('authToken');

      console.log(`🔍 Fetching applications for internship: ${internshipId}`);

      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/applications/internship/${internshipId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      console.log('📊 Applications response:', data);

      if (data.success) {
        const applicationsList = data.data.applications || [];
        console.log(`✅ Found ${applicationsList.length} applications`);

        // Log each application to see its structure
        applicationsList.forEach((app, index) => {
          console.log(`📝 Application ${index + 1}:`, {
            id: app._id,
            idType: typeof app._id,
            student: app.studentId || app.student,
            status: app.status
          });
        });

        setApplications(applicationsList);

        const pending = applicationsList.filter(a => a.status === 'pending').length;
        const shortlisted = applicationsList.filter(a => a.status === 'shortlisted').length;
        const accepted = applicationsList.filter(a => a.status === 'accepted').length;
        const rejected = applicationsList.filter(a => a.status === 'rejected').length;

        setStats({
          total: applicationsList.length,
          pending,
          shortlisted,
          accepted,
          rejected
        });

        await checkInterviewStatus(applicationsList);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Failed to load applications', 'error');
    } finally {
      setLoading(prev => ({ ...prev, applications: false }));
    }
  };

  const checkInterviewStatus = async (apps) => {
    try {
      setLoading(prev => ({ ...prev, interviews: true }));
      const token = localStorage.getItem('authToken');
      const interviewMap = {};

      const shortlistedApps = apps.filter(app => app.status === 'shortlisted');

      if (shortlistedApps.length === 0) {
        setInterviews({});
        return;
      }

      const response = await fetch('https://internhub-backend-d870.onrender.com/api/interviews/recruiter?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const allInterviews = data.data.interviews || [];

        shortlistedApps.forEach(app => {
          const appId = app._id?.toString();
          const appInterview = allInterviews.find(interview => {
            const interviewAppId = interview.applicationId?._id?.toString() ||
              interview.applicationId?.toString();
            return interviewAppId === appId;
          });

          if (appInterview) {
            interviewMap[app._id] = {
              exists: true,
              interviewId: appInterview._id,
              currentRound: appInterview.currentRound || 1,
              rounds: appInterview.rounds || []
            };
          } else {
            interviewMap[app._id] = { exists: false };
          }
        });
      }

      setInterviews(interviewMap);
    } catch (error) {
      console.error('Error checking interview status:', error);
    } finally {
      setLoading(prev => ({ ...prev, interviews: false }));
    }
  };

  // ✅ FIXED: Get application ID safely
  const getApplicationId = (app) => {
    // Try different possible ID fields
    const id = app._id || app.id || app.applicationId;
    console.log('🔍 Getting application ID:', { app, foundId: id });
    return id;
  };

  // ✅ FIXED: Update application status with proper ID handling
  const updateApplicationStatus = async (app, newStatus) => {
    try {
      const applicationId = getApplicationId(app);

      if (!applicationId) {
        console.error('❌ Application ID is undefined for app:', app);
        showNotification('Invalid application ID - please refresh and try again', 'error');
        return;
      }

      console.log(`🔍 Updating application ${applicationId} to ${newStatus}`);

      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      console.log('📊 Update response:', data);

      if (data.success) {
        // Update local state
        setApplications(prev =>
          prev.map(a => {
            const aId = getApplicationId(a);
            return aId === applicationId ? { ...a, status: newStatus } : a;
          })
        );

        // Update stats
        setStats(prev => {
          const newStats = { ...prev };
          const oldStatus = app.status;

          if (oldStatus === 'pending') newStats.pending--;
          else if (oldStatus === 'shortlisted') newStats.shortlisted--;
          else if (oldStatus === 'accepted') newStats.accepted--;
          else if (oldStatus === 'rejected') newStats.rejected--;

          if (newStatus === 'pending') newStats.pending++;
          else if (newStatus === 'shortlisted') newStats.shortlisted++;
          else if (newStatus === 'accepted') newStats.accepted++;
          else if (newStatus === 'rejected') newStats.rejected++;

          return newStats;
        });

        if (newStatus === 'shortlisted') {
          setTimeout(() => {
            if (selectedInternship?._id) {
              fetchApplications(selectedInternship._id);
            }
          }, 500);
        }

        showNotification(`Application ${newStatus} successfully`);
      } else {
        console.error('❌ Update failed:', data);
        showNotification(data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      showNotification('Network error. Please try again.', 'error');
    }
  };


  const startInterviewProcess = async (app) => {
    try {
      const applicationId = getApplicationId(app);

      if (!applicationId) {
        console.error('❌ Application ID is undefined');
        showNotification('Invalid application ID', 'error');
        return;
      }

      const token = localStorage.getItem('authToken');

      showNotification('Starting interview process...', 'info');

      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/interviews/application/${applicationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📊 Interview start response:', data);

      if (data.success) {
        showNotification('✅ Interview process started successfully!', 'success');

        // Redirect directly to interviews dashboard
        setTimeout(() => {
          navigate('/recruiter/interviews');
        }, 800);

      } else {
        if (data.message === 'Interview already scheduled for this application') {
          showNotification('Routing you to your interviews dashboard...', 'info');
          // Redirect to interviews page since it's already there
          setTimeout(() => {
            navigate('/recruiter/interviews');
          }, 800);
        } else {
          console.error('❌ Interview start failed:', data);
          showNotification(data.message || 'Failed to start interview', 'error');
        }
      }
    } catch (error) {
      console.error('❌ Error starting interview:', error);
      showNotification('Network error. Please try again.', 'error');
    }
  };

  const viewStudentProfile = (studentId) => {
    if (!studentId) {
      showNotification('Student ID not found', 'error');
      return;
    }
    navigate(`/recruiter/student/${studentId}`);
  };

  const viewInterview = (interviewId) => {
    if (!interviewId) {
      showNotification('Interview ID not found', 'error');
      return;
    }
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

  const getFilteredApplications = useCallback(() => {
    if (filterStatus === 'all') return applications;
    return applications.filter(app => app.status === filterStatus);
  }, [applications, filterStatus]);

  // Pagination logic
  const filteredApplications = getFilteredApplications();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.applications-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStudentName = (student) => {
    if (!student) return 'Unknown Student';
    return student.fullName || student.name || 'Student';
  };

  const getStudentEmail = (student) => {
    if (!student) return 'No email provided';
    return student.email || 'No email';
  };

  const getStudentPhone = (student) => {
    if (!student) return null;
    return student.phone || student.mobile || null;
  };

  const getStudentSkills = (student) => {
    if (!student) return [];
    return student.skills || [];
  };

  const getStudentId = (student) => {
    if (!student) return null;
    return student._id || student.id;
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
        : type === 'info'
          ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
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

  return (
    <div className="app-container">
      {/* Unified Sidebar */}
      <RecruiterSidebar 
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
            <h2 className="page-title">
              Applicants
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
          {loading.internships ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div className="loading-spinner"></div>
              <p style={{ color: '#666' }}>Loading your internships...</p>
            </div>
          ) : internships.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No internships posted yet</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Post an internship to start receiving applications
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate('/recruiter/post-internship')}
                style={{ padding: '0.75rem 2rem' }}
              >
                Post Internship
              </button>
            </div>
          ) : (
            <>
              {/* Internship Selector */}
              <div style={{
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <label htmlFor="internship-select" style={{ fontWeight: '600' }}>
                  Select Internship:
                </label>
                <select
                  id="internship-select"
                  value={selectedInternship?._id || ''}
                  onChange={(e) => {
                    const selected = internships.find(i => i._id === e.target.value);
                    setSelectedInternship(selected);
                    navigate(`/recruiter/applicants?internship=${e.target.value}`, { replace: true });
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
                  <div className="stats-grid" style={{
                    marginBottom: '2rem',
                    gridTemplateColumns: 'repeat(5, 1fr)'
                  }}>
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

                    <div className="stat-card">
                      <div className="stat-info">
                        <div className="stat-label">Rejected</div>
                        <div className="stat-value">{stats.rejected}</div>
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

                  {/* Filter Tabs */}
                  <div style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
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
                  {loading.applications ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '300px',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div className="loading-spinner"></div>
                      <p style={{ color: '#666' }}>Loading applications...</p>
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem' }}>
                      <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                        No applications found
                      </h3>
                      <p style={{ color: '#666' }}>
                        {filterStatus === 'all'
                          ? 'No one has applied to this internship yet'
                          : `No ${filterStatus} applications found`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="applications-list">
                        {currentApplications.map((app) => {
                          const statusColors = getStatusColor(app.status);
                          const appId = getApplicationId(app);
                          const hasInterview = interviews[appId]?.exists;
                          const interviewId = interviews[appId]?.interviewId;
                          const currentRound = interviews[appId]?.currentRound || 1;
                          const student = app.studentId || app.student || {};

                          return (
                            <div key={appId} className="application-card" style={{
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              padding: '1.5rem',
                              marginBottom: '1rem',
                              position: 'relative',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                              {/* Header */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1rem'
                              }}>
                                <div>
                                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                    {getStudentName(student)}
                                  </h3>
                                  <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                                    {getStudentEmail(student)}
                                  </p>
                                  {getStudentPhone(student) && (
                                    <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                                      📞 {getStudentPhone(student)}
                                    </p>
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

                              {/* Applied Date - CENTERED */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '1rem'
                              }}>
                                <p style={{
                                  fontSize: '0.875rem',
                                  color: '#6b7280',
                                  background: '#f9fafb',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '20px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span>📅</span>
                                  Applied: {formatDate(app.appliedAt || app.createdAt)}
                                </p>
                              </div>

                              {/* Cover Letter Section - CENTERED */}
                              {app.coverLetter && (
                                <div style={{
                                  marginBottom: '1.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center'
                                }}>
                                  <div
                                    onClick={() => toggleCoverLetter(appId)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      cursor: 'pointer',
                                      color: '#2440F0',
                                      fontWeight: '500',
                                      fontSize: '0.875rem',
                                      background: '#EEF2FF',
                                      padding: '0.5rem 1rem',
                                      borderRadius: '20px',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#E0E7FF';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#EEF2FF';
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="7 10 12 15 17 10"></polyline>
                                      <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    {expandedCoverLetter === appId ? 'Hide Cover Letter' : 'View Cover Letter'}
                                  </div>

                                  {expandedCoverLetter === appId && (
                                    <div style={{
                                      marginTop: '0.75rem',
                                      padding: '1rem',
                                      background: '#f9fafb',
                                      borderRadius: '8px',
                                      border: '1px solid #e5e7eb',
                                      width: '100%',
                                      maxWidth: '600px'
                                    }}>
                                      <p style={{
                                        fontSize: '0.875rem',
                                        color: '#1f2937',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap',
                                        textAlign: 'center'
                                      }}>
                                        {app.coverLetter}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Skills - CENTERED */}
                              {getStudentSkills(student).length > 0 && (
                                <div style={{
                                  marginBottom: '1.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center'
                                }}>
                                  <p style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    color: '#4b5563'
                                  }}>
                                    Skills:
                                  </p>
                                  <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    justifyContent: 'center'
                                  }}>
                                    {getStudentSkills(student).map((skill, index) => (
                                      <span key={index} style={{
                                        background: '#f3f4f6',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '16px',
                                        fontSize: '0.75rem',
                                        color: '#1f2937',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}>
                                        {typeof skill === 'string' ? skill : skill.name || skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: '1rem'
                              }}>
                                {app.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => updateApplicationStatus(app, 'shortlisted')}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: '#2440F0',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#0B1DC1'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = '#2440F0'}
                                    >
                                      Shortlist
                                    </button>
                                    <button
                                      onClick={() => updateApplicationStatus(app, 'rejected')}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: '#dc2626',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {app.status === 'shortlisted' && (
                                  <>
                                    {!hasInterview ? (
                                      <button
                                        onClick={() => startInterviewProcess(app)}
                                        style={{
                                          padding: '0.5rem 1rem',
                                          border: 'none',
                                          borderRadius: '6px',
                                          background: '#8b5cf6',
                                          color: 'white',
                                          fontSize: '0.875rem',
                                          fontWeight: '500',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        Schedule Interview
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => navigate('/recruiter/interviews')}
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
                                          gap: '0.5rem',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = '#ede9fe';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = '#f5f3ff';
                                        }}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="3"></circle>
                                          <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                                        </svg>
                                        Go to Scheduling
                                      </button>
                                    )}

                                    <button
                                      onClick={() => updateApplicationStatus(app, 'rejected')}
                                      style={{
                                        padding: '0.5rem 1rem',
                                        border: 'none',
                                        borderRadius: '6px',
                                        background: '#dc2626',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

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
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                          <circle cx="12" cy="12" r="3"></circle>
                                          <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                                        </svg>
                                        Go to Interviews Page
                                      </button>
                                    )}
                                  </>
                                )}

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

                                <button
                                  onClick={() => viewStudentProfile(getStudentId(student))}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    background: 'white',
                                    color: '#1f2937',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                >
                                  View Profile
                                </button>
                              </div>

                              {/* Interview Status Badge */}
                              {app.status === 'shortlisted' && hasInterview && (
                                <div style={{
                                  position: 'absolute',
                                  top: '1rem',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
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
                                  Round {currentRound} in progress
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '2rem',
                          marginBottom: '1rem'
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
                      {filteredApplications.length > 0 && (
                        <div style={{
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginTop: '0.5rem'
                        }}>
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredApplications.length)} of {filteredApplications.length} applications
                        </div>
                      )}
                    </>
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