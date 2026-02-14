// src/pages/auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' // 'student' or 'recruiter' ONLY
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-focus full name input on load
  useEffect(() => {
    document.getElementById('fullName')?.focus();
  }, []);

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

  // Handle role selection
  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  // Show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Show/hide confirm password
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Please select a role';
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

      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Clear previous errors
    setErrors({});

    // Show loading state
    setIsLoading(true);

    // DETERMINING CORRECT API ENDPOINT BASED ON SELECTED ROLE
    try {
      let apiUrl;
      
      if (formData.role === 'student') {
        apiUrl = 'http://localhost:5000/api/students/register';
      } else if (formData.role === 'recruiter') {
        apiUrl = 'http://localhost:5000/api/recruiters/register';
      } else {
        showNotification('Please select a valid role', 'error');
        setIsLoading(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store email for auto-fill
        localStorage.setItem('registeredEmail', formData.email);
        
        // Store role for login redirection
        localStorage.setItem('registeredRole', formData.role);
        
        // Show success notification
        showNotification(`✅ ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account created successfully! Redirecting to login...`);
        
        // Redirect to login page
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              registeredEmail: formData.email,
              registeredRole: formData.role,
              successMessage: `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account created successfully! Please sign in.`
            }
          });
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

  return (
    <div className="registration-container">
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
            <h2 className="form-heading">Create an account</h2>
            <p className="form-subtext">Start your internship journey today</p>
          </div>

          <form id="registrationForm" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {errors.fullName && <small className="error-message">{errors.fullName}</small>}
            </div>

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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => {
                    if (formData.password) {
                      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                      if (!passwordRegex.test(formData.password)) {
                        setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' }));
                      }
                    }
                  }}
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
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <small className="error-message">{errors.password}</small>}
              <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="password-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => {
                    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                    }
                  }}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <small className="error-message">{errors.confirmPassword}</small>}
            </div>

            {/* Role Selection - ONLY Student and Recruiter */}
            <div className="form-group">
              <label className="form-label">I am a</label>
              <div className="role-buttons">
                {/* Student Role */}
                <button
                  type="button"
                  className={`role-button ${formData.role === 'student' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('student')}
                  disabled={isLoading}
                >
                  <div className="role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <span className="role-text">Student</span>
                </button>

                {/* Recruiter Role */}
                <button
                  type="button"
                  className={`role-button ${formData.role === 'recruiter' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('recruiter')}
                  disabled={isLoading}
                >
                  <div className="role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <span className="role-text">Recruiter</span>
                </button>
              </div>
              {errors.role && <small className="error-message">{errors.role}</small>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create'}
            </button>

            {/* Already have an account link */}
            <div className="create-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;