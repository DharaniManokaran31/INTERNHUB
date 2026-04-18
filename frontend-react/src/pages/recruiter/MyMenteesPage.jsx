// src/pages/recruiter/MyMenteesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import '../../styles/StudentDashboard.css';

const MyMenteesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState({
    mentees: true,
    progress: false,
    interviews: false
  });
  const [mentees, setMentees] = useState([]);
  const [filteredMentees, setFilteredMentees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState({});
  const [menteeProgress, setMenteeProgress] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgProgress: 0,
    totalInterviews: 0
  });
  const [userData, setUserData] = useState({
    name: '',
    initials: '',
    department: '',
    company: 'Zoyaraa',
    email: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRecruiterProfile();
  }, []);

  useEffect(() => {
    if (userData.email) {
      fetchMentees();
    }
  }, [userData.email]);

  useEffect(() => {
    filterMentees();
  }, [mentees, searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMentees = async () => {
    try {
      setLoading(prev => ({ ...prev, mentees: true }));
      const token = localStorage.getItem('authToken');

      console.log('🔍 Fetching mentees...');
      const response = await fetch('http://localhost:5000/api/recruiters/mentees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Mentees API Response:', data);

      if (data.success) {
        const menteesList = data.data.mentees || [];
        setMentees(menteesList);
        setFilteredMentees(menteesList);
        setTotalPages(Math.ceil(menteesList.length / itemsPerPage));

        // Set initial stats
        setStats(prev => ({
          ...prev,
          total: menteesList.length
        }));

        // Fetch progress and interviews for each mentee
        if (menteesList.length > 0) {
          await Promise.all([
            fetchAllMenteesProgress(menteesList),
            fetchInterviewHistory(menteesList)
          ]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching mentees:', error);
      showNotification('Failed to load mentees', 'error');
    } finally {
      setLoading(prev => ({ ...prev, mentees: false }));
    }
  };

  const fetchAllMenteesProgress = async (menteesList) => {
    try {
      setLoading(prev => ({ ...prev, progress: true }));
      const token = localStorage.getItem('authToken');
      const progressMap = {};
      let activeCount = 0;
      let completedCount = 0;
      let totalProgressSum = 0;
      let progressCount = 0;

      for (const mentee of menteesList) {
        try {
          const response = await fetch(`http://localhost:5000/api/progress/intern/${mentee._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          
          if (data.success && data.data) {
            const progress = data.data.progress;
            const stats = data.data.stats;
            progressMap[mentee._id] = { ...progress, ...stats };

            // Calculate percentage
            let percentage = progress.percentage || 0;

            // Count active interns (those with progress > 0 or any logs)
            if (progress.daysPassed > 0 || (stats && stats.totalLogs > 0)) {
              activeCount++;
            }

            // Count completed interns (100% progress)
            if (percentage >= 100) {
              completedCount++;
            }

            // Add to total progress sum for average
            if (percentage > 0) {
              totalProgressSum += percentage;
              progressCount++;
            }
          }
        } catch (error) {
          console.log(`⚠️ Error fetching progress for ${mentee._id}:`, error.message);
        }
      }

      setMenteeProgress(progressMap);

      // Calculate average progress
      const avgProgressValue = progressCount > 0 ? (totalProgressSum / progressCount) : 0;

      setStats(prev => ({
        ...prev,
        active: activeCount,
        completed: completedCount,
        avgProgress: Number(avgProgressValue).toFixed(2)
      }));

      console.log('📊 Stats updated:', { activeCount, completedCount, avgProgress: avgProgressValue });
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
    } finally {
      setLoading(prev => ({ ...prev, progress: false }));
    }
  };

  const fetchInterviewHistory = async (menteesList) => {
    try {
      setLoading(prev => ({ ...prev, interviews: true }));
      const token = localStorage.getItem('authToken');
      const historyMap = {};
      let totalInterviews = 0;

      // Fetch all interviews for recruiter
      const response = await fetch('http://localhost:5000/api/interviews/recruiter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const allInterviews = data.data.interviews || [];

        // Group interviews by student
        menteesList.forEach(mentee => {
          const menteeInterviews = allInterviews.filter(
            interview => interview.studentId?._id === mentee._id || interview.studentId === mentee._id
          );

          if (menteeInterviews.length > 0) {
            const completed = menteeInterviews.filter(i => i.overallStatus === 'selected' || i.overallStatus === 'rejected').length;
            const upcoming = menteeInterviews.filter(i => i.overallStatus === 'in_progress').length;

            historyMap[mentee._id] = {
              total: menteeInterviews.length,
              completed,
              upcoming
            };
            totalInterviews += menteeInterviews.length;
          } else {
            historyMap[mentee._id] = null;
          }
        });
      }

      setInterviewHistory(historyMap);
      setStats(prev => ({
        ...prev,
        totalInterviews
      }));
    } catch (error) {
      console.error('❌ Error fetching interview history:', error);
    } finally {
      setLoading(prev => ({ ...prev, interviews: false }));
    }
  };

  const filterMentees = () => {
    let filtered = [...mentees];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(mentee =>
        mentee.fullName?.toLowerCase().includes(query) ||
        mentee.email?.toLowerCase().includes(query) ||
        mentee.internship?.title?.toLowerCase().includes(query) ||
        mentee.education?.college?.toLowerCase().includes(query)
      );
    }

    setFilteredMentees(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedMentee || !feedbackText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/mentees/${selectedMentee._id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback: feedbackText,
          rating: feedbackRating
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('✅ Feedback sent successfully');
        setShowFeedbackModal(false);
        setFeedbackText('');
        setFeedbackRating(5);
        setSelectedMentee(null);
      } else {
        showNotification(data.message || 'Failed to send feedback', 'error');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewMenteeProfile = (menteeId) => {
    navigate(`/recruiter/student/${menteeId}`);
  };

  const viewMenteeLogs = (menteeId) => {
    navigate(`/recruiter/intern-progress/${menteeId}`);
  };

  const viewMenteeInterviews = (menteeId) => {
    navigate(`/recruiter/interviews?student=${menteeId}`);
  };

  const viewMenteeProgress = (menteeId) => {
    navigate(`/recruiter/intern-progress/${menteeId}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.querySelector('.mentees-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getProgressColor = (percentage) => {
    if (!percentage) return '#e5e7eb';
    if (percentage < 25) return '#f59e0b';
    if (percentage < 50) return '#3b82f6';
    if (percentage < 75) return '#8b5cf6';
    return '#10b981';
  };
 
  const getProgressPercentage = (mentee) => {
    // First check if we have progress data
    if (menteeProgress[mentee._id]) {
      const p = menteeProgress[mentee._id];
      if (typeof p.percentage === 'number') return p.percentage;
      if (p.daysPassed && p.totalDays) {
        return Math.round((p.daysPassed / p.totalDays) * 100);
      }
    }
    
    // Then check internship progress string
    if (mentee.internship?.progress) {
      const match = mentee.internship.progress.match(/Week (\d+)\/(\d+)/);
      if (match) {
        return Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
      }
    }
    
    return 0;
  };
 
  const getProgressText = (mentee) => {
    if (menteeProgress[mentee._id]) {
      const p = menteeProgress[mentee._id];
      return `${p.daysPassed || 0}/${p.totalDays || 60} Days`;
    }
    
    if (mentee.internship?.progress) {
      return mentee.internship.progress;
    }
    
    return 'Not Started';
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMentees = filteredMentees.slice(indexOfFirstItem, indexOfLastItem);
  const isLoading = loading.mentees;

  return (
    <div className="app-container">
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
              My Mentees
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
          {/* Stats Cards */}
          <div className="stats-grid" style={{ 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            marginBottom: '2rem' 
          }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Mentees</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Active Interns</div>
                <div className="stat-value">{stats.active}</div>
              </div>
              <div className="stat-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
              <div className="stat-icon orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Avg Progress</div>
                <div className="stat-value">{stats.avgProgress}%</div>
              </div>
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 20L22 20" />
                  <path d="M4 16L8 8L12 12L16 6L20 12" />
                </svg>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Interviews</div>
                <div className="stat-value">{stats.totalInterviews}</div>
              </div>
              <div className="stat-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search mentees by name, email, internship, or college..."
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
          </div>

          {/* Mentees List */}
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
              <p style={{ color: '#666' }}>Loading your mentees...</p>
            </div>
          ) : filteredMentees.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {searchQuery ? 'No mentees match your search' : 'No mentees yet'}
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'When you accept interns, they will appear here for mentoring'}
              </p>
              {searchQuery && (
                <button
                  className="secondary-btn"
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '0.75rem 2rem' }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mentees-list">
                {currentMentees.map((mentee) => {
                  const progressPercentage = getProgressPercentage(mentee);
                  const progressColor = getProgressColor(progressPercentage);
                  const progressText = getProgressText(mentee);
                  const interviewData = interviewHistory[mentee._id];

                  return (
                    <div
                      key={mentee._id}
                      className="recent-application-card"
                      style={{ 
                        cursor: 'pointer', 
                        padding: '1.5rem',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => viewMenteeProgress(mentee._id)}
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
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#EEF2FF',
                            color: '#2440F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: '1rem'
                          }}>
                            {getInitials(mentee.fullName)}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                              {mentee.fullName || 'Unknown Student'}
                            </h4>
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: '2px 0 0' }}>
                              {mentee.email}
                            </p>
                          </div>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: progressPercentage >= 100 ? '#E6F7E6' : '#EEF2FF',
                          color: progressPercentage >= 100 ? '#10b981' : '#2440F0'
                        }}>
                          {progressText}
                        </span>
                      </div>

                      {mentee.education && (
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280', 
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          {mentee.education.college} • {mentee.education.department}
                        </p>
                      )}

                      {mentee.internship && (
                        <div style={{
                          background: '#f8fafc',
                          padding: '1rem',
                          borderRadius: '8px',
                          marginTop: '0.5rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <p style={{ fontWeight: '500', marginBottom: '0.75rem', color: '#1f2937' }}>
                            {mentee.internship.title}
                          </p>

                          {/* Progress Bar */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              <span>Progress</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              background: '#e5e7eb',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${progressPercentage}%`,
                                height: '100%',
                                background: progressColor,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: '1.5rem',
                            fontSize: '0.8125rem',
                            color: '#6b7280',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              Start: {formatDate(mentee.internship.startDate)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              End: {formatDate(mentee.internship.endDate)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {mentee.skills && mentee.skills.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {mentee.skills.slice(0, 5).map((skill, idx) => (
                              <span key={idx} style={{
                                background: '#f3f4f6',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                                color: '#1f2937'
                              }}>
                                {typeof skill === 'string' ? skill : skill.name || skill}
                              </span>
                            ))}
                            {mentee.skills.length > 5 && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', alignSelf: 'center' }}>
                                +{mentee.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Interview History Preview - Only show if there's something upcoming */}
                      {interviewData && interviewData.upcoming > 0 && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          background: '#f3e8ff',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          border: '1px solid #8b5cf6'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span style={{ fontWeight: '500' }}>
                              {interviewData.total} {interviewData.total === 1 ? 'Interview' : 'Interviews'} 
                              {interviewData.completed > 0 && ` • ${interviewData.completed} completed`}
                              {interviewData.upcoming > 0 && ` • ${interviewData.upcoming} upcoming`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          className="secondary-btn"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            flex: 1,
                            minWidth: '80px'
                          }}
                          onClick={(e) => { e.stopPropagation(); viewMenteeProfile(mentee._id); }}
                          onClickCapture={(e) => createRippleEffect(e)}
                        >
                          Profile
                        </button>
                        <button
                          className="secondary-btn"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            flex: 1,
                            minWidth: '80px'
                          }}
                          onClick={(e) => { e.stopPropagation(); viewMenteeLogs(mentee._id); }}
                          onClickCapture={(e) => createRippleEffect(e)}
                        >
                          Logs
                        </button>
                        <button
                          className="secondary-btn"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            flex: 1,
                            minWidth: '100px',
                            background: '#f3e8ff', 
                            color: '#8b5cf6', 
                            borderColor: '#8b5cf6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                          onClick={(e) => { e.stopPropagation(); viewMenteeInterviews(mentee._id); }}
                          onClickCapture={(e) => createRippleEffect(e)}
                        >
                          Interviews {interviewData?.total > 0 && `(${interviewData.total})`}
                        </button>
                        <button
                          className="primary-btn"
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            flex: 1,
                            minWidth: '80px',
                            background: '#10b981'
                          }}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedMentee(mentee); 
                            setShowFeedbackModal(true); 
                          }}
                          onClickCapture={(e) => createRippleEffect(e)}
                        >
                          Feedback
                        </button>
                      </div>
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
              {filteredMentees.length > 0 && (
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginTop: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMentees.length)} of {filteredMentees.length} mentees
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedMentee && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                Give Feedback to {selectedMentee.fullName}
              </h2>
              <button
                className="close-modal"
                onClick={() => setShowFeedbackModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackRating(rating)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: feedbackRating === rating ? '2px solid #2440F0' : '1px solid #d1d5db',
                        background: feedbackRating === rating ? '#EEF2FF' : 'white',
                        color: feedbackRating === rating ? '#2440F0' : '#4b5563',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback here..."
                  rows="5"
                  maxLength="500"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: feedbackText.length >= 450 ? '#dc2626' : '#6b7280', 
                  textAlign: 'right',
                  marginTop: '0.25rem'
                }}>
                  {feedbackText.length}/500 characters
                </div>
              </div>
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
                onClick={() => setShowFeedbackModal(false)}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleFeedbackSubmit}
                disabled={submitting || !feedbackText.trim()}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMenteesPage;