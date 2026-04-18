import React from 'react';

const CertificateTemplate = ({ certRef, studentName, internshipTitle, department, skillsAcquired, mentorName, grade, issueDate, certificateId, template = 'professional' }) => {
    const formattedDate = issueDate ? new Date(issueDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const isProfessional = template === 'professional';
    const isModern = template === 'modern';
    const isClassic = template === 'classic';

    return (
        <div ref={certRef} style={{ 
            width: '842px', 
            height: '595px', 
            padding: '50px 60px', 
            background: isProfessional ? 'white' :
                        isModern ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' :
                        'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: isProfessional ? '12px solid #2440F0' :
                    isModern ? '10px solid #10b981' : '10px solid #b8860b',
            borderRadius: isModern ? '20px' : '0', 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            color: isModern ? 'white' : '#1e293b',
            fontFamily: "'Playfair Display', Georgia, serif",
            boxSizing: 'border-box',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            overflow: 'hidden'
        }}>
            {/* Border Inner Line - Simplified to avoid overlaps */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                bottom: '10px',
                border: isProfessional ? '1px solid rgba(36, 64, 240, 0.3)' : 
                        isModern ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(184, 134, 11, 0.3)',
                pointerEvents: 'none'
            }} />

            {/* Header Section */}
            <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ 
                    fontSize: '13px', 
                    letterSpacing: '6px', 
                    textTransform: 'uppercase', 
                    color: isModern ? '#10b981' : 
                           isClassic ? '#b8860b' : '#2440F0',
                    fontWeight: '700',
                    marginBottom: '10px'
                }}>
                    Internship Achievement
                </div>
                <h1 style={{ 
                    fontSize: '48px', 
                    margin: '0', 
                    color: isModern ? 'white' : '#1e293b',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    lineHeight: '1.2'
                }}>
                    Certificate
                </h1>
                <div style={{ fontSize: '15px', marginTop: '5px', opacity: 0.7, letterSpacing: '2px' }}>
                    OF COMPLETION
                </div>
            </div>

            {/* Content Section */}
            <div style={{ textAlign: 'center', maxWidth: '720px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '18px', margin: '0 0 8px 0', fontStyle: 'italic', opacity: 0.8 }}>
                    This is to certify that
                </p>
                <h2 style={{ 
                    fontSize: '44px', 
                    margin: '10px 0 15px 0', 
                    fontWeight: '900',
                    color: isModern ? 'white' : '#0f172a',
                    textDecoration: 'underline',
                    textUnderlineOffset: '8px',
                    fontFamily: "'Playfair Display', serif"
                }}>
                    {studentName || 'Student Name'}
                </h2>
                <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0', opacity: 0.9 }}>
                    has successfully completed an internship program at <strong style={{ color: isModern ? '#10b981' : '#2440F0', fontWeight: '800' }}>Zoyaraa</strong>
                    <br />
                    as a <strong>{internshipTitle || 'Intern'}</strong> in the <strong>{department || 'Department'}</strong> department.
                    <br />
                    {skillsAcquired && (
                        <div style={{ marginTop: '10px', fontSize: '14px', maxWidth: '650px', margin: '10px auto 0' }}>
                            The intern demonstrated exceptional skills in <strong>{Array.isArray(skillsAcquired) ? skillsAcquired.join(', ') : skillsAcquired}</strong>.
                        </div>
                    )}
                </p>

                {/* Performance/Grade - Moved inside content for better spacing */}
                <div style={{
                    marginTop: '25px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                   <div style={{
                        background: isModern ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                        padding: '8px 25px',
                        borderRadius: '50px',
                        border: isModern ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#64748b' }}>Performance Grade:</span>
                        <span style={{ 
                            fontSize: '18px', 
                            fontWeight: '900', 
                            color: isModern ? '#10b981' : '#2440F0'
                        }}>
                            {grade || 'A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Section - Positioned carefully at the bottom */}
            <div style={{ 
                display: 'flex', 
                width: '100%', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end',
                padding: '0 40px 10px 40px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        borderBottom: isModern ? '1px solid white' : '1px solid #94a3b8', 
                        width: '180px', 
                        marginBottom: '8px' 
                    }}></div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{mentorName || 'Mentor Name'}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>Project Mentor</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        borderBottom: isModern ? '1px solid white' : '1px solid #94a3b8', 
                        width: '180px', 
                        marginBottom: '8px' 
                    }}></div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{formattedDate}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>Date of Issue</div>
                </div>
            </div>

            {/* Certificate ID - Moved to VERY bottom to avoid middle overlap */}
            <div style={{ 
                position: 'absolute', 
                bottom: '12px', 
                left: '0',
                right: '0',
                textAlign: 'center', 
                fontSize: '8px', 
                opacity: 0.35,
                fontFamily: 'monospace',
                letterSpacing: '1px'
            }}>
                VERIFY VALIDITY AT: ZOYARAA.COM/VERIFY • {certificateId || 'CERT-XXXXXXXX'}
            </div>
        </div>
    );
};

export default CertificateTemplate;
