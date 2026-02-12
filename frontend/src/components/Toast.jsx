
import React from 'react';

export const ToastContainer = ({ toasts }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    style={{
                        pointerEvents: 'auto',
                        minWidth: '250px',
                        maxWidth: '350px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        animation: 'slideIn 0.3s ease-out forwards',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderLeft: `4px solid ${toast.type === 'success' ? '#10b981' :
                                toast.type === 'error' ? '#ef4444' : '#3b82f6'
                            }`
                    }}
                >
                    <span>
                        {toast.type === 'success' ? '✓' :
                            toast.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    {toast.message}
                </div>
            ))}
        </div>
    );
};
