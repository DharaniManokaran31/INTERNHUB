// src/pages/student/DailyLogFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Reuse existing styles
import NotificationBell from '../../components/common/NotificationBell';

const DailyLogFormPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [internship, setInternship] = useState(null);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'ST',
    role: 'student'
  });

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([
    { description: '', hoursSpent: '', status: 'completed' }
  ]);
  const [learnings, setLearnings] = useState('');
  const [challenges, setChallenges] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');

  // Fetch user profile
  useEffect(() => {
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

    fetchUserProfile();
  }, []);

  // Fetch active internship
  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const token = localStorage.getItem('authToken');

        // First, check if student has an accepted application
        const appsResponse = await fetch('http://localhost:5000/api/applications/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const appsData = await appsResponse.json();

        if (!appsData.success) {
          navigate('/student/dashboard');
          return;
        }

        const acceptedApp = appsData.data.applications?.find(app => app.status === 'accepted');

        if (!acceptedApp) {
          // No active internship, redirect to dashboard
          navigate('/student/dashboard');
          return;
        }

        const internshipId = acceptedApp.internshipId || acceptedApp.internship?._id;

        // Fetch internship details
        const internshipResponse = await fetch(`http://localhost:5000/api/internships/${internshipId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const internshipData = await internshipResponse.json();

        if (internshipData.success) {
          setInternship(internshipData.data.internship);
        }

        // Check if already submitted for today
        const logsResponse = await fetch('http://localhost:5000/api/daily-logs/my-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsResponse.json();

        if (logsData.success) {
          const todayStr = new Date().toDateString();
          const hasLoggedToday = logsData.data.logs?.some(log => 
            new Date(log.date).toDateString() === todayStr
          );

          if (hasLoggedToday) {
            // If already submitted today, redirect to active internship page with message
            alert('You have already submitted your log for today.');
            navigate('/student/active-internship');
          }
        }

      } catch (error) {
        console.error('Error fetching internship:', error);
      }
    };

    fetchInternship();
  }, [navigate]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : 'linear-gradient(135deg, #2440F0, #0B1DC1)';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Task management functions
  const addTask = () => {
    setTasks([...tasks, { description: '', hoursSpent: '', status: 'completed' }]);
  };

  const removeTask = (index) => {
    if (tasks.length === 1) {
      showNotification('You need at least one task', 'error');
      return;
    }
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const totalHours = tasks.reduce((sum, task) => sum + (parseFloat(task.hoursSpent) || 0), 0);
  const isHoursValid = totalHours >= 4 && totalHours <= 12;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!internship) return;

    if (!isHoursValid) {
      showNotification('Total hours must be between 4 and 12', 'error');
      return;
    }

    if (tasks.some(t => !t.description || !t.hoursSpent)) {
      showNotification('Please fill in all task details', 'error');
      return;
    }

    if (!tomorrowPlan) {
      showNotification('Please fill in your plan for tomorrow', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');

      const logData = {
        internshipId: internship._id,
        date,
        tasksCompleted: tasks.map(t => ({
          description: t.description,
          hoursSpent: parseFloat(t.hoursSpent),
          status: t.status
        })),
        totalHours,
        learnings,
        challenges,
        tomorrowPlan
      };

      const response = await fetch('http://localhost:5000/api/daily-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('Daily log submitted successfully!', 'success');
        navigate('/student/active-internship');
      } else {
        throw new Error(data.message || 'Failed to submit log');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showNotification(error.message || 'Error submitting log', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item"
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
            className="nav-item"
            onClick={() => navigate('/student/internships')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span className="nav-item-text">Browse Internships</span>
          </button>

          <button
            className="nav-item"
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
            className="nav-item"
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

          <button
            className="nav-item active"
            onClick={() => navigate('/student/active-internship')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="nav-item-text">My Internship</span>
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
              <div className="user-role-sidebar">Student • Zoyaraa</div>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">Submit Daily Log</h2>
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
          {/* Page Header - Matching other pages */}
          <div className="page-header">
            <h1 className="page-title">Daily Work Log</h1>
            <p className="page-subtitle">
              {internship ? `Log your work for ${internship.title}` : 'Document your daily progress'}
            </p>
          </div>

          {/* Form Card */}
          <div className="modal-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              {/* Date Field */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Log Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>

              {/* Tasks Section */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1e293b' }}>
                Tasks Completed Today
              </h3>

              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="internship-card"
                  style={{
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✕ Remove
                    </button>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Task Description
                    </label>
                    <textarea
                      className="form-input"
                      rows="2"
                      placeholder="Briefly describe what you worked on..."
                      value={task.description}
                      onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.75rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Hours Spent
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        min="0.5"
                        step="0.5"
                        placeholder="e.g., 2.5"
                        value={task.hoursSpent}
                        onChange={(e) => handleTaskChange(index, 'hoursSpent', e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.75rem' }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Status
                      </label>
                      <select
                        className="form-input"
                        value={task.status}
                        onChange={(e) => handleTaskChange(index, 'status', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem' }}
                      >
                        <option value="completed">Completed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Task Button */}
              <button
                type="button"
                className="secondary-btn"
                onClick={addTask}
                style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Another Task
              </button>

              {/* Total Hours Banner */}
              <div
                className="stat-card"
                style={{
                  background: isHoursValid ? '#E6F7E6' : '#fee2e2',
                  color: isHoursValid ? '#10b981' : '#dc2626',
                  padding: '1rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: isHoursValid ? '1px solid #10b981' : '1px solid #dc2626'
                }}
              >
                <span style={{ fontWeight: '600' }}>Total Hours Logged:</span>
                <span style={{ fontWeight: '700' }}>
                  {totalHours.toFixed(1)} hrs {isHoursValid ? '✓' : '(Must be 4-12 hrs)'}
                </span>
              </div>

              {/* Reflections Section */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1e293b' }}>
                Reflections & Insights
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  What did you learn today?
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="New concepts, tools, or skills acquired..."
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Any challenges faced?
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Blockers, bugs, or difficulties..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Plan for tomorrow
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="What are your goals for the next working day?"
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="primary-btn"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Daily Log'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyLogFormPage;