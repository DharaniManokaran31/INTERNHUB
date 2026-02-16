// src/pages/recruiter/PostInternshipPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const PostInternshipPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { internshipId } = useParams(); // Get internshipId from URL for edit mode
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    location: '',
    type: 'Full-time',
    category: 'technology',
    stipend: '',
    duration: '',
    description: '',
    skillsRequired: [],
    requirements: [],
    perks: [],
    deadline: '',
    status: 'active'
  });

  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [requirementInput, setRequirementInput] = useState('');
  const [perkInput, setPerkInput] = useState('');
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    company: ''
  });

  // Check if we're in edit mode
  useEffect(() => {
    if (internshipId) {
      setIsEditMode(true);
      fetchInternshipData();
    }
  }, [internshipId]);

  // Fetch internship data for editing
  const fetchInternshipData = async () => {
    try {
      setFetchingData(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:5000/api/internships/${internshipId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const internship = data.data.internship;
        
        // Format date to YYYY-MM-DD for input
        const formattedDate = internship.deadline 
          ? new Date(internship.deadline).toISOString().split('T')[0]
          : '';

        setFormData({
          title: internship.title || '',
          companyName: internship.companyName || '',
          location: internship.location || '',
          type: internship.type || 'Full-time',
          category: internship.category || 'technology',
          stipend: internship.stipend || '',
          duration: internship.duration || '',
          description: internship.description || '',
          skillsRequired: internship.skillsRequired || [],
          requirements: internship.requirements || [],
          perks: internship.perks || [],
          deadline: formattedDate,
          status: internship.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching internship:', error);
      showNotification('Failed to load internship data', 'error');
    } finally {
      setFetchingData(false);
    }
  };

  // Category options
  const categories = [
    { value: 'technology', label: 'Technology' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Design' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'sales', label: 'Sales' },
    { value: 'other', label: 'Other' }
  ];

  // Job type options
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Remote',
    'Hybrid',
    'On-site',
    'Internship'
  ];

  // Fetch recruiter profile on mount
  useEffect(() => {
    fetchRecruiterProfile();
  }, []);

  const fetchRecruiterProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        const initials = user.fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        setUserData({
          name: user.fullName,
          initials: initials,
          company: user.company || ''
        });

        // Auto-fill company name if available and not in edit mode
        if (user.company && !internshipId) {
          setFormData(prev => ({ ...prev, companyName: user.company }));
        }
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddSkillWithLevel = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [
          ...prev.skillsRequired, 
          { 
            name: skillInput.trim(), 
            level: skillLevel 
          }
        ]
      }));
      setSkillInput('');
      setSkillLevel('beginner');
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter((_, i) => i !== index)
    }));
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddPerk = () => {
    if (perkInput.trim()) {
      setFormData(prev => ({
        ...prev,
        perks: [...prev.perks, perkInput.trim()]
      }));
      setPerkInput('');
    }
  };

  const handleRemovePerk = (index) => {
    setFormData(prev => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'skill') handleAddSkillWithLevel();
      if (type === 'requirement') handleAddRequirement();
      if (type === 'perk') handleAddPerk();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.type) newErrors.type = 'Job type is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.skillsRequired.length === 0) newErrors.skillsRequired = 'At least one skill is required';
    if (!formData.deadline) newErrors.deadline = 'Application deadline is required';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      let url = 'http://localhost:5000/api/internships';
      let method = 'POST';

      // If in edit mode, use PUT method and add ID to URL
      if (isEditMode && internshipId) {
        url = `http://localhost:5000/api/internships/${internshipId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          postedBy: user.id
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification(isEditMode ? 'Internship updated successfully!' : 'Internship posted successfully!');
        setTimeout(() => {
          navigate('/recruiter/internships');
        }, 2000);
      } else {
        showNotification(data.message || `Failed to ${isEditMode ? 'update' : 'post'} internship`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
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
      background: ${type === 'error'
        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
        : 'linear-gradient(135deg, #2440F0, #0B1DC1)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-size: 0.9375rem;
      font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
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

  if (fetchingData) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="content-area">
            <div className="loading-placeholder">Loading internship data...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <span className="sidebar-logo-text">InternHub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${location.pathname === '/recruiter/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span className="nav-item-text">Dashboard</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/internships') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Manage Internships</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/post-internship') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/post-internship')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="nav-item-text">Post Internship</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/applicants') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/applicants')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="nav-item-text">View Applicants</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/recruiter/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">
                {userData.company ? `Recruiter • ${userData.company}` : 'Recruiter'}
              </div>
            </div>
          </button>
        </div>
      </aside>

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">{isEditMode ? 'Edit Internship' : 'Post New Internship'}</h2>
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
          <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section">
              <h2 className="section-title">{isEditMode ? 'Edit Internship Details' : 'Internship Details'}</h2>

              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="form-group">
                    <label>Job Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Frontend Developer Intern"
                      className={errors.title ? 'error' : ''}
                    />
                    {errors.title && <small className="error-text">{errors.title}</small>}
                  </div>

                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Your company name"
                      className={errors.companyName ? 'error' : ''}
                    />
                    {errors.companyName && <small className="error-text">{errors.companyName}</small>}
                  </div>

                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Remote, New York, NY"
                      className={errors.location ? 'error' : ''}
                    />
                    {errors.location && <small className="error-text">{errors.location}</small>}
                  </div>

                  <div className="form-group">
                    <label>Job Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={errors.type ? 'error' : ''}
                    >
                      {jobTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.type && <small className="error-text">{errors.type}</small>}
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Stipend (Optional)</label>
                    <input
                      type="text"
                      name="stipend"
                      value={formData.stipend}
                      onChange={handleChange}
                      placeholder="e.g., ₹20,000/month or Unpaid"
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration *</label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g., 3 months, 6 months"
                      className={errors.duration ? 'error' : ''}
                    />
                    {errors.duration && <small className="error-text">{errors.duration}</small>}
                  </div>

                  <div className="form-group">
                    <label>Application Deadline *</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={errors.deadline ? 'error' : ''}
                    />
                    {errors.deadline && <small className="error-text">{errors.deadline}</small>}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the internship role, responsibilities, and expectations..."
                    rows="6"
                    className={errors.description ? 'error' : ''}
                  />
                  {errors.description && <small className="error-text">{errors.description}</small>}
                </div>

                {/* Skills Required */}
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Skills Required *</label>
                  
                  <div className="skill-input-row" style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                      placeholder="Type a skill name"
                      style={{ flex: 2, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                    
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9375rem'
                      }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    
                    <button
                      type="button"
                      onClick={handleAddSkillWithLevel}
                      className="secondary-btn"
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      Add
                    </button>
                  </div>
                  
                  {errors.skillsRequired && <small className="error-text">{errors.skillsRequired}</small>}

                  <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {formData.skillsRequired.map((skill, index) => (
                      <span key={index} className="skill-tag" style={{
                        background: '#EEF2FF',
                        color: '#2440F0',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {skill.name} 
                        <span style={{
                          background: 'rgba(36, 64, 240, 0.1)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          marginLeft: '0.25rem'
                        }}>
                          {skill.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2440F0',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '0 0.25rem'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Requirements (Optional)</label>
                  <div className="input-with-addon" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'requirement')}
                      placeholder="e.g., Currently pursuing B.Tech in Computer Science"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="secondary-btn"
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {formData.requirements.map((req, index) => (
                      <span key={index} className="skill-tag" style={{
                        background: '#f3f4f6',
                        color: '#1f2937',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {req}
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#1f2937',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '0 0.25rem'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Perks */}
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Perks & Benefits (Optional)</label>
                  <div className="input-with-addon" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={perkInput}
                      onChange={(e) => setPerkInput(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'perk')}
                      placeholder="e.g., Flexible work hours, Certificate, Letter of recommendation"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPerk}
                      className="secondary-btn"
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {formData.perks.map((perk, index) => (
                      <span key={index} className="skill-tag" style={{
                        background: '#E6F7E6',
                        color: '#10b981',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {perk}
                        <button
                          type="button"
                          onClick={() => handleRemovePerk(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '0 0.25rem'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => navigate('/recruiter/internships')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={loading}
                  >
                    {loading ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Internship' : 'Post Internship')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostInternshipPage;