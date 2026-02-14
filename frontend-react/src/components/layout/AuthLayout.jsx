// src/components/layout/AuthLayout.jsx
import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
};

export default AuthLayout;