import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css';
import HrSidebar from '../../components/hr/HrSidebar';
import hrService from '../../services/hrService';
import NotificationBell from '../../components/common/NotificationBell';

const StudentsPage = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userData, setUserData] = useState({ name: 'HR Manager', initials: 'HR' });

    useEffect(() => {
        fetchStudents();
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const results = students.filter(student =>
            student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStudents(results);
    }, [searchTerm, students]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/recruiters/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const user = data.data?.user || data.user;
                setUserData({
                    name: user.fullName,
                    initials: user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await hrService.getAllStudents();
            if (response.success) {
                setStudents(response.data.students || []);
                setFilteredStudents(response.data.students || []);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="app-container">
            <HrSidebar 
                userData={userData} 
                isMobileMenuOpen={isMobileMenuOpen} 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
            />

            <div className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={toggleMobileMenu}></div>

            <main className="main-content">
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="menu-toggle" onClick={toggleMobileMenu}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <h2 className="page-title">
                            Student Database
                            <span className="page-subtitle">• Global Talent Directory</span>
                        </h2>
                    </div>
                    <div className="top-bar-right">
                        <NotificationBell />
                        <button className="logout-btn" onClick={() => navigate('/login')}>
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <div className="content-area">
                    <div className="section" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Search by name or email..." 
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '18px', color: '#64748b' }}
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <button className="secondary-btn">Filter</button>
                        </div>

                        <div className="table-container">
                            <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem', background: 'transparent' }}>
                                <thead>
                                    <tr>
                                        <th>Student Details</th>
                                        <th>Education</th>
                                        <th>Skills</th>
                                        <th>Stats</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center">Loading talent records...</td></tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">No students found matching your search.</td></tr>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <tr key={student._id} style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                                                <td style={{ padding: '1.25rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div className="avatar" style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #2440F0, #7c3aed)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                                                            {student.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{student.fullName}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>{student.education?.college || 'N/A'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{student.education?.course || 'Degree unknown'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                                                        {(student.skills || []).slice(0, 3).map((skill, idx) => (
                                                            <span key={idx} className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{skill}</span>
                                                        ))}
                                                        {student.skills?.length > 3 && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>+{student.skills.length - 3} move</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: '700', color: '#2440f0' }}>{student.applications || 0}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Apps</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="secondary-btn btn-small">View Profile</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentsPage;
