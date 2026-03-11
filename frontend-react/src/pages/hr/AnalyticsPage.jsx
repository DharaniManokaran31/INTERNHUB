import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import '../../styles/StudentDashboard.css';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService';
import NotificationBell from '../../components/common/NotificationBell';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState({ applicationsOverTime: [], hiresOverTime: [] });
    const [conversion, setConversion] = useState({ applicationToHire: 0, interviewToOffer: 0, departmentWise: [] });
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });

    useEffect(() => {
        fetchAnalyticsData();
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

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const [trendsRes, convRes] = await Promise.all([
                hrService.getReportsTrends('month'),
                hrService.getReportsConversion()
            ]);
            
            if (trendsRes.success) setTrends(trendsRes.data);
            if (convRes.success) setConversion(convRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#2440F0', '#7c3aed', '#ec4899', '#f59e0b', '#10b981'];

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
                            Talent Analytics
                            <span className="page-subtitle">• Conversion Insights</span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* Applications Trend Chart */}
                        <div className="section" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                Recruitment Momentum
                                <span className="badge badge-info">Monthly</span>
                            </h3>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trends.applicationsOverTime}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#2440F0" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Department Wise Conversion */}
                        <div className="section" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Dept Conversion Rates</h3>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={conversion.departmentWise}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} />
                                        <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                                        <Tooltip />
                                        <Bar dataKey="conversion" radius={[4, 4, 0, 0]}>
                                            {conversion.departmentWise.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Conversion Funnel Summary */}
                        <div className="section" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Global Funnel Visualization</h3>
                            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                                <div className="card p-6" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f0f4ff, #e0e7ff)' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#2440f0' }}>{conversion.applicationToHire}%</div>
                                    <div style={{ color: '#64748b', fontWeight: '600' }}>App-to-Hire Rate</div>
                                </div>
                                <div className="card p-6" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>{conversion.interviewToOffer}%</div>
                                    <div style={{ color: '#64748b', fontWeight: '600' }}>Interview-to-Offer</div>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Department</th>
                                            <th>Success Rate</th>
                                            <th>Efficiency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conversion.departmentWise.map((dept, idx) => (
                                            <tr key={idx}>
                                                <td>{dept.department}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1, background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${dept.conversion}%`, background: COLORS[idx % COLORS.length], height: '100%' }}></div>
                                                        </div>
                                                        <span style={{ fontWeight: '700' }}>{dept.conversion.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-success">Optimal</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AnalyticsPage;
