// src/pages/recruiter/ManageInternshipsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';

const ManageInternshipsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState({
    internships: true,
    counts: true,
    interviews: true
  });
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [interviewCounts, setInterviewCounts] = useState({});
  const [userData, setUserData] = useState({
    name: '',
    initials: '',
    department: '',
    company: 'Zoyaraa',
    email: ''
  });

  // Status options
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'closed', label: 'Closed' },
    { value: 'draft', label: 'Draft' }
  ], []);

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

  // Filter internships when dependencies change
  useEffect(() => {
    filterInternships();
  }, [internships, searchQuery, statusFilter]);

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
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
      navigate('/login');
    }
  };

  const fetchInternships = async () => {
    try {
      setLoading(prev => ({ ...prev, internships: true }));
      const token = localStorage.getItem('authToken');

      // Try multiple possible endpoints
      const endpoints = [
        'https://internhub-backend-d870.onrender.com/api/internships/recruiter',
        'https://internhub-backend-d870.onrender.com/api/internships/recruiter/mine',
        'https://internhub-backend-d870.onrender.com/api/internships/my-internships',
        'https://internhub-backend-d870.onrender.com/api/recruiters/my-internships'
      ];

      let internshipsList = [];

      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          const response = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Response from ${endpoint}:`, data);

            if (data.success && data.data?.internships) {
              internshipsList = data.data.internships;
              console.log(`✅ Found ${internshipsList.length} internships from ${endpoint}`);
              break;
            }
          }
        } catch (e) {
          console.log(`Endpoint ${endpoint} failed:`, e.message);
        }
      }

      // If no dedicated endpoint worked, fall back to filtering
      if (internshipsList.length === 0) {
        console.log('⚠️ No dedicated endpoint worked, falling back to filter');

        // Get profile first
        const profileRes = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();

        if (profileData.success) {
          const recruiter = profileData.data.user;
          const recruiterId = recruiter._id;

          // Fetch all internships
          const allRes = await fetch('https://internhub-backend-d870.onrender.com/api/internships', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allData = await allRes.json();

          if (allData.success) {
            const allInternships = allData.data.internships || [];

            // Filter by postedBy or mentorId
            internshipsList = allInternships.filter(internship => {
              const postedById = internship.postedBy?._id?.toString() ||
                internship.postedBy?.toString();
              const mentorId = internship.mentorId?._id?.toString() ||
                internship.mentorId?.toString();

              return postedById === recruiterId || mentorId === recruiterId;
            });
          }
        }
      }

      console.log('📊 Final internships list:', internshipsList);
      setInternships(internshipsList);

      if (internshipsList.length > 0) {
        await fetchApplicationCounts(internshipsList);
        await fetchInterviewCounts(internshipsList);
      }

    } catch (error) {
      console.error('❌ Error:', error);
      showNotification('Failed to load internships', 'error');
    } finally {
      setLoading(prev => ({ ...prev, internships: false }));
    }
  };

  const fetchApplicationCounts = async (internshipsList) => {
    try {
      setLoading(prev => ({ ...prev, counts: true }));
      const counts = {};

      internshipsList.forEach(internship => {
        counts[internship._id] = (internship.stats?.totalApplications ?? internship.applicationCount) || 0;
        console.log(`📊 ${internship.title}: ${counts[internship._id]} applications`);
      });

      setApplicationCounts(counts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(prev => ({ ...prev, counts: false }));
    }
  };

  const fetchInterviewCounts = async (internshipsList) => {
    try {
      setLoading(prev => ({ ...prev, interviews: true }));
      const token = localStorage.getItem('authToken');
      const counts = {};

      // Fetch all interviews for this recruiter
      const response = await fetch('https://internhub-backend-d870.onrender.com/api/interviews/recruiter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const interviews = data.data.interviews || [];

        // Count interviews per internship
        internshipsList.forEach(internship => {
          const count = interviews.filter(interview =>
            interview.internshipId?._id === internship._id ||
            interview.internshipId === internship._id
          ).length;
          counts[internship._id] = count;
        });
      }

      setInterviewCounts(counts);
    } catch (error) {
      console.error('Error fetching interview counts:', error);
    } finally {
      setLoading(prev => ({ ...prev, interviews: false }));
    }
  };

  const filterInternships = useCallback(() => {
    let filtered = [...internships];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(internship => {
        const titleMatch = internship.title?.toLowerCase().includes(query);
        const locationMatch = internship.location?.toLowerCase().includes(query);
        const companyMatch = internship.companyName?.toLowerCase().includes(query);
        const skillsMatch = internship.skillsRequired?.some(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name;
          return skillName?.toLowerCase().includes(query);
        });
        const departmentMatch = internship.department?.toLowerCase().includes(query);

        return titleMatch || locationMatch || companyMatch || skillsMatch || departmentMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(internship =>
        internship.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredInternships(filtered);
  }, [internships, searchQuery, statusFilter]);

  // ✅ FIXED: Use the correct path that exists in your routes
  const editInternship = (internshipId) => {
    console.log('🔍 Edit clicked for internship ID:', internshipId);
    // Use the existing route from App.js
    navigate(`/recruiter/edit-internship/${internshipId}`);
  };

  // ✅ FIXED: Handle status change with debugging
  const handleStatusChange = async (internshipId, newStatus) => {
    try {
      console.log(`🔍 Attempting to change internship ${internshipId} to ${newStatus}`);

      const token = localStorage.getItem('authToken');

      // Show loading state
      showNotification(`Updating internship status...`, 'info');

      // Determine endpoint based on action
      let endpoint;
      let method;
      let body;

      if (newStatus === 'closed') {
        endpoint = `https://internhub-backend-d870.onrender.com/api/internships/${internshipId}/close`;
        method = 'PATCH';
        body = undefined;
      } else {
        endpoint = `https://internhub-backend-d870.onrender.com/api/internships/${internshipId}`;
        method = 'PUT';
        body = JSON.stringify({ status: newStatus });
      }

      console.log(`📤 Sending ${method} request to ${endpoint}`);
      if (body) console.log('Request body:', body);

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);

      if (data.success) {
        // Update local state
        setInternships(prev =>
          prev.map(internship =>
            internship._id === internshipId
              ? { ...internship, status: newStatus }
              : internship
          )
        );

        const message = newStatus === 'closed'
          ? 'Internship closed successfully'
          : `Internship ${newStatus} successfully`;

        showNotification(message, 'success');
      } else {
        console.error('❌ Server returned error:', data);
        showNotification(data.message || `Failed to ${newStatus} internship`, 'error');
      }
    } catch (error) {
      console.error('❌ Network/JS error:', error);
      showNotification('Network error. Please check console and try again.', 'error');
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

      console.log(`🔍 Deleting internship: ${selectedInternship._id}`);

      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/internships/${selectedInternship._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Delete response:', data);

      if (data.success) {
        setInternships(prev => prev.filter(i => i._id !== selectedInternship._id));
        setShowDeleteModal(false);
        setSelectedInternship(null);
        showNotification('Internship deleted successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to delete internship', 'error');
      }
    } catch (error) {
      console.error('Error deleting internship:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStr = status?.toLowerCase() || 'draft';
    const styles = {
      active: { bg: '#E6F7E6', color: '#10b981' },
      closed: { bg: '#fee2e2', color: '#dc2626' },
      draft: { bg: '#f3f4f6', color: '#6b7280' }
    };
    const style = styles[statusStr] || styles.draft;

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
        {status || 'Draft'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatStipend = (stipend) => {
    if (!stipend) return 'Unpaid';
    if (typeof stipend === 'number') {
      return `₹${stipend.toLocaleString()}`;
    }
    return stipend;
  };

  const showNotification = (message, type = 'success') => {
    // Remove existing notifications
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

  const viewInternshipInterviews = (internshipId) => {
    console.log('🔍 View interviews for internship:', internshipId);
    navigate(`/recruiter/interviews?internship=${internshipId}`);
  };

  const viewApplicants = (internshipId) => {
    console.log('🔍 View applicants for internship:', internshipId);
    navigate(`/recruiter/applicants?internship=${internshipId}`);
  };

  const isLoading = loading.internships;

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
            <h2 className="page-title">Manage Internships</h2>
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
                {userData.department
                  ? `Manage and track all ${userData.department} internships`
                  : 'Manage and track all your posted internships'}
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
                placeholder="Search by title, location, department, or skills..."
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
              <p style={{ color: '#666' }}>Loading your internships...</p>
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No internships match your filters'
                  : 'No internships yet'}
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Post your first internship to start receiving applications'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button
                  className="primary-btn"
                  onClick={() => navigate('/recruiter/post-internship')}
                  style={{ padding: '0.75rem 2rem' }}
                >
                  Post Your First Internship
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
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
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                          {internship.title || 'Untitled Internship'}
                        </h3>
                        {getStatusBadge(internship.status)}
                        {internship.department && (
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
                        )}
                      </div>

                      {/* Company and Location */}
                      <p style={{
                        color: '#4b5563',
                        marginBottom: '0.75rem',
                        fontSize: '0.9375rem'
                      }}>
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>
                          {internship.companyName || userData.company}
                        </span>
                        <span style={{ color: '#9ca3af', margin: '0 0.5rem' }}>•</span>
                        <span>{internship.location || 'Location TBD'}</span>
                      </p>

                      {/* Job Details with Icons */}
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
                          <span style={{ fontSize: '1rem' }}>💼</span> {internship.type || 'Full-time'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>⏱️</span> {internship.duration || '3'} months
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>💰</span> {formatStipend(internship.stipend)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#4b5563' }}>
                          <span style={{ fontSize: '1rem' }}>👥</span> {internship.positions || 1} {internship.positions === 1 ? 'position' : 'positions'}
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
                        <span>🏢 {internship.workMode || 'Hybrid'}</span>
                        {internship.officeLocation && <span>📍 {internship.officeLocation}</span>}
                        {internship.dailyTimings && <span>⏰ {internship.dailyTimings}</span>}
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
                        {internship.deadline && (
                          <>
                            <span style={{ color: '#9ca3af' }}>•</span>
                            <span>⏰ Deadline: {formatDate(internship.deadline)}</span>
                          </>
                        )}
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
                    }} onClick={(e) => e.stopPropagation()}>
                      {/* Two Stats in a Row */}
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        {/* Application count */}
                        <div style={{
                          flex: 1,
                          background: '#EEF2FF',
                          padding: '0.75rem 0.5rem',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2440F0' }}>
                            {applicationCounts[internship._id] || 0}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                            Applications
                          </div>
                        </div>

                        {/* Interview count */}
                        <div style={{
                          flex: 1,
                          background: '#f3e8ff',
                          padding: '0.75rem 0.5rem',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                            {interviewCounts[internship._id] || 0}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                            Interviews
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                        width: '100%'
                      }}>
                        <button
                          onClick={() => viewApplicants(internship._id)}
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

                        {/* Edit button with debugging */}
                        <button
                          onClick={() => editInternship(internship._id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'white',
                            color: '#4b5563',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          Edit
                        </button>

                        {/* Close/Reopen button */}
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
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                          >
                            Close
                          </button>
                        ) : internship.status === 'closed' ? (
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
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#d1fae5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#E6F7E6'}
                          >
                            Reopen
                          </button>
                        ) : null}

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
                            cursor: 'pointer',
                            transition: 'all 0.2s'
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
                        {internship.skillsRequired.slice(0, 5).map((skill, idx) => {
                          const skillName = typeof skill === 'string' ? skill : skill.name;
                          const skillLevel = typeof skill === 'string' ? null : skill.level;

                          return (
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
                              {skillName}
                              {skillLevel && (
                                <span style={{
                                  background: 'rgba(36, 64, 240, 0.1)',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '8px',
                                  fontSize: '0.6rem',
                                  color: '#2440F0',
                                  marginLeft: '0.25rem'
                                }}>
                                  {skillLevel}
                                </span>
                              )}
                            </span>
                          );
                        })}
                        {internship.skillsRequired.length > 5 && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', alignSelf: 'center' }}>
                            +{internship.skillsRequired.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description preview */}
                  {internship.description && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#4b5563',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {internship.description}
                      </p>
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
                "{selectedInternship.title}" at {selectedInternship.companyName || userData.company}
              </p>
              <p style={{
                color: '#dc2626',
                fontSize: '0.875rem',
                background: '#fee2e2',
                padding: '0.75rem',
                borderRadius: '6px'
              }}>
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