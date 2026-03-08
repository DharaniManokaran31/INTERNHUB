// src/components/common/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ isScrolled, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navigate = useNavigate();

  // Function to handle smooth scrolling
  const handleScrollToSection = (e, sectionId) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate to home first
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    setIsMobileMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`} id="header">
      <div className="container">
        <div className="header-content">
          {/* Logo - Updated to Zoyaraa */}
          <Link to="/" className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
                <path d="M22 10v6"></path>
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
              </svg>
            </div>
            <span className="logo-text">Zoyaraa</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav">
            <div className="nav-links">
              <a 
                href="#home" 
                className="nav-link"
                onClick={(e) => handleScrollToSection(e, 'home')}
              >
                Home
              </a>
              <a 
                href="#how-it-works" 
                className="nav-link"
                onClick={(e) => handleScrollToSection(e, 'how-it-works')}
              >
                How It Works
              </a>
              <a 
                href="#features" 
                className="nav-link"
                onClick={(e) => handleScrollToSection(e, 'features')}
              >
                For Students
              </a>
              <a 
                href="#features" 
                className="nav-link"
                onClick={(e) => handleScrollToSection(e, 'features')}
              >
                For Recruiters
              </a>
              <a 
                href="#faq" 
                className="nav-link"
                onClick={(e) => handleScrollToSection(e, 'faq')}
              >
                FAQ
              </a>
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
          <a 
            href="#home" 
            className="mobile-nav-link" 
            onClick={(e) => handleScrollToSection(e, 'home')}
          >
            Home
          </a>
          <a 
            href="#how-it-works" 
            className="mobile-nav-link" 
            onClick={(e) => handleScrollToSection(e, 'how-it-works')}
          >
            How It Works
          </a>
          <a 
            href="#features" 
            className="mobile-nav-link" 
            onClick={(e) => handleScrollToSection(e, 'features')}
          >
            For Students
          </a>
          <a 
            href="#features" 
            className="mobile-nav-link" 
            onClick={(e) => handleScrollToSection(e, 'features')}
          >
            For Recruiters
          </a>
          <a 
            href="#faq" 
            className="mobile-nav-link" 
            onClick={(e) => handleScrollToSection(e, 'faq')}
          >
            FAQ
          </a>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              navigate('/register');
              setIsMobileMenuOpen(false);
            }} 
            style={{ width: '100%' }}
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;