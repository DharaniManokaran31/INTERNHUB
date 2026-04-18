import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminSidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, userData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin/dashboard',
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
      id: 'users',
      label: 'Manage Users',
      path: '/admin/users',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      id: 'internships',
      label: 'Internships',
      path: '/admin/internships',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/admin/reports',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      )
    },
    {
      id: 'company',
      label: 'Company Settings',
      path: '/admin/company',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18"></path>
          <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"></path>
          <path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"></path>
          <rect x="9" y="7" width="6" height="4"></rect>
          <path d="M17 11V7"></path>
          <path d="M7 11V7"></path>
        </svg>
      )
    }
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

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
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
            >
              {item.icon}
              <span className="nav-item-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="user-profile-sidebar"
            onClick={() => navigate('/admin/profile')}
          >
            <div className="user-avatar-sidebar">{userData?.initials || 'AD'}</div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">{userData?.name || 'Admin'}</div>
              <div className="user-role-sidebar">Admin</div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
