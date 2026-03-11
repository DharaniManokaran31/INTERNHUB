import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';

const NotificationCenterPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const user = data.data?.user || data.user;
                setUserData({
                    name: user.fullName,
                    initials: user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await hrService.getNotifications();
            if (response.success && response.data) {
                setNotifications(response.data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const markAllAsRead = async () => {
        try {
            const response = await hrService.markAllNotificationsRead();
            if (response.success) {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            const response = await hrService.markNotificationRead(id);
            if (response.success) {
                setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const filteredNotifications = (notifications || []).filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        return true;
    });

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
                            Notification Center
                            <span className="page-subtitle">• Stay Informed</span>
                        </h2>
                    </div>
                    <div className="top-bar-right">
                        <NotificationBell />
                        <button className="logout-btn" onClick={() => navigate('/login')}>
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

                    <div className="action-buttons" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className={`secondary-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                            <button className={`secondary-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
                        </div>
                        <button className="secondary-btn" onClick={markAllAsRead}>
                            Mark all as read
                        </button>
                    </div>

                    <section className="section" style={{ marginTop: '1.5rem' }}>
                        <h2 className="section-title">Communication Log</h2>
                        <div className="title-underline"></div>
                        <div className="recent-applications-list">
                            {loading ? (
                                <p className="text-center py-10">Loading notifications...</p>
                            ) : filteredNotifications.length > 0 ? (
                                filteredNotifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        className="recent-application-card" 
                                        style={{ opacity: notif.isRead ? 0.6 : 1, cursor: notif.isRead ? 'default' : 'pointer' }}
                                        onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                            <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px' }}>
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: notif.isRead ? '#64748b' : '#1a1f36' }}>{notif.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{notif.message}</p>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {!notif.isRead && <div style={{ width: '8px', height: '8px', background: '#2440F0', borderRadius: '50%' }}></div>}
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #e0e7ff, #dbeafe)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="1.5" style={{ width: '32px' }}>
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                        </svg>
                                    </div>
                                    <h4 style={{ margin: '0 0 0.5rem', color: '#1a1f36' }}>No notifications yet</h4>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto 1rem' }}>
                                        Notifications will appear here when key events happen — such as when a student applies to an internship, or when application statuses change across your company.
                                    </p>
                                    <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                        Current activity notifications are routed to the respective recruiters.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default NotificationCenterPage;
