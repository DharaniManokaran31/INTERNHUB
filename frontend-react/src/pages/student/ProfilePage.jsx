import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentProfile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    education: {
      college: '',
      department: '',
      yearOfStudy: '',
      course: '',
      specialization: ''
    },
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: ''
  });
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/students/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const user = data.data.student;
          const profile = {
            fullName: user.fullName || '',
            email: user.email || '',
            education: {
              college: user.education?.college || '',
              department: user.education?.department || '',
              yearOfStudy: user.education?.yearOfStudy || '',
              course: user.education?.course || '',
              specialization: user.education?.specialization || ''
            },
            phone: user.phone || '',
            location: user.location || '',
            linkedin: user.linkedin || '',
            github: user.github || '',
            portfolio: user.portfolio || ''
          };
          setProfileData(profile);
          setOriginalData(profile);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested education fields
    if (name.startsWith('education.')) {
      const educationField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        education: {
          ...prev.education,
          [educationField]: value
        }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          education: profileData.education,
          phone: profileData.phone,
          location: profileData.location,
          linkedin: profileData.linkedin,
          github: profileData.github,
          portfolio: profileData.portfolio
        })
      });

      const data = await response.json();
      if (data.success) {
        setOriginalData(profileData);
        setIsEditMode(false);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.fullName = profileData.fullName;
        user.education = profileData.education;
        localStorage.setItem('user', JSON.stringify(user));
        
        showNotification('Profile updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(originalData);
    setIsEditMode(false);
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
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getYearText = (year) => {
    if (!year || year === '') return 'Not set';
    if (year === '1st Year') return '1st Year';
    if (year === '2nd Year') return '2nd Year';
    if (year === '3rd Year') return '3rd Year';
    if (year === '4th Year') return '4th Year';
    if (year === '5th Year') return '5th Year';
    if (year === 'Graduated') return 'Graduated';
    return year;
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
      <div className="profile-header-gradient">
        <div className="profile-header-content">
          <div className="profile-title-section">
            <h1>My Profile</h1>
            <p>Manage your personal information and academic details</p>
          </div>
          <div className="profile-avatar-large">
            <span className="avatar-initials">{getInitials(profileData.fullName)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content-wrapper">
        {/* Action Buttons */}
        <div className="profile-actions-bar">
          {!isEditMode ? (
            <button 
              className="profile-edit-btn"
              onClick={(e) => { createRippleEffect(e); setIsEditMode(true); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="profile-action-group">
              <button 
                className="profile-save-btn"
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
          <div className="profile-stat-card">
            <div className="profile-stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-label">Full Name</span>
              <span className="profile-stat-value">{profileData.fullName || 'Not set'}</span>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-icon green">
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

          <div className="profile-stat-card">
            <div className="profile-stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-label">Current Status</span>
              <span className="profile-stat-value">{getYearText(profileData.education?.yearOfStudy) || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="profile-sections">
          {/* Basic Information */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h2>Academic Information</h2>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-field">
                <label>Full Name</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.fullName || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Email Address</label>
                <div className="profile-field-display email-field">
                  <span>{profileData.email}</span>
                  <small>Email cannot be changed</small>
                </div>
              </div>

              <div className="profile-form-field">
                <label>College/University</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="education.college"
                    value={profileData.education?.college || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your college name"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.education?.college || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Department</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="education.department"
                    value={profileData.education?.department || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.education?.department || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Course</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="education.course"
                    value={profileData.education?.course || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., B.Tech, B.E., B.Sc"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.education?.course || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Specialization</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="education.specialization"
                    value={profileData.education?.specialization || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science, IT"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.education?.specialization || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Year of Study</label>
                {isEditMode ? (
                  <select
                    name="education.yearOfStudy"
                    value={profileData.education?.yearOfStudy || ''}
                    onChange={handleInputChange}
                    className="profile-select"
                  >
                    <option value="">Select status</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                ) : (
                  <div className="profile-field-display">
                    <span>{getYearText(profileData.education?.yearOfStudy)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2.18"></rect>
                  <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"></path>
                </svg>
                <h2>Contact Information</h2>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-field">
                <label>Phone Number</label>
                {isEditMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Location</label>
                {isEditMode ? (
                  <input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleInputChange}
                    placeholder="City, State"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display">
                    <span>{profileData.location || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="profile-section-card">
            <div className="profile-section-header">
              <div className="profile-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                <h2>Social Profiles</h2>
              </div>
              <p className="profile-section-subtitle">Connect your professional accounts</p>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-field">
                <label>LinkedIn</label>
                {isEditMode ? (
                  <input
                    type="url"
                    name="linkedin"
                    value={profileData.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display link-field">
                    {profileData.linkedin ? (
                      <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer">
                        {profileData.linkedin}
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>GitHub</label>
                {isEditMode ? (
                  <input
                    type="url"
                    name="github"
                    value={profileData.github}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display link-field">
                    {profileData.github ? (
                      <a href={profileData.github} target="_blank" rel="noopener noreferrer">
                        {profileData.github}
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div className="profile-form-field">
                <label>Portfolio</label>
                {isEditMode ? (
                  <input
                    type="url"
                    name="portfolio"
                    value={profileData.portfolio}
                    onChange={handleInputChange}
                    placeholder="https://yourportfolio.com"
                    className="profile-input"
                  />
                ) : (
                  <div className="profile-field-display link-field">
                    {profileData.portfolio ? (
                      <a href={profileData.portfolio} target="_blank" rel="noopener noreferrer">
                        {profileData.portfolio}
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
    </div>
  );
};

export default ProfilePage;