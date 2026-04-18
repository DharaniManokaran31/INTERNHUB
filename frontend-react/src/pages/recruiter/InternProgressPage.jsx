// src/pages/recruiter/InternProgressPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import DailyLogCard from '../../components/logs/DailyLogCard';
import LogFilterBar from '../../components/logs/LogFilterBar';
import ProgressChart from '../../components/logs/ProgressChart';
import api from '../../services/api';
import progressService from '../../services/progressService';
import dailyLogService from '../../services/dailyLogService';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import '../../styles/StudentDashboard.css';

const InternProgressPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState({
        student: true,
        logs: true,
        progress: true,
        weekly: true
    });
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [filter, setFilter] = useState('all');
    const [progress, setProgress] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [studentInfo, setStudentInfo] = useState({ fullName: '', email: '', education: {} });
    const [userData, setUserData] = useState({
        name: '',
        initials: '',
        department: '',
        company: 'Zoyaraa',
        email: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(3);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userData.email && id) {
            fetchStudentData();
        }
    }, [userData.email, id]);

    useEffect(() => {
        filterLogs();
    }, [filter, logs]);

    // Reset to first page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

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

    const fetchStudentData = async () => {
        try {
            setLoading({ student: true, logs: true, progress: true, weekly: true });
            
            // Fetch student details first
            try {
                const studentRes = await api.get(`/students/${id}`);
                if (studentRes.data.success) {
                    setStudentInfo(studentRes.data.data.student || {});
                }
            } catch (error) {
                console.error('Error fetching student:', error);
            } finally {
                setLoading(prev => ({ ...prev, student: false }));
            }

            // Fetch all data in parallel
            const [logsRes, progressRes, weeklyRes] = await Promise.allSettled([
                dailyLogService.getInternLogs(id),
                progressService.getInternProgress(id),
                progressService.getWeeklyBreakdown(id)
            ]);

            // Handle logs response
            if (logsRes.status === 'fulfilled' && logsRes.value) {
                const logsData = logsRes.value;
                const logsList = logsData.logs || logsData.data?.logs || [];
                setLogs(logsList);
                setFilteredLogs(logsList);
                setTotalPages(Math.ceil(logsList.length / itemsPerPage));
            } else {
                console.error('Failed to fetch logs:', logsRes.reason);
            }
            setLoading(prev => ({ ...prev, logs: false }));

            // Handle progress response
            if (progressRes.status === 'fulfilled' && progressRes.value) {
                // Store the whole data object so we can access .progress AND .stats
                const progressData = progressRes.value.data || progressRes.value;
                setProgress(progressData);
            } else {
                console.error('Failed to fetch progress:', progressRes.reason);
            }
            setLoading(prev => ({ ...prev, progress: false }));

            // Handle weekly data response
            if (weeklyRes.status === 'fulfilled' && weeklyRes.value) {
                const weeklyResult = weeklyRes.value.data || weeklyRes.value;
                setWeeklyData(weeklyResult);
            } else {
                console.error('Failed to fetch weekly data:', weeklyRes.reason);
            }
            setLoading(prev => ({ ...prev, weekly: false }));

        } catch (error) {
            console.error("❌ Error fetching intern info:", error);
            showNotification('Failed to load intern data', 'error');
        }
    };

    const filterLogs = () => {
        if (filter === 'all') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(log => log.status === filter));
        }
        setTotalPages(Math.ceil(logs.length / itemsPerPage));
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

    const getInitials = (name) => {
        if (!name) return 'S';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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

    // Pagination logic for logs
    const indexOfLastLog = currentPage * itemsPerPage;
    const indexOfFirstLog = indexOfLastLog - itemsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
    const logTotalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const isLoading = loading.student || loading.logs || loading.progress || loading.weekly;

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
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                            <p style={{ color: '#666' }}>Loading intern data...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
                            {/* Main Content - Charts and Logs */}
                            <div>
                                {/* Progress Chart */}
                                <div className="section" style={{ 
                                    marginBottom: '30px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
                                        Weekly Hours Logged
                                    </h3>
                                    {weeklyData ? (
                                        <ProgressChart data={weeklyData} />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                            No weekly data available
                                        </div>
                                    )}
                                </div>

                                {/* Daily Logs */}
                                <div className="section" style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '20px'
                                    }}>
                                        <h2 className="section-title" style={{ margin: 0 }}>Daily Logs History</h2>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            background: '#EEF2FF',
                                            color: '#2440F0',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {filteredLogs.length} logs
                                        </span>
                                    </div>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                        <LogFilterBar currentFilter={filter} onFilterChange={setFilter} />
                                    </div>

                                    {filteredLogs.length > 0 ? (
                                        <>
                                            <div className="logs-list">
                                                {currentLogs.map(log => (
                                                    <DailyLogCard key={log._id} log={log} />
                                                ))}
                                            </div>

                                            {/* Pagination for Logs */}
                                            {logTotalPages > 1 && (
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
                                            {filteredLogs.length > 0 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    fontSize: '0.875rem',
                                                    color: '#6b7280',
                                                    marginTop: '0.5rem',
                                                    marginBottom: '1rem'
                                                }}>
                                                    Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} logs
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
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No logs found</h3>
                                            <p style={{ color: '#6b7280' }}>No logs match the selected filter.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar - Student Info & Stats */}
                            <div>
                                {/* Student Info Card */}
                                <div className="section" style={{
                                    textAlign: 'left',
                                    padding: '2rem',
                                    background: 'white',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    border: '1px solid #e5e7eb',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start'
                                }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: '#EEF2FF',
                                        color: '#2440F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1rem'
                                    }}>
                                        {getInitials(studentInfo.fullName)}
                                    </div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                                        {studentInfo.fullName || 'Unknown Student'}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>{studentInfo.email || 'No email'}</p>
                                    
                                    {studentInfo.education && (
                                        <div style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: '#4b5563',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1rem' }}>🎓</span>
                                                <span style={{ fontWeight: '500' }}>{studentInfo.education.college || 'College not specified'}</span>
                                            </div>
                                            {studentInfo.education.department && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '1rem' }}>🏢</span>
                                                    <span>{studentInfo.education.department}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Progress Stats Card */}
                                {progress ? (
                                    <div className="section" style={{
                                        padding: '24px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px', textAlign: 'left' }}>
                                            Internship Progress
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                                                    <span>Overall Completion</span>
                                                    <span style={{ fontWeight: '600', color: '#2440F0' }}>{(progress.progress?.percentage || 0).toFixed(2)}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '50px', overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        height: '100%', 
                                                        width: `${progress.progress?.percentage || 0}%`, 
                                                        background: 'linear-gradient(90deg, #2440F0, #60a5fa)', 
                                                        borderRadius: '50px',
                                                        transition: 'width 0.5s ease'
                                                    }}></div>
                                                </div>
                                            </div>

                                            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Days Completed</div>
                                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.25rem', marginTop: '4px' }}>
                                                    {progress.progress?.daysPassed || 0} / {progress.progress?.totalDays || progress.internship?.totalDays || 60}
                                                </div>
                                            </div>

                                            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Hours Logged</div>
                                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.25rem', marginTop: '4px' }}>
                                                    {Number(progress.stats?.totalHours || 0).toFixed(2)}h
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '12px' }}>
                                                    <div style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Pending Logs</div>
                                                    <div style={{ fontWeight: '700', color: '#92400e', fontSize: '1.1rem' }}>{progress.stats?.pendingLogs || 0}</div>
                                                </div>
                                                <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '12px' }}>
                                                    <div style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Approved Logs</div>
                                                    <div style={{ fontWeight: '700', color: '#065f46', fontSize: '1.1rem' }}>{progress.stats?.approvedLogs || 0}</div>
                                                </div>
                                            </div>

                                            <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '12px' }}>
                                                <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Rejected Logs</div>
                                                <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '1.1rem' }}>{progress.stats?.rejectedLogs || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="section" style={{
                                        padding: '24px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                        border: '1px solid #e5e7eb',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ color: '#6b7280' }}>No progress data available</p>
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