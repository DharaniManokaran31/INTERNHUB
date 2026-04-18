// src/pages/hr/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [company, setCompany] = useState(null);
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        department: '',
        designation: '',
        phone: '',
        location: '',
        bio: '',
        initials: 'HR'
    });

    useEffect(() => {
        fetchProfile();
        fetchCompanyInfo();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const user = data.data?.user || data.user;
                const initials = (user.fullName || 'HR')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                setProfileData({
                    fullName: user.fullName || '',
                    email: user.email || '',
                    department: user.department || 'Administration',
                    designation: user.designation || 'HR Manager',
                    phone: user.phone || '',
                    location: user.location || 'Bangalore, India',
                    bio: user.bio || 'HR professional with experience in talent acquisition and team management.',
                    initials: initials,
                    joinedAt: user.createdAt || new Date().toISOString(),
                    companyId: user.companyId || null
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch('https://internhub-backend-d879.onrender.com/api/company/details', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setCompany(data.data.company);
                console.log('✅ Company data:', data.data.company);
            }
        } catch (error) {
            console.error('Error fetching company:', error);
            // Don't set error state - company info is optional
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: profileData.fullName,
                    phone: profileData.phone,
                    location: profileData.location,
                    bio: profileData.bio
                })
            });

            const data = await response.json();

            if (data.success) {
                setIsEditMode(false);
                setSuccess('Profile updated successfully!');

                // Update local storage name if needed
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.fullName = profileData.fullName;
                localStorage.setItem('user', JSON.stringify(user));

                // Refresh profile data
                await fetchProfile();

                // Auto-hide success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
                        className="user-profile-sidebar active"
                        onClick={() => navigate('/hr/profile')}
                    >
                        <div className="user-avatar-sidebar">{profileData.initials}</div>
                        <div className="user-info-sidebar">
                            <div className="user-name-sidebar">{profileData.fullName || 'HR Manager'}</div>
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
                            My Profile
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
                    {/* Error/Success Messages */}
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

                    {success && (
                        <div className="section" style={{
                            background: '#d1fae5',
                            border: '1px solid #10b981',
                            color: '#065f46',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            borderRadius: '8px'
                        }}>
                            {success}
                        </div>
                    )}

                    {/* Profile Header */}
                    <div className="welcome-section" style={{
                        background: 'linear-gradient(135deg, #2440F0, #7c3aed)',
                        padding: '2rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                background: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2440F0',
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }}>
                                {profileData.initials}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>{profileData.fullName || 'HR Manager'}</h1>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                        </svg>
                                        <span>{profileData.designation}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span>{profileData.department}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Information Card - NEW */}
                    {company && (
                        <section className="section" style={{ marginBottom: '2rem' }}>
                            <h2 className="section-title">Company Information</h2>
                            <div className="title-underline"></div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2rem',
                                marginTop: '1.5rem',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #2440F0, #7c3aed)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '2rem',
                                    fontWeight: 'bold'
                                }}>
                                    Z
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', color: '#1e293b' }}>{company.name}</h3>
                                    <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>{company.description}</p>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '1rem',
                                        marginTop: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                            <span style={{ fontSize: '0.9rem' }}>{company.email}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                            </svg>
                                            <span style={{ fontSize: '0.9rem' }}>{company.phone}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                            <span style={{ fontSize: '0.9rem' }}>
                                                {company.address?.city}, {company.address?.state}, {company.address?.country}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                            </svg>
                                            <span style={{ fontSize: '0.9rem' }}>{company.website}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Company Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '1rem',
                                marginTop: '2rem',
                                padding: '1rem',
                                background: '#f8fafc',
                                borderRadius: '12px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2440F0' }}>{company.size}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Company Size</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2440F0' }}>{company.foundedYear}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Founded</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2440F0' }}>{company.departments?.length || 8}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Departments</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#2440F0' }}>Active</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Action Buttons */}
                    <div className="action-buttons" style={{ marginBottom: '2rem' }}>
                        {!isEditMode ? (
                            <button
                                className="primary-btn"
                                onClick={(e) => { createRippleEffect(e); setIsEditMode(true); }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                </svg>
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button
                                    className="primary-btn"
                                    onClick={(e) => { createRippleEffect(e); handleSave(); }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="loading-spinner-small" style={{ marginRight: '0.5rem' }}></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                                <path d="M20 6L9 17l-5-5"></path>
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button
                                    className="secondary-btn"
                                    onClick={() => setIsEditMode(false)}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>

                    {/* Profile Details Grid */}
                    <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Left Column */}
                        <section className="section">
                            <h2 className="section-title">Personal Information</h2>
                            <div className="title-underline"></div>

                            <div style={{ marginTop: '1.5rem' }}>
                                {/* Full Name */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Full Name
                                    </label>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ width: '100%', padding: '0.75rem' }}
                                            value={profileData.fullName}
                                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{profileData.fullName || 'Not provided'}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Email Address
                                    </label>
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{profileData.email}</p>
                                    <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Login email cannot be changed</small>
                                </div>

                                {/* Phone */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Phone Number
                                    </label>
                                    {isEditMode ? (
                                        <input
                                            type="tel"
                                            className="form-input"
                                            style={{ width: '100%', padding: '0.75rem' }}
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            placeholder="Enter your phone number"
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{profileData.phone || 'Not provided'}</p>
                                    )}
                                </div>

                                {/* Location */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Location
                                    </label>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ width: '100%', padding: '0.75rem' }}
                                            value={profileData.location}
                                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                            placeholder="City, Country"
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{profileData.location}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Right Column */}
                        <section className="section">
                            <h2 className="section-title">Work Information</h2>
                            <div className="title-underline"></div>

                            <div style={{ marginTop: '1.5rem' }}>
                                {/* Department */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Department
                                    </label>
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{profileData.department}</p>
                                </div>

                                {/* Designation */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Designation
                                    </label>
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{profileData.designation}</p>
                                </div>

                                {/* Joined Date */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Joined Date
                                    </label>
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>{formatDate(profileData.joinedAt)}</p>
                                </div>

                                {/* Bio */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#64748b',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Bio
                                    </label>
                                    {isEditMode ? (
                                        <textarea
                                            className="form-input"
                                            style={{ width: '100%', padding: '0.75rem', minHeight: '100px' }}
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            placeholder="Tell us about yourself..."
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.6' }}>{profileData.bio}</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Account Stats */}
                    <section className="section" style={{ marginTop: '2rem' }}>
                        <h2 className="section-title">Account Statistics</h2>
                        <div className="title-underline"></div>

                        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <div className="stat-label">Account Type</div>
                                    <div className="stat-value" style={{ fontSize: '1rem', color: '#2440F0' }}>HR Administrator</div>
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
                                    <div className="stat-label">Member Since</div>
                                    <div className="stat-value" style={{ fontSize: '1rem' }}>{formatDate(profileData.joinedAt)}</div>
                                </div>
                                <div className="stat-icon green">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <div className="stat-label">Last Active</div>
                                    <div className="stat-value" style={{ fontSize: '1rem' }}>Today</div>
                                </div>
                                <div className="stat-icon orange">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 6v6l4 2"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;