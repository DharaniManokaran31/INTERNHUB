// src/pages/hr/ViewCertificatePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import CertificateTemplate from '../../components/common/CertificateTemplate';

const ViewCertificatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const certRef = useRef(null);
    
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [userData, setUserData] = useState({
        name: 'HR Manager',
        initials: 'HR',
        role: 'hr'
    });

    useEffect(() => {
        fetchUserProfile();
        fetchCertificateDetails();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('https://internhub-backend-d870.onrender.com/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                const user = data.data?.user || data.user;
                const initials = user.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                setUserData({
                    name: user.fullName,
                    initials: initials,
                    role: 'hr'
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchCertificateDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const response = await fetch(`https://internhub-backend-d870.onrender.com/api/hr/certificates/verify/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setCertificate(data.data.certificate);
            } else {
                setError(data.message || 'Failed to fetch certificate details.');
            }
        } catch (error) {
            console.error('Error fetching certificate:', error);
            setError('Failed to load certificate data.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!certificate) return;
        
        setIsDownloading(true);
        showNotification('Preparing certificate download...', 'info');

        try {
            const element = certRef.current;
            if (!element) {
                throw new Error('Certificate template not found');
            }

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`${certificate.studentId?.fullName.replace(/\s+/g, '_')}_Internship_Certificate.pdf`);
            
            showNotification('Certificate downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showNotification('Failed to generate PDF. Please try again.', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        notification.textContent = message;
        notification.style.background = type === 'error'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #2440F0, #0B1DC1)';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    if (loading) {
        return (
            <div className="app-container">
                <main className="main-content" style={{ marginLeft: 0, width: '100%' }}>
                    <div className="loading-spinner-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <div className="loading-spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !certificate) {
        return (
            <div className="app-container">
                <main className="main-content" style={{ marginLeft: 0, width: '100%' }}>
                    <div className="error-container" style={{ textAlign: 'center', padding: '4rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ marginBottom: '1rem' }}>{error || 'Certificate Not Found'}</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem' }}>The certificate you are looking for does not exist or has been revoked.</p>
                        <button className="primary-btn" onClick={() => navigate('/hr/completed-interns')}>
                            Back to Completed Interns
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Main Content */}
            <main className="main-content" style={{ marginLeft: 0, width: '100%' }}>
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="secondary-btn" onClick={() => navigate(-1)} style={{ marginRight: '1rem', padding: '0.5rem' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <h2 className="page-title">Certificate Preview</h2>
                    </div>
                    <div className="top-bar-right">
                        <button 
                            className="primary-btn" 
                            onClick={handleDownload}
                            disabled={isDownloading}
                            style={{ marginRight: '1rem' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                        <NotificationBell />
                        <button className="logout-btn" onClick={handleLogout}>
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <div className="content-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
                    <div className="certificate-preview-container" style={{ 
                        boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                        maxWidth: '1000px',
                        width: '100%'
                    }}>
                        <CertificateTemplate 
                            certRef={certRef}
                            studentName={certificate.studentId?.fullName}
                            internshipTitle={certificate.internshipId?.title}
                            department={certificate.internshipId?.department}
                            skillsAcquired={certificate.skillsAcquired}
                            mentorName={certificate.mentorName || certificate.issuedBy?.fullName}
                            grade={certificate.grade}
                            issueDate={certificate.issueDate}
                            certificateId={certificate.certificateId}
                            template={certificate.template || 'professional'}
                        />
                    </div>
                    
                    <div style={{ marginTop: '3rem', width: '100%', maxWidth: '1000px' }}>
                        <div className="section" style={{ background: 'white', padding: '2rem', borderRadius: '12px' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Certificate Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Certificate ID</label>
                                    <p style={{ fontWeight: '500' }}>{certificate.certificateId}</p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Issue Date</label>
                                    <p style={{ fontWeight: '500' }}>{new Date(certificate.issueDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                                    <span className={`badge ${certificate.status === 'issued' ? 'badge-success' : 'badge-error'}`}>
                                        {certificate.status.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label style={{ color: '#64748b', fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Issued By</label>
                                    <p style={{ fontWeight: '500' }}>{certificate.issuedBy?.fullName || 'HR Management'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewCertificatePage;
