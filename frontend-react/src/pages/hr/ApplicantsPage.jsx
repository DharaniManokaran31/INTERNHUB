import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';

const ApplicantsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, shortlisted: 0, hired: 0 });
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchApplications();
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

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await hrService.getAllApplications();
            
            // Handle different possible API structures
            let fetchedApps = [];
            if (response.success && response.data) {
                fetchedApps = response.data.applications || response.data || [];
            } else if (Array.isArray(response)) {
                fetchedApps = response;
            } else if (response.applications) {
                fetchedApps = response.applications;
            }

            // Ensure it's an array
            const appsArray = Array.isArray(fetchedApps) ? fetchedApps : [];
            setApplications(appsArray);

            setStats({
                total: appsArray.length,
                pending: appsArray.filter(a => a.status === 'applied' || a.status === 'pending').length,
                shortlisted: appsArray.filter(a => a.status === 'shortlisted').length,
                hired: appsArray.filter(a => a.status === 'hired' || a.status === 'accepted').length
            });
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError('Failed to load applications. Please try again.');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'hired': case 'accepted': return 'badge-success';
            case 'pending': case 'applied': return 'badge-warning';
            case 'shortlisted': return 'badge-info';
            case 'rejected': return 'badge-error';
            default: return 'badge-info';
        }
    };

    const filteredApplications = (applications || []).filter(app => {
        if (filter === 'all') return true;
        if (filter === 'pending') return app.status === 'applied' || app.status === 'pending';
        return app.status === filter;
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
                            Applicants
                            <span className="page-subtitle">• Candidate Processing</span>
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
                                <div className="stat-label">Total Applicants</div>
                                <div className="stat-value">{stats.total}</div>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Unprocessed</div>
                                <div className="stat-value">{stats.pending}</div>
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
                                <div className="stat-label">Hired Candidates</div>
                                <div className="stat-value">{stats.hired}</div>
                            </div>
                            <div className="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="action-buttons" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                        <button className={`secondary-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                        <button className={`secondary-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
                        <button className={`secondary-btn ${filter === 'shortlisted' ? 'active' : ''}`} onClick={() => setFilter('shortlisted')}>Shortlisted</button>
                        <button className={`secondary-btn ${filter === 'hired' ? 'active' : ''}`} onClick={() => setFilter('hired')}>Hired</button>
                    </div>

                    <section className="section" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="section-title">Application Pipeline</h2>
                            <button className="secondary-btn" onClick={fetchApplications} style={{ fontSize: '0.8rem' }}>Refresh</button>
                        </div>
                        <div className="title-underline"></div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Applicant</th>
                                        <th>Position</th>
                                        <th>Applied On</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-10">Loading applications...</td></tr>
                                    ) : filteredApplications.length > 0 ? (
                                        filteredApplications.map(app => (
                                            <tr key={app?._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div className="user-avatar-sidebar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                                            {app?.student?.fullName?.charAt(0) || 'S'}
                                                        </div>
                                                        <div>
                                                            <div className="item-title">{app?.student?.fullName || 'Unknown Student'}</div>
                                                            <div className="item-subtitle">{app?.student?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="item-title">{app?.internship?.title || 'Unknown Role'}</div>
                                                        <div className="item-subtitle">{app?.internship?.department}</div>
                                                    </div>
                                                </td>
                                                <td>{app?.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <span className={`badge ${getStatusBadge(app?.status)}`}>
                                                        {(app?.status || 'UNKNOWN').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="secondary-btn" 
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                        onClick={() => navigate(`/hr/applicants/${app?._id}`)}
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center py-10">No applicants found matching this filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ApplicantsPage;