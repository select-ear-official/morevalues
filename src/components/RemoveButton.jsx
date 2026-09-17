import React from 'react';
import { Trash2 } from 'lucide-react';

export function RemoveButton({ onClick, label = "Remove", style = {}, className = "", iconOnly = false, noIcon = false }) {
  return (
    <button 
      className={`btn btn-delete ${className}`} 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: iconOnly ? '0.5rem' : '0.5rem 1rem', ...style }}
      onClick={onClick}
      title={iconOnly ? label : undefined}
    >
      {!noIcon && <Trash2 size={16} />}
      {!iconOnly && label}
    </button>
  );
}
