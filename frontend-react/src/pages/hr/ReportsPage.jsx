import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';

const ReportsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [reportStats, setReportStats] = useState({ recruiters: 0, internships: 0, applicants: 0, activeInterns: 0 });
    const [internships, setInternships] = useState([]);
    const [deptData, setDeptData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [timeRange, setTimeRange] = useState('all');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReportData();
        fetchUserProfile();
    }, [timeRange]);

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

    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [statsRes, distRes, internsRes] = await Promise.all([
                hrService.getReportsStats(),
                hrService.getDepartmentDistribution(),
                hrService.getAllInternships()
            ]);

            if (statsRes.success && statsRes.data) {
                const s = statsRes.data;
                setReportStats({
                    recruiters: s.totalRecruiters || 0,
                    internships: s.totalInternships || 0,
                    applicants: s.totalApplications || 0,
                    activeInterns: s.acceptedApplications || 0,
                    placementRate: s.placementRate || 0
                });
            }

            if (distRes.success && distRes.data) {
                setDeptData(distRes.data.distribution || []);
            }

            if (internsRes.success && internsRes.data) {
                setInternships(internsRes.data.internships || []);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Failed to load report analytics.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const exportToCSV = () => {
        if (!reportStats) return;
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Metric,Value\n"
            + `Total Recruiters,${reportStats.recruiters}\n`
            + `Active Internships,${reportStats.internships}\n`
            + `Total Applications,${reportStats.applicants}\n`
            + `Total Active Interns,${reportStats.activeInterns}\n`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `hr_report_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            Reports & Analytics
                            <span className="page-subtitle">• Data Insights</span>
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

                    <div className="action-buttons" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className={`secondary-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>This Week</button>
                            <button className={`secondary-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>This Month</button>
                            <button className={`secondary-btn ${timeRange === 'all' ? 'active' : ''}`} onClick={() => setTimeRange('all')}>All Time</button>
                        </div>
                        <button className="primary-btn" onClick={exportToCSV}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export Report
                        </button>
                    </div>

                    <div className="stats-grid" style={{ marginTop: '2rem' }}>
                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Applicants</div>
                                <div className="stat-value">{loading ? '...' : reportStats.applicants}</div>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>Cumulative interest</p>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                    <polyline points="17 6 23 6 23 12"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Placement Rate</div>
                                <div className="stat-value">{loading ? '...' : reportStats.placementRate}%</div>
                                <p style={{ fontSize: '0.75rem', color: '#10b981', margin: '0.5rem 0 0 0' }}>Applicants to Interns</p>
                            </div>
                            <div className="stat-icon green">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <polyline points="16 11 18 13 22 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Program Health</div>
                                <div className="stat-value">{reportStats.activeInterns > 0 ? 'Good' : 'Idle'}</div>
                                <p style={{ fontSize: '0.75rem', color: '#2440F0', margin: '0.5rem 0 0 0' }}>Real-time status</p>
                            </div>
                            <div className="stat-icon purple">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="two-column-grid">
                        <section className="section">
                            <h2 className="section-title">Department Distribution</h2>
                            <div className="title-underline"></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {loading ? (
                                    <p>Loading distribution...</p>
                                ) : deptData.length > 0 ? (
                                    deptData.map((dept, index) => {
                                        const colors = ['#2440F0', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b'];
                                        const percentage = reportStats.internships > 0 
                                            ? Math.round((dept.count / reportStats.internships) * 100) 
                                            : 0;
                                        
                                        return (
                                            <div key={dept.name || index}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                                    <span>{dept.name || 'Undefined'}</span>
                                                    <span style={{ fontWeight: '600' }}>{percentage}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        height: '100%', 
                                                        background: colors[index % colors.length], 
                                                        width: `${percentage}%`, 
                                                        transition: 'width 0.5s ease' 
                                                    }}></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No data available.</p>
                                )}
                            </div>
                        </section>

                        <section className="section">
                            <h2 className="section-title">Operational Metrics</h2>
                            <div className="title-underline"></div>
                            <div className="recent-applications-list">
                                <div className="recent-application-card">
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>Total Recruiters</h4>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Team managing interns</p>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2440F0' }}>{reportStats.recruiters}</span>
                                </div>
                                <div className="recent-application-card">
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>Active Internships</h4>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Live opportunities</p>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>{reportStats.internships}</span>
                                </div>
                                <div className="recent-application-card">
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>Currently Hosted</h4>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>Total active interns</p>
                                    </div>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{reportStats.activeInterns}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReportsPage;