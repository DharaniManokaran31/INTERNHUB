// src/pages/hr/InternshipsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const InternshipsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [internships, setInternships] = useState([]);
    const [filteredInternships, setFilteredInternships] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, closed: 0, draft: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });

    useEffect(() => {
        fetchUserProfile();
        fetchInternships();
    }, []);

    useEffect(() => {
        // Filter internships when status filter changes
        if (statusFilter === 'all') {
            setFilteredInternships(internships);
        } else {
            setFilteredInternships(internships.filter(i => i.status === statusFilter));
        }
        setCurrentPage(1); // Reset to first page on filter change
    }, [statusFilter, internships]);

    const fetchUserProfile = async () => {
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

    const fetchInternships = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const response = await fetch('https://internhub-backend-d870.onrender.com/api/hr/internships', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const internshipsList = data.data.internships || [];
                setInternships(internshipsList);
                setFilteredInternships(internshipsList);

                // Calculate stats
                const total = internshipsList.length;
                const active = internshipsList.filter(i => i.status === 'active').length;
                const closed = internshipsList.filter(i => i.status === 'closed').length;
                const draft = internshipsList.filter(i => i.status === 'draft').length;

                setStats({ total, active, closed, draft });
            } else {
                setError('Failed to load internships');
            }
        } catch (error) {
            console.error('Error fetching internships:', error);
            setError('Network error. Please refresh the page.');
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

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return { class: 'badge-success', color: '#10b981', bg: '#d1fae5' };
            case 'draft':
                return { class: 'badge-warning', color: '#f59e0b', bg: '#fef3c7' };
            case 'closed':
                return { class: 'badge-error', color: '#ef4444', bg: '#fee2e2' };
            default:
                return { class: 'badge-info', color: '#6b7280', bg: '#f3f4f6' };
        }
    };

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'Active';
            case 'draft': return 'Draft';
            case 'closed': return 'Closed';
            default: return status?.toUpperCase() || 'UNKNOWN';
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

    const getSkillColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return { bg: '#e6f7ff', color: '#0099cc', border: '#b8e2f2' };
            case 'intermediate': return { bg: '#fff3e0', color: '#ff9800', border: '#ffe0b2' };
            case 'advanced': return { bg: '#fce4e4', color: '#f44336', border: '#ffcdd2' };
            default: return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
        }
    };

    // Pagination
    const totalPages = Math.ceil(filteredInternships.length / itemsPerPage);
    const paginatedInternships = filteredInternships.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
                            Internships
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

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Postings</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.total
                                    )}
                                </div>
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
                                <div className="stat-label">Active Roles</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.active
                                    )}
                                </div>
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
                                <div className="stat-label">Draft</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.draft
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <path d="M3 9h18"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Closed</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.closed
                                    )}
                                </div>
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
                    <div className="status-tabs" style={{ marginBottom: '1.5rem' }}>
                        <button
                            className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                            <span className="tab-badge">{internships.length}</span>
                        </button>
                        <button
                            className={`status-tab ${statusFilter === 'active' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('active')}
                        >
                            Active
                            <span className="tab-badge">{stats.active}</span>
                        </button>
                        <button
                            className={`status-tab ${statusFilter === 'draft' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('draft')}
                        >
                            Draft
                            <span className="tab-badge">{stats.draft}</span>
                        </button>
                        <button
                            className={`status-tab ${statusFilter === 'closed' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('closed')}
                        >
                            Closed
                            <span className="tab-badge">{stats.closed}</span>
                        </button>
                    </div>

                    {/* Internships Grid */}
                    <section className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="section-title">All Internship Postings</h2>
                            <button
                                className="secondary-btn"
                                onClick={fetchInternships}
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

                        {loading ? (
                            <div className="applications-grid">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="skeleton-card" style={{ height: '200px' }}></div>
                                ))}
                            </div>
                        ) : paginatedInternships.length > 0 ? (
                            <>
                                <div className="applications-grid">
                                    {paginatedInternships.map(internship => {
                                        const statusStyle = getStatusBadge(internship.status);
                                        return (
                                            <div
                                                key={internship._id}
                                                className="application-card"
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                    ':hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 10px 20px rgba(0,0,0,0.08)'
                                                    }
                                                }}
                                                onClick={() => navigate(`/hr/internships/${internship._id}`)}
                                            >
                                                <div className="app-card-header">
                                                    <div className="app-company-info">
                                                        <div className="app-company-logo" style={{
                                                            background: internship.status === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' :
                                                                internship.status === 'draft' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                                                    'linear-gradient(135deg, #6b7280, #4b5563)',
                                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                        }}>
                                                            {internship.title?.charAt(0) || 'I'}
                                                        </div>
                                                        <div className="app-details">
                                                            <h3 className="app-title" style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '600' }}>
                                                                {internship.title || 'Untitled Internship'}
                                                            </h3>
                                                            <p className="app-company-name" style={{ color: '#475569', fontSize: '0.9rem' }}>
                                                                <span style={{ color: '#2440F0', fontWeight: '500' }}>{internship.department || 'Department'}</span> • {internship.companyName || 'Zoyaraa'}
                                                            </p>
                                                            <div className="app-meta" style={{ color: '#64748b' }}>
                                                                <span className="app-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px' }}>
                                                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                        <circle cx="12" cy="10" r="3"></circle>
                                                                    </svg>
                                                                    {internship.location || 'Remote'}
                                                                </span>
                                                                <span className="app-meta-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.75rem' }}>
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px' }}>
                                                                        <circle cx="12" cy="12" r="10"></circle>
                                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                                    </svg>
                                                                    {formatDate(internship.createdAt)}
                                                                </span>
                                                                {internship.stipend > 0 && (
                                                                    <span className="app-meta-item" style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem',
                                                                        marginLeft: '0.75rem',
                                                                        color: '#10b981',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px' }}>
                                                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                                        </svg>
                                                                        ₹{internship.stipend.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                        <span className={`badge ${statusStyle.class}`} style={{
                                                            background: statusStyle.bg,
                                                            color: statusStyle.color,
                                                            fontWeight: '600',
                                                            padding: '0.25rem 0.75rem'
                                                        }}>
                                                            {getStatusText(internship.status)}
                                                        </span>
                                                        {internship.applications && (
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                color: '#64748b',
                                                                background: '#f1f5f9',
                                                                padding: '0.15rem 0.5rem',
                                                                borderRadius: '12px'
                                                            }}>
                                                                {internship.applications} applicant{internship.applications !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {internship.skillsRequired && internship.skillsRequired.length > 0 && (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: '0.5rem',
                                                        marginTop: '1rem',
                                                        paddingTop: '1rem',
                                                        borderTop: '1px solid #e2e8f0'
                                                    }}>
                                                        {internship.skillsRequired.slice(0, 3).map((skill, i) => {
                                                            const skillName = typeof skill === 'string' ? skill : skill.name;
                                                            const skillLevel = typeof skill === 'string' ? 'beginner' : skill.level;
                                                            const colors = getSkillColor(skillLevel);

                                                            return (
                                                                <span
                                                                    key={i}
                                                                    style={{
                                                                        padding: '0.2rem 0.75rem',
                                                                        background: colors.bg,
                                                                        color: colors.color,
                                                                        borderRadius: '20px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '500',
                                                                        border: `1px solid ${colors.border}`,
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem'
                                                                    }}
                                                                >
                                                                    {skillName}
                                                                    <span style={{
                                                                        fontSize: '0.6rem',
                                                                        opacity: 0.7,
                                                                        background: 'rgba(255,255,255,0.5)',
                                                                        padding: '0.1rem 0.3rem',
                                                                        borderRadius: '10px'
                                                                    }}>
                                                                        {skillLevel}
                                                                    </span>
                                                                </span>
                                                            );
                                                        })}
                                                        {internship.skillsRequired.length > 3 && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                color: '#64748b',
                                                                background: '#f1f5f9',
                                                                padding: '0.2rem 0.75rem',
                                                                borderRadius: '20px'
                                                            }}>
                                                                +{internship.skillsRequired.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Additional info row */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginTop: '1rem',
                                                    paddingTop: '0.75rem',
                                                    borderTop: '1px dashed #e2e8f0',
                                                    fontSize: '0.75rem',
                                                    color: '#94a3b8'
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px' }}>
                                                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                                            <path d="M2 8h20"></path>
                                                        </svg>
                                                        {internship.workMode || 'Not specified'}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px' }}>
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                        {internship.duration || '?'} months
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px' }}>
                                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="9" cy="7" r="4"></circle>
                                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                        </svg>
                                                        {internship.positions || 1} position{internship.positions !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                opacity: currentPage === 1 ? 0.5 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            ← Previous
                                        </button>
                                        <span style={{
                                            padding: '0.5rem 1rem',
                                            color: '#1e293b',
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontWeight: '500'
                                        }}>
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                opacity: currentPage === totalPages ? 0.5 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                    </svg>
                                </div>
                                <h3>No internships found</h3>
                                <p>There are no internship postings matching your criteria.</p>
                                {statusFilter !== 'all' && (
                                    <button
                                        className="secondary-btn"
                                        onClick={() => setStatusFilter('all')}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        View All Internships
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default InternshipsPage;