// src/pages/hr/InternshipDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const InternshipDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [internship, setInternship] = useState(null);
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('details');
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
        if (id) {
            loadInternshipData();
        }
    }, [id]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const user = data.data?.user || data.user;
                const initials = user.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                setUserData({
                    name: user.fullName,
                    initials: initials,
                    role: 'hr'
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const loadInternshipData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            // Fetch both in parallel
            const [intResponse, appsResponse] = await Promise.all([
                fetch(`https://internhub-backend-d870.onrender.com/api/hr/internships/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch(`https://internhub-backend-d870.onrender.com/api/hr/internships/${id}/applications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            if (intResponse.success) {
                setInternship(intResponse.data.internship);
            } else {
                setError('Internship details not found.');
            }

            if (appsResponse.success) {
                // Ensure student data is properly populated
                const apps = appsResponse.data.applications || [];
                console.log('Applications with student data:', apps); // Debug log
                setApplications(apps);
            }
        } catch (err) {
            console.error('Error loading internship data:', err);
            setError('Failed to load internship details. Please try again.');
        } finally {
            setLoading(false);
        }
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

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return { class: 'badge-success', color: '#10b981', bg: '#d1fae5', text: 'Active' };
            case 'draft':
                return { class: 'badge-warning', color: '#f59e0b', bg: '#fef3c7', text: 'Draft' };
            case 'closed':
                return { class: 'badge-error', color: '#ef4444', bg: '#fee2e2', text: 'Closed' };
            default:
                return { class: 'badge-info', color: '#6b7280', bg: '#f3f4f6', text: status?.toUpperCase() || 'UNKNOWN' };
        }
    };

    const getApplicationStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { class: 'badge-warning', text: 'Pending' };
            case 'shortlisted':
                return { class: 'badge-info', text: 'Shortlisted' };
            case 'accepted':
                return { class: 'badge-success', text: 'Accepted' };
            case 'rejected':
                return { class: 'badge-error', text: 'Rejected' };
            default:
                return { class: 'badge-info', text: status?.toUpperCase() || 'UNKNOWN' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'Unpaid';
        return `₹${amount.toLocaleString()}`;
    };

    const getSkillLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return { bg: '#e6f7ff', color: '#0099cc', border: '#b8e2f2' };
            case 'intermediate': return { bg: '#fff3e0', color: '#ff9800', border: '#ffe0b2' };
            case 'advanced': return { bg: '#fce4e4', color: '#f44336', border: '#ffcdd2' };
            default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
        }
    };

    // Handle application review - navigate to application details page
    const handleReviewApplication = (appId) => {
        navigate(`/hr/applicants/${appId}`);
    }

    if (loading) {
        return (
            <div className="app-container">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-logo">
                            <div className="sidebar-logo-icon">Z</div>
                            <span className="sidebar-logo-text">Zoyaraa</span>
                        </div>
                    </div>
                </aside>
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

    const statusBadge = internship ? getStatusBadge(internship.status) : null;

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
                        className="nav-item"
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
                        className="nav-item active"
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
                            Internship Details
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
                            borderRadius: '8px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Back Button */}
                    <button
                        className="secondary-btn"
                        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={(e) => { createRippleEffect(e); navigate('/hr/internships'); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Internships
                    </button>

                    {internship ? (
                        <>
                            {/* Header Section */}
                            <div className="welcome-section" style={{
                                background: 'linear-gradient(135deg, #2440F0, #0a1a7a)',
                                padding: '2rem',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                color: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                            {internship.title}
                                        </h1>
                                        <p style={{ fontSize: '1rem', opacity: '0.9', marginBottom: '0.5rem' }}>
                                            {internship.department} • {internship.companyName || 'Zoyaraa'}
                                        </p>
                                        <p style={{ fontSize: '0.9rem', opacity: '0.8', margin: 0 }}>
                                            Posted by: {internship.postedBy?.fullName || 'Recruiter'} • {internship.postedBy?.email || ''}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        <span className={`badge ${statusBadge.class}`} style={{
                                            background: statusBadge.bg,
                                            color: statusBadge.color,
                                            fontSize: '1rem',
                                            padding: '0.5rem 1.5rem'
                                        }}>
                                            {statusBadge.text}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                                            Posted on {formatDate(internship.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                <div className="stat-card">
                                    <div className="stat-info">
                                        <div className="stat-label">Total Applications</div>
                                        <div className="stat-value">{applications.length}</div>
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
                                        <div className="stat-label">Positions</div>
                                        <div className="stat-value">{internship.positions || 1}</div>
                                    </div>
                                    <div className="stat-icon green">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-info">
                                        <div className="stat-label">Filled</div>
                                        <div className="stat-value">{internship.filledPositions || 0}</div>
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
                                        <div className="stat-label">Remaining</div>
                                        <div className="stat-value">{(internship.positions || 1) - (internship.filledPositions || 0)}</div>
                                    </div>
                                    <div className="stat-icon purple">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="action-buttons" style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
                                <button
                                    className={`secondary-btn ${activeTab === 'details' ? 'active' : ''}`}
                                    style={{
                                        borderBottom: activeTab === 'details' ? '3px solid #2440F0' : 'none',
                                        borderRadius: '0',
                                        color: activeTab === 'details' ? '#2440F0' : '#64748b',
                                        fontWeight: activeTab === 'details' ? '600' : '500'
                                    }}
                                    onClick={() => setActiveTab('details')}
                                >
                                    Role Overview
                                </button>
                                <button
                                    className={`secondary-btn ${activeTab === 'applicants' ? 'active' : ''}`}
                                    style={{
                                        borderBottom: activeTab === 'applicants' ? '3px solid #2440F0' : 'none',
                                        borderRadius: '0',
                                        color: activeTab === 'applicants' ? '#2440F0' : '#64748b',
                                        fontWeight: activeTab === 'applicants' ? '600' : '500'
                                    }}
                                    onClick={() => setActiveTab('applicants')}
                                >
                                    Candidates ({applications.length})
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'details' ? (
                                <div className="two-column-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                                    {/* Left Column - Description & Skills */}
                                    <section className="section">
                                        <h2 className="section-title">Job Description</h2>
                                        <div className="title-underline"></div>
                                        <p style={{ lineHeight: '1.8', color: '#334155', marginBottom: '2rem' }}>
                                            {internship.description}
                                        </p>

                                        <h2 className="section-title" style={{ marginTop: '1.5rem' }}>Requirements</h2>
                                        <div className="title-underline"></div>
                                        {internship.requirements && internship.requirements.length > 0 ? (
                                            <ul style={{
                                                paddingLeft: '1.5rem',
                                                color: '#475569',
                                                lineHeight: '1.8',
                                                textAlign: 'left',
                                                margin: 0,
                                                listStylePosition: 'outside'
                                            }}>
                                                {internship.requirements.map((req, index) => (
                                                    <li key={index} style={{ textAlign: 'left' }}>{req}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'left' }}>No specific requirements listed</p>
                                        )}

                                        <h2 className="section-title" style={{ marginTop: '1.5rem' }}>Perks & Benefits</h2>
                                        <div className="title-underline"></div>
                                        {internship.perks && internship.perks.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                {internship.perks.map((perk, index) => (
                                                    <span key={index} style={{
                                                        padding: '0.4rem 1rem',
                                                        background: '#f0f9ff',
                                                        color: '#0369a1',
                                                        borderRadius: '20px',
                                                        fontSize: '0.9rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <path d="m9 12 2 2 4-5"></path>
                                                        </svg>
                                                        {perk}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No perks listed</p>
                                        )}

                                        <h2 className="section-title" style={{ marginTop: '1.5rem' }}>Skills Required</h2>
                                        <div className="title-underline"></div>
                                        {internship.skillsRequired && internship.skillsRequired.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                {internship.skillsRequired.map((skill, index) => {
                                                    const skillName = typeof skill === 'string' ? skill : skill.name;
                                                    const skillLevel = typeof skill === 'string' ? 'beginner' : skill.level;
                                                    const colors = getSkillLevelColor(skillLevel);

                                                    return (
                                                        <span
                                                            key={index}
                                                            style={{
                                                                padding: '0.4rem 1rem',
                                                                background: colors.bg,
                                                                color: colors.color,
                                                                borderRadius: '20px',
                                                                fontSize: '0.9rem',
                                                                border: `1px solid ${colors.border}`,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem'
                                                            }}
                                                        >
                                                            {skillName}
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                opacity: 0.8,
                                                                background: 'rgba(255,255,255,0.5)',
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '12px'
                                                            }}>
                                                                {skillLevel}
                                                            </span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No skills specified</p>
                                        )}
                                    </section>

                                    {/* Right Column - Timeline & Details */}
                                    <section className="section">
                                        <h2 className="section-title">Program Timeline</h2>
                                        <div className="title-underline"></div>
                                        <div className="recent-applications-list">
                                            <div className="recent-application-card">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>Start Date</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>When the internship begins</div>
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: '#2440F0' }}>{formatDate(internship.startDate)}</span>
                                                </div>
                                            </div>

                                            <div className="recent-application-card">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="stat-icon green" style={{ width: '40px', height: '40px' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>End Date</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>When the internship ends</div>
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: '#10b981' }}>{formatDate(internship.endDate)}</span>
                                                </div>
                                            </div>

                                            <div className="recent-application-card" style={{ background: '#fff7ed' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="stat-icon orange" style={{ width: '40px', height: '40px' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>Application Deadline</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Last date to apply</div>
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: '#f59e0b' }}>{formatDate(internship.deadline)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="section-title" style={{ marginTop: '2rem' }}>Work Details</h2>
                                        <div className="title-underline"></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem' }}>
                                                <div className="stat-label" style={{ fontSize: '0.75rem' }}>Work Mode</div>
                                                <div className="stat-value" style={{ fontSize: '1rem' }}>{internship.workMode || 'Not specified'}</div>
                                            </div>
                                            <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem' }}>
                                                <div className="stat-label" style={{ fontSize: '0.75rem' }}>Duration</div>
                                                <div className="stat-value" style={{ fontSize: '1rem' }}>{internship.duration} months</div>
                                            </div>
                                            <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem' }}>
                                                <div className="stat-label" style={{ fontSize: '0.75rem' }}>Stipend</div>
                                                <div className="stat-value" style={{ fontSize: '1rem', color: '#10b981' }}>{formatCurrency(internship.stipend)}</div>
                                            </div>
                                            <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem' }}>
                                                <div className="stat-label" style={{ fontSize: '0.75rem' }}>Location</div>
                                                <div className="stat-value" style={{ fontSize: '1rem' }}>{internship.location || 'Remote'}</div>
                                            </div>
                                        </div>

                                        {internship.dailyTimings && (
                                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                                <div className="stat-label" style={{ marginBottom: '0.25rem' }}>Daily Timings</div>
                                                <div style={{ fontWeight: '500' }}>{internship.dailyTimings}</div>
                                            </div>
                                        )}

                                        {internship.selectionProcess && internship.selectionProcess.length > 0 && (
                                            <>
                                                <h2 className="section-title" style={{ marginTop: '2rem' }}>Selection Process</h2>
                                                <div className="title-underline"></div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {internship.selectionProcess.map((round, index) => (
                                                        <div key={index} style={{
                                                            padding: '1rem',
                                                            background: '#f8fafc',
                                                            borderRadius: '8px',
                                                            borderLeft: '4px solid #2440F0'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                                <span style={{ fontWeight: '600' }}>Round {round.round}: {round.type}</span>
                                                                {round.duration && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>⏱️ {round.duration}</span>}
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{round.details}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </section>
                                </div>
                            ) : (
                                /* Candidates Tab */
                                <section className="section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 className="section-title">Candidates ({applications.length})</h2>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span className="badge badge-warning">
                                                Pending: {applications.filter(a => a.status === 'pending').length}
                                            </span>
                                            <span className="badge badge-info">
                                                Shortlisted: {applications.filter(a => a.status === 'shortlisted').length}
                                            </span>
                                            <span className="badge badge-success">
                                                Accepted: {applications.filter(a => a.status === 'accepted').length}
                                            </span>
                                            <span className="badge badge-error">
                                                Rejected: {applications.filter(a => a.status === 'rejected').length}
                                            </span>
                                        </div>
                                    </div>

                                    {applications.length > 0 ? (
                                        <div className="applications-grid">
                                            {applications.map(app => {
                                                const status = getApplicationStatusBadge(app.status);

                                                // SAFE STUDENT DATA ACCESS - handles all possible structures
                                                const student = app.studentId || app.student || {};

                                                const studentName = student.fullName ||
                                                    student.name ||
                                                    (student.profile && student.profile.name) ||
                                                    'Unknown Student';

                                                const studentEmail = student.email ||
                                                    (student.profile && student.profile.email) ||
                                                    'Email not available';

                                                const studentCollege =
                                                    (student.currentEducation && student.currentEducation.college) ||
                                                    (student.education && student.education.college) ||
                                                    (student.profile && student.profile.education && student.profile.education.college) ||
                                                    student.college ||
                                                    'College not specified';

                                                const studentInitial = studentName.charAt(0).toUpperCase();

                                                // Debug log to see what's actually coming from the API
                                                console.log('Application student data:', {
                                                    appId: app._id,
                                                    student: student,
                                                    studentName: studentName,
                                                    studentEmail: studentEmail,
                                                    studentCollege: studentCollege
                                                });

                                                return (
                                                    <div key={app._id} className="application-card" style={{ cursor: 'pointer' }}
                                                        onClick={() => handleReviewApplication(app._id)}
                                                    >
                                                        <div className="app-card-header">
                                                            <div className="app-company-info">
                                                                <div className="app-company-logo" style={{
                                                                    background: status.class === 'badge-warning' ? '#f59e0b' :
                                                                        status.class === 'badge-info' ? '#3b82f6' :
                                                                            status.class === 'badge-success' ? '#10b981' :
                                                                                '#ef4444'
                                                                }}>
                                                                    {studentInitial}
                                                                </div>
                                                                <div className="app-details">
                                                                    <h3 className="app-title">{studentName}</h3>
                                                                    <p className="app-company-name">
                                                                        {studentEmail}
                                                                    </p>
                                                                    <div className="app-meta">
                                                                        <span className="app-meta-item">
                                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                                            </svg>
                                                                            Applied {formatDate(app.appliedAt)}
                                                                        </span>
                                                                        <span className="app-meta-item">
                                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                                            </svg>
                                                                            {studentCollege}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                                <span className={`badge ${status.class}`}>
                                                                    {status.text}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {app.coverLetter && (
                                                            <div style={{
                                                                marginTop: '1rem',
                                                                padding: '0.75rem',
                                                                background: '#f8fafc',
                                                                borderRadius: '8px',
                                                                fontSize: '0.85rem',
                                                                color: '#475569'
                                                            }}>
                                                                <span style={{ fontWeight: '600' }}>Cover Letter: </span>
                                                                {app.coverLetter.length > 150
                                                                    ? app.coverLetter.substring(0, 150) + '...'
                                                                    : app.coverLetter}
                                                            </div>
                                                        )}

                                                        <div className="app-card-footer" style={{ marginTop: '1rem' }}>
                                                            <button
                                                                className="secondary-btn"
                                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReviewApplication(app._id);
                                                                }}
                                                            >
                                                                Review Application
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                            </div>
                                            <h3>No applications yet</h3>
                                            <p>Students haven't applied to this internship yet.</p>
                                        </div>
                                    )}
                                </section>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <h3>Internship not found</h3>
                            <p>The internship you're looking for doesn't exist or has been removed.</p>
                            <button
                                className="primary-btn"
                                onClick={() => navigate('/hr/internships')}
                            >
                                Back to Internships
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InternshipDetailsPage;