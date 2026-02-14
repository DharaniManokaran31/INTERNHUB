import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/StudentBrowseInternships.css';

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
  const [userData, setUserData] = useState({
    name: '',
    initials: 'DS',
    firstName: 'Student',
    role: 'student',
    greeting: 'Good morning'
  });

  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ===== FILTER STATES =====
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // ===== FETCH INTERNSHIPS FROM BACKEND =====
  const fetchInternships = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/internships', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  // ===== FETCH MY APPLICATIONS - FIXED =====
  const fetchMyApplications = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:5000/api/applications/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const applications = data.data.applications || [];
        console.log('✅ Applications loaded:', applications);

        // ✅ NORMALIZE: Ensure internshipId is available at top level
        const normalizedApps = applications.map(app => ({
          ...app,
          // Extract internship ID from nested object if needed
          internshipId: app.internshipId || app.internship?._id || app.internship
        }));

        setMyApplications(normalizedApps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  // ===== CHECK IF ALREADY APPLIED - FIXED =====
  const hasApplied = (internshipId) => {
    if (!internshipId) return false;

    // Check if this internship ID exists in myApplications
    return myApplications.some(app => {
      // Try multiple possible field names
      const appInternshipId = app.internshipId || app.internship?._id || app.internship;
      return appInternshipId === internshipId;
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
    if (typeof stipend === 'string') {
      if (stipend.includes('₹')) return stipend;
      return `₹${stipend}`;
    }
    return `₹${stipend.toLocaleString()}/month`;
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

  // ===== FILTER & SORT INTERNSHIPS =====
  useEffect(() => {
    let filtered = [...internships];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(internship =>
        internship.title?.toLowerCase().includes(query) ||
        internship.companyName?.toLowerCase().includes(query) ||
        internship.description?.toLowerCase().includes(query) ||
        internship.skillsRequired?.some(skill =>
          typeof skill === 'string'
            ? skill.toLowerCase().includes(query)
            : skill.name?.toLowerCase().includes(query)
        )
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
        const stipendAmount = typeof internship.stipend === 'string'
          ? parseInt(internship.stipend.replace(/[^0-9]/g, '') || 0)
          : internship.stipend?.amount || 0;
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
          const aStipend = typeof a.stipend === 'string'
            ? parseInt(a.stipend.replace(/[^0-9]/g, '') || 0)
            : a.stipend?.amount || 0;
          const bStipend = typeof b.stipend === 'string'
            ? parseInt(b.stipend.replace(/[^0-9]/g, '') || 0)
            : b.stipend?.amount || 0;
          return bStipend - aStipend;
        }
        case 'stipend-low': {
          const aStipend = typeof a.stipend === 'string'
            ? parseInt(a.stipend.replace(/[^0-9]/g, '') || 0)
            : a.stipend?.amount || 0;
          const bStipend = typeof b.stipend === 'string'
            ? parseInt(b.stipend.replace(/[^0-9]/g, '') || 0)
            : b.stipend?.amount || 0;
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

  // ===== HANDLE APPLY - FIXED (added await) =====
  const handleApply = async () => {
    if (!selectedInternship) return;

    try {
      setApplying(true);
      const token = localStorage.getItem('authToken');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const studentId = user.id || user._id;

      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          internshipId: selectedInternship._id,
          coverLetter
        })
      });

      const data = await response.json();

      if (data.success || data.message === 'Application submitted successfully') {
        showNotification('Application submitted successfully!', 'success');
        setShowApplyModal(false);
        setCoverLetter('');

        // ✅ IMPORTANT: Wait for applications to refresh
        await fetchMyApplications();

      } else {
        throw new Error(data.message || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying:', error);
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

  // ===== TOGGLE FILTER TYPE =====
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

  // ===== HANDLE NOTIFICATION CLICK =====
  const handleNotificationClick = () => {
    showNotification('You have no new notifications');
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

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  // ===== GET FILTER DISPLAY TEXT =====
  const getFilterDisplayText = (type, value) => {
    switch (type) {
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
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar - EXACT match to Dashboard */}
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
            className={`nav-item active`}
            onClick={() => navigate('/student/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Browse Internships</span>
          </button>

          <button
            className={`nav-item ${location.pathname === '/student/applications' ? 'active' : ''}`}
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
            className={`nav-item ${location.pathname.includes('/student/resume') ? 'active' : ''}`}
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
              <div className="user-name-sidebar">{userData.name || 'Student User'}</div>
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
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                id="searchInput"
                placeholder="Search internships..."
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
            <button
              className="notification-btn"
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge"></span>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {/* Page Header - LEFT ALIGNED WITH GREETING */}
          <div className="page-header">
            <h1 className="page-title">
              {userData.greeting}, {userData.firstName || 'Student'}!
            </h1>
            <p className="page-subtitle">Find your perfect internship opportunity</p>
          </div>

          {/* Active Filters */}
          <div className={`active-filters ${getActiveFiltersCount() === 0 ? 'hidden' : ''}`}>
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

              {/* Internship Type Filter */}
              <div className="filter-group">
                <label className="filter-label">💼 Internship Type</label>
                <div className="checkbox-group">
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="fullTime"
                      value="full-time"
                      checked={activeFilters.types.includes('full-time')}
                      onChange={(e) => toggleTypeFilter(e.target.value)}
                    />
                    <label htmlFor="fullTime">Full-time</label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="partTime"
                      value="part-time"
                      checked={activeFilters.types.includes('part-time')}
                      onChange={(e) => toggleTypeFilter(e.target.value)}
                    />
                    <label htmlFor="partTime">Part-time</label>
                  </div>
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="remoteType"
                      value="remote"
                      checked={activeFilters.types.includes('remote')}
                      onChange={(e) => toggleTypeFilter(e.target.value)}
                    />
                    <label htmlFor="remoteType">Remote</label>
                  </div>
                </div>
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

              {/* Category Filter */}
              <div className="filter-group">
                <label className="filter-label">🏷️ Category</label>
                <select
                  className="filter-select"
                  value={activeFilters.category}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
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
                    `Showing ${displayedInternships.length} of ${filteredInternships.length} internship${filteredInternships.length !== 1 ? 's' : ''}`
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
                  // Skeleton loading
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card"></div>
                  ))
                ) : displayedInternships.length === 0 ? (
                  // Empty state
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                      </svg>
                    </div>
                    <h3>No internships found</h3>
                    <p>Try adjusting your filters to see more results</p>
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
                  // Internship cards
                  displayedInternships.map((internship) => {
                    const applied = hasApplied(internship._id);
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
                        aria-label={`View details for ${internship.title} at ${internship.companyName}`}
                      >
                        <div className="card-header">
                          <div className="company-info">
                            <div className="company-logo">
                              {internship.companyName?.charAt(0) || 'C'}
                            </div>
                            <div className="internship-details">
                              <h3 className="internship-title">{internship.title}</h3>
                              <p className="company-name">{internship.companyName}</p>
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
                                  {internship.duration || 'N/A'} {internship.duration && 'months'}
                                </span>
                                <span className="meta-item">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  {internship.type || 'Full-time'}
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

      {/* Internship Details Modal - 2x2 Grid Layout */}
      {selectedInternship && !showApplyModal && (
        <div className="modal-overlay" onClick={() => setSelectedInternship(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
              <div className="modal-header-content">
                <h2>{selectedInternship.title}</h2>
                <p className="company-name-large">{selectedInternship.companyName}</p>
              </div>

              {/* 2x2 Grid Layout - Perfect Alignment */}
              <div className="internship-details-grid-2col">
                <div className="detail-card">
                  <div className="detail-label">📍 Location</div>
                  <div className="detail-value">{selectedInternship.location || 'N/A'}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">⏱️ Duration</div>
                  <div className="detail-value">
                    {selectedInternship.duration || 'N/A'}
                    {selectedInternship.duration && !selectedInternship.duration.includes('month') ? ' months' : ''}
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">💰 Stipend</div>
                  <div className="detail-value stipend-value">{formatStipend(selectedInternship.stipend)}</div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">💼 Type</div>
                  <div className="detail-value">{selectedInternship.type || 'Full-time'}</div>
                </div>
              </div>

              {/* Description */}
              <div className="modal-section">
                <h3>📝 Description</h3>
                <p className="internship-description">{selectedInternship.description}</p>
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
                      <div key={index} className="skill-item">
                        <span className="skill-name">{skillName}</span>
                        <span
                          className="skill-level-badge"
                          style={{
                            backgroundColor: levelColor.bg,
                            color: levelColor.color,
                            border: `1px solid ${levelColor.border}`
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
                  <ul className="requirements-list">
                    {selectedInternship.requirements.map((req, index) => (
                      <li key={index}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <div className="perks-grid">
                    {selectedInternship.perks.map((perk, index) => (
                      <div key={index} className="perk-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="m9 12 2 2 4-5"></path>
                        </svg>
                        {perk}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  ✓ Applied
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedInternship && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                <p className="company-name-large">{selectedInternship.companyName}</p>
              </div>

              <div className="modal-section">
                <h3>📝 Cover Letter</h3>
                <textarea
                  className="cover-letter-input"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this internship..."
                  rows="6"
                />
                <p className="field-hint">
                  A well-written cover letter increases your chances of getting shortlisted.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-close-btn"
                onClick={() => setShowApplyModal(false)}
                onMouseDown={createRippleEffect}
              >
                Cancel
              </button>
              <button
                className="modal-apply-btn"
                onClick={handleApply}
                disabled={applying}
                onMouseDown={createRippleEffect}
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