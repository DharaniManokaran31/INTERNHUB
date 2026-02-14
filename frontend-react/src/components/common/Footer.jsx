// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Logo and Description */}
          <div className="footer-col">
            <div className="logo" style={{ marginBottom: '1rem' }}>
              <div className="logo-icon">IH</div>
              <span className="logo-text">InternHub</span>
            </div>
            <p className="footer-description">
              Connecting students with their dream internships and companies with top talent.
            </p>
            <div className="social-links">
              <a href="#facebook" className="social-link" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#twitter" className="social-link" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#linkedin" className="social-link" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#instagram" className="social-link" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>

          {/* For Users */}
          <div className="footer-col">
            <h3>For Users</h3>
            <ul className="footer-links">
              <li><a href="#students">Students</a></li>
              <li><a href="#recruiters">Recruiters</a></li>
              <li><a href="#administrators">Administrators</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="footer-col">
            <h3>Legal & Contact</h3>
            <ul className="footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="mailto:info@internhub.com">info@internhub.com</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>© 2026 InternHub. Built for students, by students. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;