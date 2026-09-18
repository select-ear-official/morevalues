import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 32, color = '#2196f3', style = {}, className = '' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} className={className}>
      <Loader2 className="animate-spin" size={size} color={color} />
    </div>
  );
}

export function FullscreenSpinner() {
  return (
    <div className="spinner-overlay">
      <div className="spinner-card" style={{ padding: '1.5rem', borderRadius: '50%', minWidth: 'unset', width: '72px', height: '72px', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={38} color="#2196f3" />
      </div>
    </div>
  );
}
