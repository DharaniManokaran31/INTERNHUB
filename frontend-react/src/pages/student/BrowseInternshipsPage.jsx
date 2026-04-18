// src/pages/student/BrowseInternshipsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentBrowseInternships.css';
import NotificationBell from '../../components/common/NotificationBell';
import StudentSidebar from '../../components/layout/StudentSidebar';

const BrowseInternshipsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== STATE MANAGEMENT =====
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [displayedInternships, setDisplayedInternships] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [userData, setUserData] = useState({
    name: '',
    initials: 'ST',
    firstName: 'Student',
    role: 'student',
    greeting: 'Good morning'
  });
  const [hasActiveInternship, setHasActiveInternship] = useState(false);

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ===== FILTER STATES =====
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    department: '',
    workMode: [],
    location: '',
    types: [],
    duration: '',
    category: '',
    stipend: '',
    levels: []
  });

  // ===== SORT STATE =====
  const [sortBy, setSortBy] = useState('recent');

  // ===== MODAL STATES =====
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);

  // ===== APPLICATION FORM STATES =====
  const [experience, setExperience] = useState('');
  const [available, setAvailable] = useState('');
  const [source, setSource] = useState('');
  const [confirmTerms, setConfirmTerms] = useState(false);  // ✅ ADDED

  // ===== DEPARTMENT OPTIONS =====
  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'Frontend', label: 'Frontend' },
    { value: 'Backend', label: 'Backend' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'HR', label: 'HR' },
    { value: 'Sales', label: 'Sales' },
    { value: 'UI/UX', label: 'UI/UX' },
    { value: 'Mobile', label: 'Mobile' }
  ];

  // ===== WORK MODE OPTIONS =====
  const workModes = [
    { value: 'Remote', label: 'Remote' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Onsite', label: 'Onsite' }
  ];

  // ===== GREETING =====
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';
    setUserData(prev => ({ ...prev, greeting }));
  }, []);

  // ===== DERIVED FILTER OPTIONS FROM REAL DATA =====
  const locations = ['', ...new Set(internships.map(i => i.location).filter(Boolean))];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'technology', label: 'Technology' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'design', label: 'Design' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'sales', label: 'Sales' },
    { value: 'other', label: 'Other' }
  ];

  const durations = [
    { value: '', label: 'Any Duration' },
    { value: '1-3', label: '1-3 months' },
    { value: '3-6', label: '3-6 months' },
    { value: '6+', label: '6+ months' }
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  // ===== LOAD BOOKMARKS FROM LOCALSTORAGE =====
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('studentBookmarks') || '[]');
    setBookmarkedIds(bookmarks);
  }, []);

  // ===== FETCH USER PROFILE =====
  useEffect(() => {
    fetchUserProfile();
    fetchInternships();
    fetchMyApplications();
    checkActiveInternship();
  }, []);

  const fetchUserProfile = async () => {
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
        const initials = user.fullName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const firstName = user.fullName.split(' ')[0];

        setUserData(prev => ({
          ...prev,
          name: user.fullName,
          firstName: firstName,
          initials: initials,
          role: user.role
        }));

        setProfileData(user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // ===== FETCH INTERNSHIPS FROM BACKEND - FIXED =====
  const fetchInternships = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Send token only if available (to get applied status)
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch('http://localhost:5000/api/internships', {
        headers: headers
      });
      const data = await response.json();

      if (data.success) {
        const internshipsList = data.data?.internships || [];
        setInternships(internshipsList);
        setFilteredInternships(internshipsList);
        setDisplayedInternships(internshipsList.slice(0, itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      showNotification('Failed to load internships', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===== FETCH MY APPLICATIONS =====
  const fetchMyApplications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const applications = data.data.applications || [];
        const normalizedApps = applications.map(app => ({
          ...app,
          internshipId: app.internshipId || app.internship?._id || app.internship
        }));
        setMyApplications(normalizedApps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  // 👇 ADD THIS FUNCTION (around line 200)
  const checkActiveInternship = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const hasAccepted = data.data.applications.some(app => app.status === 'accepted');
        setHasActiveInternship(hasAccepted);
      }
    } catch (error) {
      console.error('Error checking active internship:', error);
    }
  };

  // ===== CHECK IF ALREADY APPLIED - FIXED =====
  const hasApplied = (internshipId) => {
    if (!internshipId) return false;
    return myApplications.some(app => {
      // Check if internshipId is an object and extract _id, otherwise use as is
      const id1 = app.internshipId?._id || app.internshipId;
      const id2 = app.internship?._id || app.internship;
      const appInternshipId = id1 || id2;
      return String(appInternshipId) === String(internshipId);
    });
  };

  // ===== CHECK IF BOOKMARKED =====
  const isBookmarked = (internshipId) => {
    return bookmarkedIds.includes(internshipId);
  };

  // ===== TOGGLE BOOKMARK =====
  const toggleBookmark = (internshipId, event) => {
    event.stopPropagation();

    setBookmarkedIds(prev => {
      let newBookmarks;
      if (prev.includes(internshipId)) {
        newBookmarks = prev.filter(id => id !== internshipId);
        showNotification('Removed from bookmarks');
      } else {
        newBookmarks = [...prev, internshipId];
        showNotification('Added to bookmarks');
      }
      localStorage.setItem('studentBookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  // ===== CHECK IF DEADLINE PASSED =====
  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // ===== FORMAT STIPEND =====
  const formatStipend = (stipend) => {
    if (!stipend) return 'Unpaid';
    if (typeof stipend === 'number') {
      return `₹${stipend.toLocaleString()}/month`;
    }
    if (typeof stipend === 'string') {
      if (stipend.includes('₹')) return stipend;
      return `₹${stipend}`;
    }
    return 'Unpaid';
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ===== GET RELATIVE TIME =====
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
    return `Posted ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
  };

  // ===== GET DAYS REMAINING =====
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  // ===== GET SKILL LEVEL COLOR =====
  const getSkillLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return { bg: '#f0f9ff', color: '#0284c7', border: '#b8e1ff' };
      case 'intermediate':
        return { bg: '#fef3c7', color: '#d97706', border: '#fed7aa' };
      case 'advanced':
        return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#1f2937', border: '#e2e8f0' };
    }
  };

  // ===== TOGGLE WORK MODE FILTER =====
  const toggleWorkModeFilter = (mode) => {
    setActiveFilters(prev => {
      const modes = [...prev.workMode];
      const index = modes.indexOf(mode);
      if (index === -1) {
        modes.push(mode);
      } else {
        modes.splice(index, 1);
      }
      return { ...prev, workMode: modes };
    });
  };

  // ===== FILTER & SORT INTERNSHIPS =====
  useEffect(() => {
    let filtered = [...internships];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(internship =>
        internship.title?.toLowerCase().includes(query) ||
        internship.description?.toLowerCase().includes(query) ||
        internship.skillsRequired?.some(skill =>
          typeof skill === 'string'
            ? skill.toLowerCase().includes(query)
            : skill.name?.toLowerCase().includes(query)
        )
      );
    }

    // Department filter
    if (activeFilters.department) {
      filtered = filtered.filter(internship =>
        internship.department === activeFilters.department
      );
    }

    // Work Mode filter
    if (activeFilters.workMode.length > 0) {
      filtered = filtered.filter(internship =>
        activeFilters.workMode.includes(internship.workMode)
      );
    }

    // Location filter
    if (activeFilters.location) {
      filtered = filtered.filter(internship =>
        internship.location?.toLowerCase() === activeFilters.location.toLowerCase()
      );
    }

    // Type filter
    if (activeFilters.types.length > 0) {
      filtered = filtered.filter(internship => {
        const internshipType = internship.type?.toLowerCase() || '';
        return activeFilters.types.some(type =>
          internshipType.includes(type.toLowerCase())
        );
      });
    }

    // Duration filter
    if (activeFilters.duration) {
      filtered = filtered.filter(internship => {
        const months = parseInt(internship.duration) || 0;
        if (activeFilters.duration === '1-3') return months >= 1 && months <= 3;
        if (activeFilters.duration === '3-6') return months >= 3 && months <= 6;
        if (activeFilters.duration === '6+') return months >= 6;
        return true;
      });
    }

    // Category filter
    if (activeFilters.category) {
      filtered = filtered.filter(internship =>
        internship.category?.toLowerCase() === activeFilters.category.toLowerCase()
      );
    }

    // Stipend filter
    if (activeFilters.stipend) {
      const minStipend = parseInt(activeFilters.stipend);
      filtered = filtered.filter(internship => {
        const stipendAmount = typeof internship.stipend === 'number'
          ? internship.stipend
          : parseInt(internship.stipend?.replace(/[^0-9]/g, '') || 0);
        return stipendAmount >= minStipend;
      });
    }

    // Skill level filter
    if (activeFilters.levels.length > 0) {
      filtered = filtered.filter(internship => {
        const hasLevel = internship.skillsRequired?.some(skill => {
          const level = typeof skill === 'string' ? 'beginner' : skill.level;
          return activeFilters.levels.includes(level);
        });
        return hasLevel;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'stipend-high': {
          const aStipend = typeof a.stipend === 'number' ? a.stipend : 0;
          const bStipend = typeof b.stipend === 'number' ? b.stipend : 0;
          return bStipend - aStipend;
        }
        case 'stipend-low': {
          const aStipend = typeof a.stipend === 'number' ? a.stipend : 0;
          const bStipend = typeof b.stipend === 'number' ? b.stipend : 0;
          return aStipend - bStipend;
        }
        case 'duration':
          const aDuration = parseInt(a.duration) || 0;
          const bDuration = parseInt(b.duration) || 0;
          return aDuration - bDuration;
        default:
          return 0;
      }
    });

    setFilteredInternships(filtered);
    setCurrentPage(1);
    setDisplayedInternships(filtered.slice(0, itemsPerPage));
  }, [internships, searchQuery, activeFilters, sortBy]);

  // ===== HANDLE APPLY - FIXED =====
  const handleApply = async () => {
    if (!selectedInternship) return;

    try {
      setApplying(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        showNotification('Please login to apply', 'error');
        return;
      }

      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          internshipId: selectedInternship._id,
          coverLetter: coverLetter
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Application submitted successfully!', 'success');
        setShowApplyModal(false);
        setCoverLetter('');
        await fetchMyApplications();
      } else {
        throw new Error(data.message || 'Failed to apply');
      }
    } catch (error) {
      console.error('❌ Error applying:', error);
      showNotification(error.message || 'Failed to submit application', 'error');
    } finally {
      setApplying(false);
    }
  };

  // ===== LOAD MORE INTERNSHIPS =====
  const loadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const nextPage = currentPage + 1;
      const endIndex = nextPage * itemsPerPage;
      const newDisplayed = filteredInternships.slice(0, endIndex);

      setDisplayedInternships(newDisplayed);
      setCurrentPage(nextPage);
      setLoadingMore(false);
    }, 800);
  };

  // ===== CLEAR ALL FILTERS =====
  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveFilters({
      department: '',
      workMode: [],
      location: '',
      types: [],
      duration: '',
      category: '',
      stipend: '',
      levels: []
    });
    setSortBy('recent');
    showNotification('All filters cleared', 'success');
  };

  // ===== REMOVE SPECIFIC FILTER =====
  const removeFilter = (type, value) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      switch (type) {
        case 'department':
          updated.department = '';
          break;
        case 'workMode':
          updated.workMode = prev.workMode.filter(m => m !== value);
          break;
        case 'location':
          updated.location = '';
          break;
        case 'type':
          updated.types = prev.types.filter(t => t !== value);
          break;
        case 'duration':
          updated.duration = '';
          break;
        case 'category':
          updated.category = '';
          break;
        case 'stipend':
          updated.stipend = '';
          break;
        case 'level':
          updated.levels = prev.levels.filter(l => l !== value);
          break;
        default:
          break;
      }
      return updated;
    });
  };

  // ===== TOGGLE TYPE FILTER =====
  const toggleTypeFilter = (type) => {
    setActiveFilters(prev => {
      const types = [...prev.types];
      const index = types.indexOf(type);
      if (index === -1) {
        types.push(type);
      } else {
        types.splice(index, 1);
      }
      return { ...prev, types };
    });
  };

  // ===== TOGGLE SKILL LEVEL =====
  const toggleLevelFilter = (level) => {
    setActiveFilters(prev => {
      const levels = [...prev.levels];
      const index = levels.indexOf(level);
      if (index === -1) {
        levels.push(level);
      } else {
        levels.splice(index, 1);
      }
      return { ...prev, levels };
    });
  };

  // ===== SHOW NOTIFICATION =====
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : 'linear-gradient(135deg, #2440F0, #0B1DC1)';
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // ===== HANDLE LOGOUT =====
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  // ===== GET INITIALS =====
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
        setShowKeyboardHint(true);
        setTimeout(() => setShowKeyboardHint(false), 2000);
      }
      if (e.key === 'Escape' && document.activeElement?.id === 'searchInput') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ===== CREATE RIPPLE EFFECT =====
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

  // ===== GET FILTER DISPLAY TEXT =====
  const getFilterDisplayText = (type, value) => {
    switch (type) {
      case 'department':
        return value;
      case 'workMode':
        return value;
      case 'location':
        return value;
      case 'type':
        return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      case 'duration':
        if (value === '1-3') return '1-3 months';
        if (value === '3-6') return '3-6 months';
        if (value === '6+') return '6+ months';
        return value;
      case 'category':
        const category = categories.find(c => c.value === value);
        return category ? category.label : value;
      case 'stipend':
        return `Min ₹${value}`;
      case 'level':
        return value.charAt(0).toUpperCase() + value.slice(1);
      default:
        return value;
    }
  };

  // ===== GET ACTIVE FILTERS COUNT =====
  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.department) count++;
    if (activeFilters.workMode.length) count++;
    if (activeFilters.location) count++;
    if (activeFilters.types.length) count++;
    if (activeFilters.duration) count++;
    if (activeFilters.category) count++;
    if (activeFilters.stipend) count++;
    if (activeFilters.levels.length) count++;
    if (searchQuery) count++;
    return count;
  };

  // ===== RENDER =====
  return (
    <div className="app-container">
      {/* Unified Sidebar */}
      <StudentSidebar 
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                id="searchInput"
                placeholder="Search internships by title, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search internships"
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
              <span className={`keyboard-hint ${showKeyboardHint ? 'show' : ''}`}>
                Press / to search
              </span>
            </div>
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
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">
              {userData.greeting}, {userData.firstName || 'Student'}!
            </h1>
            <p className="page-subtitle">Find your perfect internship opportunity at Zoyaraa</p>
          </div>

          {/* Active Filters */}
          <div className={`active-filters ${getActiveFiltersCount() === 0 ? 'hidden' : ''}`}>
            {activeFilters.department && (
              <div className="filter-chip">
                🏢 {activeFilters.department}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('department', activeFilters.department)}
                  aria-label="Remove department filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            {activeFilters.workMode.map(mode => (
              <div key={mode} className="filter-chip">
                🏢 {mode}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('workMode', mode)}
                  aria-label="Remove work mode filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
            {activeFilters.location && (
              <div className="filter-chip">
                📍 {activeFilters.location}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('location', activeFilters.location)}
                  aria-label="Remove location filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            {activeFilters.types.map(type => (
              <div key={type} className="filter-chip">
                💼 {getFilterDisplayText('type', type)}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('type', type)}
                  aria-label="Remove type filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
            {activeFilters.duration && (
              <div className="filter-chip">
                ⏱️ {getFilterDisplayText('duration', activeFilters.duration)}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('duration', activeFilters.duration)}
                  aria-label="Remove duration filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            {activeFilters.category && (
              <div className="filter-chip">
                🏷️ {getFilterDisplayText('category', activeFilters.category)}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('category', activeFilters.category)}
                  aria-label="Remove category filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            {activeFilters.stipend && (
              <div className="filter-chip">
                💰 {getFilterDisplayText('stipend', activeFilters.stipend)}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('stipend', activeFilters.stipend)}
                  aria-label="Remove stipend filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            {activeFilters.levels.map(level => (
              <div key={level} className="filter-chip">
                📊 {getFilterDisplayText('level', level)}
                <button
                  className="filter-chip-remove"
                  onClick={() => removeFilter('level', level)}
                  aria-label="Remove level filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Browse Layout */}
          <div className="browse-layout">
            {/* Filters Sidebar */}
            <aside className="filters-sidebar">
              <div className="filters-header">
                <h3 className="filters-title">Filters</h3>
                {getActiveFiltersCount() > 0 && (
                  <button
                    className="clear-filters-btn"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Department Filter */}
              <div className="filter-group">
                <label className="filter-label">🏢 Department</label>
                <select
                  className="filter-select"
                  value={activeFilters.department}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  {departments.map(dept => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
                  ))}
                </select>
              </div>

              {/* Work Mode Filter */}
              <div className="filter-group">
                <label className="filter-label">🏢 Work Mode</label>
                <div className="checkbox-group">
                  {workModes.map(mode => (
                    <div key={mode.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`mode-${mode.value}`}
                        value={mode.value}
                        checked={activeFilters.workMode.includes(mode.value)}
                        onChange={(e) => toggleWorkModeFilter(e.target.value)}
                      />
                      <label htmlFor={`mode-${mode.value}`}>{mode.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div className="filter-group">
                <label className="filter-label">📍 Location</label>
                <select
                  className="filter-select"
                  value={activeFilters.location}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, location: e.target.value }))}
                >
                  <option value="">All Locations</option>
                  {locations.filter(Boolean).map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Duration Filter */}
              <div className="filter-group">
                <label className="filter-label">⏱️ Duration</label>
                <select
                  className="filter-select"
                  value={activeFilters.duration}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, duration: e.target.value }))}
                >
                  {durations.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Stipend Filter */}
              <div className="filter-group">
                <label className="filter-label">💰 Minimum Stipend (₹/month)</label>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="e.g., 10000"
                  value={activeFilters.stipend}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, stipend: e.target.value }))}
                  min="0"
                />
              </div>

              {/* Skill Level Filter */}
              <div className="filter-group">
                <label className="filter-label">📊 Skill Level</label>
                <div className="checkbox-group">
                  {skillLevels.map(level => (
                    <div key={level.value} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`level-${level.value}`}
                        value={level.value}
                        checked={activeFilters.levels.includes(level.value)}
                        onChange={(e) => toggleLevelFilter(e.target.value)}
                      />
                      <label htmlFor={`level-${level.value}`}>{level.label}</label>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Internships List */}
            <div className="internships-container">
              <div className="results-header">
                <div className="results-count">
                  {loading ? 'Loading...' :
                    `Showing ${displayedInternships.length} of ${filteredInternships.length} internship${filteredInternships.length !== 1 ? 's' : ''} at Zoyaraa`
                  }
                </div>
                <div className="sort-dropdown">
                  <label htmlFor="sortBy">Sort by:</label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="stipend-high">Highest Stipend</option>
                    <option value="stipend-low">Lowest Stipend</option>
                    <option value="duration">Duration</option>
                  </select>
                </div>
              </div>

              <div id="internshipsList" className="internships-list">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card"></div>
                  ))
                ) : displayedInternships.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    <h3>No internships found</h3>
                    <p>Try adjusting your filters to see more results from Zoyaraa</p>
                    <div className="empty-state-actions">
                      <button
                        className="primary-btn"
                        onClick={clearAllFilters}
                        onMouseDown={createRippleEffect}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3v18h18"></path>
                          <path d="m7 13 4-4 4 4 6-6"></path>
                          <path d="M21 3v6h-6"></path>
                        </svg>
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  displayedInternships.map((internship) => {
                    const applied = internship.hasApplied || hasApplied(internship._id);
                    const bookmarked = isBookmarked(internship._id);
                    const deadlinePassed = isDeadlinePassed(internship.deadline);
                    const relativeTime = getRelativeTime(internship.createdAt);

                    return (
                      <div
                        key={internship._id}
                        className="internship-card"
                        onClick={() => setSelectedInternship(internship)}
                        tabIndex="0"
                        role="button"
                        aria-label={`View details for ${internship.title} at Zoyaraa`}
                      >
                        <div className="card-header">
                          <div className="company-info">
                            <div className="company-logo">
                              Z
                            </div>
                            <div className="internship-details">
                              <h3 className="internship-title">{internship.title}</h3>
                              <p className="company-name">Zoyaraa • {internship.department}</p>
                              <div className="internship-meta">
                                <span className="meta-item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                  </svg>
                                  {internship.location || 'N/A'}
                                </span>
                                <span className="meta-item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                  {internship.duration || 'N/A'} months
                                </span>
                                <span className="meta-item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  {internship.workMode || 'Full-time'}
                                </span>
                              </div>
                              <div className="posted-time">{relativeTime}</div>
                            </div>
                          </div>
                          {/* Bookmark Button */}
                          <div className="card-actions-header">
                            <button
                              className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
                              onClick={(e) => toggleBookmark(internship._id, e)}
                              aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                              onMouseDown={createRippleEffect}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <p className="card-description">{internship.description}</p>

                        <div className="card-tags">
                          {internship.skillsRequired?.slice(0, 6).map((skill, index) => {
                            const skillName = typeof skill === 'string' ? skill : skill.name;
                            const skillLevel = typeof skill === 'string' ? 'beginner' : skill.level;
                            const levelColor = getSkillLevelColor(skillLevel);

                            return (
                              <span
                                key={index}
                                className="tag"
                                style={{
                                  backgroundColor: levelColor.bg,
                                  color: levelColor.color,
                                  border: `1px solid ${levelColor.border}`
                                }}
                              >
                                {skillName}
                                <span className="skill-level"> • {skillLevel}</span>
                              </span>
                            );
                          })}
                        </div>

                        <div className="card-footer">
                          <div className="stipend">{formatStipend(internship.stipend)}</div>
                          <button
                            className={`apply-btn ${applied ? 'applied' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!applied && !deadlinePassed) {
                                setSelectedInternship(internship);
                                setShowApplyModal(true);
                              }
                            }}
                            disabled={applied || deadlinePassed}
                            onMouseDown={createRippleEffect}
                          >
                            {applied ? '✓ Applied' : deadlinePassed ? 'Closed' : 'Apply Now'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Load More Button */}
              {!loading && filteredInternships.length > displayedInternships.length && (
                <div className="load-more-container">
                  <button
                    className="load-more-btn"
                    onClick={loadMore}
                    disabled={loadingMore}
                    onMouseDown={createRippleEffect}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Internships'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Internship Details Modal */}
      {selectedInternship && !showApplyModal && (
        <div className="modal-overlay" onClick={() => setSelectedInternship(null)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <button
              className="close-modal"
              onClick={() => setSelectedInternship(null)}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-body">
              {/* Header */}
              <div className="modal-header-content">
                <h2>{selectedInternship.title}</h2>
                <p className="company-name-large">Zoyaraa • {selectedInternship.department} Department</p>
                <div className="internship-status-badge" style={{
                  display: 'inline-block',
                  padding: '0.25rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  background: selectedInternship.status === 'active' ? '#E6F7E6' : '#fee2e2',
                  color: selectedInternship.status === 'active' ? '#10b981' : '#dc2626',
                  marginTop: '0.5rem'
                }}>
                  {selectedInternship.status === 'active' ? '🟢 Active' : '🔴 Closed'}
                </div>
              </div>

              {/* Key Details Grid */}
              <div className="internship-details-grid-2col">
                <div className="detail-card">
                  <div className="detail-label">📍 Location</div>
                  <div className="detail-value">{selectedInternship.location || 'Not specified'}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">⏱️ Duration</div>
                  <div className="detail-value">{selectedInternship.duration} months</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">💰 Stipend</div>
                  <div className="detail-value stipend-value">{formatStipend(selectedInternship.stipend)}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">💼 Work Mode</div>
                  <div className="detail-value">{selectedInternship.workMode || 'Not specified'}</div>
                </div>
              </div>

              {/* Work Details Section */}
              <div className="modal-section">
                <h3>🏢 Work Details</h3>
                <div className="work-details-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px'
                }}>
                  {selectedInternship.officeLocation && (
                    <div className="work-detail-item">
                      <span className="detail-label-small">Office Location:</span>
                      <span className="detail-value-small">{selectedInternship.officeLocation}</span>
                    </div>
                  )}
                  <div className="work-detail-item">
                    <span className="detail-label-small">Daily Timings:</span>
                    <span className="detail-value-small">{selectedInternship.dailyTimings || '10 AM - 6 PM'}</span>
                  </div>
                  <div className="work-detail-item">
                    <span className="detail-label-small">Weekly Off:</span>
                    <span className="detail-value-small">{selectedInternship.weeklyOff || 'Saturday, Sunday'}</span>
                  </div>
                  <div className="work-detail-item">
                    <span className="detail-label-small">Start Date:</span>
                    <span className="detail-value-small">{formatDate(selectedInternship.startDate)}</span>
                  </div>
                  <div className="work-detail-item">
                    <span className="detail-label-small">End Date:</span>
                    <span className="detail-value-small">{formatDate(selectedInternship.endDate)}</span>
                  </div>
                  <div className="work-detail-item">
                    <span className="detail-label-small">Positions Available:</span>
                    <span className="detail-value-small">{selectedInternship.positions || 1}</span>
                  </div>
                  <div className="work-detail-item">
                    <span className="detail-label-small">Application Deadline:</span>
                    <span className="detail-value-small" style={{
                      color: isDeadlinePassed(selectedInternship.deadline) ? '#dc2626' : '#059669',
                      fontWeight: '600'
                    }}>
                      {formatDate(selectedInternship.deadline)}
                      {!isDeadlinePassed(selectedInternship.deadline) && (
                        <span style={{ marginLeft: '0.5rem' }}>({getDaysRemaining(selectedInternship.deadline)})</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="modal-section">
                <h3>📝 Description</h3>
                <p className="internship-description" style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedInternship.description}
                </p>
              </div>

              {/* Skills Required */}
              <div className="modal-section">
                <h3>🛠️ Skills Required</h3>
                <div className="skills-container">
                  {selectedInternship.skillsRequired?.map((skill, index) => {
                    const skillName = typeof skill === 'string' ? skill : skill.name;
                    const skillLevel = typeof skill === 'string' ? 'beginner' : skill.level;
                    const levelColor = getSkillLevelColor(skillLevel);

                    return (
                      <div key={index} className="skill-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        marginBottom: '0.5rem'
                      }}>
                        <span className="skill-name" style={{ fontWeight: '500' }}>{skillName}</span>
                        <span
                          className="skill-level-badge"
                          style={{
                            backgroundColor: levelColor.bg,
                            color: levelColor.color,
                            border: `1px solid ${levelColor.border}`,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          {skillLevel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Requirements */}
              {selectedInternship.requirements && selectedInternship.requirements.length > 0 && (
                <div className="modal-section">
                  <h3>📋 Requirements</h3>
                  <ul className="requirements-list" style={{ listStyle: 'none', padding: 0 }}>
                    {selectedInternship.requirements.map((req, index) => (
                      <li key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        marginBottom: '0.5rem'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Perks & Benefits */}
              {selectedInternship.perks && selectedInternship.perks.length > 0 && (
                <div className="modal-section">
                  <h3>🎁 Perks & Benefits</h3>
                  <div className="perks-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {selectedInternship.perks.map((perk, index) => (
                      <div key={index} className="perk-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: '#f0f9ff',
                        borderRadius: '8px',
                        color: '#0369a1'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="m9 12 2 2 4-5"></path>
                        </svg>
                        {perk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selection Process */}
              {selectedInternship.selectionProcess && selectedInternship.selectionProcess.length > 0 && (
                <div className="modal-section">
                  <h3>🎯 Selection Process</h3>
                  <div className="selection-process-steps">
                    {selectedInternship.selectionProcess.map((round, index) => (
                      <div key={index} className="selection-round" style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '1rem',
                          background: '#2440F0',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Round {round.round}
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600' }}>{round.type}</span>
                            {round.duration && (
                              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                ⏱️ {round.duration}
                              </span>
                            )}
                          </div>
                          <p style={{ color: '#4b5563', fontSize: '0.9375rem', margin: 0 }}>
                            {round.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posted & Deadline Info */}
              <div className="modal-section" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '0.875rem' }}>
                  <span>📅 Posted: {formatDate(selectedInternship.createdAt)}</span>
                  <span>🆔 Internship ID: {selectedInternship._id.slice(-6)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-close-btn"
                onClick={() => setSelectedInternship(null)}
                onMouseDown={createRippleEffect}
              >
                Close
              </button>
              {!hasApplied(selectedInternship._id) && !isDeadlinePassed(selectedInternship.deadline) && (
                <button
                  className="modal-apply-btn"
                  onClick={() => setShowApplyModal(true)}
                  onMouseDown={createRippleEffect}
                >
                  Apply Now
                </button>
              )}
              {hasApplied(selectedInternship._id) && (
                <button className="modal-apply-btn applied" disabled>
                  ✓ Already Applied
                </button>
              )}
              {isDeadlinePassed(selectedInternship.deadline) && !hasApplied(selectedInternship._id) && (
                <button className="modal-apply-btn" disabled style={{ background: '#9ca3af' }}>
                  ⏰ Deadline Passed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedInternship && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button
              className="close-modal"
              onClick={() => setShowApplyModal(false)}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-body">
              <div className="modal-header-content">
                <h2>Apply for {selectedInternship.title}</h2>
                <p className="company-name-large">Zoyaraa • {selectedInternship.department} Department</p>
              </div>

              {/* ===== SECTION 1: Profile Review ===== */}
              <div className="modal-section">
                <h3>📋 Your Profile</h3>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  {/* Basic Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{userData.name || 'Student Name'}</span>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>{userData.email}</p>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      background: '#E6F7E6',
                      color: '#10b981',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontWeight: '600'
                    }}>
                      Profile Synced
                    </span>
                  </div>

                  {/* Education */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Education</span>
                    <p style={{ fontSize: '0.9375rem', marginTop: '0.25rem' }}>
                      {profileData?.currentEducation?.college || 'Not specified'} •
                      {profileData?.currentEducation?.department || 'Department'} •
                      {profileData?.currentEducation?.yearOfStudy || 'Year'}
                    </p>
                  </div>

                  {/* Skills */}
                  {profileData?.skills && profileData.skills.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Skills</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {profileData.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} style={{
                            background: '#EEF2FF',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            color: '#2440F0'
                          }}>
                            {skill}
                          </span>
                        ))}
                        {profileData.skills.length > 5 && (
                          <span style={{
                            background: '#f1f5f9',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            color: '#64748b'
                          }}>
                            +{profileData.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resume */}
                  {profileData?.resume?.resumeFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2440F0" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: '#2440F0' }}>
                        {profileData.resume.resumeFileName || 'resume.pdf'}
                      </span>
                      <a
                        href={`http://localhost:5000${profileData.resume.resumeFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#2440F0', textDecoration: 'underline' }}
                      >
                        View Resume
                      </a>
                    </div>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      background: '#FFF4E5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                        No resume uploaded. Please upload in your profile.
                      </span>
                      <button
                        onClick={() => navigate('/student/resume')}
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.75rem',
                          color: '#2440F0',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Go to Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== SECTION 2: Cover Letter ===== */}
              <div className="modal-section">
                <h3>📝 Cover Letter</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell us why you're interested in this internship and what makes you a good fit..."
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.9375rem',
                      fontFamily: 'inherit'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    A thoughtful cover letter increases your chances of getting shortlisted.
                  </p>
                </div>
              </div>

              {/* ===== SECTION 3: Confirmation ===== */}
              <div className="modal-section" style={{ borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    id="confirm"
                    style={{ marginTop: '0.25rem' }}
                    onChange={(e) => setConfirmTerms(e.target.checked)}
                  />
                  <label htmlFor="confirm" style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    I confirm that all information provided is accurate and I understand that submitting false information may lead to disqualification.
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setShowApplyModal(false)}
                onMouseDown={createRippleEffect}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleApply}
                disabled={applying}
                onMouseDown={createRippleEffect}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  padding: '0.75rem 2rem'
                }}
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseInternshipsPage;