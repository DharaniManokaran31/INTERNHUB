// src/pages/recruiter/ReviewLogsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import dailyLogService from '../../services/dailyLogService';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import DailyLogCard from '../../components/logs/DailyLogCard';
import '../../styles/StudentDashboard.css';

const ReviewLogsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [pendingLogs, setPendingLogs] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [loading, setLoading] = useState({
        logs: true,
        action: false
    });
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [userData, setUserData] = useState({
        name: '',
        initials: '',
        department: '',
        company: 'Zoyaraa',
        email: ''
    });
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userData.email) {
            fetchPendingLogs();
        }
    }, [userData.email]);

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
                    .slice(0, 2) || 'R';

                setUserData({
                    name: fullName,
                    initials: initials,
                    department: user.department || '',
                    company: 'Zoyaraa',
                    email: user.email
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchPendingLogs = async () => {
        try {
            setLoading(prev => ({ ...prev, logs: true }));
            setError(null);
            
            console.log('🔍 Fetching pending logs...');
            const response = await dailyLogService.getPendingLogs();
            console.log('📊 Pending logs response:', response);
            
            // Handle different response structures
            let logs = [];
            
            if (response.success && response.logs) {
                logs = response.logs;
            } else if (response.data?.logs) {
                logs = response.data.logs;
            } else if (Array.isArray(response)) {
                logs = response;
            } else if (response.logs) {
                logs = response.logs;
            }
            
            console.log(`✅ Found ${logs.length} pending logs`);
            setPendingLogs(logs);
            setTotalPages(Math.ceil(logs.length / itemsPerPage));
            
            if (logs.length > 0) {
                // Find the first log with valid student data
                const firstValidLog = logs.find(log => log.studentId || log.student);
                if (firstValidLog) {
                    const student = firstValidLog.studentId || firstValidLog.student;
                    setSelectedStudentId(student?._id || student?.id);
                }
            }
            
        } catch (error) {
            console.error("❌ Error fetching pending logs:", error);
            setError(error.message || 'Failed to load pending logs');
            showNotification('Failed to load pending logs: ' + (error.message || 'Network error'), 'error');
            setPendingLogs([]);
        } finally {
            setLoading(prev => ({ ...prev, logs: false }));
        }
    };

    // Group logs by student
    const logsByStudent = pendingLogs.reduce((acc, log) => {
        const student = log.studentId || log.student || {};
        const sId = student._id || student.id;
        
        if (!sId) return acc;
        
        if (!acc[sId]) {
            acc[sId] = {
                student: student,
                internship: log.internshipId || log.internship || {},
                logs: []
            };
        }
        acc[sId].logs.push(log);
        return acc;
    }, {});

    const selectedStudentLogs = selectedStudentId && logsByStudent[selectedStudentId]
        ? logsByStudent[selectedStudentId].logs
        : [];

    // Reset to first page when selected student changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStudentId]);

    // Pagination logic for logs
    const indexOfLastLog = currentPage * itemsPerPage;
    const indexOfFirstLog = indexOfLastLog - itemsPerPage;
    const currentLogs = selectedStudentLogs.slice(indexOfFirstLog, indexOfLastLog);
    const logTotalPages = Math.ceil(selectedStudentLogs.length / itemsPerPage);

    const handleApprove = async (logId) => {
        if (!feedbackText.trim()) {
            showNotification('Please provide feedback for approval', 'warning');
            return;
        }

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setSelectedLogId(logId);
            
            await dailyLogService.approveLog(logId, {
                feedback: feedbackText,
                rating: feedbackRating
            });
            
            showNotification('✅ Log approved successfully!', 'success');

            // Remove approved log from state
            setPendingLogs(prev => prev.filter(l => l._id !== logId));
            setFeedbackText('');
            setFeedbackRating(5);
            setSelectedLogId(null);

            // Refresh data
            await fetchPendingLogs();

        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'Failed to approve log', 'error');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handleReject = async (logId) => {
        if (!feedbackText.trim()) {
            showNotification('Please provide a reason for rejection', 'error');
            return;
        }

        try {
            setLoading(prev => ({ ...prev, action: true }));
            setSelectedLogId(logId);
            
            await dailyLogService.rejectLog(logId, feedbackText);
            showNotification('Log rejected', 'success');

            // Remove rejected log from state
            setPendingLogs(prev => prev.filter(l => l._id !== logId));
            setFeedbackText('');
            setSelectedLogId(null);

            // Refresh data
            await fetchPendingLogs();

        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'Failed to reject log', 'error');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handleRequestRevision = async (logId) => {
        if (!feedbackText.trim()) {
            showNotification('Please provide revision feedback', 'error');
            return;
        }

        try {
            setLoading(prev => ({ ...prev, action: true }));
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

            // Refresh data
            await fetchPendingLogs();

        } catch (error) {
            console.error(error);
            showNotification(error.response?.data?.message || 'Failed to request revision', 'error');
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        document.querySelector('.logs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                : type === 'warning'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
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

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleRetry = () => {
        fetchPendingLogs();
    };

    const isLoading = loading.logs;

    // If error, show retry option
    if (error && !isLoading && pendingLogs.length === 0) {
        return (
            <div className="app-container">
                <RecruiterSidebar 
                    isOpen={isMobileMenuOpen} 
                    setIsOpen={setIsMobileMenuOpen} 
                    userData={userData} 
                />
                <main className="main-content">
                    <div className="top-bar">
                        <div className="top-bar-left">
                            <button className="menu-toggle" onClick={toggleMobileMenu}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>
                            <h2 className="page-title">Review Daily Logs</h2>
                        </div>
                        <div className="top-bar-right">
                            <NotificationBell />
                            <button className="logout-btn" onClick={handleLogout}>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                    <div className="content-area">
                        <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                            <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <circle cx="12" cy="16" r="1" fill="#dc2626" />
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Failed to Load Logs</h3>
                            <p style={{ color: '#666', marginBottom: '1.5rem' }}>{error}</p>
                            <button
                                className="primary-btn"
                                onClick={handleRetry}
                                style={{ padding: '0.75rem 2rem' }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Unified Sidebar */}
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
                            Review Daily Logs
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
                    {/* Back Button */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <button
                            className="secondary-btn"
                            onClick={() => navigate('/recruiter/mentor-dashboard')}
                            style={{ 
                                padding: '0.6rem 1.2rem', 
                                fontSize: '0.875rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onClickCapture={(e) => createRippleEffect(e)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back to Mentor Dashboard
                        </button>
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
                            <p style={{ color: '#666' }}>Loading pending logs...</p>
                        </div>
                    ) : pendingLogs.length === 0 ? (
                        <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                            <div className="empty-state-icon" style={{ width: '80px', height: '80px' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 12h8"></path>
                                </svg>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>All Caught Up! 🎉</h3>
                            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                                There are no pending logs to review at the moment.
                            </p>
                            <button
                                className="primary-btn"
                                onClick={() => navigate('/recruiter/mentor-dashboard')}
                                style={{ padding: '0.75rem 2rem' }}
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
                                overflowY: 'auto',
                                border: '1px solid #e5e7eb'
                            }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#1e293b' }}>
                                    Students with Pending Logs ({Object.keys(logsByStudent).length})
                                </h3>

                                {Object.values(logsByStudent).map(entry => (
                                    <div
                                        key={entry.student._id || entry.student.id}
                                        style={{
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: `1px solid ${selectedStudentId === (entry.student._id || entry.student.id) ? '#8b5cf6' : '#e2e8f0'}`,
                                            background: selectedStudentId === (entry.student._id || entry.student.id) ? '#f5f3ff' : 'white',
                                            marginBottom: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: selectedStudentId === (entry.student._id || entry.student.id) ? '0 4px 6px rgba(139, 92, 246, 0.1)' : 'none'
                                        }}
                                        onClick={() => {
                                            setSelectedStudentId(entry.student._id || entry.student.id);
                                            setFeedbackText('');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: selectedStudentId === (entry.student._id || entry.student.id) ? '#8b5cf6' : '#EEF2FF',
                                                color: selectedStudentId === (entry.student._id || entry.student.id) ? 'white' : '#2440F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '600',
                                                fontSize: '0.8rem'
                                            }}>
                                                {getInitials(entry.student.fullName)}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
                                                    {entry.student.fullName || 'Unknown Student'}
                                                </h4>
                                                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.75rem' }}>
                                                    {entry.internship?.title || 'Internship'}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            borderRadius: '50px',
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            marginTop: '4px'
                                        }}>
                                            {entry.logs.length} pending {entry.logs.length === 1 ? 'log' : 'logs'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Right Panel - Log Details */}
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                {selectedStudentLogs.length > 0 ? (
                                    <>
                                        <div className="logs-list">
                                            {currentLogs.map(log => (
                                                <div
                                                    key={log._id}
                                                    style={{
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        padding: '24px',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                                        marginBottom: '20px',
                                                        border: '1px solid #e5e7eb'
                                                    }}
                                                >
                                                    <DailyLogCard log={log} />

                                                    {/* Feedback Form */}
                                                    <div style={{
                                                        marginTop: '24px',
                                                        background: '#f8fafc',
                                                        padding: '20px',
                                                        borderRadius: '12px',
                                                        border: '1px solid #e5e7eb'
                                                    }}>
                                                        <label style={{ 
                                                            display: 'block', 
                                                            marginBottom: '8px', 
                                                            fontWeight: '600', 
                                                            color: '#334155',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            Mentor Feedback {log.status === 'pending' ? '(Required)' : ''}
                                                        </label>
                                                        <textarea
                                                            rows="3"
                                                            placeholder="Add specific, constructive feedback..."
                                                            value={feedbackText}
                                                            onChange={(e) => setFeedbackText(e.target.value)}
                                                            maxLength="500"
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                border: '1px solid #cbd5e1',
                                                                borderRadius: '8px',
                                                                marginBottom: '8px',
                                                                resize: 'vertical',
                                                                fontFamily: 'inherit',
                                                                fontSize: '0.95rem'
                                                            }}
                                                        />
                                                        <div style={{ 
                                                            fontSize: '0.75rem', 
                                                            color: feedbackText.length >= 450 ? '#dc2626' : '#6b7280', 
                                                            textAlign: 'right',
                                                            marginBottom: '15px'
                                                        }}>
                                                            {feedbackText.length}/500 characters
                                                        </div>

                                                        {/* Rating */}
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <label style={{ 
                                                                display: 'block', 
                                                                marginBottom: '8px', 
                                                                fontWeight: '600', 
                                                                color: '#334155',
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                Rating (1-5)
                                                            </label>
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                {[1, 2, 3, 4, 5].map(r => (
                                                                    <button
                                                                        key={r}
                                                                        type="button"
                                                                        onClick={() => setFeedbackRating(r)}
                                                                        style={{
                                                                            width: '40px',
                                                                            height: '40px',
                                                                            borderRadius: '50%',
                                                                            border: feedbackRating === r ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                                                                            background: feedbackRating === r ? '#f5f3ff' : 'white',
                                                                            color: feedbackRating === r ? '#8b5cf6' : '#4b5563',
                                                                            fontWeight: '600',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        {r}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '12px',
                                                            marginTop: '10px',
                                                            flexWrap: 'wrap'
                                                        }}>
                                                            <button
                                                                className="primary-btn"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: '120px',
                                                                    background: '#10b981',
                                                                    opacity: loading.action && selectedLogId === log._id ? 0.6 : 1
                                                                }}
                                                                onClick={() => handleApprove(log._id)}
                                                                disabled={loading.action && selectedLogId === log._id}
                                                                onClickCapture={(e) => createRippleEffect(e)}
                                                            >
                                                                {loading.action && selectedLogId === log._id ? 'Processing...' : 'Approve'}
                                                            </button>
                                                            <button
                                                                className="secondary-btn"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: '120px',
                                                                    background: '#fef2f2',
                                                                    color: '#dc2626',
                                                                    borderColor: '#fecaca'
                                                                }}
                                                                onClick={() => handleReject(log._id)}
                                                                disabled={loading.action && selectedLogId === log._id}
                                                                onClickCapture={(e) => createRippleEffect(e)}
                                                            >
                                                                Reject
                                                            </button>
                                                            <button
                                                                className="secondary-btn"
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: '120px',
                                                                    background: '#fef3c7',
                                                                    color: '#d97706',
                                                                    borderColor: '#fde68a'
                                                                }}
                                                                onClick={() => handleRequestRevision(log._id)}
                                                                disabled={loading.action && selectedLogId === log._id}
                                                                onClickCapture={(e) => createRippleEffect(e)}
                                                            >
                                                                Request Revision
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination for Logs */}
                                        {logTotalPages > 1 && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginTop: '1rem',
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

                                                {[...Array(logTotalPages)].map((_, index) => {
                                                    const pageNumber = index + 1;
                                                    if (
                                                        pageNumber === 1 ||
                                                        pageNumber === logTotalPages ||
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
                                                    disabled={currentPage === logTotalPages}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        background: currentPage === logTotalPages ? '#f3f4f6' : 'white',
                                                        color: currentPage === logTotalPages ? '#9ca3af' : '#1f2937',
                                                        cursor: currentPage === logTotalPages ? 'not-allowed' : 'pointer',
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
                                        {selectedStudentLogs.length > 0 && (
                                            <div style={{
                                                textAlign: 'center',
                                                fontSize: '0.875rem',
                                                color: '#6b7280',
                                                marginTop: '0.5rem',
                                                marginBottom: '1rem'
                                            }}>
                                                Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, selectedStudentLogs.length)} of {selectedStudentLogs.length} logs
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-state" style={{ padding: '3rem' }}>
                                        <div className="empty-state-icon" style={{ width: '64px', height: '64px' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M8 12h8"></path>
                                            </svg>
                                        </div>
                                        <h3>No logs for this student</h3>
                                        <p>Select another student from the list</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ReviewLogsPage;