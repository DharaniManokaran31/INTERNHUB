// src/pages/recruiter/MyMenteesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const MyMenteesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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
    name: 'Loading...',
    initials: 'RD',
    department: '',
    company: 'Zoyaraa'
  });

  useEffect(() => {
    fetchRecruiterProfile();
    fetchMentees();
  }, []);

  useEffect(() => {
    filterMentees();
  }, [mentees, searchQuery]);

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
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/recruiters/mentees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Mentees API Response:', data);

      if (data.success) {
        const menteesList = data.data.mentees || [];
        setMentees(menteesList);
        setFilteredMentees(menteesList);

        // Set initial stats
        setStats(prev => ({
          ...prev,
          total: menteesList.length
        }));

        // Fetch progress and interviews for each mentee
        await Promise.all([
          fetchAllMenteesProgress(menteesList),
          fetchInterviewHistory(menteesList)
        ]);
      }
    } catch (error) {
      console.error('Error fetching mentees:', error);
      showNotification('Failed to load mentees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMenteesProgress = async (menteesList) => {
    try {
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
          console.log(`📊 Progress for ${mentee.fullName}:`, data);

          if (data.success && data.progress) {
            const progress = data.progress;
            progressMap[mentee._id] = progress;

            // Calculate percentage
            let percentage = 0;
            if (progress.percentage) {
              percentage = progress.percentage;
            } else if (progress.completedDays && progress.totalDays) {
              percentage = Math.round((progress.completedDays / progress.totalDays) * 100);
            }

            // Count active interns (those with progress > 0)
            if (progress.completedDays > 0) {
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
          console.log(`Error fetching progress for ${mentee._id}:`, error);
        }
      }

      setMenteeProgress(progressMap);

      // Calculate average progress
      const avgProgress = progressCount > 0 ? Math.round(totalProgressSum / progressCount) : 0;

      setStats(prev => ({
        ...prev,
        active: activeCount,
        completed: completedCount,
        avgProgress: avgProgress
      }));

      console.log('📊 Stats updated:', { activeCount, completedCount, avgProgress });
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchInterviewHistory = async (menteesList) => {
    try {
      const token = localStorage.getItem('authToken');
      const historyMap = {};
      let totalInterviews = 0;

      for (const mentee of menteesList) {
        try {
          const response = await fetch(`http://localhost:5000/api/interviews/student`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success) {
            const menteeInterviews = data.data.upcoming?.filter(
              interview => interview.studentId?._id === mentee._id
            ) || [];

            const pastInterviews = data.data.past?.filter(
              interview => interview.studentId?._id === mentee._id
            ) || [];

            const allInterviews = [...menteeInterviews, ...pastInterviews];

            if (allInterviews.length > 0) {
              historyMap[mentee._id] = {
                total: allInterviews.length,
                completed: pastInterviews.length,
                upcoming: menteeInterviews.length
              };
              totalInterviews += allInterviews.length;
            } else {
              historyMap[mentee._id] = null;
            }
          }
        } catch (error) {
          console.log(`No interviews for mentee ${mentee._id}`);
          historyMap[mentee._id] = null;
        }
      }

      setInterviewHistory(historyMap);
      setStats(prev => ({
        ...prev,
        totalInterviews
      }));
    } catch (error) {
      console.error('Error fetching interview history:', error);
    }
  };

  const filterMentees = () => {
    let filtered = [...mentees];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(mentee =>
        mentee.fullName?.toLowerCase().includes(query) ||
        mentee.email?.toLowerCase().includes(query) ||
        mentee.internship?.title?.toLowerCase().includes(query)
      );
    }

    setFilteredMentees(filtered);
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
        showNotification('Feedback sent successfully');
        setShowFeedbackModal(false);
        setFeedbackText('');
        setFeedbackRating(5);
        setSelectedMentee(null);
      } else {
        showNotification(data.message || 'Failed to send feedback', 'error');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      showNotification('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const viewMenteeProfile = (menteeId) => {
    navigate(`/recruiter/student/${menteeId}`);
  };

  const viewMenteeLogs = (menteeId) => {
    navigate(`/recruiter/review-logs?studentId=${menteeId}`);
  };

  const viewMenteeInterviews = (menteeId) => {
    navigate(`/recruiter/interviews?student=${menteeId}`);
  };

  const viewMenteeProgress = (menteeId) => {
    navigate(`/recruiter/intern-progress/${menteeId}`);
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
      const progress = menteeProgress[mentee._id];
      
      if (progress.percentage) {
        return progress.percentage;
      }
      
      if (progress.completedDays && progress.totalDays) {
        return Math.round((progress.completedDays / progress.totalDays) * 100);
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
      return `${p.completedDays || 0}/${p.totalDays || 60} Days`;
    }
    
    if (mentee.internship?.progress) {
      return mentee.internship.progress;
    }
    
    return 'Not Started';
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
            textAlign: 'center',
            color: 'white'
          }}>
            {userData.department || 'Mentor'}
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
            className={`nav-item active`}
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
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">
                {userData.department} • {userData.company}
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
              My Mentees
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
          {/* Stats Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '2rem' }}>
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
              <div className="stat-icon purple" style={{ background: '#f3e8ff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
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
              <div className="stat-icon purple" style={{ background: '#f3e8ff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              placeholder="Search mentees by name, email, or internship..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Mentees List */}
          {loading ? (
            <div className="loading-placeholder">Loading mentees...</div>
          ) : filteredMentees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3>No mentees yet</h3>
              <p>
                {searchQuery
                  ? 'No mentees match your search'
                  : 'When you accept interns, they will appear here for mentoring'}
              </p>
            </div>
          ) : (
            <div className="mentees-list">
              {filteredMentees.map((mentee) => {
                const progressPercentage = getProgressPercentage(mentee);
                const progressColor = getProgressColor(progressPercentage);
                const progressText = getProgressText(mentee);
                const interviewData = interviewHistory[mentee._id];

                return (
                  <div
                    key={mentee._id}
                    className="recent-application-card"
                    style={{ cursor: 'pointer', padding: '1.5rem' }}
                    onClick={() => viewMenteeProgress(mentee._id)}
                  >
                    <div className="recent-app-header">
                      <h4>{mentee.fullName}</h4>
                      <span className="status-badge status-active">
                        {progressText}
                      </span>
                    </div>

                    <p style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
                      {mentee.email}
                    </p>

                    {mentee.education && (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        🎓 {mentee.education.college} • {mentee.education.department}
                      </p>
                    )}

                    {mentee.internship && (
                      <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginTop: '0.5rem'
                      }}>
                        <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                          {mentee.internship.title}
                        </p>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '0.5rem' }}>
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
                          gap: '1rem',
                          fontSize: '0.8125rem',
                          color: '#6b7280'
                        }}>
                          <span>📅 Start: {formatDate(mentee.internship.startDate)}</span>
                          <span>🏁 End: {formatDate(mentee.internship.endDate)}</span>
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {mentee.skills && mentee.skills.length > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {mentee.skills.slice(0, 5).map((skill, idx) => (
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
                      </div>
                    )}

                    {/* Interview History Preview */}
                    {interviewData && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: '#f3e8ff',
                        borderRadius: '8px',
                        fontSize: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span style={{ fontWeight: '500' }}>
                            {interviewData.total} {interviewData.total === 1 ? 'Interview' : 'Interviews'} •
                            {interviewData.completed > 0 && ` ${interviewData.completed} completed`}
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
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); viewMenteeProfile(mentee._id); }}
                        onClickCapture={(e) => createRippleEffect(e)}
                      >
                        Profile
                      </button>
                      <button
                        className="secondary-btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); viewMenteeLogs(mentee._id); }}
                        onClickCapture={(e) => createRippleEffect(e)}
                      >
                        Logs
                      </button>
                      <button
                        className="secondary-btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', flex: 1, background: '#f3e8ff', color: '#8b5cf6', borderColor: '#8b5cf6' }}
                        onClick={(e) => { e.stopPropagation(); viewMenteeInterviews(mentee._id); }}
                        onClickCapture={(e) => createRippleEffect(e)}
                      >
                        Interviews
                      </button>
                      <button
                        className="primary-btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', flex: 1, background: '#10b981' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedMentee(mentee); setShowFeedbackModal(true); }}
                        onClickCapture={(e) => createRippleEffect(e)}
                      >
                        Feedback
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Rating
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedbackRating(rating)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: feedbackRating === rating ? '2px solid #2440F0' : '1px solid #d1d5db',
                        background: feedbackRating === rating ? '#EEF2FF' : 'white',
                        color: feedbackRating === rating ? '#2440F0' : '#4b5563',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback here..."
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit'
                  }}
                />
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
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleFeedbackSubmit}
                disabled={submitting || !feedbackText.trim()}
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