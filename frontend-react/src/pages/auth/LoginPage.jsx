// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: localStorage.getItem('registeredEmail') || location.state?.registeredEmail || '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  // Auto-focus email input on load
  useEffect(() => {
    document.getElementById('email')?.focus();

    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }

    // Clear registered email from localStorage after use
    if (localStorage.getItem('registeredEmail')) {
      localStorage.removeItem('registeredEmail');
    }
    
    // Clear registered role from localStorage after use
    if (localStorage.getItem('registeredRole')) {
      localStorage.removeItem('registeredRole');
    }
  }, [successMessage]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear previous errors
    setErrors({});

    // Show loading state
    setIsLoading(true);

    // TRY BOTH STUDENT AND RECRUITER LOGIN
    try {
      // First try student login
      let response = await fetch('http://localhost:5000/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      let data = await response.json();

      // If student login fails, try recruiter login
      if (!data.success) {
        response = await fetch('http://localhost:5000/api/recruiters/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        data = await response.json();
      }

      if (data.success) {
        // Save auth data to localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Clear any registration data
        localStorage.removeItem('registeredEmail');
        localStorage.removeItem('registeredRole');

        // Show success notification
        showNotification(`Welcome back, ${data.data.user.fullName}! You have been signed in successfully.`);

        // Redirect based on user role
        setTimeout(() => {
          if (data.data.user.role === 'student') {
            navigate('/student/dashboard');
          } else if (data.data.user.role === 'recruiter') {
            navigate('/recruiter/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    // Remove existing notifications
    document.querySelectorAll('.custom-notification').forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #2440F0, #0B1DC1)'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(36, 64, 240, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  };

  // Handle Enter key for form submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
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
            <h1 className="branding-heading">Connect talent with opportunity.</h1>
            <p className="branding-subtext">
              The complete internship management platform for students, recruiters, and administrators.
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
            <h2 className="form-heading">Welcome back</h2>
            <p className="form-subtext">Enter your credentials to access your account</p>
          </div>

          {/* Success message from registration */}
          {successMessage && (
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
              <span>{successMessage}</span>
              {location.state?.registeredRole && (
                <span style={{ 
                  fontWeight: 'bold', 
                  marginLeft: '0.5rem',
                  padding: '2px 8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.75rem'
                }}>
                  {location.state.registeredRole.toUpperCase()}
                </span>
              )}
            </div>
          )}

          <form id="signInForm" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => {
                  if (formData.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) {
                      setErrors(prev => ({ ...prev, email: 'Enter a valid email address' }));
                    }
                  }
                }}
                required
                disabled={isLoading}
              />
              {errors.email && <small className="error-message">{errors.email}</small>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => {
                    if (formData.password && formData.password.length < 8) {
                      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  <svg
                    id="eyeIcon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: showPassword ? 'none' : 'block' }}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg
                    id="eyeOffIcon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: showPassword ? 'block' : 'none' }}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
              {errors.password && <small className="error-message">{errors.password}</small>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              id="submitButton"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Create Account Link */}
            <div className="create-link">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-password-link" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link
                to="/forgot-password"
                style={{
                  color: '#2440F0',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;