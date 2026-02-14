// src/pages/recruiter/DashboardPage.jsx
import React from 'react';

const DashboardPage = () => {
  return (
    <div className="recruiter-dashboard">
      <div className="dashboard-header">
        <h1>Recruiter Dashboard</h1>
        <p>Welcome to your recruiter dashboard</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Active Internships</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>Shortlisted</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>Hired</h3>
          <p className="stat-number">0</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-section">
          <h2>Recent Internships</h2>
          <p className="placeholder-text">No internships posted yet</p>
        </div>

        <div className="recent-section">
          <h2>Recent Applications</h2>
          <p className="placeholder-text">No applications received yet</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;