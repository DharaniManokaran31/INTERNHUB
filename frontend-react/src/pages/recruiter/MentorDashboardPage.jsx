import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const MentorDashboardPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMentees: 0,
        pendingReviews: 0,
        approvedToday: 0,
        avgHoursPerDay: 0
    });
    const [mentees, setMentees] = useState([]);
    const [userData, setUserData] = useState({
        name: 'Loading...',
        initials: '',
        department: '',
        company: 'Zoyaraa'
    });
    const [greeting, setGreeting] = useState('Welcome back');

    useEffect(() => {
        fetchUserProfile();
        fetchMentorData();
    }, []);

    // Update greeting based on time
    useEffect(() => {
        const hour = new Date().getHours();
        const firstName = userData.name.split(' ')[0];
        let greetingText = 'Welcome back';

        if (hour < 12) {
            greetingText = 'Good morning';
        } else if (hour < 18) {
            greetingText = 'Good afternoon';
        } else {
            greetingText = 'Good evening';
        }

        setGreeting(`${greetingText}, ${firstName}!`);
    }, [userData]);

    const fetchUserProfile = async () => {
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

                // Store updated user in localStorage
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...storedUser,
                    ...user
                }));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchMentorData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            // Fetch mentees list
            const menteesResponse = await fetch('http://localhost:5000/api/recruiters/mentees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const menteesData = await menteesResponse.json();
            console.log('📊 Mentees API Response:', menteesData);

            // Fetch mentor stats
            const statsResponse = await fetch('http://localhost:5000/api/progress/mentor/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsResponse.json();
            console.log('📊 Stats API Response:', statsData);

            if (menteesData.success) {
                const menteesList = menteesData.data.mentees || [];
                
                // Fetch progress for each mentee to get accurate percentages
                const menteesWithProgress = await Promise.all(
                    menteesList.map(async (mentee) => {
                        try {
                            const progressResponse = await fetch(
                                `http://localhost:5000/api/progress/intern/${mentee._id}`,
                                { headers: { 'Authorization': `Bearer ${token}` } }
                            );
                            const progressData = await progressResponse.json();
                            
                            return {
                                ...mentee,
                                progressStats: progressData.success ? progressData.progress : null
                            };
                        } catch (err) {
                            console.error(`Error fetching progress for ${mentee._id}:`, err);
                            return mentee;
                        }
                    })
                );
                
                setMentees(menteesWithProgress);
            }

            if (statsData.success) {
                setStats(statsData.stats || {
                    totalMentees: 0,
                    pendingReviews: 0,
                    approvedToday: 0,
                    avgHoursPerDay: 0
                });
            }

        } catch (error) {
            console.error('❌ Error fetching mentor data:', error);
            showNotification('Failed to load mentor data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
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

    // ✅ FIXED: Calculate progress percentage from multiple sources
    const getProgressPercentage = (mentee) => {
        // Source 1: From progressStats API
        if (mentee.progressStats?.percentage) {
            return mentee.progressStats.percentage;
        }
        
        // Source 2: From internship progress string (e.g., "Week 10/14")
        if (mentee.internship?.progress) {
            const match = mentee.internship.progress.match(/Week (\d+)\/(\d+)/);
            if (match) {
                return Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
            }
        }
        
        // Source 3: From completedDays/totalDays
        if (mentee.progressStats?.completedDays && mentee.progressStats?.totalDays) {
            return Math.round((mentee.progressStats.completedDays / mentee.progressStats.totalDays) * 100);
        }
        
        // Source 4: From logs count (if available)
        if (mentee.stats?.totalLogs && mentee.stats?.totalDays) {
            return Math.round((mentee.stats.totalLogs / mentee.stats.totalDays) * 100);
        }
        
        return 0;
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
                        className="nav-item"
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
                        className="nav-item"
                        onClick={() => navigate('/recruiter/internships')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <span className="nav-item-text">Manage Internships</span>
                    </button>

                    <button
                        className={`nav-item active`}
                        onClick={() => navigate('/recruiter/mentor-dashboard')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <span className="nav-item-text">Mentor Dashboard</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/recruiter/review-logs')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span className="nav-item-text">Review Logs</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/recruiter/post-internship')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="nav-item-text">Post Internship</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/recruiter/applicants')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        <span className="nav-item-text">View Applicants</span>
                    </button>

                    <button
                        className="nav-item"
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
                            Mentor Dashboard
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
                    <div className="welcome-section">
                        <h1 className="welcome-heading">{greeting}</h1>
                        <p className="welcome-subtext">
                            Track your mentees' progress and review their daily logs
                        </p>
                    </div>

                    {loading ? (
                        <div className="loading-placeholder">Loading mentor dashboard...</div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#4b5563', marginBottom: '1rem' }}>
                                    Mentor Overview
                                </h3>
                                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <div className="stat-label">Total Mentees</div>
                                            <div className="stat-value">{stats.totalMentees}</div>
                                        </div>
                                        <div className="stat-icon blue">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <div className="stat-label">Pending Reviews</div>
                                            <div className="stat-value">{stats.pendingReviews}</div>
                                        </div>
                                        <div className="stat-icon orange">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <div className="stat-label">Approved Today</div>
                                            <div className="stat-value">{stats.approvedToday}</div>
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
                                            <div className="stat-label">Avg Daily Hours</div>
                                            <div className="stat-value">{stats.avgHoursPerDay}h</div>
                                        </div>
                                        <div className="stat-icon purple" style={{ background: '#f3e8ff' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M12 6v6l4 2"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons" style={{ marginBottom: '2rem' }}>
                                <button
                                    className="primary-btn"
                                    onClick={(e) => { createRippleEffect(e); navigate('/recruiter/review-logs'); }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                    </svg>
                                    Review Pending Logs
                                </button>
                                <button
                                    className="secondary-btn"
                                    onClick={(e) => { createRippleEffect(e); navigate('/recruiter/mentees'); }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                    </svg>
                                    View All Mentees
                                </button>
                            </div>

                            {/* Mentees List */}
                            <section className="section">
                                <div className="section-header">
                                    <h2 className="section-title">Your Assigned Mentees</h2>
                                    {mentees.length > 0 && (
                                        <button
                                            className="view-all-link"
                                            onClick={() => navigate('/recruiter/mentees')}
                                        >
                                            View All ({mentees.length})
                                        </button>
                                    )}
                                </div>

                                {mentees.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '3rem' }}>
                                        <div className="empty-state-icon" style={{ width: '64px', height: '64px' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                            </svg>
                                        </div>
                                        <h3>No Mentees Assigned</h3>
                                        <p>You haven't been assigned as a mentor for any active internships yet.</p>
                                        <button
                                            className="primary-btn"
                                            onClick={() => navigate('/recruiter/applicants')}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            View Applicants
                                        </button>
                                    </div>
                                ) : (
                                    <div className="recent-applications-list">
                                        {mentees.slice(0, 5).map((mentee) => {
                                            const progressPercentage = getProgressPercentage(mentee);
                                            const displayProgress = mentee.internship?.progress || 
                                                                  (progressPercentage > 0 ? `${progressPercentage}% Complete` : 'Active');
                                            
                                            return (
                                                <div 
                                                    key={mentee._id} 
                                                    className="recent-application-card" 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/recruiter/intern-progress/${mentee._id}`)}
                                                >
                                                    <div className="recent-app-header">
                                                        <h4>{mentee.fullName}</h4>
                                                        <span className="status-badge status-active">
                                                            {displayProgress}
                                                        </span>
                                                    </div>
                                                    <div className="recent-app-company">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                        </svg>
                                                        {mentee.internship?.title || 'Internship'} • {mentee.education?.department || 'Department'}
                                                    </div>
                                                    
                                                    {/* Progress Bar */}
                                                    <div style={{ margin: '0.75rem 0' }}>
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
                                                                background: 'linear-gradient(90deg, #8b5cf6, #c084fc)',
                                                                borderRadius: '3px',
                                                                transition: 'width 0.3s ease'
                                                            }} />
                                                        </div>
                                                    </div>

                                                    <div className="recent-app-meta" style={{ justifyContent: 'space-between' }}>
                                                        <span>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            Joined: {formatDate(mentee.createdAt)}
                                                        </span>
                                                        <span style={{ color: '#8b5cf6', fontWeight: '500' }}>
                                                            View Progress →
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MentorDashboardPage;