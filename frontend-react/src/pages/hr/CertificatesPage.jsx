import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';
import IssueCertificateModal from '../../components/modals/IssueCertificateModal';

const CertificatesPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [stats, setStats] = useState({ issued: 0, eligible: 0, revoked: 0 });
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAllData();
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

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [eligibleRes, statsRes] = await Promise.all([
                hrService.getCertificateEligible(),
                hrService.getCertificateStats()
            ]);

            if (eligibleRes.success) {
                setEligibleStudents(eligibleRes.data.eligible || eligibleRes.data || []);
            }

            if (statsRes.success && statsRes.data) {
                setStats({
                    issued: statsRes.data.totalIssued || 0,
                    eligible: (eligibleRes.data.eligible || eligibleRes.data || []).length,
                    revoked: statsRes.data.totalRevoked || 0
                });
            }
        } catch (error) {
            console.error('Error fetching certificate data:', error);
            setError('Failed to load certification data.');
        } finally {
            setLoading(false);
        }
    };

    const handleIssueInitiative = (student) => {
        setSelectedStudent(student);
        setShowIssueModal(true);
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
                            Certificates
                            <span className="page-subtitle">• Issuance Management</span>
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
                                <div className="stat-label">Total Issued</div>
                                <div className="stat-value">{stats.issued}</div>
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
                                <div className="stat-label">Ready for Issuance</div>
                                <div className="stat-value">{stats.eligible}</div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="8" r="4"></circle>
                                    <path d="M5.5 20v-2a6 6 0 0 1 12 0v2"></path>
                                    <path d="M12 12v4"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Stability Index</div>
                                <div className="stat-value">Active</div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>Internal system audit</p>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <section className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="section-title">Eligible Candidates</h2>
                            <button className="secondary-btn" onClick={fetchAllData} style={{ fontSize: '0.8rem' }}>Refresh</button>
                        </div>
                        <div className="title-underline"></div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Project / Role</th>
                                        <th>Application Date</th>
                                        <th>Department</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-10">Loading eligible candidates...</td></tr>
                                    ) : eligibleStudents.length > 0 ? (
                                        eligibleStudents.map(student => (
                                            <tr key={student?._id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div className="user-avatar-sidebar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                                            {student?.student?.fullName?.charAt(0) || 'S'}
                                                        </div>
                                                        <div>
                                                            <div className="item-title">{student?.student?.fullName || 'Unknown'}</div>
                                                            <div className="item-subtitle">{student?.student?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{student?.internship?.title || 'Program Completion'}</td>
                                                <td>{student?.appliedAt ? new Date(student.appliedAt).toLocaleDateString() : 'N/A'}</td>
                                                <td><span className="badge badge-info">{student?.internship?.department || 'N/A'}</span></td>
                                                <td>
                                                    <button 
                                                        className="primary-btn" 
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                        onClick={() => handleIssueInitiative(student)}
                                                    >
                                                        Issue Certificate
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center py-10">No students currently eligible for certificates.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            {showIssueModal && (
                <IssueCertificateModal 
                    studentData={selectedStudent}
                    onClose={() => setShowIssueModal(false)}
                    onSuccess={fetchAllData}
                />
            )}
        </div>
    );
};

export default CertificatesPage;
