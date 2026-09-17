import React from 'react';
import { Play, Edit3, GitFork, Trash2 } from 'lucide-react';

export function TestCard({ test, isOwner, onSelectTest, onEditTest, onViewProfile, onDeleteTest }) {
  const isDraft = test.isDraft === 1;

  return (
    <div className="axis-card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      padding: 0,
      backgroundColor: 'var(--container-bg, #eeeeee',
      borderRadius: '8pt',
      ...(isDraft ? { border: '1px dashed var(--border-color)' } : {})
    }}>
      {/* Thumbnail Banner */}
      <div style={{ width: '100%', height: '160px', backgroundColor: 'var(--bg-color)', opacity: isDraft ? 0.7 : 1 }}>
        <img 
          src={test.thumbnail || '/placeholder.jpg'} 
          alt={`${test.title} thumbnail`} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={(e) => { e.target.src = '/placeholder.jpg'; }}
        />
      </div>
      
      {/* Card Content */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', textAlign: 'left' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
            {isDraft && (
              <span style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>DRAFT</span>
            )}
            {!isDraft && test.hasDraft === 1 && (
              <span style={{ backgroundColor: 'var(--primary-color, #3b82f6)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>UNSAVED EDITS</span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {test.axes?.length || test.axisCount || 4} Axes • {test.questions?.length || test.questionCount || 0} Questions
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: isDraft ? 'var(--text-muted)' : 'var(--text-main)' }}>
            {test.title || (isDraft ? 'Untitled Draft' : 'Untitled Test')}
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginRight: '0.25rem' }}>By</span>
            {test.ownerUsername ? (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewProfile) onViewProfile(test.ownerUsername);
                }}
                style={{ fontSize: '0.85rem', color: isDraft ? 'var(--text-muted)' : 'var(--text-main)', cursor: onViewProfile ? 'pointer' : 'default', fontWeight: 'bold' }}
                onMouseOver={(e) => { if (onViewProfile) e.target.style.textDecoration = 'underline'; }}
                onMouseOut={(e) => { if (onViewProfile) e.target.style.textDecoration = 'none'; }}
              >
                {test.ownerUsername}
              </span>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {test.id === '8values-classic' ? '8values Team' : (isDraft ? 'You' : 'Anonymous')}
              </span>
            )}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
            {test.description || (isDraft ? 'No description' : '')}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          {isDraft ? (
            <>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onEditTest(test)}>
                <Edit3 size={14} /> Resume Editing
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => onSelectTest(test)} title="Demo this Draft">
                <Play size={14} /> Demo
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onSelectTest(test)}>
                <Play size={14} /> Play
              </button>
              {isOwner ? (
                <button className="btn btn-sm btn-outline" onClick={() => onEditTest(test)} title="Open in Studio Creator">
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <button className="btn btn-sm btn-fork" onClick={() => onEditTest(test)} title="Fork & Edit this Test in Creator">
                  <GitFork size={14} /> Fork
                </button>
              )}
            </>
          )}
          {onDeleteTest && (
            <button
              className="btn btn-sm btn-delete"
              style={{ padding: '0.25rem 0.5rem' }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTest(test.id);
              }}
              title="Delete Test"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
