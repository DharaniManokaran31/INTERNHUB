// src/pages/student/CertificatesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse existing styles
import NotificationBell from '../../components/common/NotificationBell';
import StudentSidebar from '../../components/layout/StudentSidebar';
import CertificateTemplate from '../../components/common/CertificateTemplate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

const CertificatesPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const certRef = useRef(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'ST',
    role: 'student'
  });

  // Fetch user profile
  useEffect(() => {
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
            initials: initials,
            role: user.role
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch certificates
  useEffect(() => {
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

    fetchCertificates();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
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

  const handleDownload = async (cert) => {
    setSelectedCert(cert);
    setIsDownloading(true);
    showNotification('Preparing your certificate...', 'info');

    // Wait for the template to render with new data
    setTimeout(async () => {
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
        pdf.save(`${userData.name.replace(/\s+/g, '_')}_Internship_Certificate.pdf`);
        
        showNotification('Certificate downloaded successfully!', 'success');
      } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Failed to generate PDF. Please try again.', 'error');
      } finally {
        setIsDownloading(false);
      }
    }, 500);
  };

  const handleVerify = (certId) => {
    // Copy verification code to clipboard
    navigator.clipboard.writeText(certId).then(() => {
      showNotification('Certificate ID copied to clipboard! You can verify on the public portal.', 'success');
    }).catch(() => {
      showNotification(`Verification ID: ${certId}`, 'info');
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="app-container">
      {/* Unified Sidebar */}
      <StudentSidebar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        userData={userData} 
      />

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button
              className="menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">My Certificates</h2>
          </div>
          <div className="top-bar-right">
            <NotificationBell />
            <button className="logout-btn" onClick={handleLogout}>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">Your Achievements</h1>
            <p className="page-subtitle">View and download your official internship completion certificates</p>
          </div>

          {/* Certificates Grid */}
          {loading ? (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card" style={{ height: '250px' }}></div>
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <h3>No certificates issued yet</h3>
              <p>
                Once you complete an internship and it's verified by HR,<br />
                your certificate will appear here.
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate('/student/active-internship')}
              >
                View Active Internship
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {certificates.map((cert) => (
                <div key={cert._id} className="application-card" style={{ padding: '1.5rem', height: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {/* Certificate Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="stat-icon blue" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15l-3-3m0 0l3-3m-3 3h8M2 13v11h20V13m-20 0l10-10 10 10"></path>
                      </svg>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: '#E6F7E6',
                      color: '#10b981'
                    }}>
                      ✓ VERIFIED
                    </span>
                  </div>

                  {/* Certificate Details */}
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '600' }}>
                    {cert.internshipId?.title || cert.internship?.title || 'Internship Certificate'}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                    {cert.internshipId?.department || cert.internship?.department || 'Department'} • Zoyaraa
                  </p>

                  {/* Grade & Skills */}
                  {cert.grade && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#f1f5f9',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        Grade: {cert.grade}
                      </span>
                    </div>
                  )}

                  {cert.skillsAcquired && cert.skillsAcquired.length > 0 && (
                    <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {cert.skillsAcquired.slice(0, 3).map((skill, i) => (
                        <span key={i} style={{
                          padding: '0.2rem 0.5rem',
                          background: '#EEF2FF',
                          color: '#2440F0',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          {skill}
                        </span>
                      ))}
                      {cert.skillsAcquired.length > 3 && (
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          +{cert.skillsAcquired.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '1rem 0', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                      <span>Issued: {formatDate(cert.issueDate)}</span>
                      <span>ID: {cert.certificateId?.slice(-8) || cert._id.slice(-8)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        className="primary-btn"
                        onClick={() => handleDownload(cert)}
                        disabled={isDownloading}
                        style={{ 
                          flex: 1, 
                          padding: '0.75rem',
                          background: isDownloading && selectedCert?._id === cert._id ? '#9ca3af' : 'linear-gradient(135deg, #2440F0, #0B1DC1)',
                          cursor: isDownloading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isDownloading && selectedCert?._id === cert._id ? (
                          'Downloading...'
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => handleVerify(cert.certificateId || cert._id)}
                        style={{ padding: '0.75rem' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Hidden Certificate Template for PDF Generation */}
      {selectedCert && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <CertificateTemplate 
            certRef={certRef}
            studentName={userData.name}
            internshipTitle={selectedCert.internshipId?.title || selectedCert.internship?.title}
            department={selectedCert.internshipId?.department || selectedCert.internship?.department}
            skillsAcquired={selectedCert.skillsAcquired}
            mentorName={selectedCert.issuedBy?.fullName || selectedCert.mentorName}
            grade={selectedCert.grade}
            issueDate={selectedCert.issueDate}
            certificateId={selectedCert.certificateId}
            template={selectedCert.template || 'professional'}
          />
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;