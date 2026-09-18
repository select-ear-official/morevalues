import React, { useState, useEffect } from 'react';
import { Download, Upload, Play, Globe, RotateCcw, Save, Check, Palette, Image as ImageIcon, Trash2, Undo2, Redo2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { AxisEditor } from './AxisEditor';
import { QuestionEditor } from './QuestionEditor';
import { IdeologyEditor } from './IdeologyEditor';
import { ImageCropperModal } from './ImageCropperModal';
import { RemoveButton } from '../RemoveButton';
import { DEFAULT_8VALUES_TEST } from '../../utils/default8values';

export function Studio({ test, setTest, onPlayTest, onPublish, isThemeEditMode, setIsThemeEditMode, user, undo, redo, canUndo, canRedo }) {
  const [activeTab, setActiveTab] = useState('axes');
  const [publishing, setPublishing] = useState(false);
  const [publishedMsg, setPublishedMsg] = useState(null);
  const [cropModalState, setCropModalState] = useState({ isOpen: false, imageSrc: null, type: null });
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Tag Autocomplete State
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tags) {
          setAvailableTags(data.tags);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddTag = (tag) => {
    if ((test.tags || []).length >= 5) return;
    const newTag = tag.trim().toLowerCase();
    const currentTags = test.tags || [];
    if (newTag && !currentTags.includes(newTag)) {
      setTest({ ...test, tags: [...currentTags, newTag] });
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tag) => {
    const newTags = (test.tags || []).filter(t => t !== tag);
    setTest({ ...test, tags: newTags });
  };

  // References for unmount auto-save
  const testRef = React.useRef(test);
  const userRef = React.useRef(user);
  const onPublishRef = React.useRef(onPublish);

  React.useEffect(() => {
    testRef.current = test;
    userRef.current = user;
    onPublishRef.current = onPublish;
  }, [test, user, onPublish]);

  React.useEffect(() => {
    return () => {
      const q = testRef.current;
      const u = userRef.current;
      const pub = onPublishRef.current;
      if (q && pub) {
        // Prevent auto-saving the default template if no edits have been made
        const isUneditedTemplate = q.id === '8values-classic' && JSON.stringify(q) === JSON.stringify(DEFAULT_8VALUES_TEST);
        if (isUneditedTemplate) return;
        
        // Only auto-save if they are logged in, and they either own the test or it's new
        if (u && (!q.ownerId || q.ownerId === u.id)) {
          const isDraft = q.isDraft !== 0;
          pub(q, isDraft).catch(() => {});
        }
      }
    };
  }, []);

  // Keyboard shortcuts for Undo/Redo
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleMetadataChange = (field, value) => {
    setTest({ ...test, [field]: value });
  };

  const handleAxesChange = (axes) => {
    setTest({ ...test, axes });
  };

  const handleQuestionsChange = (questions) => {
    setTest({ ...test, questions });
  };

  const handleIdeologiesChange = (ideologies) => {
    setTest({ ...test, ideologies });
  };

  const handlePublishClick = async (isDraft) => {
    setPublishing(true);
    setPublishedMsg(null);
    setErrorMsg(null);
    try {
      const res = await onPublish(test, isDraft);
      if (res && res.success) {
        const isUpdate = test.ownerId && user && test.ownerId === user.id;
        let msg = isDraft ? 'Draft saved successfully!' : (isUpdate ? 'Changes saved and published!' : `Test published! Share URL: ${window.location.origin}/#test=${res.id}`);
        setPublishedMsg(msg);
        
        // Update local test state with the new ID and owner so subsequent clicks act as "Save"
        setTest({ ...test, id: res.id, ownerId: user?.id || null, isDraft: isDraft ? 1 : 0 });
      } else {
        setErrorMsg(res?.error || 'Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error occurred.');
    } finally {
      setPublishing(false);
    }
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (file.type === 'image/gif') {
        handleMetadataChange(field, event.target.result);
        return;
      }
      
      setCropModalState({ isOpen: true, imageSrc: event.target.result, type: field });
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1>Creator</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Design and publish your test here.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.05)' }}>
            <button 
              style={{ border: 'none', background: 'transparent', padding: '0.5rem 0.75rem', color: canUndo ? 'var(--text-main)' : 'var(--text-muted)', cursor: canUndo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }} 
              onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <div style={{ width: '1px', background: 'var(--border-color)' }} />
            <button 
              style={{ border: 'none', background: 'transparent', padding: '0.5rem 0.75rem', color: canRedo ? 'var(--text-main)' : 'var(--text-muted)', cursor: canRedo ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }} 
              onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => handlePublishClick(true)} disabled={publishing} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '110px' }}>
            {publishing ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Draft</>}
          </button>
          
          <button className="btn btn-success btn-sm" onClick={onPlayTest} disabled={publishing}>
            <Play size={16} /> Demo Test
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => handlePublishClick(false)} disabled={publishing} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>
            {publishing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <><Globe size={16} /> {test.ownerId && (!user || test.ownerId !== user.id) ? 'Fork & Publish' : 'Publish'}</>
            )}
          </button>
        </div>
      </div>

      {!user && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#d97706', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>You are not logged in.</strong> You can design and test your test locally, but you must create an account or log in to save and publish it.
          </div>
        </div>
      )}

      {publishedMsg && (
        <div style={{ background: 'rgba(22, 163, 74, 0.15)', border: '1px solid #16a34a', color: '#4caf50', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} />
          {publishedMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(211, 47, 47, 0.15)', border: '1px solid #d32f2f', color: '#f44336', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold' }}>Error:</span>
          {errorMsg}
        </div>
      )}

      {/* General Settings Card */}
      <div className="axis-card" style={{ textAlign: 'left', marginBottom: '2rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>General Test Settings</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Test Title</label>
            <input
              type="text"
              className="form-input"
              value={test.title || ''}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
              placeholder="e.g. 8values Political Spectrum"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Description</label>
          <textarea
            rows={2}
            className="form-textarea"
            value={test.description || ''}
            onChange={(e) => handleMetadataChange('description', e.target.value)}
            placeholder="Brief explanation of what this test measures..."
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1', position: 'relative', marginBottom: '1rem' }}>
          <label className="form-label">Tags (max 5)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {(test.tags || []).map(t => (
              <span key={t} style={{ background: 'var(--btn-bg, #e0e0e0)', color: 'var(--text-main, #444)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {t}
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
              </span>
            ))}
          </div>
          <input
            type="text"
            className="form-input"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowTagDropdown(true);
            }}
            onFocus={() => setShowTagDropdown(true)}
            onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
            placeholder={(test.tags || []).length < 5 ? "Type a tag and press Enter..." : "Maximum 5 tags reached"}
            disabled={(test.tags || []).length >= 5}
          />
          {showTagDropdown && tagInput.trim().length > 0 && availableTags.filter(t => t.includes(tagInput.toLowerCase()) && !(test.tags || []).includes(t)).length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #cccccc', borderRadius: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', marginTop: '0.25rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
              {availableTags.filter(t => t.includes(tagInput.toLowerCase()) && !(test.tags || []).includes(t)).map(option => (
                <div 
                  key={option} 
                  style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #eeeeee', color: '#333333' }}
                  onMouseDown={(e) => { e.preventDefault(); handleAddTag(option); }}
                  onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.background = '#ffffff'}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Branding & Assets Card */}
      <div className="axis-card" style={{ textAlign: 'left', marginBottom: '2rem', padding: '1.5rem' }}>
        {/* <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImageIcon size={20} style={{ color: '#a78bfa' }} />
          Branding & Assets
        </h3> */}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {/* Thumbnail Upload */}
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Test Thumbnail (Cover Image)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Displayed on the search page. (Recommended ratio 16:9)
              </p>
            </div>
            
            <label className="image-upload-wrapper" style={{ display: 'block', marginBottom: '1rem', border: test.thumbnail ? '1px solid var(--border-color)' : '2px dashed var(--border-color)', background: 'rgba(0,0,0,0.05)', aspectRatio: '16/9' }}>
              {test.thumbnail ? (
                <img src={test.thumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
              )}
              <div className="image-upload-overlay">
                <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                {test.thumbnail ? 'Change Cover Image' : 'Upload Cover Image'}
                <input 
                  style={{ display: 'none' }} 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'thumbnail')} 
                />
              </div>
            </label>

            {test.thumbnail && (
              <RemoveButton 
                className="btn-sm" 
                style={{ width: '100%', padding: '0.5rem' }}
                label="Remove Cover Image"
                onClick={() => handleMetadataChange('thumbnail', null)}
              />
            )}
          </div>

          {/* Favicon Upload */}
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Favicon (Small Icon)</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Displayed in the browser tab and small badges. (Square)
              </p>
            </div>

            <label className="image-upload-wrapper" style={{ display: 'block', marginBottom: '1rem', width: '80px', height: '80px', border: test.favicon ? '1px solid var(--border-color)' : '2px dashed var(--border-color)', background: 'rgba(0,0,0,0.05)' }}>
              {test.favicon ? (
                <img src={test.favicon} alt="Favicon preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={20} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
              )}
              <div className="image-upload-overlay" style={{ fontSize: '0.75rem' }}>
                <Upload size={16} style={{ marginBottom: '0.25rem' }} />
                <input 
                  style={{ display: 'none' }} 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(e, 'favicon')} 
                />
              </div>
            </label>

            {test.favicon && (
              <div style={{ marginTop: '0.5rem' }}>
                <RemoveButton 
                  className="btn-sm" 
                  noIcon={true}
                  style={{ width: '80px', padding: '0.25rem', fontSize: '0.85rem' }}
                  onClick={() => handleMetadataChange('favicon', null)}
                />
              </div>
            )}
          </div>

          {/* Theme Colors */}
          <div>
            <label className="form-label">Custom Theme Colours</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Customise your test colours with the colour picker.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => {
              setIsThemeEditMode(true);
              onPlayTest();
            }}>
              <Palette size={16} /> Edit Theme Colors
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="studio-tabs">
        <button
          className={`studio-tab ${activeTab === 'axes' ? 'active' : ''}`}
          onClick={() => setActiveTab('axes')}
        >
          1. Axes & Values ({test.axes?.length || 0})
        </button>

        <button
          className={`studio-tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          2. Questions & Weights ({test.questions?.length || 0})
        </button>

        <button
          className={`studio-tab ${activeTab === 'ideologies' ? 'active' : ''}`}
          onClick={() => setActiveTab('ideologies')}
        >
          3. Ideologies ({test.ideologies?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'axes' && (
        <AxisEditor axes={test.axes || []} setAxes={handleAxesChange} />
      )}

      {activeTab === 'questions' && (
        <QuestionEditor questions={test.questions || []} setQuestions={handleQuestionsChange} axes={test.axes || []} />
      )}

      {activeTab === 'ideologies' && (
        <IdeologyEditor ideologies={test.ideologies || []} setIdeologies={handleIdeologiesChange} axes={test.axes || []} />
      )}

      <ImageCropperModal
        isOpen={cropModalState.isOpen}
        imageSrc={cropModalState.imageSrc}
        aspectRatio={cropModalState.type === 'thumbnail' ? (16 / 9) : 1}
        title={cropModalState.type === 'thumbnail' ? "Crop Cover Image (16:9)" : "Crop Favicon (1:1)"}
        onComplete={(croppedImage) => {
          handleMetadataChange(cropModalState.type, croppedImage);
          setCropModalState({ isOpen: false, imageSrc: null, type: null });
        }}
        onCancel={() => setCropModalState({ isOpen: false, imageSrc: null, type: null })}
      />
    </div>
  );
}
