import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { ValueIcon } from '../ValueIcon';
import { RemoveButton } from '../RemoveButton';

export function QuestionEditor({ questions, setQuestions, axes }) {
  const handleAddQuestion = () => {
    const defaultEffects = {};
    if (axes.length > 0) {
      defaultEffects[axes[0].id] = 10;
    }

    const newQuestion = {
      id: Date.now(),
      text: "New statement to be rated by users.",
      effects: defaultEffects
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleUpdateText = (index, text) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], text };
    setQuestions(updated);
  };

  const handleUpdateEffect = (qIdx, axisId, weightVal) => {
    const updated = [...questions];
    const effects = { ...(updated[qIdx].effects || {}) };

    if (weightVal === 0) {
      delete effects[axisId];
    } else {
      effects[axisId] = weightVal;
    }

    updated[qIdx] = { ...updated[qIdx], effects };
    setQuestions(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3>Statements & Questions ({questions.length})</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Add questions and control which axes are affected when you agree.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, qIdx) => (
          <div key={q.id || qIdx} className="axis-card" style={{ textAlign: 'left', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>Question #{qIdx + 1}</span>
              <RemoveButton className="btn-sm" onClick={() => handleRemoveQuestion(qIdx)} />
            </div>

            <div className="form-group">
              <label className="form-label">Statement Text</label>
              <textarea
                className="form-textarea"
                value={q.text}
                onChange={(e) => handleUpdateText(qIdx, e.target.value)}
                placeholder="Enter statement..."
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '22pt',
                  textAlign: 'center',
                  backgroundColor: 'var(--container-bg, #eeeeee)',
                  color: 'var(--heading-color, #333333)',
                  borderRadius: '16px',
                  padding: '24px',
                  minHeight: '140px',
                  fontWeight: 400,
                  resize: 'vertical',
                  lineHeight: '1.3'
                }}
              />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem' }}>
                Axis Weights & Impacts (When Agreeing)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {axes.map((axis) => {
                  const currentWeight = q.effects?.[axis.id] ?? 0;
                  const leftVal = 50 + (currentWeight / 20 * 50);
                  const rightVal = 100 - leftVal;

                  return (
                    <div
                      key={axis.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div className="axis" style={{ margin: '4px 0 12px 0' }}>
                        <div style={{ width: '56px', flexShrink: 0 }}>
                          <ValueIcon
                            name={axis.left.name}
                            color={axis.left.color}
                            iconSrc={axis.left.icon || '/raw_icons/equality.svg'}
                          />
                        </div>

                        <div style={{ position: 'relative', display: 'flex', flex: 1, height: '24pt', lineHeight: '24pt', fontSize: '12pt', overflow: 'hidden', borderTop: '2px solid var(--results-bar-border, #222)', borderBottom: '2px solid var(--results-bar-border, #222)', alignSelf: 'center' }}>
                          
                          <div className="bar-left" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: `${leftVal}%`, backgroundColor: axis.left.color, color: '#222222', fontWeight: 700, padding: 0, height: '100%' }}>
                            <div style={{ padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{leftVal >= 15 && currentWeight > 0 ? `+${currentWeight}` : ''}</div>
                          </div>

                          <div className="bar-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: `${rightVal}%`, backgroundColor: axis.right.color, color: '#222222', fontWeight: 700, padding: 0, height: '100%' }}>
                            <div style={{ padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{rightVal >= 15 && currentWeight < 0 ? `+${Math.abs(currentWeight)}` : ''}</div>
                          </div>

                          <input
                            type="range"
                            min="-20"
                            max="20"
                            step="5"
                            value={currentWeight}
                            onChange={(e) => handleUpdateEffect(qIdx, axis.id, parseInt(e.target.value))}
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
                          />
                        </div>

                        <div style={{ width: '56px', flexShrink: 0 }}>
                          <ValueIcon
                            name={axis.right.name}
                            color={axis.right.color}
                            iconSrc={axis.right.icon || '/raw_icons/markets.svg'}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {currentWeight === 0 ? 'No impact on this axis' : `Pushes towards ${currentWeight > 0 ? axis.left.name : axis.right.name}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleAddQuestion}>
        <Plus size={20} style={{ marginRight: '0.5rem' }} /> Add Another Question
      </button>
    </div>
  );
}
