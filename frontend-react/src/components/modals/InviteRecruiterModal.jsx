// src/components/modals/InviteRecruiterModal.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/StudentDashboard.css'; // Reuse existing styles

const InviteRecruiterModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availableRecruiters, setAvailableRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [formData, setFormData] = useState({
    recruiterId: '',
    fullName: '',
    email: '',
    department: '',
    designation: '',
    maxInterns: 3
  });

  // Fetch available recruiters (pre-loaded but not yet invited)
  useEffect(() => {
    const fetchAvailableRecruiters = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://internhub-backend-d870.onrender.com/api/hr/recruiters/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          setAvailableRecruiters(data.data.recruiters || []);
        }
      } catch (error) {
        console.error('Error fetching recruiters:', error);
      }
    };

    fetchAvailableRecruiters();
  }, []);

  // Handle recruiter selection from dropdown
  const handleRecruiterSelect = (e) => {
    const recruiterId = e.target.value;
    setSelectedRecruiter(recruiterId);
    
    if (recruiterId) {
      const recruiter = availableRecruiters.find(r => r._id === recruiterId);
      if (recruiter) {
        setFormData({
          recruiterId: recruiter._id,
          fullName: recruiter.fullName,
          email: recruiter.email,
          department: recruiter.department,
          designation: recruiter.designation || 'Recruiter',
          maxInterns: 3
        });
      }
    } else {
      // Reset form if no recruiter selected
      setFormData({
        recruiterId: '',
        fullName: '',
        email: '',
        department: '',
        designation: '',
        maxInterns: 3
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.recruiterId) {
      alert('Please select a recruiter from the list');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://internhub-backend-d870.onrender.com/api/hr/recruiters/${formData.recruiterId}/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          maxInterns: formData.maxInterns
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message || 'Error sending invitation');
      }
    } catch (error) {
      console.error('Error inviting:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Recruiter</h2>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Recruiter Selection Dropdown */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
              Select Recruiter <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              className="form-input"
              value={selectedRecruiter}
              onChange={handleRecruiterSelect}
              required
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <option value="">-- Choose a recruiter --</option>
              {availableRecruiters.map(recruiter => (
                <option key={recruiter._id} value={recruiter._id}>
                  {recruiter.fullName} - {recruiter.department} ({recruiter.email})
                </option>
              ))}
            </select>
            {availableRecruiters.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                No pending recruiters available to invite. All recruiters have been invited.
              </p>
            )}
          </div>

          {/* Auto-filled Full Name */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
              Full Name
            </label>
            <input
              className="form-input"
              type="text"
              value={formData.fullName}
              readOnly
              disabled
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            />
          </div>

          {/* Auto-filled Email */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
              Email Address
            </label>
            <input
              className="form-input"
              type="email"
              value={formData.email}
              readOnly
              disabled
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            />
          </div>

          {/* Auto-filled Department */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
              Department
            </label>
            <input
              className="form-input"
              type="text"
              value={formData.department}
              readOnly
              disabled
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            />
          </div>

          {/* Designation */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
              Designation
            </label>
            <input
              className="form-input"
              type="text"
              value={formData.designation}
              readOnly
              disabled
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569'
              }}
            />
          </div>

          {/* Max Interns (Editable) */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
              Maximum Interns Allowed <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(You can change this)</span>
            </label>
            <input
              className="form-input"
              type="number"
              value={formData.maxInterns}
              onChange={(e) => setFormData({ ...formData, maxInterns: parseInt(e.target.value) })}
              min="1"
              max="10"
              required
              style={{ width: '100%', padding: '0.75rem' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              This recruiter can mentor up to {formData.maxInterns} interns at a time.
            </p>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={(e) => { createRippleEffect(e); onClose(); }}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn" 
              disabled={loading || !formData.recruiterId}
              onClick={createRippleEffect}
              style={{ 
                padding: '0.75rem 1.5rem',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2440F0, #0B1DC1)',
                cursor: loading || !formData.recruiterId ? 'not-allowed' : 'pointer'
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