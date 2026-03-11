import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';

const HrProfilePage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        department: '',
        designation: '',
        phone: '',
        initials: 'HR'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const user = data.data?.user || data.user;
                setProfileData({
                    fullName: user.fullName || '',
                    email: user.email || '',
                    department: user.department || 'Administration',
                    designation: user.designation || 'HR Manager',
                    phone: user.phone || '',
                    initials: user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/recruiters/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            const data = await response.json();
            if (data.success) {
                setIsEditMode(false);
                // Update local storage name if needed
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.fullName = profileData.fullName;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
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
                userData={profileData} 
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
                            My Profile
                            <span className="page-subtitle">• Personal Settings</span>
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
                    <div className="section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div className="user-avatar-sidebar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                {profileData.initials}
                            </div>
                            <div>
                                <h1 style={{ margin: 0, color: '#1a1f36' }}>{profileData.fullName}</h1>
                                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>{profileData.designation} • {profileData.department}</p>
                            </div>
                        </div>

                        <div className="action-buttons" style={{ marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                            {!isEditMode ? (
                                <button className="primary-btn" onClick={(e) => { createRippleEffect(e); setIsEditMode(true); }}>
                                    Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="primary-btn" onClick={(e) => { createRippleEffect(e); handleSave(); }} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button className="secondary-btn" onClick={() => setIsEditMode(false)}>
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
                                <div className="stat-info">
                                    <div className="stat-label">ACCOUNT TYPE</div>
                                    <div className="stat-value" style={{ fontSize: '1rem', color: '#2440F0' }}>HR ADMINISTRATOR</div>
                                </div>
                            </div>
                            <div className="stat-card" style={{ background: '#f8fafc', boxShadow: 'none' }}>
                                <div className="stat-info">
                                    <div className="stat-label">JOINED DATE</div>
                                    <div className="stat-value" style={{ fontSize: '1rem' }}>Aug 2024</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Full Name</label>
                                    {isEditMode ? (
                                        <input 
                                            type="text" 
                                            className="profile-input" 
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            value={profileData.fullName}
                                            onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontWeight: '500' }}>{profileData.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email Address</label>
                                    <p style={{ margin: 0, fontWeight: '500' }}>{profileData.email}</p>
                                    <small style={{ color: '#94a3b8' }}>Login email cannot be changed</small>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Phone Number</label>
                                    {isEditMode ? (
                                        <input 
                                            type="tel" 
                                            className="profile-input" 
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        />
                                    ) : (
                                        <p style={{ margin: 0, fontWeight: '500' }}>{profileData.phone || 'Not provided'}</p>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Department</label>
                                    <p style={{ margin: 0, fontWeight: '500' }}>{profileData.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HrProfilePage;
