import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse dashboard styles for consistency
import NotificationBell from '../../components/common/NotificationBell';

const CertificatesPage = () => {
    const navigate = useNavigate();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({
        name: 'Loading...',
        initials: 'ST'
    });

    useEffect(() => {
        fetchUserProfile();
        fetchCertificates();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/students/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const user = data.data.student;
                const initials = user.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                setUserData({
                    name: user.fullName,
                    initials: initials
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/students/issued-certificates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setCertificates(data.data.certificates || []);
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (cert) => {
        // Implement download logic (e.g., open PDF in new tab)
        if (cert.certificateUrl) {
            window.open(cert.certificateUrl, '_blank');
        } else {
            alert('Certificate file not available');
        }
    };

    const handleVerify = (certId) => {
        // Navigate to a verification page or show a toast
        alert(`Verification Code: ${certId}\nYou can verify this on the public verification portal.`);
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
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
                </div>

                <nav className="sidebar-nav">
                    <button className="nav-item" onClick={() => navigate('/student/dashboard')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        <span className="nav-item-text">Dashboard</span>
                    </button>
                    <button className="nav-item" onClick={() => navigate('/student/internships')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                        <span className="nav-item-text">Browse Internships</span>
                    </button>
                    <button className="nav-item" onClick={() => navigate('/student/applications')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        <span className="nav-item-text">My Applications</span>
                    </button>
                    <button className="nav-item active">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        <span className="nav-item-text">My Certificates</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-sidebar">
                        <div className="user-avatar-sidebar">{userData.initials}</div>
                        <div className="user-info-sidebar">
                            <div className="user-name-sidebar">{userData.name}</div>
                            <div className="user-role-sidebar">Student • Zoyaraa</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <div className="top-bar">
                    <div className="top-bar-left">
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>My Certificates</h2>
                    </div>
                    <div className="top-bar-right">
                        <NotificationBell />
                        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
                    </div>
                </div>

                <div className="content-area">
                    <div className="welcome-section">
                        <h1 className="welcome-heading">Your Achievements</h1>
                        <p className="welcome-subtext">View and download your official internship completion certificates</p>
                    </div>

                    {loading ? (
                        <div className="loading-state">Loading certificates...</div>
                    ) : certificates.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                            </div>
                            <h3>No certificates issued yet</h3>
                            <p>Once you complete an internship and it's verified, your certificate will appear here.</p>
                        </div>
                    ) : (
                        <div className="certificates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                            {certificates.map(cert => (
                                <div key={cert._id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', height: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                                        <div style={{ background: '#EEF2FF', color: '#2440F0', padding: '0.5rem', borderRadius: '10px' }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-3-3m0 0l3-3m-3 3h8M2 13v11h20V13m-20 0l10-10 10 10"></path></svg>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', background: '#E6F7E6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>VERIFIED</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{cert.internship?.title || 'Internship Certificate'}</h3>
                                    <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>{cert.internship?.companyName || 'Zoyaraa'}</p>
                                    
                                    <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                                            <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                                            <span>ID: {cert._id.slice(-8).toUpperCase()}</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => handleDownload(cert)}
                                                style={{ flex: 1, padding: '0.6rem', background: '#2440F0', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Download
                                            </button>
                                            <button 
                                                onClick={() => handleVerify(cert._id)}
                                                style={{ padding: '0.6rem', background: 'white', color: '#2440F0', border: '1px solid #2440F0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CertificatesPage;
