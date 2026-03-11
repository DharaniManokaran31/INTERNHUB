import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';

const ApplicationDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState(null);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        fetchProfile();
        if (id) {
            fetchApplicationDetails();
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

    const fetchApplicationDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await hrService.getApplicationById(id);
            if (response.success) {
                setApplication(response.data.application);
            } else {
                setError('Application not found.');
            }
        } catch (err) {
            console.error('Error fetching application:', err);
            setError('Failed to load application details.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setSubmitting(true);
            const response = await hrService.updateApplicationStatus(id, newStatus);
            if (response.success) {
                await fetchApplicationDetails();
                alert(`Application ${newStatus} successfully!`);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleScheduleSubmit = async (interviewData) => {
        try {
            setSubmitting(true);
            const res = await hrService.scheduleInterview(id, interviewData);
            if (res.success) {
                setShowScheduleModal(false);
                await fetchApplicationDetails();
                alert('Interview scheduled successfully!');
            }
        } catch (err) {
            console.error('Error scheduling:', err);
            alert('Failed to schedule interview.');
        } finally {
            setSubmitting(false);
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
                            Application Review
                            <span className="page-subtitle">• Candidate Evaluation</span>
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
                    <button className="secondary-btn" style={{ marginBottom: '1.5rem' }} onClick={(e) => { createRippleEffect(e); navigate('/hr/applicants'); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to List
                    </button>

                    {loading ? (
                        <p>Loading application details...</p>
                    ) : error ? (
                        <div className="section" style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem' }}>{error}</div>
                    ) : application ? (
                        <div className="two-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                            <div className="left-col">
                                <div className="section" style={{ marginBottom: '2rem' }}>
                                    <h3 className="section-title">Candidate Profile</h3>
                                    <div className="title-underline"></div>
                                    <div style={{ padding: '1rem 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                            <div className="avatar" style={{ width: '80px', height: '80px', background: '#e0e7ff', color: '#2440f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '2rem', fontWeight: 'bold' }}>
                                                {application.student?.fullName?.charAt(0)}
                                            </div>
                                            <div>
                                                <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem' }}>{application.student?.fullName}</h1>
                                                <p style={{ margin: 0, color: '#64748b' }}>{application.student?.email}</p>
                                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>Applied for: <strong>{application.internship?.title}</strong></p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</h4>
                                                <span className={`badge ${application.status === 'accepted' ? 'badge-success' : application.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                    {application.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied Date</h4>
                                                <p style={{ margin: 0 }}>{new Date(application.appliedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="section">
                                    <h3 className="section-title">Cover Letter</h3>
                                    <div className="title-underline"></div>
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem', lineHeight: '1.6' }}>
                                        {application.coverLetter || "No cover letter provided."}
                                    </div>
                                </div>
                            </div>

                            <div className="right-col">
                                <div className="section" style={{ marginBottom: '2rem' }}>
                                    <h3 className="section-title">Actions</h3>
                                    <div className="title-underline"></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                        <button 
                                            className="secondary-btn" 
                                            style={{ backgroundColor: '#2440F0', color: 'white', border: 'none' }}
                                            disabled={submitting || application.status === 'accepted'}
                                            onClick={() => handleStatusUpdate('accepted')}
                                        >
                                            Accept Candidate
                                        </button>
                                        <button 
                                            className="secondary-btn"
                                            onClick={() => setShowScheduleModal(true)}
                                            disabled={submitting || application.status === 'rejected'}
                                        >
                                            Schedule Interview
                                        </button>
                                        <button 
                                            className="secondary-btn" 
                                            style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                                            disabled={submitting || application.status === 'rejected'}
                                            onClick={() => handleStatusUpdate('rejected')}
                                        >
                                            Reject Application
                                        </button>
                                    </div>
                                </div>

                                <div className="section">
                                    <h3 className="section-title">Quick Student Stats</h3>
                                    <div className="title-underline"></div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Education</span>
                                            <span style={{ fontWeight: '600', fontSize: '0.8125rem', textAlign: 'right' }}>{application.student?.education?.college || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Skills</span>
                                            <span style={{ fontWeight: '600', fontSize: '0.8125rem' }}>{application.student?.skills?.length || 0} skills</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>No application found.</p>
                    )}
                </div>
            </main>

            {showScheduleModal && (
                <ScheduleInterviewModal 
                    round={{ roundNumber: (application?.interviews?.length || 0) + 1, roundType: 'Technical Interview' }}
                    onClose={() => setShowScheduleModal(false)}
                    onSubmit={handleScheduleSubmit}
                />
            )}
        </div>
    );
};

export default ApplicationDetailsPage;
