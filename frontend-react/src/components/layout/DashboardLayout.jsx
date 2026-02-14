// src/components/layout/DashboardLayout.jsx
import React from 'react';

const DashboardLayout = ({ children, role = 'student' }) => {
  return (
    <div className="dashboard-layout">
      {/* REMOVED: <h1>{role.toUpperCase()} Dashboard</h1> */}
      <div>{children}</div>
    </div>
  );
};

export default DashboardLayout;