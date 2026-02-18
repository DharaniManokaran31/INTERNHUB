// frontend-react/src/pages/admin/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';
import '../../styles/AdminReports.css';

const ReportsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [stats, setStats] = useState({
    overview: {
      totalStudents: 0,
      totalRecruiters: 0,
      totalUsers: 0,
      totalInternships: 0,
      activeInternships: 0,
      totalApplications: 0,
      pendingApplications: 0,
      shortlistedApplications: 0,
      acceptedApplications: 0,
      rejectedApplications: 0,
      successRate: 0
    },
    categories: [],
    timeline: {
      labels: [],
      students: [],
      recruiters: [],
      internships: [],
      applications: []
    },
    applicationStatus: {
      pending: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0
    },
    trends: {
      students: '+0%',
      recruiters: '+0%',
      internships: '+0%',
      applications: '+0%'
    }
  });
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'AD',
    role: 'admin'
  });

  useEffect(() => {
    fetchAdminProfile();
    fetchAllReportsData();
  }, [dateRange]);

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/admin/profile', {
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
          role: user.role
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchAllReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Fetch all data in parallel for better performance
      const [statsResponse, timelineResponse, internshipsResponse, trendsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/admin/reports/timeline?range=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/internships?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/admin/reports/trends', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsResponse.json();
      const timelineData = await timelineResponse.json();
      const internshipsData = await internshipsResponse.json();
      const trendsData = await trendsResponse.json();

      if (statsData.success) {
        const totalUsers = statsData.data.users.totalStudents + statsData.data.users.totalRecruiters;
        const totalApplications = statsData.data.applications.total;
        const acceptedApplications = statsData.data.applications.accepted;
        const successRate = totalApplications > 0
          ? Number(((acceptedApplications / totalApplications) * 100).toFixed(1))
          : 0;

        // Calculate categories from internships
        let categories = [];
        if (internshipsData.success) {
          const categoryCount = {};
          internshipsData.data.internships.forEach(internship => {
            const cat = internship.category || 'other';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
          categories = Object.entries(categoryCount).map(([name, count]) => ({ name, count }));
        }

        setStats({
          overview: {
            totalStudents: statsData.data.users.totalStudents,
            totalRecruiters: statsData.data.users.totalRecruiters,
            totalUsers,
            totalInternships: statsData.data.internships.total,
            activeInternships: statsData.data.internships.active,
            totalApplications,
            pendingApplications: statsData.data.applications.pending,
            shortlistedApplications: statsData.data.applications.shortlisted,
            acceptedApplications,
            rejectedApplications: statsData.data.applications.rejected,
            successRate
          },
          categories,
          timeline: timelineData.success ? timelineData.data : generateFallbackTimeline(dateRange),
          applicationStatus: {
            pending: statsData.data.applications.pending,
            shortlisted: statsData.data.applications.shortlisted,
            accepted: statsData.data.applications.accepted,
            rejected: statsData.data.applications.rejected
          },
          trends: trendsData.success ? trendsData.data : {
            students: '+0%',
            recruiters: '+0%',
            internships: '+0%',
            applications: '+0%'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching reports data:', error);
      showNotification('Failed to load reports data', 'error');
      // Fallback to empty data
      setStats(prev => ({
        ...prev,
        timeline: generateFallbackTimeline(dateRange)
      }));
    } finally {
      setLoading(false);
    }
  };

  // Add fallback function
  const generateFallbackTimeline = (range) => {
    let points = range === 'week' ? 7 : range === 'month' ? 30 : 12;
    let labels = [];

    switch (range) {
      case 'week':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'month':
        labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
        break;
      case 'quarter':
        labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
        break;
      case 'year':
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
      default:
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }

    return {
      labels,
      students: Array(points).fill(0),
      recruiters: Array(points).fill(0),
      internships: Array(points).fill(0),
      applications: Array(points).fill(0)
    };
  };
  const calculateTrends = async (token) => {
    return {
      students: `+${Math.floor(Math.random() * 15)}%`,
      recruiters: `+${Math.floor(Math.random() * 12)}%`,
      internships: `+${Math.floor(Math.random() * 20)}%`,
      applications: `+${Math.floor(Math.random() * 25)}%`
    };
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Number(((value / total) * 100).toFixed(1));
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology: '#2440F0',
      marketing: '#f59e0b',
      design: '#8b5cf6',
      finance: '#10b981',
      hr: '#ec4899',
      sales: '#f97316',
      development: '#2440F0',
      business: '#f59e0b',
      creative: '#8b5cf6',
      other: '#6b7280'
    };
    return colors[category?.toLowerCase()] || '#6b7280';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      technology: '💻',
      marketing: '📢',
      design: '🎨',
      finance: '💰',
      hr: '👥',
      sales: '📊',
      development: '👨‍💻',
      business: '💼',
      creative: '✨',
      other: '📌'
    };
    return icons[category?.toLowerCase()] || '📁';
  };

  // Enhanced Bar Chart with better tooltip positioning
  const BarChart = ({ data, color, height = 180, label, index }) => {
    if (!data || data.length === 0 || data.every(v => v === 0)) {
      return (
        <div className="enhanced-bar-chart-container">
          <div className="no-data-chart" style={{ height: `${height}px` }}>
            <span>No data available</span>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data, 1);
    const total = data.reduce((a, b) => a + b, 0);

    return (
      <div className="enhanced-bar-chart-container">
        <div
          className="enhanced-bar-chart"
          style={{ height: `${height}px` }}
          data-points={data.length}
        >
          {data.map((value, i) => {
            const barHeight = maxValue > 0 ? (value / maxValue) * height : 2;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            const isHovered = hoveredCard === `${index}-${i}`;

            return (
              <div
                key={i}
                className="enhanced-bar-wrapper"
                onMouseEnter={() => setHoveredCard(`${index}-${i}`)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className={`enhanced-bar ${isHovered ? 'hovered' : ''}`}
                  style={{
                    background: color,
                    height: `${barHeight}px`,
                    opacity: value === 0 ? 0.25 : 1
                  }}
                >
                  {value > 0 && (
                    <div className={`enhanced-bar-tooltip ${isHovered ? 'visible' : ''}`}>
                      <div className="tooltip-arrow"></div>
                      <div className="tooltip-content">
                        <div className="tooltip-value">{formatNumber(value)}</div>
                        <div className="tooltip-percentage">{percentage}%</div>
                        <div className="tooltip-date">{stats.timeline.labels[i]}</div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Labels - only show every few to prevent overlap */}
                {stats.timeline.labels[i] && (
                  data.length > 20 ? (
                    i % 5 === 0 && <span className="enhanced-bar-label">{stats.timeline.labels[i]}</span>
                  ) : data.length > 10 ? (
                    i % 3 === 0 && <span className="enhanced-bar-label">{stats.timeline.labels[i]}</span>
                  ) : (
                    <span className="enhanced-bar-label">{stats.timeline.labels[i]}</span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
            className={`nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/admin/dashboard')}
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
            onClick={() => navigate('/admin/users')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="nav-item-text">Manage Users</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate('/admin/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="nav-item-text">Internships</span>
          </button>

          <button
            className="nav-item active"
            onClick={() => navigate('/admin/reports')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span className="nav-item-text">Reports</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/admin/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">Administrator</div>
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">Analytics & Reports</h2>
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
          {/* Welcome Section - Standard version matching other pages */}
          <div className="welcome-section">
            <h1 className="welcome-heading">Platform Analytics</h1>
            <p className="welcome-subtext">Comprehensive insights into your internship platform</p>
          </div>

          {loading ? (
            <div className="reports-loading">
              <div className="reports-spinner"></div>
              <p>Loading analytics data...</p>
            </div>
          ) : (
            <>
              {/* Date Range Selector with Glassmorphism */}
              <div className="reports-range-selector-enhanced">
                {['week', 'month', 'quarter', 'year'].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`range-btn-enhanced ${dateRange === range ? 'active' : ''}`}
                  >
                    {range}
                    {dateRange === range && <span className="range-glow"></span>}
                  </button>
                ))}
              </div>

              {/* Metrics Row with 3D Hover Effects */}
              <div className="metrics-row-enhanced">
                <div
                  className="metric-card-enhanced users"
                  onMouseEnter={() => setHoveredCard('metric-users')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="metric-card-inner">
                    <div className="metric-icon-wrapper">
                      <span className="metric-icon">👥</span>
                      <div className="icon-glow"></div>
                    </div>
                    <div className="metric-content">
                      <span className="metric-label">Total Users</span>
                      <span className="metric-value">{formatNumber(stats.overview.totalUsers)}</span>
                      <div className="metric-breakdown">
                        <span className="metric-badge students">
                          <span className="badge-dot"></span>
                          👨‍🎓 {formatNumber(stats.overview.totalStudents)}
                        </span>
                        <span className="metric-badge recruiters">
                          <span className="badge-dot"></span>
                          👔 {formatNumber(stats.overview.totalRecruiters)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="metric-hover-line"></div>
                  <div className="metric-shine"></div>
                </div>

                <div
                  className="metric-card-enhanced internships"
                  onMouseEnter={() => setHoveredCard('metric-internships')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="metric-card-inner">
                    <div className="metric-icon-wrapper">
                      <span className="metric-icon">💼</span>
                      <div className="icon-glow"></div>
                    </div>
                    <div className="metric-content">
                      <span className="metric-label">Internships</span>
                      <span className="metric-value">{formatNumber(stats.overview.totalInternships)}</span>
                      <div className="metric-breakdown">
                        <span className="metric-badge active">
                          <span className="badge-dot"></span>
                          ✅ {formatNumber(stats.overview.activeInternships)} Active
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="metric-hover-line"></div>
                  <div className="metric-shine"></div>
                </div>

                <div
                  className="metric-card-enhanced applications"
                  onMouseEnter={() => setHoveredCard('metric-applications')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="metric-card-inner">
                    <div className="metric-icon-wrapper">
                      <span className="metric-icon">📝</span>
                      <div className="icon-glow"></div>
                    </div>
                    <div className="metric-content">
                      <span className="metric-label">Applications</span>
                      <span className="metric-value">{formatNumber(stats.overview.totalApplications)}</span>
                      <div className="metric-breakdown">
                        <span className="metric-badge pending">
                          <span className="badge-dot"></span>
                          ⏳ {formatNumber(stats.overview.pendingApplications)}
                        </span>
                        <span className="metric-badge accepted">
                          <span className="badge-dot"></span>
                          ✅ {formatNumber(stats.overview.acceptedApplications)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="metric-hover-line"></div>
                  <div className="metric-shine"></div>
                </div>

                <div
                  className="metric-card-enhanced success"
                  onMouseEnter={() => setHoveredCard('metric-success')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="metric-card-inner">
                    <div className="metric-icon-wrapper">
                      <span className="metric-icon">📈</span>
                      <div className="icon-glow"></div>
                    </div>
                    <div className="metric-content">
                      <span className="metric-label">Success Rate</span>
                      <span className="metric-value">{stats.overview.successRate}%</span>
                      <div className="metric-breakdown">
                        <span className="metric-badge rate">
                          <span className="badge-dot"></span>
                          {formatNumber(stats.overview.acceptedApplications)} accepted
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="metric-hover-line"></div>
                  <div className="metric-shine"></div>
                </div>
              </div>

              {/* Timeline Section - Enhanced with better visibility */}
              <div className="timeline-section-enhanced">
                <div className="section-header">
                  <h3 className="section-title">
                    Platform Activity Timeline
                    <span className="section-badge">{dateRange}</span>
                  </h3>
                  <div className="section-legend">
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: '#2440F0' }}></span>
                      Students
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: '#10b981' }}></span>
                      Recruiters
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                      Internships
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                      Applications
                    </span>
                  </div>
                </div>

                <div className="timeline-grid-enhanced">
                  <div className="timeline-chart-card">
                    <div className="chart-card-header">
                      <span className="chart-card-title">
                        <span className="title-dot" style={{ background: '#2440F0' }}></span>
                        New Students
                      </span>
                      <span className="chart-card-total">
                        {formatNumber(stats.timeline.students.reduce((a, b) => a + b, 0))}
                      </span>
                    </div>
                    <div className="chart-wrapper">
                      <BarChart
                        data={stats.timeline.students}
                        color="#2440F0"
                        height={180}
                        label="Students"
                        index="students"
                      />
                    </div>
                  </div>

                  <div className="timeline-chart-card">
                    <div className="chart-card-header">
                      <span className="chart-card-title">
                        <span className="title-dot" style={{ background: '#10b981' }}></span>
                        New Recruiters
                      </span>
                      <span className="chart-card-total">
                        {formatNumber(stats.timeline.recruiters.reduce((a, b) => a + b, 0))}
                      </span>
                    </div>
                    <div className="chart-wrapper">
                      <BarChart
                        data={stats.timeline.recruiters}
                        color="#10b981"
                        height={180}
                        label="Recruiters"
                        index="recruiters"
                      />
                    </div>
                  </div>

                  <div className="timeline-chart-card">
                    <div className="chart-card-header">
                      <span className="chart-card-title">
                        <span className="title-dot" style={{ background: '#f59e0b' }}></span>
                        New Internships
                      </span>
                      <span className="chart-card-total">
                        {formatNumber(stats.timeline.internships.reduce((a, b) => a + b, 0))}
                      </span>
                    </div>
                    <div className="chart-wrapper">
                      <BarChart
                        data={stats.timeline.internships}
                        color="#f59e0b"
                        height={180}
                        label="Internships"
                        index="internships"
                      />
                    </div>
                  </div>

                  <div className="timeline-chart-card">
                    <div className="chart-card-header">
                      <span className="chart-card-title">
                        <span className="title-dot" style={{ background: '#8b5cf6' }}></span>
                        New Applications
                      </span>
                      <span className="chart-card-total">
                        {formatNumber(stats.timeline.applications.reduce((a, b) => a + b, 0))}
                      </span>
                    </div>
                    <div className="chart-wrapper">
                      <BarChart
                        data={stats.timeline.applications}
                        color="#8b5cf6"
                        height={180}
                        label="Applications"
                        index="applications"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Row with Glass Cards */}
              <div className="analytics-row-enhanced">
                {/* Categories Section */}
                <div className="categories-section-enhanced">
                  <h3 className="section-title">
                    Internships by Category
                    <span className="section-subtitle">Distribution across domains</span>
                  </h3>

                  <div className="categories-grid-enhanced">
                    {stats.categories.length > 0 ? (
                      stats.categories.map((category, index) => {
                        const percentage = calculatePercentage(category.count, stats.overview.totalInternships);
                        const color = getCategoryColor(category.name);

                        return (
                          <div
                            key={index}
                            className="category-card-enhanced"
                            onMouseEnter={() => setHoveredCategory(index)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            style={{
                              transform: hoveredCategory === index ? 'translateY(-4px) scale(1.02)' : 'none',
                              boxShadow: hoveredCategory === index ? `0 20px 25px -5px ${color}20` : 'none'
                            }}
                          >
                            <div className="category-card-inner">
                              <div className="category-header">
                                <span className="category-icon">{getCategoryIcon(category.name)}</span>
                                <span className="category-name">{category.name}</span>
                                <span className="category-count" style={{ color }}>{formatNumber(category.count)}</span>
                              </div>
                              <div className="category-progress-container">
                                <div className="category-progress">
                                  <div
                                    className="category-progress-bar"
                                    style={{
                                      width: `${percentage}%`,
                                      background: `linear-gradient(90deg, ${color}, ${color}80)`
                                    }}
                                  >
                                    <div className="progress-glow"></div>
                                  </div>
                                </div>
                                <div className="category-footer">
                                  <span className="category-percentage">{percentage}%</span>
                                  <span className="category-total">of total</span>
                                </div>
                              </div>
                            </div>
                            <div className="category-hover-effect" style={{ background: `${color}10` }}></div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-categories-enhanced">No category data available</div>
                    )}
                  </div>
                </div>

                {/* Application Status Section */}
                <div className="status-section-enhanced">
                  <h3 className="section-title">
                    Application Status
                    <span className="section-subtitle">Current stage distribution</span>
                  </h3>

                  <div className="status-grid-enhanced">
                    {/* Pending */}
                    <div
                      className="status-card-enhanced pending"
                      onMouseEnter={() => setHoveredStatus('pending')}
                      onMouseLeave={() => setHoveredStatus(null)}
                      style={{
                        transform: hoveredStatus === 'pending' ? 'translateX(8px)' : 'none',
                        boxShadow: hoveredStatus === 'pending' ? '0 10px 25px -5px #f59e0b' : 'none'
                      }}
                    >
                      <div className="status-icon-wrapper">
                        <span className="status-icon">⏳</span>
                        <div className="status-icon-glow"></div>
                      </div>
                      <div className="status-content">
                        <div className="status-header">
                          <span className="status-name">Pending Review</span>
                          <span className="status-count">{formatNumber(stats.applicationStatus.pending)}</span>
                        </div>
                        <div className="status-progress-container">
                          <div className="status-progress">
                            <div
                              className="status-progress-bar"
                              style={{
                                width: `${calculatePercentage(stats.applicationStatus.pending, stats.overview.totalApplications)}%`
                              }}
                            ></div>
                          </div>
                          <div className="status-footer">
                            <span className="status-percentage">
                              {calculatePercentage(stats.applicationStatus.pending, stats.overview.totalApplications)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="status-hover-line"></div>
                    </div>

                    {/* Shortlisted */}
                    <div
                      className="status-card-enhanced shortlisted"
                      onMouseEnter={() => setHoveredStatus('shortlisted')}
                      onMouseLeave={() => setHoveredStatus(null)}
                      style={{
                        transform: hoveredStatus === 'shortlisted' ? 'translateX(8px)' : 'none',
                        boxShadow: hoveredStatus === 'shortlisted' ? '0 10px 25px -5px #2440F0' : 'none'
                      }}
                    >
                      <div className="status-icon-wrapper">
                        <span className="status-icon">⭐</span>
                        <div className="status-icon-glow"></div>
                      </div>
                      <div className="status-content">
                        <div className="status-header">
                          <span className="status-name">Shortlisted</span>
                          <span className="status-count">{formatNumber(stats.applicationStatus.shortlisted)}</span>
                        </div>
                        <div className="status-progress-container">
                          <div className="status-progress">
                            <div
                              className="status-progress-bar"
                              style={{
                                width: `${calculatePercentage(stats.applicationStatus.shortlisted, stats.overview.totalApplications)}%`
                              }}
                            ></div>
                          </div>
                          <div className="status-footer">
                            <span className="status-percentage">
                              {calculatePercentage(stats.applicationStatus.shortlisted, stats.overview.totalApplications)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="status-hover-line"></div>
                    </div>

                    {/* Accepted */}
                    <div
                      className="status-card-enhanced accepted"
                      onMouseEnter={() => setHoveredStatus('accepted')}
                      onMouseLeave={() => setHoveredStatus(null)}
                      style={{
                        transform: hoveredStatus === 'accepted' ? 'translateX(8px)' : 'none',
                        boxShadow: hoveredStatus === 'accepted' ? '0 10px 25px -5px #10b981' : 'none'
                      }}
                    >
                      <div className="status-icon-wrapper">
                        <span className="status-icon">✅</span>
                        <div className="status-icon-glow"></div>
                      </div>
                      <div className="status-content">
                        <div className="status-header">
                          <span className="status-name">Accepted</span>
                          <span className="status-count">{formatNumber(stats.applicationStatus.accepted)}</span>
                        </div>
                        <div className="status-progress-container">
                          <div className="status-progress">
                            <div
                              className="status-progress-bar"
                              style={{
                                width: `${calculatePercentage(stats.applicationStatus.accepted, stats.overview.totalApplications)}%`
                              }}
                            ></div>
                          </div>
                          <div className="status-footer">
                            <span className="status-percentage">
                              {calculatePercentage(stats.applicationStatus.accepted, stats.overview.totalApplications)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="status-hover-line"></div>
                    </div>

                    {/* Rejected */}
                    <div
                      className="status-card-enhanced rejected"
                      onMouseEnter={() => setHoveredStatus('rejected')}
                      onMouseLeave={() => setHoveredStatus(null)}
                      style={{
                        transform: hoveredStatus === 'rejected' ? 'translateX(8px)' : 'none',
                        boxShadow: hoveredStatus === 'rejected' ? '0 10px 25px -5px #dc2626' : 'none'
                      }}
                    >
                      <div className="status-icon-wrapper">
                        <span className="status-icon">❌</span>
                        <div className="status-icon-glow"></div>
                      </div>
                      <div className="status-content">
                        <div className="status-header">
                          <span className="status-name">Rejected</span>
                          <span className="status-count">{formatNumber(stats.applicationStatus.rejected)}</span>
                        </div>
                        <div className="status-progress-container">
                          <div className="status-progress">
                            <div
                              className="status-progress-bar"
                              style={{
                                width: `${calculatePercentage(stats.applicationStatus.rejected, stats.overview.totalApplications)}%`
                              }}
                            ></div>
                          </div>
                          <div className="status-footer">
                            <span className="status-percentage">
                              {calculatePercentage(stats.applicationStatus.rejected, stats.overview.totalApplications)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="status-hover-line"></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;