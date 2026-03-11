import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import HrSidebar from '../../components/hr/HrSidebar';
import NotificationBell from '../../components/common/NotificationBell';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('company');
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });

    useEffect(() => {
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
                            System Settings
                            <span className="page-subtitle">• Global Configuration</span>
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
                    <div className="section" style={{ minHeight: '500px' }}>
                        <div className="tabs-container" style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                            <button 
                                className={`tab-link ${activeTab === 'company' ? 'active' : ''}`}
                                onClick={() => setActiveTab('company')}
                                style={{ padding: '0.75rem 0.5rem', borderBottom: activeTab === 'company' ? '2px solid #2440f0' : 'none', background: 'none', color: activeTab === 'company' ? '#2440f0' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Company Profile
                            </button>
                            <button 
                                className={`tab-link ${activeTab === 'departments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('departments')}
                                style={{ padding: '0.75rem 0.5rem', borderBottom: activeTab === 'departments' ? '2px solid #2440f0' : 'none', background: 'none', color: activeTab === 'departments' ? '#2440f0' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Departments
                            </button>
                            <button 
                                className={`tab-link ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                                style={{ padding: '0.75rem 0.5rem', borderBottom: activeTab === 'notifications' ? '2px solid #2440f0' : 'none', background: 'none', color: activeTab === 'notifications' ? '#2440f0' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Notifications
                            </button>
                        </div>

                        {activeTab === 'company' && (
                            <div className="tab-pane">
                                <h3 style={{ marginBottom: '1.5rem' }}>Company Details</h3>
                                <div className="grid grid-cols-2 gap-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Company Name</label>
                                        <input type="text" className="form-input" defaultValue="Zoyaraa" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Industry</label>
                                        <input type="text" className="form-input" defaultValue="Technology & Human Resources" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Official Website</label>
                                        <input type="text" className="form-input" defaultValue="https://zoyaraa.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Headquarters</label>
                                        <input type="text" className="form-input" defaultValue="Tamil Nadu, India" />
                                    </div>
                                </div>
                                <button className="primary-btn" style={{ marginTop: '2rem' }}>Save Changes</button>
                            </div>
                        )}

                        {activeTab === 'departments' && (
                            <div className="tab-pane">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3>Active Departments</h3>
                                    <button className="secondary-btn btn-small">+ Add New</button>
                                </div>
                                <div className="departments-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    {['Engineering', 'Design', 'Marketing', 'Product', 'Sales', 'HR', 'Finance'].map(dept => (
                                        <div key={dept} className="card p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', minWidth: '150px', textAlign: 'center' }}>
                                            <div style={{ fontWeight: '700' }}>{dept}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>4 Active Roles</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="tab-pane">
                                <h3 style={{ marginBottom: '1.5rem' }}>Preferences</h3>
                                <div className="settings-list">
                                    {[
                                        { id: 'app_alerts', label: 'Candidate Application Alerts', desc: 'Get notified when someone applies to any internship' },
                                        { id: 'recruiter_alerts', label: 'Recruiter Activity Alerts', desc: 'Get notified when recruiters post or update roles' },
                                        { id: 'system_updates', label: 'Monthly System Reports', desc: 'Receive automated conversion reports via email' }
                                    ].map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{item.label}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                                            </div>
                                            <div className="toggle-switch" style={{ width: '40px', height: '20px', background: '#2440f0', borderRadius: '10px', position: 'relative' }}>
                                                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
