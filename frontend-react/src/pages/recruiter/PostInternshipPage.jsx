// src/pages/recruiter/PostInternshipPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import NotificationBell from '../../components/common/NotificationBell';
import RecruiterSidebar from '../../components/layout/RecruiterSidebar';

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
    id: '',
    email: '',
    fullName: ''
  });
  
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    location: '',
    type: 'Full-time',
    category: 'technology',
    description: '',

    // Zoyaraa Work Details
    workMode: 'Hybrid',
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
    name: '',
    initials: '',
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
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/recruiters/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        const fullName = user.fullName || user.name || '';
        const initials = fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'R';

        setUserData({
          name: fullName,
          initials: initials,
          department: user.department || '',
          company: 'Zoyaraa'
        });

        // Store complete recruiter data
        setRecruiterData({
          department: user.department || '',
          companyId: user.companyId || '',
          maxInterns: user.permissions?.maxInterns || 3,
          id: user._id || user.id,
          email: user.email,
          fullName: fullName
        });

        // Update localStorage user object
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.id = user._id || user.id;
        storedUser.department = user.department || '';
        localStorage.setItem('user', JSON.stringify(storedUser));
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching recruiter:', error);
      navigate('/login');
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
        const formatDate = (date) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        };

        setFormData({
          title: internship.title || '',
          location: internship.location || '',
          type: internship.type || 'Full-time',
          category: internship.category || 'technology',
          description: internship.description || '',

          workMode: internship.workMode || 'Hybrid',
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

          deadline: formatDate(internship.deadline),
          status: internship.status || 'active'
        });
      } else {
        showNotification('Failed to load internship data', 'error');
        navigate('/recruiter/internships');
      }
    } catch (error) {
      console.error('Error fetching internship:', error);
      showNotification('Failed to load internship data', 'error');
      navigate('/recruiter/internships');
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
  const workModes = ['Remote', 'Hybrid', 'On-site'];

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
        if (diffMonths > 0 && diffMonths <= 12) {
          setFormData(prev => ({ 
            ...prev, 
            [name]: value, 
            duration: diffMonths.toString() 
          }));
          return;
        }
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Skills management
  const handleAddSkillWithLevel = () => {
    if (skillInput.trim()) {
      // Check if skill already exists
      const exists = formData.skillsRequired.some(
        s => s.name.toLowerCase() === skillInput.trim().toLowerCase()
      );
      
      if (exists) {
        showNotification('This skill already exists', 'error');
        return;
      }

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
      
      // Clear skills error
      if (errors.skillsRequired) {
        setErrors(prev => ({ ...prev, skillsRequired: '' }));
      }
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
          { 
            ...currentRound, 
            round: prev.selectionProcess.length + 1,
            _id: Date.now().toString() // Temporary ID for UI
          }
        ]
      }));
      setCurrentRound({
        round: formData.selectionProcess.length + 2,
        type: 'Technical Test',
        duration: '',
        details: ''
      });
    } else {
      showNotification('Please fill in round details', 'error');
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

    // Deadline validation
    if (formData.deadline) {
      const deadline = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadline < today) {
        newErrors.deadline = 'Deadline cannot be in the past';
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

      // Get recruiter info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = recruiterData.companyId;

      if (!companyId) {
        showNotification('Company information missing. Please refresh and try again.', 'error');
        setLoading(false);
        return;
      }

      if (!recruiterData.id) {
        showNotification('Recruiter ID missing. Please refresh and try again.', 'error');
        setLoading(false);
        return;
      }

      // Prepare data with ALL required fields
      const internshipData = {
        title: formData.title,
        location: formData.location,
        type: formData.type,
        category: formData.category,
        description: formData.description,
        
        // Company details
        companyName: 'Zoyaraa',
        companyId: companyId,
        department: recruiterData.department,
        
        // Work details
        workMode: formData.workMode,
        officeLocation: formData.officeLocation,
        dailyTimings: formData.dailyTimings,
        weeklyOff: formData.weeklyOff,
        
        // Dates
        startDate: formData.startDate,
        endDate: formData.endDate,
        deadline: formData.deadline,
        
        // Numbers
        duration: Number(formData.duration),
        stipend: Number(formData.stipend) || 0,
        positions: Number(formData.positions) || 1,
        
        // Arrays
        skillsRequired: formData.skillsRequired,
        requirements: formData.requirements,
        perks: formData.perks,
        selectionProcess: formData.selectionProcess,
        
        // IDs
        mentorId: recruiterData.id,
        postedBy: recruiterData.id,
        
        // Status
        status: formData.status
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
        showNotification(
          isEditMode ? 'Internship updated successfully!' : 'Internship posted successfully!',
          'success'
        );
        setTimeout(() => {
          navigate('/recruiter/internships');
        }, 2000);
      } else {
        console.error('❌ Server Error:', data);
        showNotification(
          data.message || `Failed to ${isEditMode ? 'update' : 'post'} internship`,
          'error'
        );
      }
    } catch (error) {
      console.error('❌ Error:', error);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    // Remove any existing notifications
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
        <RecruiterSidebar 
          isOpen={isMobileMenuOpen} 
          setIsOpen={setIsMobileMenuOpen} 
          userData={userData} 
        />
        <main className="main-content">
          <div className="content-area">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div className="loading-spinner"></div>
              <p style={{ color: '#666' }}>Loading internship data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Unified Sidebar */}
      <RecruiterSidebar 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        userData={userData} 
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
                {userData.department && (
                  <span style={{ 
                    fontSize: '0.9rem', 
                    marginLeft: '1rem', 
                    color: '#666',
                    background: '#EEF2FF',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px'
                  }}>
                    {userData.department} Department
                  </span>
                )}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="form-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1.5rem', 
                  marginBottom: '2rem' 
                }}>
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
                      placeholder="e.g., Chennai, Bangalore, Remote"
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
                <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                  Work Details
                </h3>
                <div className="form-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1.5rem', 
                  marginBottom: '2rem' 
                }}>
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
                      placeholder="e.g., Tower A, Manyata Tech Park, Bangalore"
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
                      onKeyPress={(e) => handleKeyPress(e, 'skill')}
                      placeholder="Type a skill name (e.g., React, Python)"
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

                  {errors.skillsRequired && (
                    <small className="error-text">{errors.skillsRequired}</small>
                  )}

                  <div className="tags-container" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem', 
                    marginTop: '0.5rem' 
                  }}>
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
                  <div className="input-with-addon" style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '0.5rem' 
                  }}>
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

                  <div className="tags-container" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem', 
                    marginTop: '0.5rem' 
                  }}>
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
                  <div className="input-with-addon" style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '0.5rem' 
                  }}>
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

                  <div className="tags-container" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem', 
                    marginTop: '0.5rem' 
                  }}>
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
                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                      Add Round {formData.selectionProcess.length + 1}
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '1rem', 
                      marginBottom: '1rem' 
                    }}>
                      <div>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>
                          Round Type
                        </label>
                        <select
                          value={currentRound.type}
                          onChange={(e) => setCurrentRound({ ...currentRound, type: e.target.value })}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '8px',
                            fontSize: '0.9375rem'
                          }}
                        >
                          {roundTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>
                          Duration (minutes)
                        </label>
                        <input
                          type="text"
                          value={currentRound.duration}
                          onChange={(e) => setCurrentRound({ ...currentRound, duration: e.target.value })}
                          placeholder="e.g., 60 mins"
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '8px',
                            fontSize: '0.9375rem'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>
                        Details
                      </label>
                      <textarea
                        value={currentRound.details}
                        onChange={(e) => setCurrentRound({ ...currentRound, details: e.target.value })}
                        placeholder="Describe what this round involves..."
                        rows="2"
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px', 
                          marginBottom: '1rem',
                          fontSize: '0.9375rem'
                        }}
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
                      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Added Rounds:</h4>
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
                              {round.duration && (
                                <span style={{ marginLeft: '1rem', color: '#666' }}>
                                  ({round.duration})
                                </span>
                              )}
                              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#666' }}>
                                {round.details}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRound(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '0.25rem 0.5rem'
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

                {/* Interview Process Preview */}
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
                      <p style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: '#6b7280', 
                        fontStyle: 'italic' 
                      }}>
                        These rounds will be automatically created when you start the interview process 
                        for shortlisted candidates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="action-buttons" style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => navigate('/recruiter/internships')}
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={loading}
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="loading-spinner-small"></span>
                        {isEditMode ? 'Updating...' : 'Posting...'}
                      </span>
                    ) : (
                      isEditMode ? 'Update Internship' : 'Post Internship'
                    )}
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