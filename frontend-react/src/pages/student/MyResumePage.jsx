import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentResume.css';
import NotificationBell from '../../components/common/NotificationBell';

const MyResumePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== STATE MANAGEMENT =====
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('education');
  const [userData, setUserData] = useState({
    name: 'Demo Student',
    initials: 'DS',
    role: 'student'
  });

  // ===== RESUME DATA STATE =====
  const [resumeData, setResumeData] = useState({
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    resumeFile: null,
    resumeUrl: ''
  });

  // ===== FORM STATES =====
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // ===== HELPER FUNCTION TO CLEAN URLS =====
  const cleanUrl = (url) => {
    if (!url) return '';
    // Fix duplicate http://localhost:5000 issue
    if (url.includes('http://localhost:5000http://')) {
      return url.replace('http://localhost:5000http://', 'http://');
    }
    if (url.includes('http://localhost:5000http//')) {
      return url.replace('http://localhost:5000http//', 'http://');
    }
    return url;
  };

  // ===== FETCH USER PROFILE =====
  useEffect(() => {
    fetchUserProfile();
    fetchResumeData();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/students/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.student;
        const initials = user.fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        setUserData({
          name: user.fullName,
          initials: initials,
          role: user.role
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // ===== FETCH RESUME DATA FROM DB =====
  const fetchResumeData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/students/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.student;
        const resume = user.resume || {};

        console.log('✅ Resume data:', resume);
        console.log('✅ Resume file field:', resume.resumeFile);

        // Get the resume URL - construct it properly if needed
        let resumeUrl = '';

        if (resume.resumeFile) {
          // If it's already a full URL
          if (resume.resumeFile.startsWith('http')) {
            resumeUrl = resume.resumeFile;
          }
          // If it's a path starting with /uploads
          else if (resume.resumeFile.startsWith('/uploads')) {
            resumeUrl = `http://localhost:5000${resume.resumeFile}`;
          }
          // If it's just a filename
          else {
            resumeUrl = `http://localhost:5000/uploads/resumes/${resume.resumeFile}`;
          }
        }

        console.log('✅ Constructed resume URL:', resumeUrl);

        // Clean certificate URLs
        const certifications = (resume.certifications || []).map(cert => ({
          ...cert,
          certificateUrl: cleanUrl(cert.certificateUrl)
        }));

        setResumeData({
          education: resume.education || [],
          experience: resume.experience || [],
          projects: resume.projects || [],
          skills: resume.skills || [],
          certifications: certifications,
          resumeFile: null,
          resumeUrl: resumeUrl
        });
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
      showNotification('Failed to load resume data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== SAVE RESUME TO DB =====
  const saveResumeData = async (updatedData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/students/resume', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (data.success) {
        setResumeData(prev => ({ ...prev, ...updatedData }));
        showNotification('Resume updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      showNotification('Failed to save resume', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===== UPLOAD RESUME FILE =====
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      showNotification('Please upload PDF or DOC file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size should be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('authToken');

      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('http://localhost:5000/api/students/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('✅ Upload response:', data);

      if (data.success) {
        setResumeData(prev => ({ ...prev, resumeUrl: data.data.url }));
        showNotification('Resume uploaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      showNotification('Failed to upload resume', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ===== UPLOAD CERTIFICATION FILE - FIXED =====
  const handleCertUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      showNotification('Please upload PDF or image file', 'error');
      return;
    }

    // Validate file size (3MB)
    if (file.size > 3 * 1024 * 1024) {
      showNotification('File size should be less than 3MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('authToken');

      const formData = new FormData();
      formData.append('certificate', file);

      // ✅ FIX: Send certificate data with the file
      // Get current form values or use defaults
      formData.append('name', formData.name || file.name.replace(/\.[^/.]+$/, ""));
      formData.append('issuer', formData.issuer || 'Pending'); // Send default if empty
      formData.append('date', formData.date || new Date().toISOString().split('T')[0]);

      const response = await fetch('http://localhost:5000/api/students/certificates/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('✅ Certificate upload response:', data);

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          certificateUrl: cleanUrl(data.data.url),
          certificateFile: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          ...(data.data.certificate?._id && { _id: data.data.certificate._id })
        }));

        showNotification('Certificate uploaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      showNotification('Failed to upload certificate', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ===== REMOVE CERTIFICATE FILE =====
  const handleRemoveCertificateFile = async (certificateId) => {
    // If it's a new certificate (no ID yet), just clear the form
    if (!certificateId) {
      setFormData(prev => ({ ...prev, certificateUrl: '', certificateFile: null }));
      showNotification('Certificate file removed', 'success');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/students/certificates/${certificateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, certificateUrl: '', certificateFile: null }));
        // Refresh certificates list
        fetchResumeData();
        showNotification('Certificate removed successfully', 'success');
      } else {
        showNotification('Failed to remove certificate', 'error');
      }
    } catch (error) {
      console.error('Error removing certificate:', error);
      showNotification('Failed to remove certificate', 'error');
    }
  };

  // ===== REMOVE RESUME =====
  const handleRemoveResume = async () => {
    if (window.confirm('Are you sure you want to remove your resume?')) {
      try {
        const token = localStorage.getItem('authToken');

        const response = await fetch('http://localhost:5000/api/students/resume/remove', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setResumeData(prev => ({ ...prev, resumeUrl: '' }));
          showNotification('Resume removed successfully', 'success');
        }
      } catch (error) {
        console.error('Error removing resume:', error);
        showNotification('Failed to remove resume', 'error');
      }
    }
  };

  // ===== VIEW RESUME WITH FALLBACK OPTIONS =====
  const handleViewResume = (url) => {
    if (!url) {
      showNotification('No resume uploaded', 'error');
      return;
    }

    const cleanUrl = url.replace('http://localhost:5000http://', 'http://')
      .replace('http://localhost:5000http//', 'http://');

    console.log('🔗 Opening resume URL:', cleanUrl);

    // Try direct download first
    const directWindow = window.open(cleanUrl, '_blank');

    if (!directWindow || directWindow.closed || typeof directWindow.closed === 'undefined') {
      console.log('Direct window blocked, trying Google Viewer...');

      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=false`;
      const googleWindow = window.open(googleViewerUrl, '_blank');

      if (!googleWindow || googleWindow.closed || typeof googleWindow.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = cleanUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();

        showNotification('If resume doesn\'t open, check pop-up blocker', 'info');
      }
    }
  };

  // ===== VIEW CERTIFICATE WITH FALLBACK OPTIONS =====
  const handleViewCertificate = (url) => {
    if (!url) {
      showNotification('No certificate file available', 'error');
      return;
    }

    // Clean the URL to remove duplicates
    const cleanUrl = url.replace('http://localhost:5000http://', 'http://')
      .replace('http://localhost:5000http//', 'http://');

    console.log('🔗 Opening certificate URL:', cleanUrl);

    // Try direct open first
    const newWindow = window.open(cleanUrl, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      console.log('Popup blocked, trying fallback method...');

      // Fallback: Create a temporary link and click it
      const link = document.createElement('a');
      link.href = cleanUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();

      showNotification('If certificate doesn\'t open, check pop-up blocker', 'info');
    }
  };

  // ===== EDUCATION FUNCTIONS =====
  const handleAddEducation = () => {
    setEditingItem(null);
    setFormData({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: ''
    });
    setShowEducationForm(true);
  };

  const handleEditEducation = (item, index) => {
    setEditingItem({ index, type: 'education' });
    setFormData(item);
    setShowEducationForm(true);
  };

  const handleSaveEducation = async () => {
    let updatedEducation;

    if (editingItem) {
      updatedEducation = [...resumeData.education];
      updatedEducation[editingItem.index] = formData;
    } else {
      updatedEducation = [...resumeData.education, formData];
    }

    const updatedData = { ...resumeData, education: updatedEducation };
    await saveResumeData(updatedData);
    setShowEducationForm(false);
    setEditingItem(null);
  };

  const handleDeleteEducation = async (index) => {
    if (window.confirm('Are you sure you want to delete this education entry?')) {
      const updatedEducation = resumeData.education.filter((_, i) => i !== index);
      const updatedData = { ...resumeData, education: updatedEducation };
      await saveResumeData(updatedData);
    }
  };

  // ===== EXPERIENCE FUNCTIONS =====
  const handleAddExperience = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      skills: []
    });
    setShowExperienceForm(true);
  };

  const handleEditExperience = (item, index) => {
    setEditingItem({ index, type: 'experience' });
    setFormData(item);
    setShowExperienceForm(true);
  };

  const handleSaveExperience = async () => {
    let updatedExperience;

    if (editingItem) {
      updatedExperience = [...resumeData.experience];
      updatedExperience[editingItem.index] = formData;
    } else {
      updatedExperience = [...resumeData.experience, formData];
    }

    const updatedData = { ...resumeData, experience: updatedExperience };
    await saveResumeData(updatedData);
    setShowExperienceForm(false);
    setEditingItem(null);
  };

  const handleDeleteExperience = async (index) => {
    if (window.confirm('Are you sure you want to delete this experience entry?')) {
      const updatedExperience = resumeData.experience.filter((_, i) => i !== index);
      const updatedData = { ...resumeData, experience: updatedExperience };
      await saveResumeData(updatedData);
    }
  };

  // ===== PROJECTS FUNCTIONS =====
  const handleAddProject = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      technologies: '',
      github: '',
      demo: ''
    });
    setShowProjectForm(true);
  };

  const handleEditProject = (item, index) => {
    setEditingItem({ index, type: 'project' });
    setFormData(item);
    setShowProjectForm(true);
  };

  const handleSaveProject = async () => {
    let updatedProjects;

    if (editingItem) {
      updatedProjects = [...resumeData.projects];
      updatedProjects[editingItem.index] = formData;
    } else {
      updatedProjects = [...resumeData.projects, formData];
    }

    const updatedData = { ...resumeData, projects: updatedProjects };
    await saveResumeData(updatedData);
    setShowProjectForm(false);
    setEditingItem(null);
  };

  const handleDeleteProject = async (index) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = resumeData.projects.filter((_, i) => i !== index);
      const updatedData = { ...resumeData, projects: updatedProjects };
      await saveResumeData(updatedData);
    }
  };

  // ===== SKILLS FUNCTIONS =====
  const handleAddSkill = () => {
    setEditingItem(null);
    setFormData({
      category: '',
      items: []
    });
    setShowSkillForm(true);
  };

  const handleEditSkill = (item, index) => {
    setEditingItem({ index, type: 'skill' });
    setFormData(item);
    setShowSkillForm(true);
  };

  const handleSaveSkill = async () => {
    let updatedSkills;

    if (editingItem) {
      updatedSkills = [...resumeData.skills];
      updatedSkills[editingItem.index] = formData;
    } else {
      updatedSkills = [...resumeData.skills, formData];
    }

    const updatedData = { ...resumeData, skills: updatedSkills };
    await saveResumeData(updatedData);
    setShowSkillForm(false);
    setEditingItem(null);
  };

  const handleDeleteSkill = async (index) => {
    if (window.confirm('Are you sure you want to delete this skill category?')) {
      const updatedSkills = resumeData.skills.filter((_, i) => i !== index);
      const updatedData = { ...resumeData, skills: updatedSkills };
      await saveResumeData(updatedData);
    }
  };

  // ===== CERTIFICATIONS FUNCTIONS =====
  const handleAddCertification = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialId: '',
      link: '',
      certificateUrl: ''
    });
    setShowCertForm(true);
  };

  const handleEditCertification = (item, index) => {
    setEditingItem({ index, type: 'certification' });
    setFormData(item);
    setShowCertForm(true);
  };

  const handleSaveCertification = async () => {
    let updatedCerts;

    if (editingItem) {
      updatedCerts = [...resumeData.certifications];
      updatedCerts[editingItem.index] = formData;
    } else {
      updatedCerts = [...resumeData.certifications, formData];
    }

    const updatedData = { ...resumeData, certifications: updatedCerts };
    await saveResumeData(updatedData);
    setShowCertForm(false);
    setEditingItem(null);
  };

  const handleDeleteCertification = async (index) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      const updatedCerts = resumeData.certifications.filter((_, i) => i !== index);
      const updatedData = { ...resumeData, certifications: updatedCerts };
      await saveResumeData(updatedData);
    }
  };

  // ===== UTILITIES =====
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : 'linear-gradient(135deg, #2440F0, #0B1DC1)';
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ===== RENDER RESUME UPLOAD SECTION =====
  const renderResumeUpload = () => {
    console.log('📄 Resume URL in render:', resumeData.resumeUrl);

    return (
      <div className="resume-upload-section">
        <div className="section-header">
          <h2>Resume</h2>
        </div>
        <div className="resume-upload-card">
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3>Upload Your Resume</h3>
          <p className="upload-hint">PDF or DOC files, max 5MB</p>

          {resumeData.resumeUrl ? (
            <div className="resume-file-info">
              <div className="file-details">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>Resume uploaded</span>
              </div>
              <div className="file-actions">
                <button
                  className="btn-view"
                  onClick={() => handleViewResume(resumeData.resumeUrl)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                  </svg>
                  View
                </button>
                <button
                  className="btn-remove"
                  onClick={handleRemoveResume}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-area">
              <input
                type="file"
                id="resumeUpload"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={uploading}
              />
              <label htmlFor="resumeUpload" className="upload-label">
                {uploading ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== RENDER =====
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
            className={`nav-item ${location.pathname === '/student/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/student/dashboard')}
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
            className={`nav-item ${location.pathname.includes('/student/internships') ? 'active' : ''}`}
            onClick={() => navigate('/student/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Browse Internships</span>
          </button>

          <button
            className={`nav-item ${location.pathname.includes('/student/applications') ? 'active' : ''}`}
            onClick={() => navigate('/student/applications')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="nav-item-text">My Applications</span>
          </button>

          <button
            className={`nav-item active`}
            onClick={() => navigate('/student/resume')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span className="nav-item-text">My Resume</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/student/profile')}
          >
            <div className="user-avatar-sidebar">{userData.initials}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData.name}</div>
              <div className="user-role-sidebar">Student</div>
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="top-bar-right">
            {/* NEW CODE - ADD THIS */}
            <NotificationBell />
            <button className="logout-btn" onClick={handleLogout}>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">My Resume</h1>
            <p className="page-subtitle">Build and manage your professional profile</p>
            {saving && <span className="saving-indicator">Saving...</span>}
          </div>

          {/* Resume Sections */}
          {loading ? (
            <div className="resume-loading">
              <div className="loading-spinner"></div>
              <p>Loading your resume...</p>
            </div>
          ) : (
            <div className="resume-container">
              {/* Resume Upload Section */}
              {renderResumeUpload()}

              {/* Section Tabs */}
              <div className="resume-tabs">
                <button
                  className={`resume-tab ${activeSection === 'education' ? 'active' : ''}`}
                  onClick={() => setActiveSection('education')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Education
                  <span className="tab-count">{resumeData.education.length}</span>
                </button>
                <button
                  className={`resume-tab ${activeSection === 'experience' ? 'active' : ''}`}
                  onClick={() => setActiveSection('experience')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Experience
                  <span className="tab-count">{resumeData.experience.length}</span>
                </button>
                <button
                  className={`resume-tab ${activeSection === 'projects' ? 'active' : ''}`}
                  onClick={() => setActiveSection('projects')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  Projects
                  <span className="tab-count">{resumeData.projects.length}</span>
                </button>
                <button
                  className={`resume-tab ${activeSection === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveSection('skills')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <circle cx="12" cy="8" r="0.5" fill="currentColor"></circle>
                  </svg>
                  Skills
                  <span className="tab-count">
                    {resumeData.skills.reduce((acc, cat) => acc + (cat.items?.length || 0), 0)}
                  </span>
                </button>
                <button
                  className={`resume-tab ${activeSection === 'certifications' ? 'active' : ''}`}
                  onClick={() => setActiveSection('certifications')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                  </svg>
                  Certifications
                  <span className="tab-count">{resumeData.certifications.length}</span>
                </button>
              </div>

              {/* Section Content */}
              <div className="resume-content">
                {/* Education Section */}
                {activeSection === 'education' && (
                  <div className="resume-section">
                    <div className="section-header">
                      <h2>Education</h2>
                      <button className="add-btn" onClick={handleAddEducation}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Education
                      </button>
                    </div>

                    {resumeData.education.length === 0 ? (
                      <div className="empty-state small">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        </div>
                        <h3>No education added yet</h3>
                        <p>Add your educational background to showcase your qualifications</p>
                        <button className="btn-primary" onClick={handleAddEducation}>
                          Add Education
                        </button>
                      </div>
                    ) : (
                      <div className="items-grid">
                        {resumeData.education.map((item, index) => (
                          <div key={index} className="resume-item-card">
                            <div className="item-header">
                              <div className="item-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                              </div>
                              <div className="item-title">
                                <h3>{item.degree} in {item.field}</h3>
                                <p className="item-subtitle">{item.institution}</p>
                                <p className="item-date">
                                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                  {item.gpa && ` • GPA: ${item.gpa}`}
                                </p>
                              </div>
                              <div className="item-actions">
                                <button
                                  className="edit-btn"
                                  onClick={() => handleEditEducation(item, index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                  </svg>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteEducation(index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {item.description && (
                              <p className="item-description">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Experience Section */}
                {activeSection === 'experience' && (
                  <div className="resume-section">
                    <div className="section-header">
                      <h2>Work Experience</h2>
                      <button className="add-btn" onClick={handleAddExperience}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Experience
                      </button>
                    </div>

                    {resumeData.experience.length === 0 ? (
                      <div className="empty-state small">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                        </div>
                        <h3>No experience added yet</h3>
                        <p>Add your work experience, internships, or volunteer work</p>
                        <button className="btn-primary" onClick={handleAddExperience}>
                          Add Experience
                        </button>
                      </div>
                    ) : (
                      <div className="items-grid">
                        {resumeData.experience.map((item, index) => (
                          <div key={index} className="resume-item-card">
                            <div className="item-header">
                              <div className="item-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                              </div>
                              <div className="item-title">
                                <h3>{item.title}</h3>
                                <p className="item-subtitle">{item.company} • {item.location}</p>
                                <p className="item-date">
                                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                </p>
                              </div>
                              <div className="item-actions">
                                <button
                                  className="edit-btn"
                                  onClick={() => handleEditExperience(item, index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                  </svg>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteExperience(index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="item-description">{item.description}</p>
                            {item.skills && item.skills.length > 0 && (
                              <div className="item-skills">
                                {item.skills.map((skill, i) => (
                                  <span key={i} className="skill-tag">{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Projects Section */}
                {activeSection === 'projects' && (
                  <div className="resume-section">
                    <div className="section-header">
                      <h2>Projects</h2>
                      <button className="add-btn" onClick={handleAddProject}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Project
                      </button>
                    </div>

                    {resumeData.projects.length === 0 ? (
                      <div className="empty-state small">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                          </svg>
                        </div>
                        <h3>No projects added yet</h3>
                        <p>Add your academic or personal projects</p>
                        <button className="btn-primary" onClick={handleAddProject}>
                          Add Project
                        </button>
                      </div>
                    ) : (
                      <div className="items-grid">
                        {resumeData.projects.map((item, index) => (
                          <div key={index} className="resume-item-card">
                            <div className="item-header">
                              <div className="item-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                              </div>
                              <div className="item-title">
                                <h3>{item.title}</h3>
                                <p className="item-technologies">{item.technologies}</p>
                              </div>
                              <div className="item-actions">
                                <button
                                  className="edit-btn"
                                  onClick={() => handleEditProject(item, index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                  </svg>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteProject(index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p className="item-description">{item.description}</p>
                            <div className="item-links">
                              {item.github && (
                                <a href={item.github} target="_blank" rel="noopener noreferrer" className="project-link">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                                  </svg>
                                  GitHub
                                </a>
                              )}
                              {item.demo && (
                                <a href={item.demo} target="_blank" rel="noopener noreferrer" className="project-link">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                  </svg>
                                  Live Demo
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skills Section */}
                {activeSection === 'skills' && (
                  <div className="resume-section">
                    <div className="section-header">
                      <h2>Skills</h2>
                      <button className="add-btn" onClick={handleAddSkill}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Skill Category
                      </button>
                    </div>

                    {resumeData.skills.length === 0 ? (
                      <div className="empty-state small">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <circle cx="12" cy="8" r="0.5" fill="currentColor"></circle>
                          </svg>
                        </div>
                        <h3>No skills added yet</h3>
                        <p>Add your technical and professional skills</p>
                        <button className="btn-primary" onClick={handleAddSkill}>
                          Add Skills
                        </button>
                      </div>
                    ) : (
                      <div className="skills-container">
                        {resumeData.skills.map((category, index) => (
                          <div key={index} className="skill-category-card">
                            <div className="category-header">
                              <h3>{category.category}</h3>
                              <div className="category-actions">
                                <button
                                  className="edit-btn"
                                  onClick={() => handleEditSkill(category, index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                  </svg>
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteSkill(index)}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="skills-list">
                              {category.items?.map((skill, i) => (
                                <span key={i} className="skill-tag large">{skill}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Certifications Section - UPDATED WITH BETTER STYLING */}
                {activeSection === 'certifications' && (
                  <div className="resume-section">
                    <div className="section-header">
                      <h2>Certifications</h2>
                      <button className="add-btn" onClick={handleAddCertification}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Certification
                      </button>
                    </div>

                    {resumeData.certifications.length === 0 ? (
                      <div className="empty-state small">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                          </svg>
                        </div>
                        <h3>No certifications added yet</h3>
                        <p>Add your professional certifications and courses</p>
                        <button className="btn-primary" onClick={handleAddCertification}>
                          Add Certification
                        </button>
                      </div>
                    ) : (
                      <div className="certificates-grid">
                        {resumeData.certifications.map((item, index) => {
                          // Clean the certificate URL before displaying
                          const cleanCertificateUrl = item.certificateUrl ?
                            item.certificateUrl.replace('http://localhost:5000http://', 'http://')
                              .replace('http://localhost:5000http//', 'http://') : '';

                          return (
                            <div key={index} className="certificate-item-card">
                              <div className="certificate-header">
                                <div className="certificate-icon">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z"></path>
                                  </svg>
                                </div>
                                <div className="certificate-info">
                                  <h3>{item.name}</h3>
                                  <div className="certificate-issuer">{item.issuer}</div>
                                  <div className="certificate-date">
                                    Issued: {formatDate(item.date)}
                                    {item.expiryDate && ` • Expires: ${formatDate(item.expiryDate)}`}
                                  </div>

                                  {item.credentialId && (
                                    <div className="certificate-badge">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 16v-4"></path>
                                        <circle cx="12" cy="8" r="0.5" fill="currentColor"></circle>
                                      </svg>
                                      ID: {item.credentialId}
                                    </div>
                                  )}

                                  <div className="certificate-file-actions">
                                    {cleanCertificateUrl && (
                                      <>
                                        <button
                                          className="certificate-view-btn"
                                          onClick={() => handleViewCertificate(cleanCertificateUrl)}
                                        >
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                                          </svg>
                                          View Certificate
                                        </button>
                                        <button
                                          className="certificate-download-btn"
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            try {
                                              const response = await fetch(cleanCertificateUrl);
                                              const blob = await response.blob();
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `${item.name || 'certificate'}.pdf`;
                                              document.body.appendChild(a);
                                              a.click();
                                              window.URL.revokeObjectURL(url);
                                              document.body.removeChild(a);
                                            } catch (error) {
                                              console.error('Download failed:', error);
                                              window.open(cleanCertificateUrl, '_blank');
                                            }
                                          }}
                                        >
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                          </svg>
                                          Download
                                        </button>
                                      </>
                                    )}
                                    {item.link && !item.certificateUrl && (
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="certificate-view-btn"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                          <polyline points="15 3 21 3 21 9"></polyline>
                                          <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                        View Credential
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="certificate-actions">
                                  <button
                                    className="certificate-edit-btn"
                                    onClick={() => handleEditCertification(item, index)}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
                                    </svg>
                                  </button>
                                  <button
                                    className="certificate-delete-btn"
                                    onClick={() => handleDeleteCertification(index)}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Education Form Modal */}
      {showEducationForm && (
        <div className="modal-overlay" onClick={() => setShowEducationForm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Education' : 'Add Education'}</h2>
              <button className="close-btn" onClick={() => setShowEducationForm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Institution</label>
                  <input
                    type="text"
                    value={formData.institution || ''}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="University/College name"
                  />
                </div>
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={formData.degree || ''}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    placeholder="B.Tech, B.E., B.Sc, etc."
                  />
                </div>
                <div className="form-group">
                  <label>Field of Study</label>
                  <input
                    type="text"
                    value={formData.field || ''}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                    placeholder="Computer Science, etc."
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>GPA (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.gpa || ''}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    placeholder="8.5"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description (Optional)</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Relevant coursework, achievements, etc."
                    rows="3"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEducationForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEducation}
                disabled={!formData.institution || !formData.degree || !formData.field || !formData.startDate}
              >
                {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Form Modal */}
      {showExperienceForm && (
        <div className="modal-overlay" onClick={() => setShowExperienceForm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Experience' : 'Add Experience'}</h2>
              <button className="close-btn" onClick={() => setShowExperienceForm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Job Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Frontend Developer Intern"
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your responsibilities and achievements"
                    rows="4"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowExperienceForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveExperience}
                disabled={!formData.title || !formData.company || !formData.description}
              >
                {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="modal-overlay" onClick={() => setShowProjectForm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Project' : 'Add Project'}</h2>
              <button className="close-btn" onClick={() => setShowProjectForm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Project Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., E-commerce Website"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Technologies Used</label>
                  <input
                    type="text"
                    value={formData.technologies || ''}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    placeholder="React, Node.js, MongoDB, etc."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your project and your role"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>GitHub Link (Optional)</label>
                  <input
                    type="url"
                    value={formData.github || ''}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    placeholder="https://github.com/username/project"
                  />
                </div>
                <div className="form-group">
                  <label>Live Demo (Optional)</label>
                  <input
                    type="url"
                    value={formData.demo || ''}
                    onChange={(e) => setFormData({ ...formData, demo: e.target.value })}
                    placeholder="https://yourproject.com"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowProjectForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveProject}
                disabled={!formData.title || !formData.description || !formData.technologies}
              >
                {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Form Modal */}
      {showSkillForm && (
        <div className="modal-overlay" onClick={() => setShowSkillForm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Skill Category' : 'Add Skill Category'}</h2>
              <button className="close-btn" onClick={() => setShowSkillForm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Category Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Programming Languages, Frontend, Tools"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Skills <span className="required">*</span></label>
                  <div className="skills-input-container">
                    <input
                      type="text"
                      className="skills-input-field"
                      placeholder="Type a skill and press Enter or comma to add"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const input = e.target;
                          const value = input.value.trim();
                          if (value) {
                            // Handle comma-separated list
                            const skills = value.split(',').map(s => s.trim()).filter(s => s);
                            setFormData(prev => ({
                              ...prev,
                              items: [...(prev.items || []), ...skills]
                            }));
                            input.value = '';
                          }
                        }
                        if (e.key === 'Backspace' && e.target.value === '' && formData.items?.length > 0) {
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items.slice(0, -1)
                          }));
                        }
                      }}
                    />
                    <p className="input-hint">Press Enter or comma to add a skill</p>
                  </div>

                  {formData.items && formData.items.length > 0 && (
                    <div className="skills-preview">
                      {formData.items.map((skill, index) => (
                        <span key={index} className="skill-preview-tag">
                          {skill}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                items: prev.items.filter((_, i) => i !== index)
                              }));
                            }}
                            className="remove-skill-btn"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSkillForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveSkill}
                disabled={!formData.category || !formData.items || formData.items.length === 0}
              >
                {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certification Form Modal - WITH ENHANCED PREVIEW LIKE RESUME */}
      {showCertForm && (
        <div className="modal-overlay" onClick={() => setShowCertForm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Certification' : 'Add Certification'}</h2>
              <button className="close-btn" onClick={() => setShowCertForm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Certification Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., AWS Certified Developer"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Issuing Organization <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.issuer || ''}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    placeholder="e.g., Amazon Web Services"
                  />
                </div>

                <div className="form-group">
                  <label>Issue Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>

                {/* Certificate Upload Section - WITH ENHANCED PREVIEW LIKE RESUME */}
                <div className="form-group full-width">
                  <label>Upload Certificate (Optional)</label>
                  <div className="cert-upload-container">
                    {formData.certificateUrl ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {formData.certificateFile?.type?.startsWith('image/') ? (
                            <img
                              src={cleanUrl(formData.certificateUrl)}
                              alt="Certificate preview"
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #e5e7eb'
                              }}
                            />
                          ) : (
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500', color: '#1f2937', fontSize: '14px' }}>
                              {formData.certificateFile?.name || 'Certificate uploaded'}
                            </span>
                            {formData.certificateFile?.size && (
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                ({(formData.certificateFile.size / 1024).toFixed(0)} KB)
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a
                            href={cleanUrl(formData.certificateUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '6px 12px',
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              color: '#4b5563',
                              textDecoration: 'none',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              border: '1px solid #e5e7eb',
                              cursor: 'pointer'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10z"></path>
                            </svg>
                            Preview
                          </a>
                          <button
                            type="button"
                            style={{
                              padding: '6px 12px',
                              background: '#fee2e2',
                              borderRadius: '6px',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '13px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (editingItem && formData._id) {
                                handleRemoveCertificateFile(formData._id);
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  certificateUrl: '',
                                  certificateFile: null
                                }));
                              }
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="upload-area-small">
                          <input
                            type="file"
                            id="certUpload"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleCertUpload}
                            disabled={uploading}
                          />
                          <label htmlFor="certUpload" className="upload-label-small">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            {uploading ? 'Uploading...' : 'Choose File'}
                          </label>
                        </div>
                        <p className="upload-hint-small">PDF, JPG, PNG (Max 3MB)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Credential ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.credentialId || ''}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                    placeholder="ABC123XYZ"
                  />
                </div>

                <div className="form-group">
                  <label>Credential URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.link || ''}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://credential.net/verify/abc123"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCertForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveCertification}
                disabled={!formData.name || !formData.issuer || !formData.date}
              >
                {editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResumePage;