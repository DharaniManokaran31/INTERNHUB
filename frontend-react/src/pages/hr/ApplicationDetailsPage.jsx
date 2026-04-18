// src/pages/hr/ApplicationDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import FeedbackModal from '../../components/modals/FeedbackModal';

const ApplicationDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState(null);
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [interview, setInterview] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    useEffect(() => {
        fetchProfile();
        if (id) {
            fetchApplicationDetails();
        }
    }, [id]);

    const fetchProfile = async () => {
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

    const fetchApplicationDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`http://localhost:5000/api/hr/applications/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                console.log('Application data:', data.data.application);
                setApplication(data.data.application);
                
                // Fetch interview if shortlised/interview stage
                try {
                    const token = localStorage.getItem('authToken');
                    const interviewRes = await fetch(`http://localhost:5000/api/interviews/application/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const interviewData = await interviewRes.json();
                    if (interviewData.success) {
                        setInterview(interviewData.data.interview);
                    }
                } catch (intErr) {
                    console.log('No interview found or error fetching interview');
                }
            } else {
                setError('Application not found.');
            }
        } catch (err) {
            console.error('Error fetching application:', err);
            setError('Failed to load application details.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this application?`)) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`http://localhost:5000/api/hr/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();

            if (data.success) {
                showNotification(`Application ${newStatus} successfully!`, 'success');
                await fetchApplicationDetails();
            } else {
                showNotification(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleScheduleSubmit = async (interviewData) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken');

            // If interview exists, we are scheduling a round in existing interview document
            if (interview) {
                const response = await fetch(`http://localhost:5000/api/interviews/hr/${interview._id}/schedule`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(interviewData)
                });
                const res = await response.json();
    
                if (res.success) {
                    setShowScheduleModal(false);
                    showNotification('Interview scheduled successfully!', 'success');
                    await fetchApplicationDetails();
                } else {
                    showNotification(res.message || 'Failed to schedule interview', 'error');
                }
            } else {
                // Legacy fallback if interview document doesn't exist (should not happen with new flow)
                const response = await fetch(`http://localhost:5000/api/hr/applications/${id}/schedule-interview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(interviewData)
                });
                const res = await response.json();
    
                if (res.success) {
                    setShowScheduleModal(false);
                    showNotification('Interview scheduled successfully!', 'success');
                    await fetchApplicationDetails();
                } else {
                    showNotification(res.message || 'Failed to schedule interview', 'error');
                }
            }
        } catch (err) {
            console.error('Error scheduling:', err);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFeedbackSubmit = async (feedbackData) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`http://localhost:5000/api/interviews/hr/${interview._id}/result`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(feedbackData)
            });

            const res = await response.json();

            if (res.success) {
                setShowFeedbackModal(false);
                showNotification('Feedback submitted successfully!', 'success');
                await fetchApplicationDetails();
            } else {
                showNotification(res.message || 'Failed to submit feedback', 'error');
            }
        } catch (err) {
            console.error('Error submitting feedback:', err);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddNote = async () => {
        const note = prompt('Enter your note:');
        if (!note) return;

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`http://localhost:5000/api/hr/applications/${id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note })
            });
            const data = await response.json();

            if (data.success) {
                showNotification('Note added successfully!', 'success');
                await fetchApplicationDetails();
            }
        } catch (err) {
            console.error('Error adding note:', err);
            showNotification('Failed to add note', 'error');
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

    const cleanUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('/uploads')) {
            return `http://localhost:5000${url}`;
        }
        return url;
    };

    const handleViewResume = (url) => {
        if (!url) {
            showNotification('No resume available', 'error');
            return;
        }
        window.open(cleanUrl(url), '_blank');
    };

    const handleViewCertificate = (url) => {
        if (!url) {
            showNotification('No certificate file available', 'error');
            return;
        }
        window.open(cleanUrl(url), '_blank');
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { class: 'badge-warning', text: 'Pending', color: '#f59e0b', bg: '#fef3c7' };
            case 'shortlisted':
                return { class: 'badge-info', text: 'Shortlisted', color: '#3b82f6', bg: '#dbeafe' };
            case 'accepted':
                return { class: 'badge-success', text: 'Accepted', color: '#10b981', bg: '#d1fae5' };
            case 'rejected':
                return { class: 'badge-error', text: 'Rejected', color: '#ef4444', bg: '#fee2e2' };
            default:
                return { class: 'badge-info', text: status?.toUpperCase() || 'UNKNOWN', color: '#6b7280', bg: '#f3f4f6' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    // Safely access student data
    const student = application?.studentId || application?.student || {};
    const internship = application?.internshipId || application?.internship || {};
    const recruiter = application?.recruiterId || {};

    const studentName = student.fullName || student.name || 'Unknown Student';
    const studentEmail = student.email || 'Email not available';
    const studentPhone = student.phone || 'Not provided';
    const studentLocation = student.location || 'Not specified';
    const studentCollege = student.currentEducation?.college || student.education?.college || 'Not specified';
    const studentCourse = student.currentEducation?.course || student.education?.course || 'Not specified';
    const studentYear = student.currentEducation?.yearOfStudy || 'Not specified';
    
    // Use categorized skills if available, otherwise fallback to top-level skills
    const resumeSkills = student.resume?.skills || [];
    const topLevelSkills = student.skills || [];
    const studentSkills = topLevelSkills;

    const timeline = application?.timeline
        ? [...application.timeline]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            // Deduplicate: same status and similar time (within 1 min)
            .filter((item, index, self) => 
                index === 0 || 
                item.status !== self[index-1].status || 
                Math.abs(new Date(item.updatedAt) - new Date(self[index-1].updatedAt)) > 60000
            )
        : [];

    const status = application ? getStatusBadge(application.status) : null;

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
                            Application Review
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
                        onClick={(e) => { createRippleEffect(e); navigate('/hr/applicants'); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Applications
                    </button>

                    {application ? (
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
                                            {studentName}
                                        </h1>
                                        <p style={{ fontSize: '1rem', opacity: '0.9', marginBottom: '0.5rem' }}>
                                            {studentEmail} • {studentPhone}
                                        </p>
                                        <p style={{ fontSize: '0.9rem', opacity: '0.8', margin: 0 }}>
                                            Applied for: <strong>{internship.title || 'Internship'}</strong> • {internship.department || 'Department'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        <span className={`badge ${status.class}`} style={{
                                            background: status.bg,
                                            color: status.color,
                                            fontSize: '1rem',
                                            padding: '0.5rem 1.5rem'
                                        }}>
                                            {status.text}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                                            Applied on {formatDate(application.appliedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                <div className="stat-card">
                                    <div className="stat-info">
                                        <div className="stat-label">College</div>
                                        <div className="stat-value" style={{ fontSize: '1rem' }}>{studentCollege}</div>
                                    </div>
                                    <div className="stat-icon blue">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        </svg>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-info">
                                        <div className="stat-label">Course</div>
                                        <div className="stat-value" style={{ fontSize: '1rem' }}>{studentCourse}</div>
                                    </div>
                                    <div className="stat-icon green">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                        </svg>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-info">
                                        <div className="stat-label">Year</div>
                                        <div className="stat-value" style={{ fontSize: '1rem' }}>{studentYear}</div>
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
                                        <div className="stat-label">Location</div>
                                        <div className="stat-value" style={{ fontSize: '1rem' }}>{studentLocation}</div>
                                    </div>
                                    <div className="stat-icon purple">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="action-buttons" style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
                                <button
                                    className={`secondary-btn ${activeTab === 'profile' ? 'active' : ''}`}
                                    style={{
                                        borderBottom: activeTab === 'profile' ? '3px solid #2440F0' : 'none',
                                        borderRadius: '0',
                                        color: activeTab === 'profile' ? '#2440F0' : '#64748b',
                                        fontWeight: activeTab === 'profile' ? '600' : '500'
                                    }}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    Profile & Cover Letter
                                </button>
                                <button
                                    className={`secondary-btn ${activeTab === 'resume' ? 'active' : ''}`}
                                    style={{
                                        borderBottom: activeTab === 'resume' ? '3px solid #2440F0' : 'none',
                                        borderRadius: '0',
                                        color: activeTab === 'resume' ? '#2440F0' : '#64748b',
                                        fontWeight: activeTab === 'resume' ? '600' : '500'
                                    }}
                                    onClick={() => setActiveTab('resume')}
                                >
                                    Resume & Skills
                                </button>
                                <button
                                    className={`secondary-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                                    style={{
                                        borderBottom: activeTab === 'timeline' ? '3px solid #2440F0' : 'none',
                                        borderRadius: '0',
                                        color: activeTab === 'timeline' ? '#2440F0' : '#64748b',
                                        fontWeight: activeTab === 'timeline' ? '600' : '500'
                                    }}
                                    onClick={() => setActiveTab('timeline')}
                                >
                                    Timeline & Notes
                                </button>
                                <button
                                    className={`secondary-btn ${activeTab === 'interviews' ? 'active' : ''}`}
                                    style={{
                                        borderBottom: activeTab === 'interviews' ? '3px solid #2440F0' : 'none',
                                        borderRadius: '0',
                                        color: activeTab === 'interviews' ? '#2440F0' : '#64748b',
                                        fontWeight: activeTab === 'interviews' ? '600' : '500'
                                    }}
                                    onClick={() => setActiveTab('interviews')}
                                >
                                    Interview Rounds
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'profile' && (
                                <div className="two-column-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                                    {/* Left Column - Cover Letter */}
                                    <section className="section">
                                        <h2 className="section-title">Cover Letter</h2>
                                        <div className="title-underline"></div>
                                        <div style={{
                                            background: '#f8fafc',
                                            padding: '2rem',
                                            borderRadius: '12px',
                                            marginTop: '1rem',
                                            lineHeight: '1.8',
                                            color: '#334155',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {application.coverLetter || "No cover letter provided."}
                                        </div>

                                        <h2 className="section-title" style={{ marginTop: '2rem' }}>Submitted Resume</h2>
                                        <div className="title-underline"></div>
                                        {application.submittedResume ? (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '1rem',
                                                background: '#f8fafc',
                                                borderRadius: '8px',
                                                marginTop: '1rem'
                                            }}>
                                                <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                    </svg>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600' }}>{application.submittedResume.fileName}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                        Uploaded {formatDate(application.submittedResume.uploadedAt)}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleViewResume(application.submittedResume?.url || student.resume?.resumeFile)}
                                                    className="secondary-btn"
                                                    style={{ padding: '0.5rem 1rem' }}
                                                >
                                                    View Resume
                                                </button>
                                            </div>
                                        ) : (
                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No resume submitted</p>
                                        )}
                                    </section>

                                    {/* Right Column - Actions */}
                                    {/* Quick Actions */}
                                    <section className="section">
                                        <h2 className="section-title">Quick Actions</h2>
                                        <div className="title-underline"></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>

                                            {/* Accept Button */}
                                            {/* Context-aware Actions */}
                                            {application.status !== 'accepted' && application.status !== 'rejected' ? (
                                                <>
                                                    <button 
                                                        className="primary-btn" 
                                                        style={{ width: '100%', marginBottom: '1rem', background: '#10b981', justifyContent: 'center' }}
                                                        onClick={() => handleStatusUpdate('accepted')}
                                                        disabled={submitting}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                        Final Selection
                                                    </button>

                                                    <button 
                                                        className="secondary-btn" 
                                                        style={{ width: '100%', marginBottom: '1rem', justifyContent: 'center' }}
                                                        onClick={() => setShowScheduleModal(true)}
                                                        disabled={submitting}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                        Schedule Interview
                                                    </button>

                                                    <button 
                                                        className="secondary-btn" 
                                                        style={{ width: '100%', marginBottom: '1rem', color: '#dc2626', borderColor: '#fee2e2', justifyContent: 'center' }}
                                                        onClick={() => handleStatusUpdate('rejected')}
                                                        disabled={submitting}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <line x1="15" y1="9" x2="9" y2="15"></line>
                                                            <line x1="9" y1="9" x2="15" y2="15"></line>
                                                        </svg>
                                                        Reject Application
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ 
                                                    padding: '1rem', 
                                                    background: application.status === 'accepted' ? '#d1fae5' : '#fee2e2', 
                                                    color: application.status === 'accepted' ? '#065f46' : '#991b1b',
                                                    borderRadius: '8px',
                                                    marginBottom: '1rem',
                                                    textAlign: 'center',
                                                    fontWeight: '600'
                                                }}>
                                                    Process Completed: {application.status.toUpperCase()}
                                                </div>
                                            )}

                                            <button
                                                className="secondary-btn"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                                onClick={handleAddNote}
                                                disabled={submitting}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                                                    <path d="M12 5v14M5 12h14"></path>
                                                </svg>
                                                Add Note
                                            </button>
                                        </div>

                                        <h2 className="section-title" style={{ marginTop: '2rem' }}>Application Stats</h2>
                                        <div className="title-underline"></div>
                                        <div style={{ marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ color: '#64748b' }}>Days Since Applied</span>
                                                <span style={{ fontWeight: '600' }}>{Math.ceil((new Date() - new Date(application.appliedAt)) / (1000 * 60 * 60 * 24))} days</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ color: '#64748b' }}>Status Timeline</span>
                                                <span style={{ fontWeight: '600' }}>{application.timeline?.length || 0} updates</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#64748b' }}>Certificate Recommended</span>
                                                <span style={{ fontWeight: '600', color: application.certificateRecommended ? '#10b981' : '#64748b' }}>
                                                    {application.certificateRecommended ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'resume' && (
                                <div className="two-column-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                                    {/* Left Column - Detailed Skills & Education */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <section className="section">
                                            {/* Processed Skills from Resume Categories */}
                                            {resumeSkills.length > 0 && (
                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#1e293b', fontWeight: '600' }}>Skill Categories</h3>
                                                    <div className="applications-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                                                        {resumeSkills.map((category, idx) => (
                                                            <div key={idx} className="application-card" style={{ padding: '1rem' }}>
                                                                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                                                                    {category.category}
                                                                </h4>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                    {category.items?.map((skill, i) => (
                                                                        <span key={i} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{skill}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* General Skills / All Skills */}
                                            {(topLevelSkills.length > 0 || (resumeSkills.length === 0 && studentSkills.length > 0)) && (
                                                <div>
                                                    <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#1e293b', fontWeight: '600' }}>
                                                        {resumeSkills.length > 0 ? "Additional Skills" : "Technical Skills"}
                                                    </h3>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {[...new Set([...topLevelSkills, ...studentSkills])].map((skill, index) => (
                                                            <span key={index} className="badge badge-info" style={{ padding: '0.4rem 0.8rem' }}>
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {resumeSkills.length === 0 && topLevelSkills.length === 0 && studentSkills.length === 0 && (
                                                <p style={{ color: '#64748b', fontStyle: 'italic' }}>No skills listed</p>
                                            )}
                                        </section>

                                        <section className="section">
                                            <h2 className="section-title">Academic Background</h2>
                                            <div className="title-underline"></div>
                                            {student.resume?.education && student.resume.education.length > 0 ? (
                                                <div style={{ marginTop: '1rem' }}>
                                                    {student.resume.education.map((edu, idx) => (
                                                        <div key={idx} style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #2440F0' }}>
                                                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>{edu.degree} in {edu.field}</div>
                                                            <div style={{ color: '#475569', marginTop: '0.25rem', fontWeight: '500' }}>{edu.institution}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                                                                <span>📅 {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}</span>
                                                                {edu.gpa && <span>🎯 GPA: {edu.gpa}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : student.currentEducation ? (
                                                <div style={{ marginTop: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #2440F0' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>{student.currentEducation.college}</div>
                                                    <div style={{ color: '#475569', marginTop: '0.25rem' }}>{student.currentEducation.course} - {student.currentEducation.department}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>{student.currentEducation.yearOfStudy}</div>
                                                </div>
                                            ) : (
                                                <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '1rem' }}>No education details available</p>
                                            )}
                                        </section>
                                    </div>

                                    {/* Right Column - Certifications & Experience Summary */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <section className="section">
                                            <h2 className="section-title">Certifications</h2>
                                            <div className="title-underline"></div>
                                            {student.resume?.certifications && student.resume.certifications.length > 0 ? (
                                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {student.resume.certifications.map((cert, index) => (
                                                        <div key={index} className="application-card" style={{ padding: '0.75rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cert.name}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cert.issuer}</div>
                                                                </div>
                                                                {cert.certificateUrl && (
                                                                    <button 
                                                                        onClick={() => handleViewCertificate(cert.certificateUrl)}
                                                                        className="secondary-btn"
                                                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                                                    >
                                                                        View
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '1rem' }}>No certifications</p>
                                            )}
                                        </section>

                                        <section className="section">
                                            <h2 className="section-title">Projects</h2>
                                            <div className="title-underline"></div>
                                            {student.resume?.projects && student.resume.projects.length > 0 ? (
                                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {student.resume.projects.map((project, index) => (
                                                        <div key={index} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{project.title}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{project.technologies}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ color: '#64748b', fontStyle: 'italic', marginTop: '1rem' }}>No projects listed</p>
                                            )}
                                        </section>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'timeline' && (
                                <section className="section">
                                    <h2 className="section-title">Application Timeline</h2>
                                    <div className="title-underline"></div>
                                    <div className="recent-applications-list" style={{ marginTop: '1.5rem' }}>
                                        {timeline.length > 0 ? (
                                            timeline.map((event, index) => (
                                                <div key={index} className="recent-application-card" style={{
                                                    borderLeft: `4px solid ${event.status === 'accepted' ? '#10b981' :
                                                            event.status === 'rejected' ? '#ef4444' :
                                                                event.status === 'shortlisted' ? '#3b82f6' :
                                                                    '#f59e0b'
                                                        }`,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                    marginBottom: '1rem',
                                                    padding: '1.25rem'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <span className={`badge ${event.status === 'accepted' ? 'badge-success' :
                                                                    event.status === 'rejected' ? 'badge-error' :
                                                                        event.status === 'shortlisted' ? 'badge-info' :
                                                                            'badge-warning'
                                                                }`} style={{ marginBottom: '0.75rem', padding: '0.25rem 0.75rem' }}>
                                                                {event.status.toUpperCase()}
                                                            </span>
                                                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                                                {event.status === 'accepted' ? 'Candidate Hired' : 
                                                                 event.status === 'rejected' ? 'Application Rejected' :
                                                                 event.status === 'shortlisted' ? 'Candidate Shortlisted' :
                                                                 'Application Submitted'}
                                                            </div>
                                                            {event.comment && (
                                                                <p style={{ margin: '0.25rem 0', color: '#475569', fontSize: '0.95rem' }}>{event.comment}</p>
                                                            )}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                                </svg>
                                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                    {formatDate(event.updatedAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <p style={{ color: '#64748b', fontStyle: 'italic' }}>No timeline events recorded yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    <h2 className="section-title" style={{ marginTop: '2rem' }}>Recruiter Notes</h2>
                                    <div className="title-underline"></div>
                                    <div className="recent-applications-list" style={{ marginTop: '1rem' }}>
                                        {application.recruiterNotes && application.recruiterNotes.length > 0 ? (
                                            application.recruiterNotes.map((note, index) => (
                                                <div key={index} className="recent-application-card">
                                                    <p style={{ margin: '0 0 0.5rem', color: '#475569' }}>{note.note}</p>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                        Added {formatDate(note.addedAt)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No notes yet</p>
                                        )}
                                    </div>
                                </section>
                            )}

                            {activeTab === 'interviews' && (
                                <section className="section">
                                    <h2 className="section-title">Interview Rounds</h2>
                                    <div className="title-underline"></div>
                                    <div style={{ marginTop: '1rem' }}>
                                        {interview ? (
                                            interview.rounds && interview.rounds.length > 0 ? (
                                                <div className="applications-grid">
                                                    {interview.rounds.map((round) => (
                                                        <div key={round._id} className="application-card" style={{ borderLeft: `4px solid ${round.status === 'completed' ? (round.result === 'pass' ? '#10b981' : '#ef4444') : round.status === 'scheduled' ? '#3b82f6' : '#f59e0b'}` }}>
                                                            <div className="app-card-header">
                                                                <div className="app-details">
                                                                    <h3 className="app-title">Round {round.roundNumber}: {round.roundType}</h3>
                                                                    <div className="app-meta">
                                                                        <span className="app-meta-item">Status: {round.status.toUpperCase()}</span>
                                                                        {round.status === 'scheduled' && (
                                                                            <span className="app-meta-item">
                                                                                📅 {formatDate(round.scheduledDate)} at {round.scheduledTime}
                                                                            </span>
                                                                        )}
                                                                        {round.status === 'completed' && (
                                                                            <span className="app-meta-item">
                                                                                Result: {round.result?.toUpperCase()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {round.status === 'completed' && round.feedback && (
                                                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                                                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Feedback Summary</h4>
                                                                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>{round.feedback.overallImpression}</p>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                        <span className="badge badge-info" style={{ background: '#e0e7ff', color: '#4338ca' }}>Score: {round.score}/100</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="app-card-footer" style={{ marginTop: '1rem' }}>
                                                                {round.roundType === 'HR Interview' && round.status === 'pending' && round.roundNumber === interview.currentRound && (
                                                                    <button
                                                                        className="primary-btn"
                                                                        onClick={() => {
                                                                            setSelectedRound(round);
                                                                            setShowScheduleModal(true);
                                                                        }}
                                                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                                    >
                                                                        Schedule HR Interview
                                                                    </button>
                                                                )}
                                                                
                                                                {round.roundType === 'HR Interview' && round.status === 'scheduled' && (
                                                                    <button
                                                                        className="secondary-btn"
                                                                        onClick={() => {
                                                                            setSelectedRound(round);
                                                                            setShowFeedbackModal(true);
                                                                        }}
                                                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                                    >
                                                                        Submit Feedback / Result
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ color: '#64748b', fontStyle: 'italic' }}>No interview rounds generated yet.</p>
                                            )
                                        ) : (
                                            <div className="empty-state">
                                                <div className="empty-state-icon">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    </svg>
                                                </div>
                                                <h3>No Interviews Scheduled</h3>
                                                <p>This candidate has not started the interview process yet.</p>
                                            </div>
                                        )}
                                    </div>
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
                            <h3>Application not found</h3>
                            <p>The application you're looking for doesn't exist or has been removed.</p>
                            <button
                                className="primary-btn"
                                onClick={() => navigate('/hr/applicants')}
                            >
                                Back to Applications
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Schedule Interview Modal */}
            {showScheduleModal && (
                <ScheduleInterviewModal
                    round={selectedRound || {
                        roundNumber: (application?.interviews?.length || 0) + 1,
                        roundType: 'HR Interview'
                    }}
                    onClose={() => {
                        setShowScheduleModal(false);
                        setSelectedRound(null);
                    }}
                    onSubmit={handleScheduleSubmit}
                />
            )}

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <FeedbackModal
                    interview={interview}
                    round={selectedRound}
                    onClose={() => {
                        setShowFeedbackModal(false);
                        setSelectedRound(null);
                    }}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
        </div>
    );
};

export default ApplicationDetailsPage;