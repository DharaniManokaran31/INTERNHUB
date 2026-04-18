// src/pages/recruiter/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ Added useLocation
import NotificationBell from '../../components/common/NotificationBell';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';
import '../../styles/StudentProfile.css'; // Reuse the same styles

const RecruiterProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Added this line
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    company: 'Zoyaraa', // Default to Zoyaraa
    department: '',
    designation: '',
    position: '',
    phone: '',
    companyDescription: '',
    website: '',
    linkedin: '',
    permissions: {
      maxInterns: 3
    },
    profilePicture: ''
  });
  const [menteesCount, setMenteesCount] = useState(0);
  const [originalData, setOriginalData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchProfile();
    fetchMenteesCount();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        const profile = {
          fullName: user.fullName || '',
          email: user.email || '',
          company: 'Zoyaraa', // Force Zoyaraa
          department: user.department || '',
          designation: user.designation || '',
          position: user.position || '',
          phone: user.phone || '',
          companyDescription: user.companyDescription || '',
          website: user.website || '',
          linkedin: user.linkedin || '',
          permissions: user.permissions || { maxInterns: 3 },
          profilePicture: user.profilePicture || ''
        };
        setProfileData(profile);
        setOriginalData(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showNotification('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenteesCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/mentees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setMenteesCount(data.data.total || data.data.mentees?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching mentees count:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handlePasswordSubmit = async () => {
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Password changed successfully!', 'success');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        showNotification(data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('https://internhub-backend-d879.onrender.com/api/recruiters/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        setOriginalData(profileData);
        setIsEditMode(false);

        // Update localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.fullName = profileData.fullName;
        storedUser.department = profileData.department;
        localStorage.setItem('user', JSON.stringify(storedUser));

        showNotification('Profile updated successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditMode(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const showNotification = (message, type = 'success') => {
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2440F0, #0B1DC1)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
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

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const getInitials = (name) => {
    if (!name) return 'RC';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner"></div>
        <p style={{ color: '#666' }}>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Unified Sidebar */}
      <RecruiterSidebar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        userData={{
            name: profileData.fullName,
            initials: getInitials(profileData.fullName),
            department: profileData.department,
            company: profileData.company,
            email: profileData.email
        }} 
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
            <h2 className="page-title">
              Recruiter Profile
              {profileData.department && (
                <span style={{
                  fontSize: '0.9rem',
                  marginLeft: '1rem',
                  color: '#666',
                  background: '#EEF2FF',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px'
                }}>
                  {profileData.department} Department
                </span>
              )}
            </h2>
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
          {/* Header Section with Gradient */}
          <div className="profile-header-gradient" style={{
            background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem'
            }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Recruiter Profile
                </h1>
                <p style={{ opacity: 0.9 }}>Manage your information and recruiter settings</p>
              </div>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'white',
                color: '#2440F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: '600'
              }}>
                {getInitials(profileData.fullName)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '2rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {!isEditMode ? (
              <>
                <button
                  className="primary-btn"
                  onClick={(e) => { createRippleEffect(e); setIsEditMode(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                  </svg>
                  Edit Profile
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setShowPasswordModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Change Password
                </button>
              </>
            ) : (
              <>
                <button
                  className="primary-btn"
                  onClick={(e) => { createRippleEffect(e); handleSave(); }}
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="secondary-btn"
                  onClick={(e) => { createRippleEffect(e); handleCancel(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Profile Stats Cards - FIXED ALIGNMENT */}
          <div className="stats-grid" style={{
            marginBottom: '2rem',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem'
          }}>
            <div className="stat-card" style={{ padding: '1.25rem 1rem' }}>
              <div className="stat-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-label" style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Recruiter Name
                </div>
                <div className="stat-value" style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profileData.fullName ? (
                    profileData.fullName.length > 15
                      ? profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                      : profileData.fullName
                  ) : 'Not set'}
                </div>
                {profileData.fullName && profileData.fullName.length > 15 && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {profileData.fullName}
                  </div>
                )}
              </div>
              <div className="stat-icon blue" style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem 1rem' }}>
              <div className="stat-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-label" style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Email
                </div>
                <div className="stat-value" style={{
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profileData.email ? (
                    profileData.email.length > 18
                      ? profileData.email.substring(0, 15) + '...'
                      : profileData.email
                  ) : 'Not set'}
                </div>
              </div>
              <div className="stat-icon green" style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-10 7L2 7"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem 1rem' }}>
              <div className="stat-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-label" style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Company
                </div>
                <div className="stat-value" style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Zoyaraa
                </div>
              </div>
              <div className="stat-icon orange" style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem 1rem' }}>
              <div className="stat-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-label" style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Department
                </div>
                <div className="stat-value" style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profileData.department || 'Not set'}
                </div>
              </div>
              <div className="stat-icon purple" style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1.25rem 1rem' }}>
              <div className="stat-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="stat-label" style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Mentor Capacity
                </div>
                <div className="stat-value" style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {menteesCount}/{profileData.permissions?.maxInterns || 3}
                </div>
              </div>
              <div className="stat-icon blue" style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Personal Information */}
            <div className="section" style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>
                  Personal Information
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem'
              }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    FULL NAME
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span>{profileData.fullName || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span>{profileData.email}</span>
                    <small style={{ display: 'block', color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                      Email cannot be changed
                    </small>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    DEPARTMENT
                  </label>
                  {isEditMode ? (
                    <select
                      name="department"
                      value={profileData.department}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    >
                      <option value="">Select Department</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Sales">Sales</option>
                      <option value="UI/UX">UI/UX</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span>{profileData.department || 'Not assigned'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    DESIGNATION
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="designation"
                      value={profileData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Tech Lead"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span>{profileData.designation || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    POSITION
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      name="position"
                      value={profileData.position}
                      onChange={handleInputChange}
                      placeholder="e.g., HR Manager"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span>{profileData.position || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    PHONE NUMBER
                  </label>
                  {isEditMode ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span>{profileData.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="section" style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#1e293b' }}>
                  Company Information
                </h3>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Zoyaraa - Your organization
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem'
              }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    COMPANY NAME
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span>Zoyaraa</span>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    COMPANY DESCRIPTION
                  </label>
                  {isEditMode ? (
                    <textarea
                      name="companyDescription"
                      value={profileData.companyDescription}
                      onChange={handleInputChange}
                      placeholder="Tell applicants about your company, culture, and values..."
                      rows="4"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      minHeight: '100px'
                    }}>
                      <span>{profileData.companyDescription || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    WEBSITE
                  </label>
                  {isEditMode ? (
                    <input
                      type="url"
                      name="website"
                      value={profileData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourcompany.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {profileData.website ? (
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2440F0' }}>
                          {profileData.website}
                        </a>
                      ) : (
                        <span>Not provided</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', display: 'block' }}>
                    LINKEDIN
                  </label>
                  {isEditMode ? (
                    <input
                      type="url"
                      name="linkedin"
                      value={profileData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/company/yourcompany"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {profileData.linkedin ? (
                        <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#2440F0' }}>
                          {profileData.linkedin}
                        </a>
                      ) : (
                        <span>Not provided</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Change Password</h2>
              <button
                className="close-modal"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: passwordErrors.currentPassword ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem'
                  }}
                />
                {passwordErrors.currentPassword && (
                  <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {passwordErrors.currentPassword}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: passwordErrors.newPassword ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem'
                  }}
                />
                {passwordErrors.newPassword && (
                  <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {passwordErrors.newPassword}
                  </small>
                )}
                <small style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
                  Must be at least 8 characters
                </small>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: passwordErrors.confirmPassword ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem'
                  }}
                />
                {passwordErrors.confirmPassword && (
                  <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {passwordErrors.confirmPassword}
                  </small>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                className="secondary-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handlePasswordSubmit}
                disabled={changingPassword}
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterProfilePage;