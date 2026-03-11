import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import hrService from '../../services/hrService';
import '../../styles/HrDashboard.css';

const IssueCertificateModal = ({ onClose, studentData, onIssue }) => {
    const [loading, setLoading] = useState(false);
    const certRef = useRef(null);
    const [formData, setFormData] = useState({
        projectTitle: studentData?.internship?.title || '',
        mentorName: studentData?.internship?.postedBy?.fullName || '',
        skillsAcquired: '',
        grade: 'A+',
        comments: '',
        template: 'professional'
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

    const generatePDF = async () => {
        const element = certRef.current;
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${studentData?.student?.fullName}_Certificate.pdf`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const certData = {
                applicationId: studentData._id,
                studentId: studentData.student?._id,
                internshipId: studentData.internship?._id,
                ...formData,
                skillsAcquired: formData.skillsAcquired.split(',').map(s => s.trim())
            };

            const res = await hrService.issueCertificate(certData);

            if (res.success) {
                await generatePDF();
                onIssue();
                onClose();
            }
        } catch (error) {
            console.error('Error issuing certificate:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Generate Certificate</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="badge badge-success mb-4 p-4 w-full" style={{ textAlign: 'left', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700' }}>Confirm Completion for {studentData?.student?.fullName}</div>
                    <div style={{ opacity: 0.8, fontSize: '0.8rem' }}>Program: {studentData?.internship?.title}</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Project / Final Role Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.projectTitle}
                            onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Signatory Mentor</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.mentorName}
                                onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Final Evaluation</label>
                            <select
                                className="form-select"
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            >
                                <option value="A+">A+ (Outstanding)</option>
                                <option value="A">A (Excellent)</option>
                                <option value="B+">B+ (Very Good)</option>
                                <option value="B">B (Good)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Key Skills Validated (comma separated)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="React, Backend Dev, Testing..."
                            value={formData.skillsAcquired}
                            onChange={(e) => setFormData({ ...formData, skillsAcquired: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Recognition / Remarks</label>
                        <textarea
                            className="form-textarea"
                            value={formData.comments}
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                            rows="3"
                            placeholder="Exceptional performance in team collaboration..."
                        ></textarea>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="secondary-btn" onClick={(e) => { handleRipple(e); onClose(); }}>Re-evaluate</button>
                        <button type="submit" className="primary-btn" disabled={loading} onClick={(e) => handleRipple(e)}>
                            {loading ? 'Finalizing...' : 'Issue Official Certificate'}
                        </button>
                    </div>
                </form>
            </div>

            {/* HIDDEN CERTIFICATE TEMPLATE FOR PDF GENERATION */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={certRef} style={{ width: '842px', height: '595px', padding: '40px', background: 'white', border: '5px double #2440F0', borderRadius: '15px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1a1f36', fontFamily: 'serif' }}>
                    <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: '#2440F0' }}>CERTIFICATE OF COMPLETION</div>
                    <div style={{ fontSize: '20px', marginBottom: '40px' }}>This is to certify that</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '30px' }}>{studentData?.student?.fullName}</div>
                    <div style={{ fontSize: '18px', textAlign: 'center', maxWidth: '80%', lineHeight: '1.6' }}>
                        has successfully completed their internship program at <strong style={{color: '#2440F0'}}>Zoyaraa</strong>
                        <br />
                        as a <strong>{studentData?.internship?.title}</strong> in the <strong>{studentData?.internship?.department}</strong> department.
                        <br />
                        The intern demonstrated exceptional skills in <strong>{formData.skillsAcquired}</strong>.
                    </div>
                    <div style={{ marginTop: '50px', display: 'flex', width: '100%', justifyContent: 'space-around' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderBottom: '1px solid black', width: '200px', marginBottom: '10px' }}></div>
                            <div>{formData.mentorName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Project Mentor</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '24px', color: '#2440F0' }}>Grade: {formData.grade}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Performance Grade</div>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '14px', color: '#94a3b8' }}>
                        Verification ID: CERT-ZOY-{Date.now()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueCertificateModal;
