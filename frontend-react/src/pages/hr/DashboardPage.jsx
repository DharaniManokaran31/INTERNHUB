// src/pages/hr/HRDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import InviteRecruiterModal from '../../components/modals/InviteRecruiterModal';

const HRDashboardPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [stats, setStats] = useState({
        totalRecruiters: 0,
        activeInternships: 0,
        totalApplicants: 0,
        activeInterns: 0,
        pendingInvites: 0
    });
    const [recentRecruiters, setRecentRecruiters] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr',
        department: 'Administration'
    });
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('authToken');

            // Fetch all data in parallel
            const [profileRes, statsRes, recruitersRes, activityRes] = await Promise.all([
                fetch('http://localhost:5000/api/recruiters/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch('http://localhost:5000/api/hr/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch('http://localhost:5000/api/hr/recruiters', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch('http://localhost:5000/api/hr/activity/recent', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            // Handle Profile
            if (profileRes.success) {
                const user = profileRes.data?.user || profileRes.user;
                const initials = (user.fullName || 'HR')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                setUserData({
                    name: user.fullName || 'HR Manager',
                    initials: initials,
                    role: 'hr',
                    department: user.department || 'Administration'
                });
            }

            // Handle Stats
            if (statsRes.success && statsRes.data) {
                setStats({
                    totalRecruiters: statsRes.data.overview?.totalRecruiters || 0,
                    activeInternships: statsRes.data.internships?.active || 0,
                    totalApplicants: statsRes.data.applications?.total || 0,
                    activeInterns: statsRes.data.interns?.active || 0,
                    pendingInvites: statsRes.data.overview?.pendingInvites || 0
                });
            }

            // Handle Recruiters
            if (recruitersRes.success && recruitersRes.data) {
                const activeRecs = recruitersRes.data.active || [];
                const pendingRecs = recruitersRes.data.pending || [];
                setRecentRecruiters([...activeRecs, ...pendingRecs].slice(0, 4));
            }

            // ✅ FIX: Handle Activity - ONLY show REAL activities from backend
            if (activityRes.success && activityRes.data && activityRes.data.activities?.length > 0) {
                const activities = activityRes.data.activities;
                setRecentActivity(activities.slice(0, 5).map(act => ({
                    id: act._id || act.id,
                    type: act.type,
                    title: getActivityTitle(act),
                    description: getActivityDescription(act),
                    time: formatTime(act.timestamp || act.createdAt),
                    status: act.isRead ? 'read' : 'new',
                    link: getActivityLink(act),
                    icon: getActivityIcon(act.type),
                    color: getActivityColor(act.type)
                })));
            } else {
                // Show empty array - no dummy data!
                setRecentActivity([]);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for activity display
    const getActivityTitle = (act) => {
        switch (act.type) {
            case 'application_received': return 'New Application';
            case 'recruiter_invited': return 'Recruiter Invited';
            case 'recruiter_accepted': return 'Recruiter Joined';
            case 'internship_posted': return 'Internship Posted';
            case 'certificate_issued': return 'Certificate Issued';
            case 'application_status_change': return 'Application Updated';
            case 'interview_scheduled': return 'Interview Scheduled';
            default: return act.title || 'Activity';
        }
    };

    const getActivityDescription = (act) => {
        if (!act.data) return act.message || 'New activity recorded';

        switch (act.type) {
            case 'application_received':
                return `${act.data.studentName || 'A student'} applied for ${act.data.internshipTitle || 'internship'}`;

            case 'recruiter_invited':
                return `${act.data.recruiterName || 'A recruiter'} was invited to join`;

            case 'recruiter_accepted':
                return `${act.data.recruiterName || 'A recruiter'} accepted invitation and joined the team`;

            case 'internship_posted':
                return `New ${act.data.department || ''} internship posted by ${act.data.recruiterName || 'a recruiter'}`;

            case 'certificate_issued':
                return `Certificate issued to ${act.data.studentName || 'a student'} for ${act.data.internshipTitle || 'internship'}`;

            case 'application_status_change':
                return `Application for ${act.data.internshipTitle || 'internship'} marked as ${act.data.newStatus || 'updated'}`;

            case 'interview_scheduled':
                return `Interview scheduled for ${act.data.studentName || 'student'} with ${act.data.recruiterName || 'recruiter'}`;

            default:
                return act.message || 'New activity recorded';
        }
    };

    const getActivityLink = (act) => {
        if (!act.data) return '#';

        switch (act.type) {
            case 'application_received':
                return act.data.applicationId ? `/hr/applications/${act.data.applicationId}` : '#';
            case 'recruiter_invited':
            case 'recruiter_accepted':
                return act.data.recruiterId ? `/hr/recruiters/${act.data.recruiterId}` : '#';
            case 'internship_posted':
                return act.data.internshipId ? `/hr/internships/${act.data.internshipId}` : '#';
            case 'certificate_issued':
                return act.data.certificateId ? `/hr/certificates/${act.data.certificateId}` : '#';
            case 'application_status_change':
                return act.data.applicationId ? `/hr/applications/${act.data.applicationId}` : '#';
            case 'interview_scheduled':
                return act.data.interviewId ? `/hr/interviews/${act.data.interviewId}` : '#';
            default:
                return '#';
        }
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'application_received': return '📝';
            case 'recruiter_invited': return '✉️';
            case 'recruiter_accepted': return '🎉';
            case 'internship_posted': return '💼';
            case 'certificate_issued': return '🏆';
            case 'application_status_change': return '🔄';
            case 'interview_scheduled': return '📅';
            default: return '📌';
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'application_received': return '#2440F0';
            case 'recruiter_invited': return '#8b5cf6';
            case 'recruiter_accepted': return '#10b981';
            case 'internship_posted': return '#f59e0b';
            case 'certificate_issued': return '#ec4899';
            case 'application_status_change': return '#6366f1';
            case 'interview_scheduled': return '#14b8a6';
            default: return '#64748b';
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Just now';
        
        const now = new Date();
        const diffMs = now - date;
        
        // Handle future dates (from slightly unsynced clocks) or very recent ones
        if (diffMs < 60000) return 'Just now';
        
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' • ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const handleInviteSuccess = () => {
        showNotification('Recruiter invited successfully!');
        fetchDashboardData();
    };

    // Get status badge for recruiters
    const getRecruiterStatusBadge = (recruiter) => {
        if (recruiter.isActive && recruiter.invitationStatus === 'accepted') {
            return <span className="badge badge-success">Active</span>;
        } else if (recruiter.invitationStatus === 'pending') {
            return <span className="badge badge-warning">Pending</span>;
        } else {
            return <span className="badge badge-error">Inactive</span>;
        }
    };

    // Get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="app-container">
            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
            ></div>

            {/* Sidebar - HR Specific */}
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
                </div>

                <nav className="sidebar-nav">
                    <button
                        className="nav-item active"
                        onClick={() => navigate('/hr/dashboard')}
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
                        onClick={() => navigate('/hr/recruiters')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="nav-item-text">Recruiters</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/internships')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        <span className="nav-item-text">Internships</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/applicants')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <span className="nav-item-text">Applications</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/students')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span className="nav-item-text">Students</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/certificates')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                        </svg>
                        <span className="nav-item-text">Certificates</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/active-interns')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        </svg>
                        <span className="nav-item-text">Active Interns</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/completed-interns')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span className="nav-item-text">Completed</span>
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate('/hr/analytics')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span className="nav-item-text">Analytics</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="user-profile-sidebar"
                        onClick={() => navigate('/hr/profile')}
                    >
                        <div className="user-avatar-sidebar">{userData.initials}</div>
                        <div className="user-info-sidebar">
                            <div className="user-name-sidebar">{userData.name}</div>
                            <div className="user-role-sidebar">HR • Zoyaraa</div>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top Bar */}
                <header className="top-bar">
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
                            HR Dashboard
                        </h2>
                    </div>
                    <div className="top-bar-right">
                        <NotificationBell />
                        <button className="logout-btn" onClick={handleLogout}>
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="content-area">
                    {/* Error Banner */}
                    {error && (
                        <div className="section" style={{
                            background: '#fee2e2',
                            border: '1px solid #ef4444',
                            color: '#b91c1c',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{error}</span>
                            <button
                                onClick={() => setError(null)}
                                style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <h1 className="welcome-heading">
                            Welcome back, {userData.name.split(' ')[0]}!
                        </h1>
                        <p className="welcome-subtext">
                            Monitor recruitment performance and manage your team efficiently at Zoyaraa.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Recruiters</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.totalRecruiters
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Active Internships</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.activeInternships
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Applicants</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.totalApplicants
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Active Interns</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.activeInterns
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            className="primary-btn"
                            onClick={(e) => {
                                createRippleEffect(e);
                                setShowInviteModal(true);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <line x1="19" y1="8" x2="19" y2="14"></line>
                                <line x1="16" y1="11" x2="22" y2="11"></line>
                            </svg>
                            Invite Recruiter
                        </button>
                        <button
                            className="secondary-btn"
                            onClick={(e) => {
                                createRippleEffect(e);
                                navigate('/hr/analytics');
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            View Analytics
                        </button>
                    </div>

                    {/* Two Column Grid */}
                    <div className="two-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Recent Recruiters Section */}
                        <section className="section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="section-title">Team Performance</h2>
                                <button
                                    className="secondary-btn"
                                    onClick={fetchDashboardData}
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                        <path d="M23 4v6h-6"></path>
                                        <path d="M1 20v-6h6"></path>
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                                        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                                    </svg>
                                    Refresh
                                </button>
                            </div>

                            <div className="recent-applications-list">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton-card" style={{ height: '80px' }}></div>
                                    ))
                                ) : recentRecruiters.length > 0 ? (
                                    recentRecruiters.map(recruiter => (
                                        <div key={recruiter._id} className="recent-application-card" style={{
                                            padding: '1rem',
                                            borderLeft: recruiter.isActive ? '4px solid #10b981' : '4px solid #f59e0b',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="user-avatar-sidebar" style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    fontSize: '1.2rem',
                                                    background: recruiter.isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)'
                                                }}>
                                                    {getInitials(recruiter.fullName)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{recruiter.fullName}</h4>
                                                        {getRecruiterStatusBadge(recruiter)}
                                                    </div>
                                                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                                                        <span style={{ fontWeight: '500', color: '#1e293b' }}>{recruiter.department}</span> • {recruiter.designation || 'Recruiter'}
                                                    </p>
                                                    <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                        📧 {recruiter.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <div className="empty-state-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        </div>
                                        <h3>No recruiters found</h3>
                                        <p>Start by inviting recruiters to join your team.</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="secondary-btn"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                onClick={(e) => {
                                    createRippleEffect(e);
                                    navigate('/hr/recruiters');
                                }}
                            >
                                Manage All Recruiters
                            </button>
                        </section>

                        {/* Recent Activity Section - ONLY REAL ACTIVITIES */}
                        <section className="section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="section-title">Recent Activity</h2>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                                    Live Feed
                                </span>
                            </div>

                            <div className="recent-applications-list">
                                {loading ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="skeleton-card" style={{ height: '90px' }}></div>
                                    ))
                                ) : recentActivity.length > 0 ? (
                                    recentActivity.map(activity => (
                                        <div
                                            key={activity.id}
                                            className="recent-application-card"
                                            style={{
                                                padding: '1rem',
                                                borderLeft: `4px solid ${activity.color}`,
                                                marginBottom: '1rem',
                                                background: activity.status === 'new' ? '#f8fafc' : 'white',
                                                cursor: activity.link !== '#' ? 'pointer' : 'default',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={() => activity.link !== '#' && navigate(activity.link)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: `${activity.color}15`,
                                                    color: activity.color,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.2rem'
                                                }}>
                                                    {activity.icon}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>
                                                            {activity.title}
                                                        </h4>
                                                        {activity.status === 'new' && (
                                                            <span style={{
                                                                background: '#f59e0b',
                                                                color: 'white',
                                                                fontSize: '0.65rem',
                                                                fontWeight: '600',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '20px'
                                                            }}>
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#475569' }}>
                                                        {activity.description}
                                                    </p>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                        {activity.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <div className="empty-state-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                        </div>
                                        <h3>No recent activity</h3>
                                        <p>Activities will appear here when you invite recruiters and they accept.</p>
                                        <button
                                            className="primary-btn"
                                            onClick={() => setShowInviteModal(true)}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            Invite Your First Recruiter
                                        </button>
                                    </div>
                                )}
                            </div>

                        </section>
                    </div>
                </div>
            </main>

            {/* Invite Recruiter Modal */}
            {showInviteModal && (
                <InviteRecruiterModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={handleInviteSuccess}
                />
            )}
        </div>
    );
};

export default HRDashboardPage;