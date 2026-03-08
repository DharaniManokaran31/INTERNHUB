import React, { useState, useEffect } from 'react';
import companyService from '../../services/companyService';

const InviteRecruiterModal = ({ onClose, onInvite }) => {
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Frontend',
    designation: '',
    maxInterns: 3
  });

  // Pre-defined recruiters list
  const predefinedRecruiters = [
    {
      id: 1,
      fullName: 'Nandhini',
      email: 'dharani.ct23@bitsathy.ac.in',
      department: 'Frontend',
      designation: 'Frontend Developer',
      maxInterns: 3
    },
    {
      id: 2,
      fullName: 'Siva',
      email: 'sivalavanya.s.a@gmail.com',
      department: 'Backend',
      designation: 'Backend Developer',
      maxInterns: 3
    },
    {
      id: 3,
      fullName: 'Kavin',
      email: 'dharukutty05@gmail.com',
      department: 'DevOps',
      designation: 'DevOps Engineer',
      maxInterns: 3
    }
  ];

  const departments = [
    'Frontend', 'Backend', 'DevOps', 'Marketing', 
    'HR', 'Sales', 'UI/UX', 'Mobile'
  ];

  // Handle dropdown selection
  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelectedRecruiter(value);
    
    if (value === 'custom') {
      setUseCustom(true);
      setFormData({
        fullName: '',
        email: '',
        department: 'Frontend',
        designation: '',
        maxInterns: 3
      });
    } else {
      setUseCustom(false);
      // Find and set selected recruiter data
      const recruiter = predefinedRecruiters.find(r => r.email === value);
      if (recruiter) {
        setFormData({
          fullName: recruiter.fullName,
          email: recruiter.email,
          department: recruiter.department,
          designation: recruiter.designation,
          maxInterns: recruiter.maxInterns
        });
      }
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onInvite(formData);
    setLoading(false);
  };

  // Ripple effect for buttons
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

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Modal Header */}
        <div className="modal-header" style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
          color: 'white',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Invite New Recruiter</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Recruiter Selection Dropdown */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              Select Recruiter <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={selectedRecruiter}
              onChange={handleSelectChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2440F0'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="">-- Select a recruiter --</option>
              {predefinedRecruiters.map(recruiter => (
                <option key={recruiter.id} value={recruiter.email}>
                  {recruiter.fullName} - {recruiter.department} ({recruiter.email})
                </option>
              ))}
              <option value="custom">+ Add Custom Recruiter</option>
            </select>
          </div>

          {/* Form Fields - Only show if a recruiter is selected */}
          {selectedRecruiter && (
            <>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  readOnly={!useCustom}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: useCustom ? 'white' : '#f3f4f6'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2440F0'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="e.g., Rajesh M"
                />
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Email <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  readOnly={!useCustom}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: useCustom ? 'white' : '#f3f4f6'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2440F0'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="recruiter@example.com"
                />
              </div>

              {/* Department */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Department <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={!useCustom}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: useCustom ? 'white' : '#f3f4f6'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2440F0'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Designation */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  readOnly={!useCustom}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: useCustom ? 'white' : '#f3f4f6'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2440F0'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="e.g., Tech Lead"
                />
              </div>

              {/* Max Interns - EDITABLE FOR ALL! */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  Maximum Interns Allowed <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  name="maxInterns"
                  value={formData.maxInterns}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white' // Always white background
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2440F0'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <p style={{
                  fontSize: '0.7rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  HR can adjust this number (1-20)
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="secondary-btn"
              onClickCapture={createRippleEffect}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                color: '#1f2937',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRecruiter}
              className="primary-btn"
              onClickCapture={createRippleEffect}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #2440F0, #0B1DC1)',
                border: 'none',
                borderRadius: '8px',
                cursor: (loading || !selectedRecruiter) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
                opacity: (loading || !selectedRecruiter) ? 0.5 : 1
              }}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteRecruiterModal;