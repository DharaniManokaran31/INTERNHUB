// src/pages/hr/ActiveInternsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const ActiveInternsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [interns, setInterns] = useState([]);
    const [filteredInterns, setFilteredInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });
    const [stats, setStats] = useState({
        totalActive: 0,
        currentlyOnline: 0,
        endingSoon: 0,
        averageProgress: 0
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchUserProfile();
        fetchActiveInterns();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredInterns(interns);
        } else {
            const results = interns.filter(intern =>
                intern.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intern.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intern.internship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intern.internship?.department?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredInterns(results);
        }
        setCurrentPage(1);
    }, [searchTerm, interns]);

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

    const calculateProgress = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();

        if (today < start) return 0;
        if (today > end) return 100;

        const totalDuration = end - start;
        const elapsed = today - start;
        const progress = Math.round((elapsed / totalDuration) * 100);
        return Math.min(100, Math.max(0, progress));
    };

    const calculateEndingSoon = (endDate) => {
        if (!endDate) return false;
        const end = new Date(endDate);
        const today = new Date();
        const daysUntilEnd = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return daysUntilEnd <= 15 && daysUntilEnd > 0;
    };

    const fetchActiveInterns = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const [internsRes, statsRes] = await Promise.all([
                fetch('https://internhub-backend-d870.onrender.com/api/hr/active-interns', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch('https://internhub-backend-d870.onrender.com/api/hr/active-interns/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            if (internsRes.success) {
                const internsList = internsRes.data.interns || [];
                console.log('✅ Active interns:', internsList);

                let totalProgress = 0;
                let endingSoonCount = 0;

                internsList.forEach(intern => {
                    const internship = intern.internshipId || intern.internship || {};
                    const progress = calculateProgress(internship.startDate, internship.endDate);
                    totalProgress += progress;

                    if (calculateEndingSoon(internship.endDate)) {
                        endingSoonCount++;
                    }
                });

                const avgProgress = internsList.length > 0
                    ? Math.round(totalProgress / internsList.length)
                    : 0;

                setStats({
                    totalActive: internsList.length,
                    currentlyOnline: 0,
                    endingSoon: endingSoonCount,
                    averageProgress: avgProgress
                });

                setInterns(internsList);
                setFilteredInterns(internsList);
            } else {
                setError('Failed to load active interns.');
            }

            if (statsRes.success) {
                console.log('✅ Stats from backend:', statsRes.data);
            }
        } catch (error) {
            console.error('Error fetching active interns:', error);
            setError('Failed to load active interns data.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (internId, studentName) => {
        if (!window.confirm(`Are you sure you want to mark ${studentName} as completed?`)) return;

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`https://internhub-backend-d870.onrender.com/api/hr/active-interns/${internId}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                showNotification(`${studentName} marked as completed successfully!`, 'success');
                fetchActiveInterns();
            } else {
                showNotification(data.message || 'Failed to mark as completed', 'error');
            }
        } catch (error) {
            console.error('Error marking intern as complete:', error);
            showNotification('Network error. Please try again.', 'error');
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

    const getProgressColor = (progress) => {
        if (progress >= 75) return '#10b981';
        if (progress >= 50) return '#f59e0b';
        if (progress >= 25) return '#3b82f6';
        return '#94a3b8';
    };

    const totalPages = Math.ceil(filteredInterns.length / itemsPerPage);
    const paginatedInterns = filteredInterns.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    return (
        <div className="app-container">
            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
            ></div>

            {/* Sidebar - HR Specific with Icons */}
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
                        className="nav-item active"
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
                            Active Interns
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
                                <div className="stat-label">Total Active Interns</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.totalActive
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Currently Online</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.currentlyOnline
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <circle cx="12" cy="8" r="2" fill="currentColor"></circle>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Ending Soon</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.endingSoon
                                    )}
                                </div>
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
                                <div className="stat-label">Avg Progress</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        `${stats.averageProgress}%`
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-9-9"></path>
                                    <path d="M21 3v6h-6"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="section" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by name, email, internship, or department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        position: 'absolute',
                                        left: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '18px',
                                        color: '#94a3b8'
                                    }}
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#94a3b8'
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button
                                className="secondary-btn"
                                onClick={fetchActiveInterns}
                                style={{ padding: '0.75rem 1.5rem' }}
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
                    </div>

                    {/* Interns Grid */}
                    <section className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="section-title">Current Interns</h2>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Showing {paginatedInterns.length} of {filteredInterns.length} interns
                            </span>
                        </div>

                        {filteredInterns.length > 0 ? (
                            <>
                                <div className="applications-grid">
                                    {paginatedInterns.map(intern => {
                                        const student = intern.studentId || intern.student || {};
                                        const internship = intern.internshipId || intern.internship || {};
                                        const progress = intern.progress || calculateProgress(internship.startDate, internship.endDate);
                                        const progressColor = getProgressColor(progress);

                                        return (
                                            <div key={intern._id} className="application-card">
                                                <div className="app-card-header">
                                                    <div className="app-company-info">
                                                        <div className="app-company-logo" style={{
                                                            background: 'linear-gradient(135deg, #10b981, #059669)'
                                                        }}>
                                                            {getInitials(student.fullName)}
                                                        </div>
                                                        <div className="app-details">
                                                            <h3 className="app-title">{student.fullName || 'Unknown Student'}</h3>
                                                            <p className="app-company-name">
                                                                {student.email || 'No email'}
                                                            </p>
                                                            <div className="app-meta">
                                                                <span className="app-meta-item">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                                    </svg>
                                                                    {internship.title || 'Internship'}
                                                                </span>
                                                                <span className="app-meta-item">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                                        <circle cx="12" cy="7" r="4"></circle>
                                                                    </svg>
                                                                    {internship.department || 'Department'}
                                                                </span>
                                                                <span className="app-meta-item">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="10"></circle>
                                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                                    </svg>
                                                                    Started {formatDate(internship.startDate)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                        <span className="badge badge-success">Active</span>
                                                        {intern.lastLog && (
                                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                Last log: {formatDate(intern.lastLog.date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Progress</span>
                                                        <span style={{ fontWeight: '600', color: progressColor }}>{progress}%</span>
                                                    </div>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '8px',
                                                        background: '#e2e8f0',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${progress}%`,
                                                            height: '100%',
                                                            background: progressColor,
                                                            borderRadius: '4px',
                                                            transition: 'width 0.3s ease'
                                                        }}></div>
                                                    </div>
                                                </div>

                                                {/* Mentor Info */}
                                                {internship.mentorId && (
                                                    <div style={{
                                                        marginTop: '0.75rem',
                                                        padding: '0.5rem',
                                                        background: '#f8fafc',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        <span>
                                                            <strong>Mentor:</strong> {internship.mentorId.fullName || 'Assigned'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="app-card-footer" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="secondary-btn"
                                                        style={{ flex: 1, padding: '0.5rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // ✅ Use student._id instead of intern._id
                                                            navigate(`/hr/active-interns/${student._id}`);
                                                        }}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                        Track Progress
                                                    </button>
                                                    <button
                                                        className="primary-btn"
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.5rem',
                                                            background: 'linear-gradient(135deg, #10b981, #059669)'
                                                        }}
                                                        onClick={() => handleMarkComplete(intern._id, student.fullName)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', marginRight: '0.25rem' }}>
                                                            <path d="M20 6L9 17l-5-5"></path>
                                                        </svg>
                                                        Mark Complete
                                                    </button>
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
                                                opacity: currentPage === 1 ? 0.5 : 1
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ padding: '0.5rem 1rem', color: '#1e293b' }}>
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
                                                opacity: currentPage === totalPages ? 0.5 : 1
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
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <h3>No active interns found</h3>
                                <p>There are no interns currently in active programs.</p>
                                {searchTerm && (
                                    <button
                                        className="secondary-btn"
                                        onClick={() => setSearchTerm('')}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        Clear Search
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

export default ActiveInternsPage;