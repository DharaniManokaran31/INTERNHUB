import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/layout/AdminSidebar';
import NotificationBell from '../../components/common/NotificationBell';
import '../../styles/StudentDashboard.css';

const CompanyPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    industry: 'Technology',
    size: '51-200',
    foundedYear: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    }
  });

  const [originalData, setOriginalData] = useState({});
  const [userData, setUserData] = useState({
    name: 'Admin',
    initials: 'AD'
  });

  useEffect(() => {
    fetchAdminProfile();
    fetchCompanyInfo();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('https://internhub-backend-d879.onrender.com/api/admin/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data.user;
        setUserData({
          name: user.fullName,
          initials: user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        });
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://internhub-backend-d879.onrender.com/api/admin/company', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.data.company) {
        setCompanyData(data.data.company);
        setOriginalData(data.data.company);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      showNotification('Failed to load company info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCompanyData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCompanyData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://internhub-backend-d879.onrender.com/api/admin/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(companyData)
      });

      const data = await response.json();

      if (data.success) {
        setOriginalData(companyData);
        setIsEditMode(false);
        showNotification('Company information updated successfully!');
      } else {
        showNotification(data.message || 'Failed to update company info', 'error');
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      showNotification('Failed to update company info', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCompanyData(originalData);
    setIsEditMode(false);
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    notification.style.background = type === 'error'
      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
      : 'linear-gradient(135deg, #2440F0, #0B1DC1)';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully!');
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  if (loading) {
    return (
      <div className="resume-loading">
        <div className="loading-spinner"></div>
        <p>Loading company data...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AdminSidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
        userData={userData} 
      />

      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <button
              className="menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="page-title">Company Settings</h2>
          </div>
          <div className="top-bar-right">
            <NotificationBell />
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="content-area">
          <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="welcome-heading">Company Information</h1>
              <p className="welcome-subtext">Manage platform-wide company details and settings</p>
            </div>
            {!isEditMode ? (
              <button 
                className="primary-btn" 
                onClick={() => setIsEditMode(true)}
                style={{ borderRadius: '12px', padding: '0.75rem 1.5rem' }}
              >
                Edit Information
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="secondary-btn" onClick={handleCancel}>Cancel</button>
                <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
            {/* Main Form */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Basic Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="name"
                    value={companyData.name}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Official Email</label>
                  <input
                    type="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="text"
                    name="website"
                    value={companyData.website}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={companyData.description}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    rows="4"
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '0.75rem' }}
                  ></textarea>
                </div>
              </div>

              <h3 style={{ margin: '2rem 0 1.5rem', fontSize: '1.25rem' }}>Location Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={companyData.address?.street}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={companyData.address?.city}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={companyData.address?.state}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={companyData.address?.pincode}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={companyData.address?.country}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Stats/Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Organization Info</h3>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Industry</label>
                  <select
                    name="industry"
                    value={companyData.industry}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  >
                    {['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Other'].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Company Size</label>
                  <select
                    name="size"
                    value={companyData.size}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  >
                    {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => (
                      <option key={s} value={s}>{s} employees</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Founded Year</label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={companyData.foundedYear}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #2440F0, #8b5cf6)', borderRadius: '16px', padding: '1.5rem', color: 'white' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Company Preview</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {companyData.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{companyData.name}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{companyData.industry}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.5, opacity: 0.9 }}>
                  This information will be visible to all students and recruiters on the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyPage;
