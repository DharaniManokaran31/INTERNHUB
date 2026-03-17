// src/pages/hr/ManageRecruitersPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import InviteRecruiterModal from '../../components/modals/InviteRecruiterModal';
import EditRecruiterModal from '../../components/modals/EditRecruiterModal';

const ManageRecruitersPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [recruiters, setRecruiters] = useState({ active: [], pending: [], inactive: [] });
    const [stats, setStats] = useState({ activeCount: 0, pendingCount: 0, totalCount: 0 });
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRecruiter, setSelectedRecruiter] = useState(null);
    const [error, setError] = useState(null);

    // Pagination states
    const [activePage, setActivePage] = useState(1);
    const [pendingPage, setPendingPage] = useState(1);
    const [inactivePage, setInactivePage] = useState(1);
    const itemsPerPage = 3;

    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });

    useEffect(() => {
        fetchUserProfile();
        fetchRecruiters();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/recruiters/profile', {
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

    const fetchRecruiters = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            console.log('🔄 Fetching recruiters...');

            const response = await fetch('http://localhost:5000/api/hr/recruiters', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            console.log('📡 Recruiters data:', data);

            if (data.success) {
                setRecruiters(data.data);

                // Calculate stats correctly
                const activeCount = data.data.active.length;
                const pendingCount = data.data.pending.length;
                const inactiveCount = data.data.inactive?.length || 0;
                const totalCount = activeCount + pendingCount + inactiveCount;

                console.log('📊 Stats calculated:', { activeCount, pendingCount, inactiveCount, totalCount });

                setStats({
                    activeCount,
                    pendingCount,
                    totalCount
                });

                // Reset pagination pages
                setActivePage(1);
                setPendingPage(1);
                setInactivePage(1);
            } else {
                setError('Failed to load recruiters');
            }
        } catch (error) {
            console.error('Error fetching recruiters:', error);
            setError('Network error. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this invitation?')) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/hr/recruiters/${id}/revoke`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                showNotification('Invitation revoked successfully');
                fetchRecruiters();
            } else {
                showNotification(data.message || 'Failed to revoke', 'error');
            }
        } catch (error) {
            console.error('Error revoking invitation:', error);
            showNotification('Network error', 'error');
        }
    };

    const handleResendInvite = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/hr/recruiters/${id}/resend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                showNotification('Invitation resent successfully');
            } else {
                showNotification(data.message || 'Failed to resend', 'error');
            }
        } catch (error) {
            console.error('Error resending invite:', error);
            showNotification('Network error', 'error');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this recruiter?`)) return;

        try {
            const token = localStorage.getItem('authToken');
            const endpoint = currentStatus ? 'deactivate' : 'activate';

            console.log(`🔄 Attempting to ${action} recruiter:`, id);

            const response = await fetch(`http://localhost:5000/api/hr/recruiters/${id}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            console.log('📡 Server response:', data);

            if (data.success) {
                showNotification(`Recruiter ${action}d successfully`);
                await fetchRecruiters();
            } else {
                showNotification(data.message || `Failed to ${action}`, 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Network error', 'error');
        }
    };

    const handleEdit = (recruiter) => {
        setSelectedRecruiter(recruiter);
        setShowEditModal(true);
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

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            showNotification('Logged out successfully!');
            setTimeout(() => navigate('/login'), 1000);
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

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Pagination helpers
    const getPaginatedItems = (items, page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return items.slice(start, end);
    };

    const totalActivePages = Math.ceil(recruiters.active.length / itemsPerPage);
    const totalPendingPages = Math.ceil(recruiters.pending.length / itemsPerPage);
    const totalInactivePages = Math.ceil((recruiters.inactive?.length || 0) / itemsPerPage);

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
                        className="nav-item active"
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
                            Manage Recruiters
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
                                <div className="stat-label">Total Recruiters</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.totalCount
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Active Members</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.activeCount
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
                                <div className="stat-label">Pending Invites</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.pendingCount
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Invite New Recruiter
                        </button>
                        <button
                            className="secondary-btn"
                            onClick={fetchRecruiters}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', marginRight: '0.5rem' }}>
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {/* Active Team Members Section */}
                    <section className="section">
                        <h2 className="section-title">Active Team Members</h2>
                        <div className="title-underline"></div>

                        {loading ? (
                            <div className="applications-grid">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="skeleton-card" style={{ height: '100px' }}></div>
                                ))}
                            </div>
                        ) : recruiters.active.length > 0 ? (
                            <>
                                <div className="applications-grid">
                                    {getPaginatedItems(recruiters.active, activePage).map(recruiter => (
                                        <div key={recruiter._id} className="application-card">
                                            <div className="app-card-header">
                                                <div className="app-company-info">
                                                    <div className="app-company-logo" style={{
                                                        background: 'linear-gradient(135deg, #10b981, #059669)'
                                                    }}>
                                                        {getInitials(recruiter.fullName)}
                                                    </div>
                                                    <div className="app-details">
                                                        <h3 className="app-title">{recruiter.fullName}</h3>
                                                        <p className="app-company-name">
                                                            {recruiter.email}
                                                        </p>
                                                        <div className="app-meta">
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                                </svg>
                                                                {recruiter.department || 'Department'}
                                                            </span>
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                                    <circle cx="12" cy="7" r="4"></circle>
                                                                </svg>
                                                                {recruiter.designation || 'Recruiter'}
                                                            </span>
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                                </svg>
                                                                Joined {formatDate(recruiter.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                    <span className="badge badge-success">Active</span>
                                                    {recruiter.stats && (
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                            {recruiter.stats.totalInternships || 0} internships • {recruiter.stats.activeMentees || 0} mentees
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="app-card-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => handleEdit(recruiter)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => toggleStatus(recruiter._id, recruiter.isActive)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.85rem',
                                                        color: '#dc2626',
                                                        borderColor: '#fee2e2'
                                                    }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                    </svg>
                                                    Deactivate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination for Active Members */}
                                {totalActivePages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setActivePage(prev => Math.max(prev - 1, 1))}
                                            disabled={activePage === 1}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                                                opacity: activePage === 1 ? 0.5 : 1
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ padding: '0.5rem 1rem', color: '#1e293b' }}>
                                            Page {activePage} of {totalActivePages}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setActivePage(prev => Math.min(prev + 1, totalActivePages))}
                                            disabled={activePage === totalActivePages}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: activePage === totalActivePages ? 'not-allowed' : 'pointer',
                                                opacity: activePage === totalActivePages ? 0.5 : 1
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <h3>No active recruiters</h3>
                                <p>Start by inviting recruiters to join your team.</p>
                                <button
                                    className="primary-btn"
                                    onClick={() => setShowInviteModal(true)}
                                    style={{ marginTop: '1rem' }}
                                >
                                    Invite Your First Recruiter
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Pending Invitations Section */}
                    <section className="section" style={{ marginTop: '2rem' }}>
                        <h2 className="section-title">Pending Invitations</h2>
                        <div className="title-underline"></div>

                        {loading ? (
                            <div className="applications-grid">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="skeleton-card" style={{ height: '80px' }}></div>
                                ))}
                            </div>
                        ) : recruiters.pending.length > 0 ? (
                            <>
                                <div className="applications-grid">
                                    {getPaginatedItems(recruiters.pending, pendingPage).map(invite => (
                                        <div key={invite._id} className="application-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                            <div className="app-card-header">
                                                <div className="app-company-info">
                                                    <div className="app-company-logo" style={{ background: '#f59e0b' }}>
                                                        ✉️
                                                    </div>
                                                    <div className="app-details">
                                                        <h3 className="app-title">{invite.fullName || 'Pending Invite'}</h3>
                                                        <p className="app-company-name">
                                                            {invite.email}
                                                        </p>
                                                        <div className="app-meta">
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                                </svg>
                                                                {invite.department || 'Department'}
                                                            </span>
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                                </svg>
                                                                Sent {formatDate(invite.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                    <span className="badge badge-warning">Pending</span>
                                                    {invite.invitationExpires && (
                                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            Expires {formatDate(invite.invitationExpires)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="app-card-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => handleResendInvite(invite._id)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                        <path d="M22 2L11 13"></path>
                                                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                                                    </svg>
                                                    Resend
                                                </button>
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => handleRevoke(invite._id)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fee2e2' }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                    Revoke
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination for Pending Invitations */}
                                {totalPendingPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setPendingPage(prev => Math.max(prev - 1, 1))}
                                            disabled={pendingPage === 1}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: pendingPage === 1 ? 'not-allowed' : 'pointer',
                                                opacity: pendingPage === 1 ? 0.5 : 1
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ padding: '0.5rem 1rem', color: '#1e293b' }}>
                                            Page {pendingPage} of {totalPendingPages}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setPendingPage(prev => Math.min(prev + 1, totalPendingPages))}
                                            disabled={pendingPage === totalPendingPages}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: pendingPage === totalPendingPages ? 'not-allowed' : 'pointer',
                                                opacity: pendingPage === totalPendingPages ? 0.5 : 1
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                </div>
                                <h3>No pending invitations</h3>
                                <p>All recruiters have responded to their invites.</p>
                            </div>
                        )}
                    </section>

                    {/* Inactive Members Section */}
                    <section className="section" style={{ marginTop: '2rem' }}>
                        <h2 className="section-title">Inactive Members</h2>
                        <div className="title-underline"></div>

                        {loading ? (
                            <div className="applications-grid">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="skeleton-card" style={{ height: '80px' }}></div>
                                ))}
                            </div>
                        ) : recruiters.inactive?.length > 0 ? (
                            <>
                                <div className="applications-grid">
                                    {getPaginatedItems(recruiters.inactive, inactivePage).map(recruiter => (
                                        <div key={recruiter._id} className="application-card" style={{ borderLeft: '4px solid #6b7280', opacity: '0.8' }}>
                                            <div className="app-card-header">
                                                <div className="app-company-info">
                                                    <div className="app-company-logo" style={{ background: '#6b7280' }}>
                                                        {getInitials(recruiter.fullName)}
                                                    </div>
                                                    <div className="app-details">
                                                        <h3 className="app-title">{recruiter.fullName}</h3>
                                                        <p className="app-company-name">
                                                            {recruiter.email}
                                                        </p>
                                                        <div className="app-meta">
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                                </svg>
                                                                {recruiter.department || 'Department'}
                                                            </span>
                                                            <span className="app-meta-item">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                                </svg>
                                                                Deactivated on {formatDate(recruiter.deactivatedAt || recruiter.updatedAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                    <span className="badge badge-error">Inactive</span>
                                                    {recruiter.stats && (
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                            {recruiter.stats.totalInternships || 0} internships • {recruiter.stats.activeMentees || 0} mentees
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="app-card-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => handleEdit(recruiter)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    className="secondary-btn"
                                                    onClick={() => toggleStatus(recruiter._id, recruiter.isActive)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        fontSize: '0.85rem',
                                                        color: '#10b981',
                                                        borderColor: '#d1fae5'
                                                    }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <path d="M12 8v8"></path>
                                                        <path d="M8 12h8"></path>
                                                    </svg>
                                                    Activate
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination for Inactive Members */}
                                {totalInactivePages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setInactivePage(prev => Math.max(prev - 1, 1))}
                                            disabled={inactivePage === 1}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: inactivePage === 1 ? 'not-allowed' : 'pointer',
                                                opacity: inactivePage === 1 ? 0.5 : 1
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ padding: '0.5rem 1rem', color: '#1e293b' }}>
                                            Page {inactivePage} of {totalInactivePages}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setInactivePage(prev => Math.min(prev + 1, totalInactivePages))}
                                            disabled={inactivePage === totalInactivePages}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: inactivePage === totalInactivePages ? 'not-allowed' : 'pointer',
                                                opacity: inactivePage === totalInactivePages ? 0.5 : 1
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                    </svg>
                                </div>
                                <h3>No inactive members</h3>
                                <p>Deactivated recruiters will appear here.</p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Invite Recruiter Modal */}
            {showInviteModal && (
                <InviteRecruiterModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        showNotification('Recruiter invited successfully!');
                        fetchRecruiters();
                    }}
                />
            )}

            {/* Edit Recruiter Modal */}
            {showEditModal && selectedRecruiter && (
                <EditRecruiterModal
                    recruiter={selectedRecruiter}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        showNotification('Recruiter updated successfully!');
                        fetchRecruiters();
                    }}
                />
            )}
        </div>
    );
};

export default ManageRecruitersPage;