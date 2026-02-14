// src/components/common/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ isScrolled, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navigate = useNavigate();

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`} id="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
                <path d="M22 10v6"></path>
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
              </svg>
            </div>
            <span className="logo-text">InternHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav">
            <div className="nav-links">
              <a href="#home" className="nav-link">Home</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#recruiters" className="nav-link">Recruiters</a>
              <a href="#students" className="nav-link">Students</a>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <a href="#home" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
          <a href="#about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#recruiters" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Recruiters</a>
          <a href="#students" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Students</a>
          <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ width: '100%' }}>
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;