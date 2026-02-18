import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentProfile.css';

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'admin'
  });
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
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/admin/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const user = data.data.user;
          const profile = {
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'admin'
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

    fetchProfile();
  }, [navigate]);

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
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
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
      
      const response = await fetch('http://localhost:5000/api/admin/change-password', {
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
      showNotification('Network error', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          phone: profileData.phone
        })
      });

      const data = await response.json();

      if (data.success) {
        setOriginalData(profileData);
        setIsEditMode(false);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.fullName = profileData.fullName;
        localStorage.setItem('user', JSON.stringify(user));
        
        showNotification('Profile updated successfully!', 'success');
      } else {
        showNotification(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('Failed to update profile', 'error');
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
    if (!name) return 'AD';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="profile-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header Section with Gradient */}
      <div className="profile-header-gradient admin-gradient">
        <div className="profile-header-content">
          <div className="profile-title-section">
            <h1>Admin Profile</h1>
            <p>Manage your administrator account details</p>
          </div>
          <div className="profile-avatar-large admin-avatar">
            <span className="avatar-initials">{getInitials(profileData.fullName)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content-wrapper">
        {/* Action Buttons */}
        <div className="profile-actions-bar">
          {!isEditMode ? (
            <>
              <button 
                className="profile-edit-btn admin-edit-btn"
                onClick={(e) => { createRippleEffect(e); setIsEditMode(true); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                </svg>
                Edit Profile
              </button>
              <button 
                className="profile-edit-btn admin-password-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Change Password
              </button>
            </>
          ) : (
            <div className="profile-action-group">
              <button 
                className="profile-save-btn admin-save-btn"
                onClick={(e) => { createRippleEffect(e); handleSave(); }}
                disabled={isSaving}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="profile-cancel-btn"
                onClick={(e) => { createRippleEffect(e); handleCancel(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Profile Stats Cards */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card admin-stat-card">
            <div className="profile-stat-icon admin-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-label">Admin Name</span>
              <span className="profile-stat-value">{profileData.fullName || 'Not set'}</span>
            </div>
          </div>

          <div className="profile-stat-card admin-stat-card">
            <div className="profile-stat-icon admin-icon-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-10 7L2 7"></path>
              </svg>
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-label">Email</span>
              <span className="profile-stat-value">{profileData.email}</span>
            </div>
          </div>

          <div className="profile-stat-card admin-stat-card">
            <div className="profile-stat-icon admin-icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-label">Role</span>
              <span className="profile-stat-value">Administrator</span>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="profile-sections">
          {/* Personal Information */}
          <div className="profile-section-card admin-section-card">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h2>Personal Information</h2>
              </div>
              <p className="profile-section-subtitle">Your basic account details</p>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-field full-width">
                <label>FULL NAME</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="profile-input admin-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.fullName || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field full-width">
                <label>EMAIL ADDRESS</label>
                <div className="profile-field-display email-field">
                  <span>{profileData.email}</span>
                  <small>Email cannot be changed</small>
                </div>
              </div>

              <div className="profile-form-field full-width">
                <label>PHONE NUMBER</label>
                {isEditMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="profile-input admin-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field full-width">
                <label>ROLE</label>
                <div className="profile-field-display role-badge">
                  <span className="admin-role-badge">Administrator</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="profile-section-card admin-section-card">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <h2>Account Information</h2>
              </div>
              <p className="profile-section-subtitle">Security and account details</p>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="info-label">Account Type</span>
                <span className="info-value admin-value">Administrator</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Last Password Change</span>
                <span className="info-value">Not available</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Two-Factor Auth</span>
                <span className="info-value">Not enabled</span>
              </div>
              <div className="profile-info-item">
                <span className="info-label">Login Sessions</span>
                <span className="info-value">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button
                className="close-modal"
                onClick={() => setShowPasswordModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={passwordErrors.currentPassword ? 'error' : ''}
                />
                {passwordErrors.currentPassword && (
                  <small className="error-text">{passwordErrors.currentPassword}</small>
                )}
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={passwordErrors.newPassword ? 'error' : ''}
                />
                {passwordErrors.newPassword && (
                  <small className="error-text">{passwordErrors.newPassword}</small>
                )}
                <small className="hint-text">
                  Must be at least 6 characters
                </small>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={passwordErrors.confirmPassword ? 'error' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <small className="error-text">{passwordErrors.confirmPassword}</small>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn admin-primary-btn"
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

export default AdminProfilePage;