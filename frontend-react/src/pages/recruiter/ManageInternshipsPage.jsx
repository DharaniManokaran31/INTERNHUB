// src/pages/recruiter/ManageInternshipsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const ManageInternshipsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [interviewCounts, setInterviewCounts] = useState({}); // ✅ NEW: For interview counts
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    department: '',
    company: 'Zoyaraa'
  });

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'draft', label: 'Draft' }
  ];

  useEffect(() => {
    fetchRecruiterProfile();
    fetchInternships();
  }, []);

  useEffect(() => {
    filterInternships();
  }, [internships, searchQuery, statusFilter]);

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
        const internshipsList = data.data.internships || [];
        setInternships(internshipsList);

        // Fetch application counts for each internship
        await fetchApplicationCounts(internshipsList);
        
        // ✅ NEW: Fetch interview counts for each internship
        await fetchInterviewCounts(internshipsList);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      showNotification('Failed to load internships', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationCounts = async (internshipsList) => {
    try {
      const token = localStorage.getItem('authToken');
      const counts = {};

      for (const internship of internshipsList) {
        const response = await fetch(`http://localhost:5000/api/applications/internship/${internship._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          counts[internship._id] = data.data.stats.total || 0;
        }
      }

      setApplicationCounts(counts);
    } catch (error) {
      console.error('Error fetching application counts:', error);
    }
  };

  // ✅ NEW: Fetch interview counts for each internship
  const fetchInterviewCounts = async (internshipsList) => {
    try {
      const token = localStorage.getItem('authToken');
      const counts = {};

      for (const internship of internshipsList) {
        try {
          // First get all interviews for this recruiter
          const response = await fetch(`http://localhost:5000/api/interviews/recruiter`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success) {
            // Filter interviews by this internship and count them
            const internshipInterviews = data.data.interviews?.filter(
              interview => interview.internshipId?._id === internship._id
            ) || [];
            counts[internship._id] = internshipInterviews.length;
          }
        } catch (error) {
          console.log(`No interviews for internship ${internship._id}`);
          counts[internship._id] = 0;
        }
      }

      setInterviewCounts(counts);
    } catch (error) {
      console.error('Error fetching interview counts:', error);
    }
  };

  const filterInternships = () => {
    let filtered = [...internships];

    // Apply search filter - search by title, location, skills
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(internship => {
        // Search in title
        const titleMatch = internship.title?.toLowerCase().includes(query);

        // Search in location
        const locationMatch = internship.location?.toLowerCase().includes(query);

        // Search in skills
        const skillsMatch = internship.skillsRequired?.some(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name;
          return skillName?.toLowerCase().includes(query);
        });

        return titleMatch || locationMatch || skillsMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(internship => internship.status === statusFilter);
    }

    setFilteredInternships(filtered);
  };

  const handleStatusChange = async (internshipId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = newStatus === 'closed'
        ? `http://localhost:5000/api/internships/${internshipId}/close`
        : `http://localhost:5000/api/internships/${internshipId}`;

      const method = newStatus === 'closed' ? 'PATCH' : 'PUT';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: method === 'PUT' ? JSON.stringify({ status: newStatus }) : undefined
      });

      const data = await response.json();

      if (data.success) {
        setInternships(prev =>
          prev.map(internship =>
            internship._id === internshipId
              ? { ...internship, status: newStatus }
              : internship
          )
        );
        showNotification(`Internship ${newStatus} successfully`);
      } else {
        showNotification(data.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Network error', 'error');
    }
  };

  const handleDeleteClick = (internship) => {
    setSelectedInternship(internship);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedInternship) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/internships/${selectedInternship._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setInternships(prev => prev.filter(i => i._id !== selectedInternship._id));
        setShowDeleteModal(false);
        setSelectedInternship(null);
        showNotification('Internship deleted successfully');
      } else {
        showNotification(data.message || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error('Error deleting internship:', error);
      showNotification('Network error', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: '#E6F7E6', color: '#10b981' },
      closed: { bg: '#fee2e2', color: '#dc2626' },
      draft: { bg: '#f3f4f6', color: '#6b7280' }
    };
    const style = styles[status] || styles.draft;

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
        {status}
      </span>
    );
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

  // ✅ NEW: Navigate to interviews for this internship
  const viewInternshipInterviews = (internshipId) => {
    navigate(`/recruiter/interviews?internship=${internshipId}`);
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
            <span className="sidebar-logo-text">Zoyaraa</span>
          </div>
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

          {/* ✅ Interviews Menu Item */}
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
              Manage Internships
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
          {/* Header with Post Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Your Internships
              </h1>
              <p style={{ color: '#666666' }}>
                Manage and track all your posted internships
              </p>
            </div>
            <button
              className="primary-btn"
              onClick={() => navigate('/recruiter/post-internship')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Post New Internship
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by title, location, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              />
              <svg
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9ca3af'
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                minWidth: '150px',
                backgroundColor: 'white'
              }}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Internships List */}
          {loading ? (
            <div className="loading-placeholder">Loading internships...</div>
          ) : filteredInternships.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3>No internships found</h3>
              <p>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Post your first internship to start receiving applications'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button
                  className="primary-btn"
                  onClick={() => navigate('/recruiter/post-internship')}
                >
                  Post Internship
                </button>
              )}
            </div>
          ) : (
            <div className="internships-list">
              {filteredInternships.map((internship) => (
                <div
                  key={internship._id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    {/* Left side - Main info */}
                    <div style={{ flex: 2, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                          {internship.title}
                        </h3>
                        {getStatusBadge(internship.status)}
                        <span style={{
                          background: '#EEF2FF',
                          color: '#2440F0',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {internship.department}
                        </span>
                      </div>

                      {/* Company and Location */}
                      <p style={{
                        color: '#4b5563',
                        marginBottom: '0.75rem',
                        fontSize: '0.9375rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>{internship.companyName}</span>
                        <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>•</span>
                        <span>{internship.location}</span>
                      </p>

                      {/* Job Details with Icons - Enhanced */}
                      <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.75rem',
                        background: '#f8fafc',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>💼</span> {internship.type}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>⏱️</span> {internship.duration} months
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>💰</span> ₹{internship.stipend?.toLocaleString() || 'Unpaid'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>👥</span> {internship.positions} positions
                        </span>
                      </div>

                      {/* Work Mode & Dates */}
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        marginBottom: '0.5rem',
                        fontSize: '0.8125rem',
                        color: '#6b7280'
                      }}>
                        <span>🏢 {internship.workMode}</span>
                        {internship.officeLocation && <span>📍 {internship.officeLocation}</span>}
                        <span>⏰ {internship.dailyTimings}</span>
                      </div>

                      {/* Dates */}
                      <p style={{
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <span>📅 Posted: {formatDate(internship.createdAt)}</span>
                        <span style={{ color: '#9ca3af' }}>•</span>
                        <span>📆 Start: {formatDate(internship.startDate)}</span>
                        <span style={{ color: '#9ca3af' }}>•</span>
                        <span>⏰ Deadline: {formatDate(internship.deadline)}</span>
                      </p>
                    </div>

                    {/* Right side - Stats and Actions */}
                    <div style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      alignItems: 'flex-end'
                    }}>
                      {/* Two Stats in a Row */}
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        {/* Application count */}
                        <div style={{
                          flex: 1,
                          background: '#EEF2FF',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2440F0' }}>
                            {applicationCounts[internship._id] || 0}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                            Applications
                          </div>
                        </div>

                        {/* ✅ NEW: Interview count */}
                        <div style={{
                          flex: 1,
                          background: '#f3e8ff',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#8b5cf6' }}>
                            {interviewCounts[internship._id] || 0}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                            Interviews
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                        <button
                          onClick={() => navigate(`/recruiter/applicants?internship=${internship._id}`)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#EEF2FF',
                            color: '#2440F0',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            flex: 1
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#E0E7FF'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#EEF2FF'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                          </svg>
                          Applicants
                        </button>

                        {/* ✅ NEW: View Interviews button */}
                        <button
                          onClick={() => viewInternshipInterviews(internship._id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#f3e8ff',
                            color: '#8b5cf6',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            flex: 1
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ede9fe'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f3e8ff'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Interviews
                        </button>

                        <button
                          onClick={() => navigate(`/recruiter/edit-internship/${internship._id}`)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            color: '#4b5563',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          Edit
                        </button>

                        {internship.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(internship._id, 'closed')}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(internship._id, 'active')}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#E6F7E6',
                              color: '#10b981',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#d1fae5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#E6F7E6'}
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteClick(internship)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skills preview */}
                  {internship.skillsRequired && internship.skillsRequired.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Required Skills:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {internship.skillsRequired.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#f3f4f6',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              color: '#1f2937',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {typeof skill === 'string' ? skill : skill.name}
                            {typeof skill !== 'string' && skill.level && (
                              <span style={{
                                background: 'rgba(36, 64, 240, 0.1)',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '8px',
                                fontSize: '0.6rem',
                                color: '#2440F0',
                                marginLeft: '0.25rem'
                              }}>
                                {skill.level}
                              </span>
                            )}
                          </span>
                        ))}
                        {internship.skillsRequired.length > 5 && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', alignSelf: 'center' }}>
                            +{internship.skillsRequired.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInternship && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Delete Internship</h2>
              <button
                className="close-modal"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Are you sure you want to delete the internship:
              </p>
              <p style={{
                fontWeight: '600',
                background: '#f3f4f6',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                "{selectedInternship.title}" at {selectedInternship.companyName}
              </p>
              <p style={{ color: '#dc2626', fontSize: '0.875rem', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px' }}>
                ⚠️ This action cannot be undone. All applications for this internship will also be deleted.
              </p>
            </div>

            <div className="modal-footer" style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                className="secondary-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={confirmDelete}
                disabled={deleting}
                style={{ background: '#dc2626' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                {deleting ? 'Deleting...' : 'Delete Internship'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInternshipsPage;