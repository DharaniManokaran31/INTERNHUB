import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';

const InternshipsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [internships, setInternships] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInternships();
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

    const fetchInternships = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await hrService.getAllInternships();
            
            let fetchedInternships = [];
            if (response.success && response.data) {
                fetchedInternships = response.data.internships || [];
            } else if (Array.isArray(response)) {
                fetchedInternships = response;
            }

            const internArray = Array.isArray(fetchedInternships) ? fetchedInternships : [];
            setInternships(internArray);
            
            setStats({
                total: internArray.length,
                active: internArray.filter(i => i.status === 'active').length,
                pending: internArray.filter(i => i.status === 'pending').length,
                completed: internArray.filter(i => i.status === 'closed' || i.status === 'completed').length
            });
        } catch (error) {
            console.error('Error fetching internships:', error);
            setError('Could not load internship postings. Please refresh.');
            setInternships([]);
        } finally {
            setLoading(false);
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

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'badge-success';
            case 'pending': return 'badge-warning';
            case 'closed': case 'completed': return 'badge-info';
            default: return 'badge-info';
        }
    };

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
                            Internships
                            <span className="page-subtitle">• Opportunities Overview</span>
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

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Postings</div>
                                <div className="stat-value">{stats.total}</div>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Active Roles</div>
                                <div className="stat-value">{stats.active}</div>
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
                                <div className="stat-label">Pending Approval</div>
                                <div className="stat-value">{stats.pending}</div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <section className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="section-title">All Internship Postings</h2>
                            <button className="secondary-btn" onClick={fetchInternships} style={{ fontSize: '0.8rem' }}>Refresh</button>
                        </div>
                        <div className="title-underline"></div>
                        
                        {loading ? (
                            <p className="text-center py-10">Loading internships...</p>
                        ) : internships.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {internships.map(internship => (
                                    <div key={internship._id} className="recent-application-card" style={{ display: 'block' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0 }}>{internship.title || 'Untitled Internship'}</h4>
                                            <span className={`badge ${getStatusBadge(internship.status)}`}>
                                                {(internship.status || 'UNKNOWN').toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px' }}>
                                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                </svg>
                                                {internship.department || 'N/A'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px' }}>
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                {internship.location || 'Remote'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                                                Posted by: <strong>{internship.postedBy?.fullName || 'System'}</strong>
                                            </div>
                                            <button 
                                                className="secondary-btn" 
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                                                onClick={(e) => { createRippleEffect(e); navigate(`/hr/internships/${internship._id}`); }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">No internships found.</p>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default InternshipsPage;