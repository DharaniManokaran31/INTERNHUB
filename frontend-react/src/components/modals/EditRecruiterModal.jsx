// src/components/modals/EditRecruiterModal.jsx
import React, { useState } from 'react';
import '../../styles/StudentDashboard.css';

const EditRecruiterModal = ({ onClose, recruiter, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: recruiter.fullName || '',
        department: recruiter.department || '',
        designation: recruiter.designation || '',
        phone: recruiter.phone || '',
        maxInterns: recruiter.permissions?.maxInterns || 3
    });

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
        setLoading(true);
        
        try {
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`https://internhub-backend-d870.onrender.com/api/hr/recruiters/${recruiter._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    department: formData.department,
                    designation: formData.designation,
                    phone: formData.phone,
                    permissions: {
                        maxInterns: formData.maxInterns
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Failed to update recruiter');
            }
        } catch (error) {
            console.error('Error updating recruiter:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Edit Team Member</h2>
                    <button 
                        className="close-btn" 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {/* Info Banner */}
                    <div style={{
                        background: '#EEF2FF',
                        color: '#2440F0',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <circle cx="12" cy="8" r="1" fill="currentColor"></circle>
                        </svg>
                        <span>Editing profile for <strong>{recruiter.email}</strong></span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem' }}
                            />
                        </div>

                        {/* Department & Designation */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                    Department
                                </label>
                                <select
                                    className="form-input"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem' }}
                                >
                                    <option value="">Select Department</option>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Backend">Backend</option>
                                    <option value="DevOps">DevOps</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Sales">Sales</option>
                                    <option value="HR">HR</option>
                                    <option value="UI/UX">UI/UX</option>
                                    <option value="Mobile">Mobile</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Senior Developer"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem' }}
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem' }}
                            />
                        </div>

                        {/* Max Interns */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Max Interns Allowed
                            </label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.maxInterns}
                                onChange={(e) => setFormData({ ...formData, maxInterns: parseInt(e.target.value) })}
                                min="1"
                                max="20"
                                required
                                style={{ width: '100%', padding: '0.75rem' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                This recruiter can mentor up to {formData.maxInterns} interns simultaneously.
                            </p>
                        </div>

                        {/* Form Actions */}
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
                                disabled={loading}
                                onClick={createRippleEffect}
                                style={{ 
                                    padding: '0.75rem 1.5rem',
                                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2440F0, #0B1DC1)',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Member'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditRecruiterModal;