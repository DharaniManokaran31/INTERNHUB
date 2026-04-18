// src/pages/hr/ActiveInternProgressPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActiveInternProgressPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [userData, setUserData] = useState({ 
        name: 'HR Manager', 
        initials: 'HR',
        role: 'hr' 
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
        if (id) {
            fetchProgressData();
        }
    }, [id]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
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

    const fetchProgressData = async () => {
    try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        
        console.log('📡 Fetching progress for ID:', id); // ADD THIS LOG
        
        const response = await fetch(`https://internhub-backend-d879.onrender.com/api/hr/active-interns/${id}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        console.log('📡 API Response:', result); // ADD THIS LOG
        
        if (result.success) {
            setData(result.data);
        } else {
            setError(result.message || 'Progress data not found.');
        }
    } catch (err) {
        console.error('Error fetching progress:', err);
        setError('Failed to load progress data.');
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatMonthDay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return { class: 'badge-success', text: 'Approved' };
            case 'pending':
                return { class: 'badge-warning', text: 'Pending' };
            case 'rejected':
                return { class: 'badge-error', text: 'Rejected' };
            default:
                return { class: 'badge-info', text: status || 'Unknown' };
        }
    };

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
                            Intern Progress
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
                    {/* Back Button */}
                    <button
                        className="secondary-btn"
                        style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={(e) => { createRippleEffect(e); navigate('/hr/active-interns'); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Active Interns
                    </button>

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

                    {data ? (
                        <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                            {/* Left Column - Charts and Logs */}
                            <div className="left-col">
                                {/* Student Header Card (Mobile) */}
                                <div className="section" style={{ display: 'none' }}></div>

                                {/* Performance Trend Chart */}
                                <section className="section" style={{ marginBottom: '2rem' }}>
                                    <h2 className="section-title">Performance Trend</h2>
                                    <div className="title-underline"></div>
                                    
                                    {data.logs && data.logs.length > 0 ? (
                                        <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.logs.map(log => ({
                                                    date: formatMonthDay(log.date),
                                                    hours: log.totalHours || 0,
                                                    status: log.status
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                                    <YAxis stroke="#64748b" fontSize={12} unit="h" />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            background: 'white', 
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                        }} 
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="hours" 
                                                        stroke="#2440F0" 
                                                        strokeWidth={3} 
                                                        dot={{ r: 4, fill: '#2440F0' }} 
                                                        activeDot={{ r: 6, fill: '#7c3aed' }} 
                                                        name="Hours Logged"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ padding: '3rem' }}>
                                            <p style={{ color: '#64748b' }}>No activity logs recorded yet</p>
                                        </div>
                                    )}
                                </section>

                                {/* Recent Activity Logs */}
                                <section className="section">
                                    <h2 className="section-title">Recent Activity Logs</h2>
                                    <div className="title-underline"></div>
                                    
                                    {data.logs && data.logs.length > 0 ? (
                                        <div className="recent-applications-list" style={{ marginTop: '1rem' }}>
                                            {data.logs.slice(0, 5).map((log, index) => {
                                                const status = getStatusBadge(log.status);
                                                return (
                                                    <div key={index} className="recent-application-card" style={{
                                                        borderLeft: `4px solid ${
                                                            log.status === 'approved' ? '#10b981' :
                                                            log.status === 'pending' ? '#f59e0b' :
                                                            log.status === 'rejected' ? '#ef4444' : '#94a3b8'
                                                        }`
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                                </svg>
                                                                <span style={{ fontWeight: '500' }}>{formatDate(log.date)}</span>
                                                            </div>
                                                            <span className={`badge ${status.class}`}>{status.text}</span>
                                                        </div>
                                                        
                                                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#475569' }}>
                                                            {log.tasksCompleted?.join(', ') || 'No tasks recorded'}
                                                        </p>
                                                        
                                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                            <span>📊 {log.totalHours || 0} hours</span>
                                                            {log.learnings && <span>📝 {log.learnings.substring(0, 30)}...</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ padding: '2rem' }}>
                                            <div className="empty-state-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                </svg>
                                            </div>
                                            <h3>No logs recorded</h3>
                                            <p>This intern hasn't submitted any daily logs yet.</p>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Right Column - Student Info and Stats */}
                            <div className="right-col">
                                {/* Student Profile Card */}
                                <section className="section" style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1rem',
                                        color: 'white',
                                        fontSize: '2.5rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {getInitials(data.student?.fullName)}
                                    </div>
                                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem' }}>{data.student?.fullName || 'Student Name'}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>{data.student?.email}</p>
                                    
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 1rem',
                                        background: '#d1fae5',
                                        color: '#065f46',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}>
                                        Active Intern
                                    </div>
                                </section>

                                {/* Progress Stats */}
                                <section className="section">
                                    <h2 className="section-title">Progress Overview</h2>
                                    <div className="title-underline"></div>
                                    
                                    {/* Overall Progress Bar */}
                                    <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Overall Progress</span>
                                            <span style={{ fontWeight: '700', color: '#2440F0' }}>{data.stats?.progress || 0}%</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '10px',
                                            background: '#e2e8f0',
                                            borderRadius: '5px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${data.stats?.progress || 0}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #2440F0, #7c3aed)',
                                                borderRadius: '5px',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '1fr 1fr', 
                                        gap: '1rem',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Total Logs</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2440F0' }}>{data.logs?.length || 0}</div>
                                        </div>
                                        
                                        <div style={{
                                            padding: '1rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Total Hours</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{data.stats?.totalHours || 0}h</div>
                                        </div>
                                    </div>

                                    {/* Internship Details */}
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#1e293b' }}>Internship Details</h3>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#64748b' }}>Department</span>
                                            <span style={{ fontWeight: '500' }}>{data.internship?.department || 'N/A'}</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#64748b' }}>Role</span>
                                            <span style={{ fontWeight: '500' }}>{data.internship?.title || 'N/A'}</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#64748b' }}>Duration</span>
                                            <span style={{ fontWeight: '500' }}>{data.internship?.duration || 0} months</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                                            <span style={{ color: '#64748b' }}>Start Date</span>
                                            <span style={{ fontWeight: '500' }}>{formatDate(data.internship?.startDate)}</span>
                                        </div>
                                    </div>

                                    {/* Weekly Breakdown */}
                                    {data.weeklyBreakdown && Object.keys(data.weeklyBreakdown).length > 0 && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#1e293b' }}>Weekly Breakdown</h3>
                                            {Object.entries(data.weeklyBreakdown).map(([week, stats]) => (
                                                <div key={week} style={{
                                                    padding: '0.75rem',
                                                    background: '#f8fafc',
                                                    borderRadius: '8px',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: '500' }}>Week {week}</span>
                                                        <span style={{ color: '#2440F0' }}>{stats.hours}h</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {stats.tasks} tasks completed
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Mentor Info */}
                                {data.internship?.mentorId && (
                                    <section className="section">
                                        <h2 className="section-title">Mentor Information</h2>
                                        <div className="title-underline"></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                background: '#e0e7ff',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#2440F0',
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {getInitials(data.internship.mentorId.fullName)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{data.internship.mentorId.fullName || 'Mentor'}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{data.internship.mentorId.email || 'No email'}</div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
};

export default ActiveInternProgressPage;