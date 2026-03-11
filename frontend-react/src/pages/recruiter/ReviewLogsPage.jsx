import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import DailyLogCard from '../../components/logs/DailyLogCard';
import dailyLogService from '../../services/dailyLogService';
import '../../styles/StudentDashboard.css';

const ReviewLogsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [pendingLogs, setPendingLogs] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [userData, setUserData] = useState({
        name: 'Loading...',
        initials: '',
        department: '',
        company: 'Zoyaraa'
    });

    useEffect(() => {
        fetchUserProfile();
        fetchPendingLogs();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const user = data.data.user;
                const initials = user.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                setUserData({
                    name: user.fullName,
                    initials: initials,
                    department: user.department || '',
                    company: 'Zoyaraa'
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchPendingLogs = async () => {
        try {
            setLoading(true);
            const data = await dailyLogService.getPendingLogs();
            if (data.logs) {
                setPendingLogs(data.logs);
                if (data.logs.length > 0) {
                    setSelectedStudentId(data.logs[0].studentId._id);
                }
            }
        } catch (error) {
            console.error("Error fetching pending logs", error);
            showNotification('Failed to load pending logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Group logs by student
    const logsByStudent = pendingLogs.reduce((acc, log) => {
        const sId = log.studentId._id;
        if (!acc[sId]) {
            acc[sId] = {
                student: log.studentId,
                internship: log.internshipId,
                logs: []
            };
        }
        acc[sId].logs.push(log);
        return acc;
    }, {});

    const selectedStudentLogs = selectedStudentId && logsByStudent[selectedStudentId]
        ? logsByStudent[selectedStudentId].logs
        : [];

    const handleApprove = async (logId) => {
        if (!feedbackText.trim()) {
            showNotification('Please provide feedback for approval', 'warning');
            return;
        }

        try {
            setProcessing(true);
            setSelectedLogId(logId);
            
            await dailyLogService.approveLog(logId, {
                feedback: feedbackText,
                rating: feedbackRating
            });
            
            showNotification('Log approved successfully!', 'success');

            // Remove approved log from state
            setPendingLogs(prev => prev.filter(l => l._id !== logId));
            setFeedbackText('');
            setFeedbackRating(5);
            setSelectedLogId(null);

        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'Failed to approve log', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (logId) => {
        if (!feedbackText.trim()) {
            showNotification('Please provide a reason for rejection', 'error');
            return;
        }

        try {
            setProcessing(true);
            setSelectedLogId(logId);
            
            await dailyLogService.rejectLog(logId, feedbackText);
            showNotification('Log rejected', 'success');

            // Remove rejected log from state
            setPendingLogs(prev => prev.filter(l => l._id !== logId));
            setFeedbackText('');
            setSelectedLogId(null);

        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'Failed to reject log', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleRequestRevision = async (logId) => {
        if (!feedbackText.trim()) {
            showNotification('Please provide revision feedback', 'error');
            return;
        }

        try {
            setProcessing(true);
            setSelectedLogId(logId);
            
            await dailyLogService.addFeedback(logId, {
                comment: feedbackText,
                rating: feedbackRating,
                status: 'needs-revision'
            });
            
            showNotification('Revision requested', 'success');

            // Remove log from pending list
            setPendingLogs(prev => prev.filter(l => l._id !== logId));
            setFeedbackText('');
            setSelectedLogId(null);

        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'Failed to request revision', 'error');
        } finally {
            setProcessing(false);
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
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.textContent = message;
        notification.style.background = type === 'error'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : type === 'warning'
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="app-container">
            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Sidebar - EXACT SAME AS ALL OTHER PAGES */}
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
                    <div className="department-badge" style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        {userData.department || 'Mentor'}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${location.pathname === '/recruiter/dashboard' ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/dashboard')}
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
                        className={`nav-item ${location.pathname.includes('/recruiter/internships') ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/internships')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <span className="nav-item-text">Manage Internships</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname === '/recruiter/mentor-dashboard' ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/mentor-dashboard')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <span className="nav-item-text">Mentor Dashboard</span>
                    </button>

                    <button
                        className={`nav-item active`}
                        onClick={() => navigate('/recruiter/review-logs')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        <span className="nav-item-text">Review Logs</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname.includes('/recruiter/post-internship') ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/post-internship')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="nav-item-text">Post Internship</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname.includes('/recruiter/applicants') ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/applicants')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        <span className="nav-item-text">View Applicants</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname.includes('/recruiter/interviews') ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/interviews')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span className="nav-item-text">Interviews</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="user-profile-sidebar"
                        onClick={() => navigate('/recruiter/profile')}
                    >
                        <div className="user-avatar-sidebar">{userData.initials}</div>
                        <div className="user-info-sidebar">
                            <div className="user-name-sidebar">{userData.name}</div>
                            <div className="user-role-sidebar">
                                {userData.department} • {userData.company}
                            </div>
                        </div>
                    </button>
                </div>
            </aside>

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
                            Review Daily Logs
                            {userData.department && (
                                <span style={{ fontSize: '0.9rem', marginLeft: '1rem', color: '#666' }}>
                                    • {userData.department} Department
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
                    {/* Back Button */}
                    <div style={{ marginBottom: '1rem' }}>
                        <button
                            className="secondary-btn"
                            onClick={() => navigate('/recruiter/mentor-dashboard')}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClickCapture={(e) => createRippleEffect(e)}
                        >
                            ← Back to Mentor Dashboard
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-placeholder">Loading pending logs...</div>
                    ) : pendingLogs.length === 0 ? (
                        <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                            <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 12h8"></path>
                                </svg>
                            </div>
                            <h3>All Caught Up! 🎉</h3>
                            <p>There are no pending logs to review at the moment.</p>
                            <button
                                className="primary-btn"
                                onClick={() => navigate('/recruiter/mentor-dashboard')}
                                style={{ marginTop: '1rem' }}
                                onClickCapture={(e) => createRippleEffect(e)}
                            >
                                Return to Mentor Dashboard
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                            {/* Left Panel - Student List */}
                            <div style={{
                                width: '350px',
                                background: 'white',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                height: 'fit-content',
                                maxHeight: 'calc(100vh - 200px)',
                                overflowY: 'auto'
                            }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#1e293b' }}>
                                    Students with Pending Logs ({Object.keys(logsByStudent).length})
                                </h3>

                                {Object.values(logsByStudent).map(entry => (
                                    <div
                                        key={entry.student._id}
                                        style={{
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: `1px solid ${selectedStudentId === entry.student._id ? '#8b5cf6' : '#e2e8f0'}`,
                                            background: selectedStudentId === entry.student._id ? '#f5f3ff' : 'white',
                                            marginBottom: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => {
                                            setSelectedStudentId(entry.student._id);
                                            setFeedbackText('');
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{entry.student.fullName}</h4>
                                        <p style={{ margin: '0', color: '#64748b', fontSize: '0.85rem' }}>{entry.internship?.title || 'Internship'}</p>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            borderRadius: '50px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            marginTop: '8px'
                                        }}>
                                            {entry.logs.length} pending {entry.logs.length === 1 ? 'log' : 'logs'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Right Panel - Log Details */}
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                {selectedStudentLogs.map(log => (
                                    <div
                                        key={log._id}
                                        style={{
                                            background: 'white',
                                            borderRadius: '16px',
                                            padding: '30px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                            marginBottom: '20px'
                                        }}
                                    >
                                        <DailyLogCard log={log} />

                                        {/* Feedback Form */}
                                        <div style={{
                                            marginTop: '20px',
                                            background: '#f8fafc',
                                            padding: '20px',
                                            borderRadius: '12px'
                                        }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>
                                                Mentor Feedback {log.status === 'pending' ? '(Required for rejection/revision)' : ''}
                                            </label>
                                            <textarea
                                                rows="3"
                                                placeholder="Add specific, constructive feedback..."
                                                value={feedbackText}
                                                onChange={(e) => setFeedbackText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '8px',
                                                    marginBottom: '10px',
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'right' }}>
                                                {feedbackText.length}/500 characters
                                            </div>

                                            {/* Rating */}
                                            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>
                                                    Rating (1-5)
                                                </label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {[1, 2, 3, 4, 5].map(r => (
                                                        <button
                                                            key={r}
                                                            onClick={() => setFeedbackRating(r)}
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '50%',
                                                                border: feedbackRating === r ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                                                                background: feedbackRating === r ? '#f5f3ff' : 'white',
                                                                color: feedbackRating === r ? '#8b5cf6' : '#4b5563',
                                                                fontWeight: '600',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '15px',
                                            marginTop: '20px',
                                            paddingTop: '20px',
                                            borderTop: '1px solid #e2e8f0'
                                        }}>
                                            <button
                                                className="primary-btn"
                                                style={{
                                                    flex: 1,
                                                    background: '#10b981',
                                                    opacity: processing && selectedLogId === log._id ? 0.6 : 1
                                                }}
                                                onClick={() => handleApprove(log._id)}
                                                disabled={processing && selectedLogId === log._id}
                                                onClickCapture={(e) => createRippleEffect(e)}
                                            >
                                                {processing && selectedLogId === log._id ? 'Processing...' : 'Approve Log'}
                                            </button>
                                            <button
                                                className="secondary-btn"
                                                style={{
                                                    flex: 1,
                                                    background: '#fef2f2',
                                                    color: '#dc2626',
                                                    borderColor: '#fecaca'
                                                }}
                                                onClick={() => handleReject(log._id)}
                                                disabled={processing && selectedLogId === log._id}
                                                onClickCapture={(e) => createRippleEffect(e)}
                                            >
                                                Reject
                                            </button>
                                            <button
                                                className="secondary-btn"
                                                style={{
                                                    flex: 1,
                                                    background: '#fef3c7',
                                                    color: '#d97706',
                                                    borderColor: '#fde68a'
                                                }}
                                                onClick={() => handleRequestRevision(log._id)}
                                                disabled={processing && selectedLogId === log._id}
                                                onClickCapture={(e) => createRippleEffect(e)}
                                            >
                                                Request Revision
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReviewLogsPage;