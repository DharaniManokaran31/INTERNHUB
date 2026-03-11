import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import DailyLogCard from '../../components/logs/DailyLogCard';
import LogFilterBar from '../../components/logs/LogFilterBar';
import ProgressChart from '../../components/logs/ProgressChart';
import api from '../../services/api';
import progressService from '../../services/progressService';
import dailyLogService from '../../services/dailyLogService';
import '../../styles/StudentDashboard.css';

const InternProgressPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [filter, setFilter] = useState('all');
    const [progress, setProgress] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [studentInfo, setStudentInfo] = useState({ fullName: 'Loading...', email: '' });
    const [userData, setUserData] = useState({
        name: 'Loading...',
        initials: '',
        department: '',
        company: 'Zoyaraa'
    });

    useEffect(() => {
        fetchUserProfile();
        fetchStudentData();
    }, [id]);

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

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            
            // Fetch student details first
            const studentRes = await api.get(`/students/${id}`);
            if (studentRes.data.success) {
                setStudentInfo(studentRes.data.data.student);
            }

            const [logsRes, progressRes, weeklyRes] = await Promise.all([
                dailyLogService.getInternLogs(id),
                progressService.getInternProgress(id),
                progressService.getWeeklyBreakdown(id)
            ]);

            if (logsRes && logsRes.logs) {
                setLogs(logsRes.logs);
                setFilteredLogs(logsRes.logs);
            }

            if (progressRes && progressRes.progress) {
                setProgress(progressRes.progress);
            }

            if (weeklyRes && weeklyRes.breakdown) {
                setWeeklyData(weeklyRes.breakdown);
            }

        } catch (error) {
            console.error("Error fetching intern info:", error);
            showNotification('Failed to load intern data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filter === 'all') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(log => log.status === filter));
        }
    }, [filter, logs]);

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

    const getInitials = (name) => {
        if (!name) return 'S';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="app-container">
            {/* Sidebar Overlay */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            {/* Sidebar */}
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
                        className={`nav-item ${location.pathname.includes('/recruiter/mentor-dashboard') ? 'active' : ''}`}
                        onClick={() => navigate('/recruiter/mentor-dashboard')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <span className="nav-item-text">Mentor Dashboard</span>
                    </button>

                    <button
                        className={`nav-item ${location.pathname.includes('/recruiter/review-logs') ? 'active' : ''}`}
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
                            Intern Progress
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
                        <div className="loading-placeholder">Loading intern data...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
                            {/* Main Content - Charts and Logs */}
                            <div>
                                {/* Progress Chart */}
                                <div className="section" style={{ marginBottom: '30px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
                                        Weekly Hours Logged
                                    </h3>
                                    <ProgressChart data={weeklyData} />
                                </div>

                                {/* Daily Logs */}
                                <div className="section">
                                    <div className="section-header">
                                        <h2 className="section-title">Daily Logs History</h2>
                                    </div>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                        <LogFilterBar currentFilter={filter} onFilterChange={setFilter} />
                                    </div>

                                    {filteredLogs.length > 0 ? (
                                        <div className="recent-applications-list">
                                            {filteredLogs.map(log => (
                                                <DailyLogCard key={log._id} log={log} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ padding: '3rem' }}>
                                            <div className="empty-state-icon" style={{ width: '64px', height: '64px' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <path d="M8 12h8"></path>
                                                </svg>
                                            </div>
                                            <h3>No logs found</h3>
                                            <p>No logs match the selected filter.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar - Student Info & Stats */}
                            <div>
                                {/* Student Info Card */}
                                <div className="section" style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: '#eef2ff',
                                        color: '#8b5cf6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2.5rem',
                                        fontWeight: 'bold',
                                        margin: '0 auto 20px auto'
                                    }}>
                                        {getInitials(studentInfo.fullName)}
                                    </div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#1e293b' }}>
                                        {studentInfo.fullName}
                                    </h3>
                                    <p style={{ color: '#64748b' }}>{studentInfo.email}</p>
                                </div>

                                {/* Progress Stats Card */}
                                {progress && (
                                    <div className="section">
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
                                            Internship Progress
                                        </h3>

                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                                                <span>Overall</span>
                                                <span style={{ fontWeight: '600', color: '#8b5cf6' }}>{progress.percentage || 0}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '50px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${progress.percentage || 0}%`, 
                                                    background: 'linear-gradient(90deg, #8b5cf6, #c084fc)', 
                                                    borderRadius: '50px',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}>
                                            <span style={{ color: '#64748b' }}>Days Completed</span>
                                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                                {progress.completedDays || 0} / {progress.totalDays || 60}
                                            </span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}>
                                            <span style={{ color: '#64748b' }}>Total Hours Logged</span>
                                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{progress.totalHours || 0}h</span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px 0',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}>
                                            <span style={{ color: '#64748b' }}>Pending Logs</span>
                                            <span style={{ fontWeight: '600', color: '#d97706' }}>{progress.pendingDays || 0}</span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '12px 0'
                                        }}>
                                            <span style={{ color: '#64748b' }}>Rejected Logs</span>
                                            <span style={{ fontWeight: '600', color: '#dc2626' }}>{progress.rejectedDays || 0}</span>
                                        </div>
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

export default InternProgressPage;