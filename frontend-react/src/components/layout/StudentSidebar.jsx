// src/components/layout/StudentSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const StudentSidebar = ({ isOpen, setIsOpen, userData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasActiveInternship, setHasActiveInternship] = useState(false);

  useEffect(() => {
    const checkActiveInternship = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('https://internhub-backend-d870.onrender.com/api/applications/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const hasAccepted = data.data.applications.some(app => 
            ['accepted', 'completed'].includes(app.status)
          );
          setHasActiveInternship(hasAccepted);
        }
      } catch (error) {
        console.error('Error checking active internship:', error);
      }
    };

    checkActiveInternship();
  }, []);

  const navItems = [
    {
      title: 'Dashboard',
      path: '/student/dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      title: 'Browse Internships',
      path: '/student/internships',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      )
    },
    {
      title: 'My Applications',
      path: '/student/applications',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      title: 'My Resume',
      path: '/student/resume',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      )
    }
  ];

  const activeInternshipItems = [
    {
      title: 'My Internship',
      path: '/student/active-internship',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      title: 'Daily Log',
      path: '/student/daily-log',
      icon: (
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      )
    },
    {
      title: 'My Logs',
      path: '/student/my-logs',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
      )
    },
    {
        title: 'Certificates',
        path: '/student/certificates',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        )
      }
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/student/dashboard')} style={{ cursor: 'pointer' }}>
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
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
            >
              {item.icon}
              <span className="nav-item-text">{item.title}</span>
            </button>
          ))}

          {hasActiveInternship && (
            <>
              <div className="sidebar-divider" style={{ 
                height: '1px', 
                background: 'rgba(255, 255, 255, 0.1)', 
                margin: '1rem 1.25rem' 
              }}></div>
              
              <div className="sidebar-section-title" style={{
                padding: '0 1.25rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Internship Program
              </div>

              {activeInternshipItems.map((item) => (
                <button
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="nav-item-text">{item.title}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => {
              navigate('/student/profile');
              setIsOpen(false);
            }}
          >
            <div className="user-avatar-sidebar">{userData?.initials || 'ST'}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData?.name || 'Student'}</div>
              <div className="user-role-sidebar">Student • Zoyaraa</div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
