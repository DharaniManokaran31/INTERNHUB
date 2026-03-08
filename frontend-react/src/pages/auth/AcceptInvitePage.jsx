// src/pages/auth/AcceptInvitePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import '../../styles/Auth.css';

const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await companyService.acceptInvitation(token, password);
      
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const notification = document.createElement('div');
      notification.className = 'custom-notification';
      notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #2440F0, #0B1DC1);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: inherit;
        font-size: 0.9375rem;
        font-weight: 500;
      `;
      notification.textContent = 'Account created successfully! Redirecting to dashboard...';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
        navigate('/recruiter/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Accept invitation error:', error);
      alert(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

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

  if (!validToken) {
    return (
      <div className="signin-container">
        <div className="branding-section">
          <div className="branding-content">
            <div className="logo-container">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              </div>
              <span className="logo-text">Zoyaraa</span>
            </div>
            <div>
              <h1 className="branding-heading">Invalid Invitation</h1>
              <p className="branding-subtext">
                The invitation link is invalid or has expired. Please contact your HR administrator.
              </p>
            </div>
          </div>
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Support</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <div className="stat-label">Secure</div>
            </div>
          </div>
        </div>
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-heading">Invalid Token</h2>
              <p className="form-subtext">The invitation link you clicked is invalid or expired.</p>
            </div>
            <button
              className="submit-button"
              onClick={() => navigate('/login')}
              onClickCapture={createRippleEffect}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signin-container">
      {/* Left Section - Branding */}
      <div className="branding-section">
        <div className="branding-content">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <span className="logo-text">Zoyaraa</span>
          </div>

          <div>
            <h1 className="branding-heading">Join the team</h1>
            <p className="branding-subtext">
              You've been invited to join Zoyaraa as a Recruiter. Set up your account to get started.
            </p>
          </div>
        </div>

        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">50+</div>
            <div className="stat-label">Departments</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">300+</div>
            <div className="stat-label">Mentors</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">92%</div>
            <div className="stat-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2 className="form-heading">Create your account</h2>
            <p className="form-subtext">Set your password to activate your recruiter account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: showPassword ? 'none' : 'block' }}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: showPassword ? 'block' : 'none' }}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="password-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: showConfirmPassword ? 'none' : 'block' }}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: showConfirmPassword ? 'block' : 'none' }}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#000' }}>Password Requirements:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: password.length >= 6 ? '#10b981' : '#6b7280',
                  marginBottom: '0.25rem'
                }}>
                  <span>{password.length >= 6 ? '✓' : '○'}</span>
                  At least 6 characters
                </li>
                <li style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: (password === confirmPassword && password !== '') ? '#10b981' : '#6b7280'
                }}>
                  <span>{(password === confirmPassword && password !== '') ? '✓' : '○'}</span>
                  Passwords match
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
              onClickCapture={createRippleEffect}
            >
              {loading ? 'Creating Account...' : 'Create Account & Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;