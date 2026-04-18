import React, { useState, useEffect } from 'react';
import '../../styles/StudentDashboard.css';

const IssueCertificateModal = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [eligibleApplications, setEligibleApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [formData, setFormData] = useState({
        template: 'professional',
        projectTitle: '',
        mentorName: '',
        skillsAcquired: '',
        grade: 'A',
        issueDate: new Date().toISOString().split('T')[0],
        comments: ''
    });

    useEffect(() => {
        fetchEligible();
    }, []);

    const fetchEligible = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('https://internhub-backend-d879.onrender.com/api/hr/certificates/eligible', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setEligibleApplications(data.eligible);
            }
        } catch (error) {
            console.error('Error fetching eligible students:', error);
            // Mocking for UI demonstration if needed, but I'll stick to real logic
        }
    };

    const handleAppSelect = (appId) => {
        const app = eligibleApplications.find(a => a._id === appId);
        setSelectedApp(app);
        setFormData(prev => ({
            ...prev,
            projectTitle: app?.internship?.title || '',
            mentorName: app?.internship?.postedBy?.fullName || ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedApp) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('https://internhub-backend-d879.onrender.com/api/hr/certificates/issue', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    applicationId: selectedApp._id,
                    studentId: selectedApp.student._id,
                    internshipId: selectedApp.internship._id,
                    ...formData,
                    skillsAcquired: formData.skillsAcquired.split(',').map(s => s.trim())
                })
            });

            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Failed to issue certificate');
            }
        } catch (error) {
            console.error('Error issuing certificate:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div className="section" style={{ maxWidth: '700px', width: '95%', background: 'white', position: 'relative', padding: '2.5rem' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Issue Certificate</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                </div>
                <div className="title-underline"></div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Student & Position</label>
                            <select
                                required
                                onChange={(e) => handleAppSelect(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                            >
                                <option value="">Select a completed internship</option>
                                {eligibleApplications.map(app => (
                                    <option key={app._id} value={app._id}>
                                        {app.student.fullName} - {app.internship.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Template</label>
                            <select
                                value={formData.template}
                                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                            >
                                <option value="professional">Professional</option>
                                <option value="modern">Modern</option>
                                <option value="creative">Creative</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Grade</label>
                            <select
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                            >
                                <option value="A+">A+</option>
                                <option value="A">A</option>
                                <option value="B+">B+</option>
                                <option value="B">B</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Project Title</label>
                            <input
                                type="text"
                                value={formData.projectTitle}
                                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                                placeholder="Final project or role name"
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Mentor Name</label>
                            <input
                                type="text"
                                value={formData.mentorName}
                                onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Issue Date</label>
                            <input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Skills (comma separated)</label>
                            <input
                                type="text"
                                value={formData.skillsAcquired}
                                onChange={(e) => setFormData({ ...formData, skillsAcquired: e.target.value })}
                                placeholder="React, API Integration, Testing..."
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Comments</label>
                            <textarea
                                value={formData.comments}
                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                rows="3"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                placeholder="Optional remarks..."
                            ></textarea>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={loading || !selectedApp}>
                            {loading ? 'Issuing...' : 'Issue Certificate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IssueCertificateModal;
