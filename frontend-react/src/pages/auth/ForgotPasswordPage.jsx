// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/students/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Check your email for reset instructions!');
        // In production: Just show success message
        // For testing: Show the token (remove in production)
        console.log('Reset Token:', data.token);
        console.log('Reset URL:', data.resetUrl);
        
        // Clear form
        setEmail('');
        
        // Optional: Auto-redirect after success
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      {/* Left Section - Branding */}
      <div className="branding-section">
        <div className="branding-content">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <span className="logo-text">InternHub</span>
          </div>
          
          <div>
            <h1 className="branding-heading">Reset your password.</h1>
            <p className="branding-subtext">
              Enter your email and we'll send you instructions to reset your password.
            </p>
          </div>
        </div>

        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">500+</div>
            <div className="stat-label">Internships Posted</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">2,000+</div>
            <div className="stat-label">Students Placed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">150+</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-heading">Forgot Password</h2>
            <p className="form-subtext">We'll send reset instructions to your email</p>
          </div>

          {message && (
            <div style={{
              backgroundColor: '#d1fae5',
              color: '#065f46',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              border: '1px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              border: '1px solid #ef4444'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                type="email" 
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Enter the email address you used to register
              </small>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </button>

            <div className="create-link" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/login">← Back to Login</Link>
              <span style={{ margin: '0 0.5rem' }}>•</span>
              <Link to="/register">Create Account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;