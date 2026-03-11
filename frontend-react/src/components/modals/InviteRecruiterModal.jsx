import React, { useState } from 'react';
import '../../styles/HrDashboard.css';

const InviteRecruiterModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Engineering',
    designation: '',
    maxInterns: 5
  });

  const handleRipple = (e) => {
    // ... ripple logic ...
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:5000/api/hr/recruiters/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Invite Recruiter</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
            <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
                className="form-input"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                required
            />
            </div>
            <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
                className="form-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="recruiter@company.com"
                required
            />
            </div>
            <div className="grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                    className="form-select"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Max Mentees</label>
                <input
                className="form-input"
                type="number"
                value={formData.maxInterns}
                onChange={(e) => setFormData({ ...formData, maxInterns: parseInt(e.target.value) })}
                min="1"
                required
                />
            </div>
            </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={(e) => { handleRipple(e); onClose(); }}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading} onClick={(e) => handleRipple(e)}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteRecruiterModal;