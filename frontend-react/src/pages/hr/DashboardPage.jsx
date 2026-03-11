import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';
import InviteRecruiterModal from '../../components/modals/InviteRecruiterModal';

const HRDashboardPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [stats, setStats] = useState({ recruiters: 0, internships: 0, applicants: 0, activeInterns: 0 });
    const [recentRecruiters, setRecentRecruiters] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR', department: 'Administration' });
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use common profile fetch but maybe add to hrService if needed
            const token = localStorage.getItem('authToken');
            
            // Fetch everything in parallel using hrService
            const [profileRes, statsRes, recruitersRes, notificationsRes] = await Promise.all([
                fetch('http://localhost:5000/api/recruiters/profile', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                }).then(res => res.json()),
                hrService.getDashboardStats(),
                hrService.getAllRecruiters(),
                hrService.getNotifications()
            ]);

            // Handle Profile
            if (profileRes.success) {
                const user = profileRes.data?.user || profileRes.user;
                setUserData({
                    name: user.fullName || 'HR Manager',
                    initials: (user.fullName || 'HR').split(' ').map(n => n[0]).join('').toUpperCase(),
                    department: user.department || 'Administration'
                });
            }

            // Handle Stats
            if (statsRes.success && statsRes.data) {
                // Support both {stats: {}} and flat data
                const s = statsRes.data.stats || statsRes.data || {};
                setStats({
                    recruiters: s.totalRecruiters || 0,
                    internships: s.activeInternships || 0,
                    applicants: s.totalApplicants || 0,
                    activeInterns: s.activeInterns || 0
                });
            }

            // Handle Recruiters - API returns { active: [], pending: [] }
            if (recruitersRes.success && recruitersRes.data) {
                const activeRecs = recruitersRes.data.active || [];
                setRecentRecruiters(activeRecs.slice(0, 3));
            }

            // Handle Activity
            // Handle Activity (using activityRes from hrService.getRecentActivity)
            if (activityRes.success && activityRes.data) {
                const activities = activityRes.data.activities || activityRes.data || [];
                setRecentActivity(activities.slice(0, 4).map(n => ({
                    id: n._id,
                    type: n.type?.includes('application') ? 'application' : n.type?.includes('recruiter') ? 'recruiter' : 'internship',
                    title: n.title,
                    message: n.message,
                    time: formatTime(n.createdAt),
                    status: n.isRead ? 'read' : 'new'
                })));
            } else {
                setRecentActivity([]);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to refresh dashboard. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            navigate('/login');
        }
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

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="app-container">
            <HrSidebar 
                userData={userData} 
                isMobileMenuOpen={isMobileMenuOpen} 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
            />

            <div className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>

            <main className="main-content">
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="menu-toggle" onClick={toggleMobileMenu}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <h2 className="page-title">
                            Dashboard
                            <span className="page-subtitle">• Platform Overview</span>
                        </h2>
                    </div>
                    <div className="top-bar-right">
                        <NotificationBell />
                        <button className="logout-btn" onClick={handleLogout}>
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <div className="content-area">
                    {error && (
                        <div className="section" style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', marginBottom: '1.5rem', padding: '1rem' }}>
                            {error}
                        </div>
                    )}

                    <div className="welcome-section">
                        <h1 className="welcome-heading">Welcome back, {userData.name.split(' ')[0]}!</h1>
                        <p className="welcome-subtext">Monitor recruitment performance and manage your team efficiently at Zoyaraa.</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Recruiters</div>
                                <div className="stat-value">{loading ? '...' : stats.recruiters}</div>
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
                                <div className="stat-label">Active Internships</div>
                                <div className="stat-value">{loading ? '...' : stats.internships}</div>
                            </div>
                            <div className="stat-icon purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Applicants</div>
                                <div className="stat-value">{loading ? '...' : stats.applicants}</div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Active Interns</div>
                                <div className="stat-value">{loading ? '...' : stats.activeInterns}</div>
                            </div>
                            <div className="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="primary-btn" onClick={(e) => { createRippleEffect(e); setShowInviteModal(true); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <line x1="19" y1="8" x2="19" y2="14"></line>
                                <line x1="16" y1="11" x2="22" y2="11"></line>
                            </svg>
                            Invite Recruiter
                        </button>
                        <button className="secondary-btn" onClick={(e) => { createRippleEffect(e); navigate('/hr/reports'); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            View Analytics
                        </button>
                    </div>

                    <div className="two-column-grid">
                        <section className="section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 className="section-title">Team Performance</h2>
                                <button className="secondary-btn" onClick={fetchDashboardData} style={{ fontSize: '0.8rem' }}>Refresh</button>
                            </div>
                            <div className="title-underline"></div>
                            <div className="recent-applications-list">
                                {loading ? (
                                    <p className="text-center py-4">Loading recruiters...</p>
                                ) : recentRecruiters.length > 0 ? (
                                    recentRecruiters.map(recruiter => (
                                        <div key={recruiter?._id} className="recent-application-card">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                <div className="user-avatar-sidebar" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                                                    {recruiter?.fullName?.charAt(0) || 'R'}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{recruiter?.fullName || 'Unknown'}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                                                        {recruiter?.department} • {recruiter?.designation || 'Recruiter'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`badge ${recruiter?.isActive ? 'badge-success' : 'badge-error'}`}>
                                                {recruiter?.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-4">No recruiters found.</p>
                                )}
                            </div>
                            <button className="secondary-btn w-full mt-4" style={{ justifyContent: 'center' }} onClick={(e) => { createRippleEffect(e); navigate('/hr/recruiters'); }}>
                                Manage Team
                            </button>
                        </section>

                        <section className="section">
                            <h2 className="section-title">Recent Activity</h2>
                            <div className="title-underline"></div>
                            <div className="recent-applications-list">
                                {loading ? (
                                    <p className="text-center py-4">Loading activity...</p>
                                ) : recentActivity.length > 0 ? (
                                    recentActivity.map(activity => (
                                        <div key={activity.id} className="recent-application-card">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                <div className={`stat-icon ${activity.type === 'application' ? 'blue' : activity.type === 'recruiter' ? 'purple' : 'orange'}`} style={{ width: '40px', height: '40px' }}>
                                                    {activity.type === 'application' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>}
                                                    {activity.type === 'recruiter' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px' }}><circle cx="12" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path></svg>}
                                                    {activity.type === 'internship' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px' }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0 }}>{activity.title}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>{activity.message}</p>
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{activity.time}</span>
                                                </div>
                                            </div>
                                            <span className={`badge ${activity.status === 'new' ? 'badge-warning' : 'badge-info'}`}>
                                                {activity.status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-4">No recent activity detected.</p>
                                )}
                            </div>
                            <button className="secondary-btn w-full mt-4" style={{ justifyContent: 'center' }} onClick={(e) => { createRippleEffect(e); navigate('/hr/notifications'); }}>
                                View All Notifications
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {showInviteModal && (
                <InviteRecruiterModal 
                    onClose={() => setShowInviteModal(false)} 
                    onSuccess={fetchDashboardData} 
                />
            )}
        </div>
    );
};

export default HRDashboardPage;