// src/pages/hr/CertificatesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import IssueCertificateModal from '../../components/modals/IssueCertificateModal';

const CertificatesPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [stats, setStats] = useState({ issued: 0, eligible: 0, revoked: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchUserProfile();
        fetchAllData();
    }, []);

    useEffect(() => {
        // Filter eligible students when search term or filter changes
        let results = [...eligibleStudents];

        // Apply search filter
        if (searchTerm.trim() !== '') {
            results = results.filter(item =>
                item.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.internship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.internship?.department?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply department filter
        if (filter !== 'all') {
            results = results.filter(item => item.internship?.department === filter);
        }

        setFilteredStudents(results);
        setCurrentPage(1); // Reset to first page on filter change
    }, [searchTerm, filter, eligibleStudents]);

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

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const [eligibleRes, statsRes] = await Promise.all([
                fetch('http://localhost:5000/api/hr/certificates/eligible', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch('http://localhost:5000/api/hr/certificates/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            if (eligibleRes.success) {
                const eligibleList = eligibleRes.data.eligible || eligibleRes.data || [];
                console.log('✅ Eligible students:', eligibleList);
                setEligibleStudents(eligibleList);
                setFilteredStudents(eligibleList);
            }

            if (statsRes.success && statsRes.data) {
                setStats({
                    issued: statsRes.data.totalIssued || 0,
                    eligible: eligibleRes.data.eligible?.length || 0,
                    revoked: statsRes.data.totalRevoked || 0
                });
            }
        } catch (error) {
            console.error('Error fetching certificate data:', error);
            setError('Failed to load certification data.');
        } finally {
            setLoading(false);
        }
    };

    const handleIssueInitiative = (student) => {
        setSelectedStudent(student);
        setShowIssueModal(true);
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

    // Get unique departments for filter
    const departments = [...new Set(eligibleStudents.map(item => item.internship?.department).filter(Boolean))];

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
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
                        className="nav-item active"
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
                            Certificates
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
                                <div className="stat-label">Total Issued</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.issued
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
                                <div className="stat-label">Ready for Issuance</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.eligible
                                    )}
                                </div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="8" r="4"></circle>
                                    <path d="M5.5 20v-2a6 6 0 0 1 12 0v2"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Revoked</div>
                                <div className="stat-value">
                                    {loading ? (
                                        <div className="skeleton-text" style={{ width: '60px', height: '32px' }}></div>
                                    ) : (
                                        stats.revoked
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

                    {/* Search and Filter Bar */}
                    <div className="section" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: 2, position: 'relative', minWidth: '250px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by name, email, or internship..."
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

                            <select
                                className="form-input"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem',
                                    background: 'white'
                                }}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>

                            <button
                                className="secondary-btn"
                                onClick={fetchAllData}
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

                    {/* Eligible Candidates Section */}
                    <section className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 className="section-title">Eligible Candidates</h2>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Showing {paginatedStudents.length} of {filteredStudents.length} candidates
                            </span>
                        </div>

                        {loading ? (
                            <div className="applications-grid">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="skeleton-card" style={{ height: '120px' }}></div>
                                ))}
                            </div>
                        ) : paginatedStudents.length > 0 ? (
                            <>
                                <div className="applications-grid">
                                    {paginatedStudents.map(item => {
                                        const student = item.studentId || item.student || {};
                                        const internship = item.internshipId || item.internship || {};

                                        return (
                                            <div key={item._id} className="application-card">
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
                                                                        <circle cx="12" cy="12" r="10"></circle>
                                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                                    </svg>
                                                                    Completed {formatDate(item.completionDate || item.appliedAt)}
                                                                </span>
                                                                <span className="app-meta-item">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                                        <circle cx="12" cy="7" r="4"></circle>
                                                                    </svg>
                                                                    {internship.department || 'Department'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                        <span className="badge badge-success">Eligible</span>
                                                        {internship.duration && (
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                {internship.duration} months
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {item.mentorName && (
                                                    <div style={{
                                                        marginTop: '0.75rem',
                                                        padding: '0.75rem',
                                                        background: '#f8fafc',
                                                        borderRadius: '8px',
                                                        fontSize: '0.85rem',
                                                        color: '#475569'
                                                    }}>
                                                        <span style={{ fontWeight: '600' }}>Mentor: </span>
                                                        {item.mentorName}
                                                    </div>
                                                )}

                                                <div className="app-card-footer" style={{ marginTop: '1rem' }}>
                                                    <button
                                                        className="primary-btn"
                                                        style={{ width: '100%', justifyContent: 'center' }}
                                                        onClick={() => handleIssueInitiative(item)}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                            <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                                                        </svg>
                                                        Issue Certificate
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
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                                    </svg>
                                </div>
                                <h3>No eligible candidates</h3>
                                <p>There are no students currently eligible for certificates.</p>
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

            {/* Issue Certificate Modal */}
            {showIssueModal && (
                <IssueCertificateModal
                    studentData={selectedStudent}
                    onClose={() => setShowIssueModal(false)}
                    onSuccess={() => {
                        showNotification('Certificate issued successfully!', 'success');
                        fetchAllData();
                    }}
                />
            )}
        </div>
    );
};

export default CertificatesPage;