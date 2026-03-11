import React, { useState } from 'react';
import hrService from '../../services/hrService';
import '../../styles/HrDashboard.css';

const EditRecruiterModal = ({ onClose, recruiter, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: recruiter.fullName || '',
        department: recruiter.department || '',
        designation: recruiter.designation || '',
        maxMentees: recruiter.maxMentees || 5
    });

    const handleRipple = (e) => {
        const btn = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await hrService.updateRecruiter(recruiter._id, formData);
            if (res.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error updating recruiter:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Edit Team Member</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="badge badge-info mb-4 w-full p-3" style={{ textAlign: 'left', borderRadius: '8px' }}>
                    Modifying profile for <strong>{recruiter.email}</strong>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select
                                className="form-select"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                required
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
                            <label className="form-label">Designation</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Lead, Senior..."
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mentee Assignment Limit</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.maxMentees}
                            onChange={(e) => setFormData({ ...formData, maxMentees: parseInt(e.target.value) })}
                            min="1"
                            max="50"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">This recruiter can manage up to {formData.maxMentees} active interns.</p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="secondary-btn" onClick={(e) => { handleRipple(e); onClose(); }}>Discard</button>
                        <button type="submit" className="primary-btn" disabled={loading} onClick={(e) => handleRipple(e)}>
                            {loading ? 'Saving...' : 'Update Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRecruiterModal;
