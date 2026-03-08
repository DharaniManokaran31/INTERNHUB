// src/pages/recruiter/PostInternshipPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';

const PostInternshipPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { internshipId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [recruiterData, setRecruiterData] = useState({
    department: '',
    companyId: '',
    maxInterns: 3,
    id: ''
  });
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    location: '',
    type: 'Full-time',
    category: 'technology',
    description: '',

    // Zoyaraa Work Details
    workMode: 'Remote',
    officeLocation: '',
    dailyTimings: '10 AM - 6 PM',
    weeklyOff: 'Saturday, Sunday',
    startDate: '',
    endDate: '',
    duration: '',
    stipend: 0,
    positions: 1,

    // Skills & Requirements
    skillsRequired: [],
    requirements: [],
    perks: [],

    // Selection Process
    selectionProcess: [],

    // Dates & Status
    deadline: '',
    status: 'active'
  });

  // Selection Process State
  const [currentRound, setCurrentRound] = useState({
    round: 1,
    type: 'Technical Test',
    duration: '',
    details: ''
  });

  // Skills with levels
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [requirementInput, setRequirementInput] = useState('');
  const [perkInput, setPerkInput] = useState('');
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'RD',
    department: '',
    company: 'Zoyaraa'
  });

  // Check if we're in edit mode
  useEffect(() => {
    if (internshipId) {
      setIsEditMode(true);
      fetchInternshipData();
    }
  }, [internshipId]);

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
          department: user.department || '',
          company: 'Zoyaraa'
        });

        // Store complete recruiter data including ID
        setRecruiterData({
          department: user.department || '',
          companyId: user.companyId || '',
          maxInterns: user.permissions?.maxInterns || 3,
          id: user.id || user._id
        });

        // Update localStorage user object with ID if missing
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!storedUser.id && (user.id || user._id)) {
          storedUser.id = user.id || user._id;
          localStorage.setItem('user', JSON.stringify(storedUser));
        }
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
    }
  };

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

        // Format dates to YYYY-MM-DD for inputs
        const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
        const formatDeadline = internship.deadline ? new Date(internship.deadline).toISOString().split('T')[0] : '';

        setFormData({
          title: internship.title || '',
          location: internship.location || '',
          type: internship.type || 'Full-time',
          category: internship.category || 'technology',
          description: internship.description || '',

          workMode: internship.workMode || 'Remote',
          officeLocation: internship.officeLocation || '',
          dailyTimings: internship.dailyTimings || '10 AM - 6 PM',
          weeklyOff: internship.weeklyOff || 'Saturday, Sunday',
          startDate: formatDate(internship.startDate),
          endDate: formatDate(internship.endDate),
          duration: internship.duration?.toString() || '',
          stipend: internship.stipend || 0,
          positions: internship.positions || 1,

          skillsRequired: internship.skillsRequired || [],
          requirements: internship.requirements || [],
          perks: internship.perks || [],

          selectionProcess: internship.selectionProcess || [],

          deadline: formatDeadline,
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

  // Work mode options
  const workModes = ['Remote', 'Hybrid', 'Onsite'];

  // Selection process types
  const roundTypes = [
    'Technical Test',
    'Technical Interview',
    'HR Interview',
    'Group Discussion',
    'Assignment'
  ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-calculate duration if start and end dates are set
    if (name === 'startDate' || name === 'endDate') {
      const start = name === 'startDate' ? value : formData.startDate;
      const end = name === 'endDate' ? value : formData.endDate;

      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        if (diffMonths > 0) {
          setFormData(prev => ({ ...prev, [name]: value, duration: diffMonths.toString() }));
          return;
        }
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Skills management
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

  // Requirements management
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

  // Perks management
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

  // Selection Process management
  const handleAddRound = () => {
    if (currentRound.type && currentRound.details) {
      setFormData(prev => ({
        ...prev,
        selectionProcess: [
          ...prev.selectionProcess,
          { ...currentRound, round: prev.selectionProcess.length + 1 }
        ]
      }));
      setCurrentRound({
        round: formData.selectionProcess.length + 2,
        type: 'Technical Test',
        duration: '',
        details: ''
      });
    }
  };

  const handleRemoveRound = (index) => {
    const newRounds = formData.selectionProcess.filter((_, i) => i !== index);
    // Re-number rounds
    const renumberedRounds = newRounds.map((round, idx) => ({
      ...round,
      round: idx + 1
    }));
    setFormData(prev => ({
      ...prev,
      selectionProcess: renumberedRounds
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
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.type) newErrors.type = 'Job type is required';
    if (!formData.workMode) newErrors.workMode = 'Work mode is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.skillsRequired.length === 0) newErrors.skillsRequired = 'At least one skill is required';
    if (!formData.deadline) newErrors.deadline = 'Application deadline is required';
    if (formData.positions < 1) newErrors.positions = 'At least 1 position is required';

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

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

      // Get recruiter info from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Get company info from recruiterData
      const companyId = recruiterData.companyId;

      if (!companyId) {
        showNotification('Company information missing. Please contact HR.', 'error');
        setLoading(false);
        return;
      }

      // ✅ Prepare data with ALL required fields
      const internshipData = {
        ...formData,
        companyName: 'Zoyaraa', // Add company name
        companyId: companyId,    // Add company ID from recruiter profile
        department: recruiterData.department, // Add department from recruiter
        mentorId: user.id || recruiterData.id, // Add mentor ID (current recruiter)
        postedBy: user.id || recruiterData.id, // Add postedBy (current recruiter)
        // Ensure dates are in correct format
        startDate: formData.startDate,
        endDate: formData.endDate,
        deadline: formData.deadline,
        // Convert stipend to number
        stipend: Number(formData.stipend) || 0,
        // Ensure positions is number
        positions: Number(formData.positions) || 1,
        // Ensure duration is number
        duration: Number(formData.duration)
      };

      console.log('📤 Sending internship data:', internshipData);

      let url = 'http://localhost:5000/api/internships';
      let method = 'POST';

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
        body: JSON.stringify(internshipData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification(isEditMode ? 'Internship updated successfully!' : 'Internship posted successfully!');
        setTimeout(() => {
          navigate('/recruiter/internships');
        }, 2000);
      } else {
        console.error('❌ Server Error:', data);
        showNotification(data.message || `Failed to ${isEditMode ? 'update' : 'post'} internship`, 'error');
      }
    } catch (error) {
      console.error('❌ Error:', error);
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
            <span className="sidebar-logo-text">Zoyaraa</span>
          </div>
          <div className="department-badge" style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            {userData.department || 'Department'}
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

          {/* ✅ Interviews Menu Item */}
          <button
            className={`nav-item ${location.pathname.includes('/recruiter/interviews') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/interviews')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="nav-item-text">Interviews</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/recruiter/mentees') ? 'active' : ''}`}
            onClick={() => navigate('/recruiter/mentees')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span className="nav-item-text">My Mentees</span>
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
                {userData.department} • Zoyaraa
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
              <h2 className="section-title">
                {isEditMode ? 'Edit Internship Details' : 'Post New Internship'}
                {userData.department && <span style={{ fontSize: '0.9rem', marginLeft: '1rem', color: '#666' }}>
                  • {userData.department} Department
                </span>}
              </h2>

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
                    <label>Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Chennai, Remote"
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
                </div>

                {/* Work Details Section */}
                <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem', fontWeight: '600' }}>Work Details</h3>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="form-group">
                    <label>Work Mode *</label>
                    <select
                      name="workMode"
                      value={formData.workMode}
                      onChange={handleChange}
                      className={errors.workMode ? 'error' : ''}
                    >
                      {workModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                    {errors.workMode && <small className="error-text">{errors.workMode}</small>}
                  </div>

                  <div className="form-group">
                    <label>Office Location (if hybrid/onsite)</label>
                    <input
                      type="text"
                      name="officeLocation"
                      value={formData.officeLocation}
                      onChange={handleChange}
                      placeholder="e.g., Tower A, Chennai"
                    />
                  </div>

                  <div className="form-group">
                    <label>Daily Timings</label>
                    <input
                      type="text"
                      name="dailyTimings"
                      value={formData.dailyTimings}
                      onChange={handleChange}
                      placeholder="e.g., 10 AM - 6 PM"
                    />
                  </div>

                  <div className="form-group">
                    <label>Weekly Off</label>
                    <input
                      type="text"
                      name="weeklyOff"
                      value={formData.weeklyOff}
                      onChange={handleChange}
                      placeholder="e.g., Saturday, Sunday"
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={errors.startDate ? 'error' : ''}
                    />
                    {errors.startDate && <small className="error-text">{errors.startDate}</small>}
                  </div>

                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className={errors.endDate ? 'error' : ''}
                    />
                    {errors.endDate && <small className="error-text">{errors.endDate}</small>}
                  </div>

                  <div className="form-group">
                    <label>Duration (months) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g., 3"
                      min="1"
                      max="12"
                      className={errors.duration ? 'error' : ''}
                    />
                    {errors.duration && <small className="error-text">{errors.duration}</small>}
                  </div>

                  <div className="form-group">
                    <label>Stipend (₹ per month)</label>
                    <input
                      type="number"
                      name="stipend"
                      value={formData.stipend}
                      onChange={handleChange}
                      placeholder="e.g., 15000"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Number of Positions *</label>
                    <input
                      type="number"
                      name="positions"
                      value={formData.positions}
                      onChange={handleChange}
                      min="1"
                      max="50"
                      className={errors.positions ? 'error' : ''}
                    />
                    {errors.positions && <small className="error-text">{errors.positions}</small>}
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

                {/* Selection Process */}
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Selection Process</label>

                  {/* Current Round Input */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ marginBottom: '1rem' }}>Add Round {formData.selectionProcess.length + 1}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label>Round Type</label>
                        <select
                          value={currentRound.type}
                          onChange={(e) => setCurrentRound({ ...currentRound, type: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                        >
                          {roundTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>Duration (minutes)</label>
                        <input
                          type="text"
                          value={currentRound.duration}
                          onChange={(e) => setCurrentRound({ ...currentRound, duration: e.target.value })}
                          placeholder="e.g., 60 mins"
                          style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label>Details</label>
                      <textarea
                        value={currentRound.details}
                        onChange={(e) => setCurrentRound({ ...currentRound, details: e.target.value })}
                        placeholder="Describe what this round involves..."
                        rows="2"
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '1rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddRound}
                      className="secondary-btn"
                      disabled={!currentRound.details}
                    >
                      Add Round
                    </button>
                  </div>

                  {/* Added Rounds */}
                  {formData.selectionProcess.length > 0 && (
                    <div>
                      <h4 style={{ marginBottom: '0.5rem' }}>Added Rounds:</h4>
                      {formData.selectionProcess.map((round, index) => (
                        <div key={index} style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>Round {round.round}: {round.type}</strong>
                              {round.duration && <span style={{ marginLeft: '1rem', color: '#666' }}>({round.duration})</span>}
                              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#666' }}>{round.details}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRound(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ✅ NEW: Interview Process Preview */}
                {formData.selectionProcess.length > 0 && (
                  <div className="form-group" style={{ marginBottom: '2rem' }}>
                    <label>Interview Process Preview</label>
                    <div style={{
                      background: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ marginBottom: '0.5rem', color: '#4b5563' }}>
                        When you shortlist candidates, they will go through:
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {formData.selectionProcess.map((round, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#EEF2FF',
                              color: '#2440F0',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            Round {round.round}: {round.type}
                          </span>
                        ))}
                      </div>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                        These rounds will be automatically created when you start the interview process for shortlisted candidates.
                      </p>
                    </div>
                  </div>
                )}

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