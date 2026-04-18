// src/components/modals/IssueCertificateModal.jsx
import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import CertificateTemplate from '../common/CertificateTemplate';
import '../../styles/StudentDashboard.css';

const IssueCertificateModal = ({ onClose, studentData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const certRef = useRef(null);
    const [formData, setFormData] = useState({
        projectTitle: studentData?.internship?.title || '',
        mentorName: studentData?.internship?.postedBy?.fullName || studentData?.mentorName || '',
        skillsAcquired: '',
        grade: 'A+',
        comments: '',
        template: 'professional'
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
            
            const certificateData = {
                applicationId: studentData._id,
                studentId: studentData.studentId?._id || studentData.student?._id || studentData.studentId,
                internshipId: studentData.internshipId?._id || studentData.internship?._id || studentData.internshipId,
                projectTitle: formData.projectTitle,
                mentorName: formData.mentorName,
                skillsAcquired: formData.skillsAcquired.split(',').map(s => s.trim()).filter(s => s),
                grade: formData.grade,
                comments: formData.comments,
                template: formData.template,
                issueDate: new Date()
            };

            const response = await fetch('https://internhub-backend-d870.onrender.com/api/hr/certificates/issue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(certificateData)
            });

            const data = await response.json();

            if (data.success) {
                // Removed auto-download on HR side per user request
                // Student will download it from their dashboard
                
                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'custom-notification';
                notification.textContent = 'Certificate issued successfully!';
                notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
                
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Failed to issue certificate');
            }
        } catch (error) {
            console.error('Error issuing certificate:', error);
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const student = studentData?.student || studentData?.studentId || {};
    const internship = studentData?.internship || studentData?.internshipId || {};

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Issue Certificate</h2>
                    <button 
                        className="close-btn" 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {/* Student Info Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            fontWeight: '600'
                        }}>
                            {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{student.fullName || 'Student'}</div>
                            <div style={{ fontSize: '0.85rem', opacity: '0.9' }}>
                                {internship.title || 'Internship'} • {internship.department || 'Department'}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Project Title */}
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Project / Final Role Title <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.projectTitle}
                                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem' }}
                            />
                        </div>

                        {/* Mentor & Grade */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                    Mentor Name <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.mentorName}
                                    onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                    Grade <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <select
                                    className="form-input"
                                    value={formData.grade}
                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem' }}
                                >
                                    <option value="A+">A+ (Outstanding)</option>
                                    <option value="A">A (Excellent)</option>
                                    <option value="B+">B+ (Very Good)</option>
                                    <option value="B">B (Good)</option>
                                    <option value="C">C (Satisfactory)</option>
                                </select>
                            </div>
                        </div>

                        {/* Skills Acquired */}
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Key Skills Validated <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., React, Node.js, MongoDB"
                                value={formData.skillsAcquired}
                                onChange={(e) => setFormData({ ...formData, skillsAcquired: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                Separate multiple skills with commas
                            </p>
                        </div>

                        {/* Comments/Remarks */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Recognition / Remarks
                            </label>
                            <textarea
                                className="form-textarea"
                                value={formData.comments}
                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                rows="3"
                                placeholder="e.g., Exceptional performance in team collaboration and project delivery..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>

                        {/* Template Selection */}
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                                Certificate Template
                            </label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="radio"
                                        name="template"
                                        value="professional"
                                        checked={formData.template === 'professional'}
                                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                                    />
                                    Professional
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="radio"
                                        name="template"
                                        value="modern"
                                        checked={formData.template === 'modern'}
                                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                                    />
                                    Modern
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="radio"
                                        name="template"
                                        value="classic"
                                        checked={formData.template === 'classic'}
                                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                                    />
                                    Classic
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
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
                                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading-spinner-small" style={{ marginRight: '0.5rem' }}></span>
                                        Issuing...
                                    </>
                                ) : (
                                    'Issue Certificate'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* HIDDEN CERTIFICATE TEMPLATE (Only for preview/consistency, no auto-download here) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <CertificateTemplate 
                    certRef={certRef}
                    studentName={student.fullName}
                    internshipTitle={formData.projectTitle || internship.title}
                    department={internship.department}
                    skillsAcquired={formData.skillsAcquired.split(',').map(s => s.trim())}
                    mentorName={formData.mentorName}
                    grade={formData.grade}
                    issueDate={new Date()}
                    certificateId="PREVIEW-ONLY"
                    template={formData.template}
                />
            </div>
        </div>
    );
};

export default IssueCertificateModal;