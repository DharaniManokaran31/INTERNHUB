// src/pages/recruiter/MentorDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import '../../styles/StudentDashboard.css';

const MentorDashboardPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState({
        profile: true,
        mentees: true,
        stats: true
    });
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(3);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Fetch mentor data after profile is loaded
    useEffect(() => {
        if (userData.name !== 'Loading...') {
            fetchMentorData();
        }
    }, [userData]);

    // Update greeting based on time
    useEffect(() => {
        const hour = new Date().getHours();
        const firstName = userData.name.split(' ')[0] || 'Mentor';
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
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const user = data.data.user;
                const fullName = user.fullName || user.name || '';
                const initials = fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'M';

                setUserData({
                    name: fullName,
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
            showNotification('Failed to load profile', 'error');
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    };

    const fetchMentorData = async () => {
        try {
            setLoading(prev => ({ ...prev, mentees: true, stats: true }));
            const token = localStorage.getItem('authToken');

            // Fetch mentor stats & mentees (all-in-one)

            // Fetch mentor stats & mentees
            const statsResponse = await fetch('https://internhub-backend-d870.onrender.com/api/progress/mentor/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsData = await statsResponse.json();
            console.log('📊 Stats API Response:', statsData);

            if (statsData.success) {
                const fetchedMentees = statsData.data?.mentees || [];
                
                // Map the mentees from the stats response directly
                setMentees(fetchedMentees.map(m => ({
                    ...m.student,
                    internship: m.internship,
                    stats: m.stats,
                    progressPercentage: m.stats.progress
                })));

                setStats({
                    totalMentees: statsData.data?.totalMentees || 0,
                    pendingReviews: statsData.data?.pendingReviews || 0,
                    pendingInterviews: statsData.data?.pendingInterviews || 0,
                    approvedToday: statsData.data?.approvedToday || 0,
                    avgHoursPerDay: statsData.data?.avgHoursPerDay || 0
                });

                setTotalPages(Math.ceil(fetchedMentees.length / itemsPerPage));
            }

        } catch (error) {
            console.error('❌ Error fetching mentor data:', error);
            showNotification('Failed to load mentor data', 'error');
        } finally {
            setLoading(prev => ({ ...prev, mentees: false, stats: false }));
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
        // Remove existing notifications
        document.querySelectorAll('.custom-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #2440F0, #0B1DC1)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 0.9375rem;
            font-weight: 500;
        `;
        notification.textContent = message;
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

    // Calculate progress percentage from multiple sources
    const getProgressPercentage = (mentee) => {
        // Source 0: From current mapping
        if (mentee.progressPercentage !== undefined) {
            return mentee.progressPercentage;
        }

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
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        document.querySelector('.mentees-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMentees = mentees.slice(indexOfFirstItem, indexOfLastItem);
    const isLoading = loading.mentees || loading.stats;

    return (
        <div className="app-container">
            <RecruiterSidebar 
                isOpen={isMobileMenuOpen} 
                setIsOpen={setIsMobileMenuOpen} 
                userData={userData} 
            />

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
                                <span style={{ 
                                    fontSize: '0.9rem', 
                                    marginLeft: '1rem', 
                                    color: '#666',
                                    background: '#EEF2FF',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px'
                                }}>
                                    {userData.department} Department
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

                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '400px',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div className="loading-spinner"></div>
                            <p style={{ color: '#666' }}>Loading mentor dashboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#4b5563', marginBottom: '1rem' }}>
                                    Mentor Overview
                                </h3>
                                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
                                            <div className="stat-label">Pending Interviews</div>
                                            <div className="stat-value">{stats.pendingInterviews || 0}</div>
                                        </div>
                                        <div className="stat-icon purple">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-info">
                                            <div className="stat-label">Avg Daily Hours</div>
                                            <div className="stat-value">{stats.avgHoursPerDay}h</div>
                                        </div>
                                        <div className="stat-icon teal">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <h2 className="section-title">Your Assigned Mentees</h2>
                                    {mentees.length > 0 && (
                                        <button
                                            className="secondary-btn"
                                            onClick={() => navigate('/recruiter/mentees')}
                                            style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                                        >
                                            View All ({mentees.length})
                                        </button>
                                    )}
                                </div>

                                {mentees.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '3rem' }}>
                                        <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                            </svg>
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Mentees Assigned</h3>
                                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                                            You haven't been assigned as a mentor for any active internships yet.
                                        </p>
                                        <button
                                            className="primary-btn"
                                            onClick={() => navigate('/recruiter/applicants')}
                                            style={{ padding: '0.75rem 2rem' }}
                                        >
                                            View Applicants
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mentees-list">
                                            {currentMentees.map((mentee) => {
                                                const progressPercentage = getProgressPercentage(mentee);
                                                const displayProgress = mentee.internship?.status === 'completed' ? 'Completed' : 
                                                                      (progressPercentage >= 100 ? '100% Complete' : `${Number(progressPercentage).toFixed(2)}% Active`);
                                                
                                                return (
                                                    <div 
                                                        key={mentee._id} 
                                                        className="recent-application-card" 
                                                        style={{ 
                                                            cursor: 'pointer',
                                                            background: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '12px',
                                                            padding: '1.5rem',
                                                            marginBottom: '1rem',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                        }}
                                                        onClick={() => navigate(`/recruiter/intern-progress/${mentee._id}`)}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'flex-start',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                                                                {mentee.fullName || 'Unknown Student'}
                                                            </h4>
                                                            <span style={{
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '20px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '600',
                                                                background: (progressPercentage >= 100 || mentee.internship?.status === 'completed') ? '#E6F7E6' : '#EEF2FF',
                                                                color: (progressPercentage >= 100 || mentee.internship?.status === 'completed') ? '#10b981' : '#2440F0'
                                                            }}>
                                                                {displayProgress}
                                                            </span>
                                                        </div>
                                                        
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            color: '#4b5563',
                                                            fontSize: '0.875rem',
                                                            marginBottom: '1rem'
                                                        }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                            </svg>
                                                            {mentee.internship?.title || 'Internship'} • {mentee.currentEducation?.department || 'N/A'}
                                                        </div>
                                                        
                                                        {/* Progress Bar */}
                                                        <div style={{ marginBottom: '1rem' }}>
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

                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            fontSize: '0.875rem',
                                                            color: '#6b7280'
                                                        }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginTop: '2rem',
                                                marginBottom: '1rem'
                                            }}>
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        background: currentPage === 1 ? '#f3f4f6' : 'white',
                                                        color: currentPage === 1 ? '#9ca3af' : '#1f2937',
                                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="15 18 9 12 15 6"></polyline>
                                                    </svg>
                                                    Previous
                                                </button>

                                                {[...Array(totalPages)].map((_, index) => {
                                                    const pageNumber = index + 1;
                                                    if (
                                                        pageNumber === 1 ||
                                                        pageNumber === totalPages ||
                                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNumber}
                                                                onClick={() => handlePageChange(pageNumber)}
                                                                style={{
                                                                    padding: '0.5rem 1rem',
                                                                    border: '1px solid #d1d5db',
                                                                    borderRadius: '6px',
                                                                    background: currentPage === pageNumber ? '#2440F0' : 'white',
                                                                    color: currentPage === pageNumber ? 'white' : '#1f2937',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: '500',
                                                                    minWidth: '40px'
                                                                }}
                                                            >
                                                                {pageNumber}
                                                            </button>
                                                        );
                                                    } else if (
                                                        pageNumber === currentPage - 2 ||
                                                        pageNumber === currentPage + 2
                                                    ) {
                                                        return <span key={pageNumber} style={{ color: '#9ca3af' }}>...</span>;
                                                    }
                                                    return null;
                                                })}

                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        background: currentPage === totalPages ? '#f3f4f6' : 'white',
                                                        color: currentPage === totalPages ? '#9ca3af' : '#1f2937',
                                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    Next
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="9 18 15 12 9 6"></polyline>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {/* Items per page info */}
                                        {mentees.length > 0 && (
                                            <div style={{
                                                textAlign: 'center',
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginTop: '0.5rem'
                                            }}>
                                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, mentees.length)} of {mentees.length} mentees
                                            </div>
                                        )}
                                    </>
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