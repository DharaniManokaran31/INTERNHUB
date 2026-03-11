import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService.js';
import InviteRecruiterModal from '../../components/modals/InviteRecruiterModal';
import EditRecruiterModal from '../../components/modals/EditRecruiterModal';

const ManageRecruitersPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [recruiters, setRecruiters] = useState({ active: [], pending: [] });
    const [stats, setStats] = useState({ activeCount: 0, pendingCount: 0, totalCount: 0 });
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRecruiter, setSelectedRecruiter] = useState(null);
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });

    useEffect(() => {
        fetchRecruiters();
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

    const fetchRecruiters = async () => {
        try {
            setLoading(true);
            const response = await hrService.getAllRecruiters();
            if (response.success) {
                setRecruiters(response.data);
                setStats({
                    activeCount: response.data.active.length,
                    pendingCount: response.data.pending.length,
                    totalCount: response.data.active.length + response.data.pending.length
                });
            }
        } catch (error) {
            console.error('Error fetching recruiters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        if (window.confirm('Are you sure you want to revoke this invitation?')) {
            try {
                const response = await hrService.revokeInvitation(id);
                if (response.success) fetchRecruiters();
            } catch (error) {
                console.error('Error revoking invitation:', error);
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const response = await hrService.updateRecruiterStatus(id, !currentStatus);
            if (response.success) fetchRecruiters();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleEdit = (recruiter) => {
        setSelectedRecruiter(recruiter);
        setShowEditModal(true);
    };

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
                            Recruiters
                            <span className="page-subtitle">• Team Management</span>
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
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Total Recruiters</div>
                                <div className="stat-value">{stats.totalCount}</div>
                            </div>
                            <div className="stat-icon blue">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <div className="stat-label">Active Members</div>
                                <div className="stat-value">{stats.activeCount}</div>
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
                                <div className="stat-label">Pending Invites</div>
                                <div className="stat-value">{stats.pendingCount}</div>
                            </div>
                            <div className="stat-icon orange">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="primary-btn" onClick={(e) => { createRippleEffect(e); setShowInviteModal(true); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Invite New Recruiter
                        </button>
                    </div>

                    <section className="section">
                        <h2 className="section-title">Active Team Members</h2>
                        <div className="title-underline"></div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Department</th>
                                        <th>Access</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5">Loading...</td></tr>
                                    ) : recruiters.active.map(recruiter => (
                                        <tr key={recruiter._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="user-avatar-sidebar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                                        {recruiter.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="item-title">{recruiter.fullName}</div>
                                                        <div className="item-subtitle">{recruiter.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-info">{recruiter.department}</span></td>
                                            <td>{recruiter.internshipLimit || 0} Slots</td>
                                            <td>
                                                <span className={`badge ${recruiter.isActive ? 'badge-success' : 'badge-error'}`}>
                                                    {recruiter.isActive ? 'Active' : 'Deactivated'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleEdit(recruiter)}>Edit</button>
                                                    <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: recruiter.isActive ? '#ef4444' : '#10b981' }} onClick={() => toggleStatus(recruiter._id, recruiter.isActive)}>
                                                        {recruiter.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="section">
                        <h2 className="section-title">Pending Invitations</h2>
                        <div className="title-underline"></div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Recipient</th>
                                        <th>Department</th>
                                        <th>Sent Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5">Loading...</td></tr>
                                    ) : recruiters.pending.length > 0 ? (
                                        recruiters.pending.map(invite => (
                                            <tr key={invite._id}>
                                                <td>{invite.email}</td>
                                                <td><span className="badge badge-purple">{invite.department}</span></td>
                                                <td>{new Date(invite.createdAt).toLocaleDateString()}</td>
                                                <td><span className="badge badge-warning">Pending</span></td>
                                                <td>
                                                    <button className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ef4444' }} onClick={() => handleRevoke(invite._id)}>Revoke</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center">No pending invitations.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            {showInviteModal && (
                <InviteRecruiterModal 
                    onClose={() => setShowInviteModal(false)} 
                    onSuccess={fetchRecruiters} 
                />
            )}

            {showEditModal && (
                <EditRecruiterModal 
                    recruiter={selectedRecruiter}
                    onClose={() => setShowEditModal(false)} 
                    onSuccess={fetchRecruiters} 
                />
            )}
        </div>
    );
};

export default ManageRecruitersPage;