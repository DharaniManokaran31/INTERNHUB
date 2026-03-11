import React from 'react';

const BulkActions = ({ selectedCount, actions, onClear }) => {
    if (selectedCount === 0) return null;

    return (
        <div 
            className="bulk-actions-bar" 
            style={{ 
                position: 'fixed', 
                bottom: '2rem', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: '#1a1f36', 
                color: 'white', 
                padding: '1rem 2rem', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                zIndex: 1000,
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                animation: 'slideUp 0.3s ease-out'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#2440f0', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {selectedCount}
                </div>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Items Selected</span>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }}></div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                {actions.map((action, idx) => (
                    <button 
                        key={idx}
                        className="secondary-btn"
                        style={{ 
                            background: action.variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: action.variant === 'danger' ? '#fca5a5' : 'white',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem'
                        }}
                        onClick={action.onClick}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            <button 
                onClick={onClear}
                style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#94a3b8', 
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textDecoration: 'underline'
                }}
            >
                Clear
            </button>
        </div>
    );
};

export default BulkActions;
