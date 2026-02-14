// src/pages/PlaceholderPage.jsx
import React from 'react';

const PlaceholderPage = ({ title = "Page" }) => {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{title}</h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>
        This page is under construction. Check back soon!
      </p>
    </div>
  );
};

export default PlaceholderPage;