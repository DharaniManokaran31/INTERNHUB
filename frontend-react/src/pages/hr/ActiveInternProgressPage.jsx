import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService';
import ProgressChart from '../../components/logs/ProgressChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActiveInternProgressPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
        if (id) {
            fetchProgressData();
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

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await hrService.getInternProgress(id);
            if (response.success) {
                setData(response.data);
            } else {
                setError('Progress data not found.');
            }
        } catch (err) {
            console.error('Error fetching progress:', err);
            setError('Failed to load progress data.');
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
                            Intern Progress
                            <span className="page-subtitle">• Performance Analytics</span>
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
                    <button className="secondary-btn" style={{ marginBottom: '1.5rem' }} onClick={(e) => { createRippleEffect(e); navigate('/hr/active-interns'); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', marginRight: '0.5rem' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to List
                    </button>

                    {loading ? (
                        <p>Loading progress data...</p>
                    ) : error ? (
                        <div className="section" style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem' }}>{error}</div>
                    ) : (
                        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                            <div className="left-col">
                                <div className="section" style={{ minHeight: '300px', marginBottom: '2rem' }}>
                                    <h3 className="section-title">Performance Trend</h3>
                                    <div className="title-underline"></div>
                                    <div style={{ width: '100%', height: '250px', marginTop: '1rem' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.recentLogs?.length > 0 
                                                ? data.recentLogs.map(log => ({ 
                                                    date: new Date(log.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                                                    hours: log.hours 
                                                  })).reverse()
                                                : []}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                                <YAxis stroke="#94a3b8" fontSize={12} unit="h" />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="hours" stroke="#2440F0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="section">
                                    <h3 className="section-title">Recent Activity Logs</h3>
                                    <div className="title-underline"></div>
                                    <div className="recent-applications-list">
                                        {data.recentLogs && data.recentLogs.length > 0 ? (
                                            data.recentLogs.map(log => (
                                                <div key={log._id} className="recent-application-card" style={{ display: 'block' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <strong>{new Date(log.date).toLocaleDateString()}</strong>
                                                        <span className={`badge ${log.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                                            {log.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{log.description}</p>
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                                                        Hours Logged: {log.hours}h
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No activity logs recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="right-col">
                                <div className="section" style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div className="user-avatar-sidebar" style={{ width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 1rem' }}>
                                        {data.student?.fullName?.charAt(0)}
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem' }}>{data.student?.fullName}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{data.student?.email}</p>
                                </div>

                                <div className="section">
                                    <h4 style={{ margin: '0 0 1rem' }}>Internship Highlights</h4>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            <span>Overall Progress</span>
                                            <span style={{ fontWeight: '600', color: '#2440F0' }}>{data.progress}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: 'linear-gradient(90deg, #2440F0, #7c3aed)', width: `${data.progress}%`, transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>

                                    <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Logs</span>
                                        <span style={{ fontWeight: '600' }}>{data.totalLogs}</span>
                                    </div>
                                    <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Total Hours</span>
                                        <span style={{ fontWeight: '600' }}>{data.totalHours || 0}h</span>
                                    </div>
                                    <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Department</span>
                                        <span style={{ fontWeight: '600' }}>{data.internship?.department || 'N/A'}</span>
                                    </div>
                                    <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Duration</span>
                                        <span style={{ fontWeight: '600' }}>{data.internship?.duration} Months</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ActiveInternProgressPage;
