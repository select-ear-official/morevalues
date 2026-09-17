import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmColor = '#ef4444' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--container-bg, var(--bg-primary, #ffffff))', width: '90%', maxWidth: '400px',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color={confirmColor} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div style={{ padding: '1.5rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {message}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'flex-end', gap: '1rem',
          background: 'rgba(0,0,0,0.02)'
        }}>
          <button className="btn btn-outline" style={{ border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" style={{ background: confirmColor, color: 'white' }} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
