import React from 'react';

const LoadingSpinner = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
            <div className="spinner" style={{ 
                width: '50px', 
                height: '50px', 
                border: '5px solid #f3f3f3', 
                borderTop: '5px solid #2440f0', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
            }}></div>
            <p style={{ color: '#64748b', fontWeight: 'bold' }}>Loading Zoyara HR...</p>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingSpinner;
