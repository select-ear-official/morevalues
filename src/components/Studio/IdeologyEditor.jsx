import React from 'react';
import { Plus, Trash2, Award, GripVertical } from 'lucide-react';
import { RemoveButton } from '../RemoveButton';
import { ValueIcon } from '../ValueIcon';

export function IdeologyEditor({ ideologies = [], setIdeologies, axes }) {
  const handleAddIdeology = () => {
    const defaultStats = {};
    axes.forEach(a => { defaultStats[a.id] = 50; });
    const newIdeology = {
      name: `Classification ${ideologies.length + 1}`,
      description: "Description of what this result classification means.",
      stats: defaultStats
    };
    setIdeologies([...ideologies, newIdeology]);
  };

  const handleRemoveIdeology = (index) => {
    const updated = ideologies.filter((_, i) => i !== index);
    setIdeologies(updated);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...ideologies];
    updated[index] = { ...updated[index], [field]: value };
    setIdeologies(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3>Ideologies ({ideologies.length})</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            You'll be given one of these ideologies at the end of the test.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {ideologies.map((item, idx) => (
          <div key={idx} className="axis-card" style={{ textAlign: 'left', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} style={{ color: '#a78bfa' }} />
                <span style={{ fontWeight: 700 }}>Ideology #{idx + 1}</span>
              </div>

              <RemoveButton className="btn-sm" onClick={() => handleRemoveIdeology(idx)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.name}
                  onChange={(e) => handleUpdate(idx, 'name', e.target.value)}
                  placeholder="e.g. Social Democrat"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.description}
                  onChange={(e) => handleUpdate(idx, 'description', e.target.value)}
                  placeholder="e.g. Believes in mixed market economy and civil liberties."
                />
              </div>
            </div>

            {/* Criteria List */}
            <div style={{ marginTop: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '1rem' }}>
                Axis Match Target (Drag the bars to customise)
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {axes.map(axis => {
                  const leftVal = item.stats?.[axis.id] ?? 50;
                  const rightVal = 100 - leftVal;

                  return (
                    <div key={axis.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div className="axis">
                        <ValueIcon
                          name={axis.left.name}
                          color={axis.left.color}
                          iconSrc={axis.left.icon || '/raw_icons/equality.svg'}
                          className="axis-icon"
                        />

                        <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
                          <div className="bar bar-left" style={{ width: `${leftVal}%`, backgroundColor: axis.left.color }}>
                            <div style={{ padding: '0 8px' }}>{leftVal > 10 ? `${leftVal}%` : ''}</div>
                          </div>

                            <div className="bar bar-right" style={{ width: `${rightVal}%`, backgroundColor: axis.right.color }}>
                              <div style={{ padding: '0 8px' }}>{rightVal > 10 ? `${rightVal}%` : ''}</div>
                            </div>

                            {/* Invisible slider overlaid entirely on top of the bars for dragging */}
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              step="1"
                              style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%', 
                                margin: 0,
                                cursor: 'pointer',
                                opacity: 0 
                              }}
                              value={leftVal}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const newStats = { ...item.stats };
                                newStats[axis.id] = val;
                                handleUpdate(idx, 'stats', newStats);
                              }}
                            />
                          </div>

                          <ValueIcon
                            name={axis.right.name}
                            color={axis.right.color}
                            iconSrc={axis.right.icon || '/raw_icons/markets.svg'}
                            className="axis-icon"
                          />
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleAddIdeology}>
        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add Another Ideology
      </button>
    </div>
  );
}
