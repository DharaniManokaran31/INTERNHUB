import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService';
import NotificationBell from '../../components/common/NotificationBell';

const CompletedInternsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });

    useEffect(() => {
        fetchCompletedInterns();
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

    const fetchCompletedInterns = async () => {
        try {
            setLoading(true);
            const response = await hrService.getCompletedInterns();
            if (response.success) {
                setInterns(response.data.interns || []);
            }
        } catch (error) {
            console.error('Error fetching completed interns:', error);
        } finally {
            setLoading(false);
        }
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
                            Completed Internships
                            <span className="page-subtitle">• Alumni Management</span>
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
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Alumni</span>
                                <span className="stat-value">{interns.length}</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">This Month</span>
                                <span className="stat-value">
                                    {interns.filter(i => new Date(i.updatedAt).getMonth() === new Date().getMonth()).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="section" style={{ marginTop: '2rem' }}>
                        <div className="section-header">
                            <h3 className="section-title">Completion Records</h3>
                        </div>
                        <div className="title-underline"></div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Internship</th>
                                        <th>Department</th>
                                        <th>Completed On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center">Loading...</td></tr>
                                    ) : interns.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">No completed internships found.</td></tr>
                                    ) : (
                                        interns.map(intern => (
                                            <tr key={intern._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="avatar-small">
                                                            {intern.student?.fullName?.charAt(0) || 'S'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{intern.student?.fullName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{intern.student?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{intern.internship?.title}</td>
                                                <td><span className="badge badge-info">{intern.internship?.department}</span></td>
                                                <td>{new Date(intern.updatedAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            className="secondary-btn btn-small"
                                                            onClick={() => navigate(`/hr/applicants/${intern._id}`)}
                                                        >
                                                            View Profile
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CompletedInternsPage;
