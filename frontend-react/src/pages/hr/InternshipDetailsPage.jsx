import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import hrService from '../../services/hrService';
import HrSidebar from '../../components/hr/HrSidebar';

const InternshipDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [internship, setInternship] = useState(null);
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState('details');
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
        if (id) {
            loadInternshipData();
        }
    }, [id]);

    const fetchProfile = async () => {
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

    const loadInternshipData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch both in parallel
            const [intResponse, appsResponse] = await Promise.all([
                hrService.getInternshipById(id),
                hrService.getInternshipApplications(id)
            ]);

            if (intResponse.success) {
                setInternship(intResponse.data.internship);
            } else {
                setError('Internship details not found.');
            }

            if (appsResponse.success) {
                const apps = appsResponse.data.applications || [];
                setApplications(apps);
            }
        } catch (err) {
            console.error('Error loading internship data:', err);
            setError('Failed to load internship details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
                            Internship Analysis
                            <span className="page-subtitle">• Detailed View</span>
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
                    <button className="secondary-btn" style={{ marginBottom: '1.5rem' }} onClick={(e) => { createRippleEffect(e); navigate('/hr/internships'); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to List
                    </button>

                    {loading ? (
                        <p>Loading details...</p>
                    ) : internship ? (
                        <>
                            <div className="section" style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div>
                                        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1a1f36' }}>{internship.title}</h1>
                                        <p style={{ color: '#64748b', margin: 0 }}>
                                            Posted by: <strong>{internship.postedBy?.fullName}</strong> • {internship.postedBy?.email}
                                        </p>
                                    </div>
                                    <span className={`badge ${internship.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                        {internship.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="stats-grid" style={{ marginBottom: 0 }}>
                                    <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
                                        <div className="stat-info">
                                            <div className="stat-label">Applications</div>
                                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{applications.length}</div>
                                        </div>
                                    </div>
                                    <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
                                        <div className="stat-info">
                                            <div className="stat-label">Department</div>
                                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{internship.department}</div>
                                        </div>
                                    </div>
                                    <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
                                        <div className="stat-info">
                                            <div className="stat-label">Duration</div>
                                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{internship.duration} Months</div>
                                        </div>
                                    </div>
                                    <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
                                        <div className="stat-info">
                                            <div className="stat-label">Stipend</div>
                                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>₹{internship.stipend}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="action-buttons" style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
                                <button 
                                    className={`secondary-btn ${activeTab === 'details' ? 'active' : ''}`} 
                                    style={{ borderBottom: activeTab === 'details' ? '2px solid #2440F0' : 'none', borderRadius: '0' }}
                                    onClick={() => setActiveTab('details')}
                                >
                                    Role Overview
                                </button>
                                <button 
                                    className={`secondary-btn ${activeTab === 'applicants' ? 'active' : ''}`} 
                                    style={{ borderBottom: activeTab === 'applicants' ? '2px solid #2440F0' : 'none', borderRadius: '0' }}
                                    onClick={() => setActiveTab('applicants')}
                                >
                                    Candidate List ({applications.length})
                                </button>
                            </div>

                            {activeTab === 'details' ? (
                                <div className="two-column-grid">
                                    <section className="section">
                                        <h2 className="section-title">Job Description</h2>
                                        <div className="title-underline"></div>
                                        <p style={{ lineHeight: '1.6', color: '#444' }}>{internship.description}</p>
                                        
                                        <h2 className="section-title" style={{ marginTop: '2rem' }}>Skills Required</h2>
                                        <div className="title-underline"></div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                            {internship.skillsRequired?.map((skill, index) => (
                                                <span key={index} className="badge badge-info">{skill.name}</span>
                                            ))}
                                        </div>
                                    </section>
                                    <section className="section">
                                        <h2 className="section-title">Program Timeline</h2>
                                        <div className="title-underline"></div>
                                        <div className="recent-applications-list">
                                            <div className="recent-application-card">
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0 }}>Start Date</h4>
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{new Date(internship.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="recent-application-card">
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0 }}>End Date</h4>
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{new Date(internship.endDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="recent-application-card" style={{ background: '#fff7ed' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, color: '#f59e0b' }}>Application Deadline</h4>
                                                </div>
                                                <span style={{ fontWeight: '600', color: '#f59e0b' }}>{new Date(internship.deadline).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            ) : (
                                <section className="section">
                                    <h2 className="section-title">Applicants for this Role</h2>
                                    <div className="title-underline"></div>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Candidate</th>
                                                    <th>Status</th>
                                                    <th>Applied On</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {applications.length > 0 ? (
                                                    applications.map(app => (
                                                        <tr key={app._id}>
                                                            <td>
                                                                <div className="item-title">{app.student?.fullName}</div>
                                                                <div className="item-subtitle">{app.student?.email}</div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${app.status === 'accepted' ? 'badge-success' : 'badge-info'}`}>
                                                                    {app.status.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                                                            <td>
                                                                <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => navigate(`/hr/applicants/${app._id}`)}>
                                                                    Review
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="4" className="text-center">No applications yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <p>Internship not found.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InternshipDetailsPage;