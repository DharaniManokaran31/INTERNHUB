import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';

const ActiveInternsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ totalActive: 0, currentlyOnline: 0, endingSoon: 0, averageProgress: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [internsRes, statsRes] = await Promise.all([
                    hrService.getActiveInterns(),
                    hrService.getActiveInternsStats()
                ]);

                if (internsRes.success) {
                    setInterns(internsRes.data.interns || []);
                } else {
                    setError('Failed to load interns.');
                }

                if (statsRes.success) {
                    setStats(statsRes.data);
                }
            } catch (error) {
                console.error('Error fetching active interns data:', error);
                setError('Failed to load active interns data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const filteredInterns = (interns || []).filter(intern => 
        intern?.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern?.internship?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern?.internship?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateProgress = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();
        if (today < startDate) return 0;
        if (today > endDate) return 100;
        const total = endDate - startDate;
        const current = today - startDate;
        return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    };

    const createRippleEffect = (e) => {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
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
                            Active Interns
                            <span className="page-subtitle">• Progress Tracking</span>
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
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Active Interns</span>
                                <span className="stat-value">{stats.totalActive}</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">
                                <div className="status-indicator online" style={{ position: 'absolute', top: '10px', right: '10px' }}></div>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 17H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2Z"></path>
                                    <path d="M6 21h12"></path>
                                    <path d="M12 17v4"></path>
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Currently Online</span>
                                <span className="stat-value">{stats.currentlyOnline}</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Ending Soon</span>
                                <span className="stat-value">{stats.endingSoon}</span>
                            </div>
                        </div>
                    </div>

                    <div className="search-bar" style={{ maxWidth: '400px', marginBottom: '1.5rem' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Find intern by name, role or department..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <section className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="section-title">Program Members</h2>
                        </div>
                        <div className="title-underline"></div>
                        
                        {loading ? (
                            <p className="text-center py-10">Loading program members...</p>
                        ) : filteredInterns.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {filteredInterns.map(intern => (
                                    <div key={intern?._id} className="recent-application-card" style={{ display: 'block' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <div className="avatar" style={{ width: '48px', height: '48px', background: '#e0e7ff', color: '#2440f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold' }}>
                                                {intern?.student?.fullName?.charAt(0) || 'S'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0 }}>{intern?.student?.fullName || 'Unknown Intern'}</h4>
                                                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>{intern?.internship?.title || 'No Title'}</p>
                                            </div>
                                            <span className="badge badge-success">ACTIVE</span>
                                        </div>
                                        
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                                <span>Duration Progress</span>
                                                <span>{calculateProgress(intern?.startDate, intern?.endDate)}%</span>
                                            </div>
                                            <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    backgroundColor: '#2440F0', 
                                                    width: `${calculateProgress(intern?.startDate, intern?.endDate)}%`,
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                Dept: <strong>{intern?.internship?.department || 'N/A'}</strong>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className="secondary-btn btn-small"
                                                    onClick={(e) => { createRippleEffect(e); navigate(`/hr/active-interns/${intern._id}/progress`); }}
                                                >
                                                    Track Progress
                                                </button>
                                                <button 
                                                    className="primary-btn btn-small"
                                                    style={{ background: '#10b981' }}
                                                    onClick={async (e) => {
                                                        createRippleEffect(e);
                                                        if (window.confirm(`Mark ${intern.student?.fullName} as completed?`)) {
                                                            try {
                                                                const res = await hrService.markInternComplete(intern._id);
                                                                if (res.success) window.location.reload();
                                                            } catch (err) { console.error(err); }
                                                        }
                                                    }}
                                                >
                                                    Finish
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">No active interns found.</p>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ActiveInternsPage;
