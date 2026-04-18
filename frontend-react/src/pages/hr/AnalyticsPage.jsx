// src/pages/hr/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Cell
} from 'recharts';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState({ applicationsOverTime: [], hiresOverTime: [] });
    const [conversion, setConversion] = useState({
        applicationToHire: 0,
        interviewToOffer: 0,
        departmentWise: []
    });
    const [timeframe, setTimeframe] = useState('month');
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserProfile();
        fetchAnalyticsData();
    }, [timeframe]);

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

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const [trendsRes, convRes] = await Promise.all([
                fetch(`https://internhub-backend-d870.onrender.com/api/hr/reports/trends?period=${timeframe}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()),
                fetch('https://internhub-backend-d870.onrender.com/api/hr/reports/conversion', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json())
            ]);

            if (trendsRes.success) {
                setTrends(trendsRes.data);
                console.log('✅ Trends data:', trendsRes.data);
            }

            if (convRes.success) {
                setConversion(convRes.data);
                console.log('✅ Conversion data:', convRes.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Failed to load analytics data.');
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

    const COLORS = ['#2440F0', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#8b5cf6', '#ef4444'];

    // Format data for charts
    const formatTrendData = (data) => {
        if (!data || data.length === 0) return [];
        return data.map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    };

    const applicationsData = formatTrendData(trends.applicationsOverTime);
    const hiresData = formatTrendData(trends.hiresOverTime);

    // Combine for area chart
    const combinedData = applicationsData.map((item, index) => ({
        date: item.date,
        applications: item.count,
        hires: hiresData[index]?.count || 0
    }));

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
                        className="nav-item active"
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
                            Talent Analytics
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

                    {/* Timeframe Filter */}
                    <div className="status-tabs" style={{ marginBottom: '1.5rem' }}>
                        <button
                            className={`status-tab ${timeframe === 'week' ? 'active' : ''}`}
                            onClick={() => setTimeframe('week')}
                        >
                            Weekly
                        </button>
                        <button
                            className={`status-tab ${timeframe === 'month' ? 'active' : ''}`}
                            onClick={() => setTimeframe('month')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`status-tab ${timeframe === 'quarter' ? 'active' : ''}`}
                            onClick={() => setTimeframe('quarter')}
                        >
                            Quarterly
                        </button>
                        <button
                            className={`status-tab ${timeframe === 'year' ? 'active' : ''}`}
                            onClick={() => setTimeframe('year')}
                        >
                            Yearly
                        </button>
                    </div>

                    {/* Analytics Grid */}
                    <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

                        {/* Recruitment Momentum Chart */}
                        <section className="section" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="section-title">Recruitment Momentum</h2>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span className="badge badge-info" style={{ background: '#dbeafe', color: '#1e40af' }}>
                                        Applications
                                    </span>
                                    <span className="badge badge-success" style={{ background: '#d1fae5', color: '#065f46' }}>
                                        Hires
                                    </span>
                                </div>
                            </div>
                            <div className="title-underline"></div>

                            {combinedData.length > 0 ? (
                                <div style={{ width: '100%', height: '350px', marginTop: '1rem' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={combinedData}>
                                            <defs>
                                                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2440F0" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#2440F0" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                            <YAxis stroke="#64748b" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="applications"
                                                stroke="#2440F0"
                                                strokeWidth={2}
                                                fill="url(#colorApplications)"
                                                name="Applications"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="hires"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                fill="url(#colorHires)"
                                                name="Hires"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '3rem' }}>
                                    <p style={{ color: '#64748b' }}>No trend data available for this period</p>
                                </div>
                            )}
                        </section>

                        {/* Department Conversion Bar Chart */}
                        <section className="section">
                            <h2 className="section-title">Department Conversion Rates</h2>
                            <div className="title-underline"></div>

                            {conversion.departmentWise && conversion.departmentWise.length > 0 ? (
                                <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={conversion.departmentWise}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="department" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={60} />
                                            <YAxis stroke="#64748b" fontSize={12} unit="%" />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, 'Conversion Rate']}
                                                contentStyle={{
                                                    background: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Bar dataKey="conversion" radius={[4, 4, 0, 0]}>
                                                {conversion.departmentWise.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '3rem' }}>
                                    <p style={{ color: '#64748b' }}>No department data available</p>
                                </div>
                            )}
                        </section>

                        {/* Conversion Funnel Section */}
                        <section className="section">
                            <h2 className="section-title">Conversion Funnel</h2>
                            <div className="title-underline"></div>

                            <div style={{ marginTop: '1.5rem' }}>
                                {/* Application to Hire Rate */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#1e293b', fontWeight: '500' }}>Application → Hire</span>
                                        <span style={{ color: '#2440F0', fontWeight: '700' }}>{conversion.applicationToHire}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '10px',
                                        background: '#e2e8f0',
                                        borderRadius: '5px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${conversion.applicationToHire}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #2440F0, #7c3aed)',
                                            borderRadius: '5px'
                                        }}></div>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        {conversion.applicationToHire}% of applications result in hires
                                    </p>
                                </div>

                                {/* Interview to Offer Rate */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#1e293b', fontWeight: '500' }}>Interview → Offer</span>
                                        <span style={{ color: '#10b981', fontWeight: '700' }}>{conversion.interviewToOffer}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '10px',
                                        background: '#e2e8f0',
                                        borderRadius: '5px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${conversion.interviewToOffer}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #10b981, #34d399)',
                                            borderRadius: '5px'
                                        }}></div>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        {conversion.interviewToOffer}% of interviews lead to offers
                                    </p>
                                </div>

                                {/* Quick Stats */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem',
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    background: '#f8fafc',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2440F0' }}>
                                            {conversion.departmentWise?.length || 0}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Departments</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                                            {conversion.departmentWise?.filter(d => d.conversion > 50).length || 0}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>High Performance</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Enhanced Department Performance Section */}
                        <section className="section" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="section-title">Department Performance</h2>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Excellent ({'>70%'})</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Good (50-70%)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Needs Improvement ({'<30%'})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="title-underline"></div>

                            {conversion.departmentWise && conversion.departmentWise.length > 0 ? (
                                <div style={{ marginTop: '1.5rem' }}>
                                    {/* Department Cards Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        {conversion.departmentWise.map((dept, idx) => {
                                            // Determine performance level
                                            const performanceLevel = dept.conversion >= 70 ? 'excellent' :
                                                dept.conversion >= 50 ? 'good' :
                                                    dept.conversion >= 30 ? 'average' : 'needs-improvement';

                                            const performanceColors = {
                                                'excellent': { bg: '#d1fae5', text: '#065f46', border: '#10b981', badge: 'Excellent' },
                                                'good': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', badge: 'Good' },
                                                'average': { bg: '#ffe4e6', text: '#9d174d', border: '#ec4899', badge: 'Average' },
                                                'needs-improvement': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444', badge: 'Needs Improvement' }
                                            };

                                            const colors = performanceColors[performanceLevel] || performanceColors['needs-improvement'];

                                            // Calculate stats for this department
                                            const totalApps = dept.totalApps || 0;
                                            const totalHired = dept.totalHired || 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="application-card"
                                                    style={{
                                                        borderLeft: `4px solid ${colors.border}`,
                                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => navigate(`/hr/internships?department=${dept.department}`)}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                        <div>
                                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{dept.department}</h3>
                                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                                                {totalApps} application{totalApps !== 1 ? 's' : ''} • {totalHired} hire{totalHired !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                        <span style={{
                                                            background: colors.bg,
                                                            color: colors.text,
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {colors.badge}
                                                        </span>
                                                    </div>

                                                    {/* Conversion Progress Bar */}
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Conversion Rate</span>
                                                            <span style={{ fontWeight: '600', color: colors.border }}>
                                                                {dept.conversion?.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div style={{
                                                            width: '100%',
                                                            height: '8px',
                                                            background: '#e2e8f0',
                                                            borderRadius: '4px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${dept.conversion}%`,
                                                                height: '100%',
                                                                background: colors.border,
                                                                borderRadius: '4px',
                                                                transition: 'width 0.3s ease'
                                                            }}></div>
                                                        </div>
                                                    </div>

                                                    {/* Quick Stats */}
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gap: '0.5rem',
                                                        padding: '0.75rem',
                                                        background: '#f8fafc',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        <div>
                                                            <div style={{ color: '#64748b' }}>Applications</div>
                                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{totalApps}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#64748b' }}>Hires</div>
                                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{totalHired}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#64748b' }}>Openings</div>
                                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{dept.openings || 0}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#64748b' }}>Efficiency</div>
                                                            <div style={{
                                                                fontWeight: '600',
                                                                color: dept.conversion > 50 ? '#10b981' : '#64748b'
                                                            }}>
                                                                {dept.conversion > 50 ? 'High' : 'Low'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* View Details Button */}
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <button
                                                            className="secondary-btn"
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                fontSize: '0.85rem',
                                                                borderColor: colors.border,
                                                                color: colors.border
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/hr/internships?department=${dept.department}`);
                                                            }}
                                                        >
                                                            View {dept.department} Internships →
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Summary Cards */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '1rem',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Best Performer</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0.25rem 0' }}>
                                                {conversion.departmentWise.reduce((best, dept) =>
                                                    dept.conversion > (best.conversion || 0) ? dept : best
                                                    , { department: 'N/A', conversion: 0 }).department}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                                {Math.max(...conversion.departmentWise.map(d => d.conversion || 0)).toFixed(1)}% conversion
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Total Applications</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.25rem 0' }}>
                                                {conversion.departmentWise.reduce((sum, dept) => sum + (dept.totalApps || 0), 0)}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Across all depts</div>
                                        </div>

                                        {/* Total Hires Card - FIXED */}
                                        <div style={{
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Total Hires</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.25rem 0' }}>
                                                {conversion.departmentWise.reduce((sum, dept) => sum + (dept.acceptedApps || dept.totalHired || 0), 0)}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Successful placements</div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Avg Conversion</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0.25rem 0' }}>
                                                {(conversion.departmentWise.reduce((sum, dept) => sum + (dept.conversion || 0), 0) /
                                                    conversion.departmentWise.length).toFixed(1)}%
                                            </div>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Department average</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: '3rem' }}>
                                    <p style={{ color: '#64748b' }}>No department data available</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AnalyticsPage;