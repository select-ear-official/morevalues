import React, { useState, useEffect } from 'react';
import { User, Edit3, Check, Image as ImageIcon, Play, GitFork, ExternalLink, Link as LinkIcon, Save, X, KeyRound, Mail, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { DEFAULT_8VALUES_TEST } from '../utils/default8values';
import { TestCard } from './TestCard';
import { ConfirmModal } from './ConfirmModal';
import { ImageCropperModal } from './Studio/ImageCropperModal';
import { Spinner } from './Spinner';

export function ProfilePage({ username, user, authToken, onUserUpdate, onSelectTest, onEditTest, onGoBack }) {
  const [profile, setProfile] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recycleBinTests, setRecycleBinTests] = useState([]);
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'drafts' | 'recycle' | 'settings'
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, testId: null, isHard: false });
  const [cropModalState, setCropModalState] = useState({ isOpen: false, imageSrc: null });
  
  // Edit mode state for bio/pic/social
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSocial, setEditSocial] = useState('');
  const [editPic, setEditPic] = useState('');
  const [saving, setSaving] = useState(false);

  // Account Settings state
  const [newUsername, setNewUsername] = useState('');
  const [confirmUsernameModal, setConfirmUsernameModal] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState({ error: null, success: null });
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ error: null, success: null });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState({ error: null, success: null });
  const [emailLoading, setEmailLoading] = useState(false);
  
  const isOwner = user && user.username.toLowerCase() === username.toLowerCase();

  const publishedTests = tests.filter(q => q.isDraft !== 1);
  const draftTests = tests.filter(q => q.isDraft === 1);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${username}`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {}
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setTests(data.tests);
        setEditBio(data.profile.bio || '');
        setEditSocial(data.profile.socialMedia || '');
        setEditPic(data.profile.profilePicture || '');
        setNewUsername(data.profile.username || '');
        setNewEmail(data.profile.email || '');
        
        if (isOwner && authToken) {
          try {
            const rbRes = await fetch(`/api/profile/${username}/recycle-bin`, {
              headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const rbData = await rbRes.json();
            if (rbData.success) {
              setRecycleBinTests(rbData.tests);
            }
          } catch(e) {}
        }
      } else {
        alert(data.error || 'Profile not found');
      }
    } catch (err) {
      alert('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const { testId, isHard } = deleteModal;
    setDeleteModal({ isOpen: false, testId: null, isHard: false });
    if (!testId) return;
    
    try {
      const endpoint = isHard ? `/api/tests/${testId}/permanent` : `/api/tests/${testId}`;
      const res = await fetch(`${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        loadProfile(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete test');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting test');
    }
  };

  const handleRestoreTest = async (testId) => {
    try {
      const res = await fetch(`/api/tests/${testId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        loadProfile(); // Refresh list
      } else {
        alert(data.error || 'Failed to restore test');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while restoring test');
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (file.type === 'image/gif') {
        setEditPic(event.target.result);
        return;
      }
      setCropModalState({ isOpen: true, imageSrc: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ bio: editBio, socialMedia: editSocial, profilePicture: editPic })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        await loadProfile();
      } else {
        alert(data.error || 'Failed to save profile');
      }
    } catch (err) {
      alert('Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeUsername = async () => {
    setConfirmUsernameModal(false);
    setUsernameMsg({ error: null, success: null });
    setUsernameLoading(true);
    try {
      const res = await fetch('/api/auth/username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ newUsername: newUsername.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setUsernameMsg({ error: null, success: data.message });
        if (onUserUpdate) {
          onUserUpdate({ ...user, username: data.user.username }, data.token);
        }
      } else {
        setUsernameMsg({ error: data.error || 'Failed to update username', success: null });
      }
    } catch (err) {
      setUsernameMsg({ error: 'Network error updating username', success: null });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ error: null, success: null });
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ error: 'New passwords do not match', success: null });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ error: null, success: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordMsg({ error: data.error || 'Failed to change password', success: null });
      }
    } catch (err) {
      setPasswordMsg({ error: 'Network error changing password', success: null });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailMsg({ error: null, success: null });
    setEmailLoading(true);
    try {
      const res = await fetch('/api/auth/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ email: newEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setEmailMsg({ error: null, success: data.message });
        await loadProfile();
      } else {
        setEmailMsg({ error: data.error || 'Failed to update email', success: null });
      }
    } catch (err) {
      setEmailMsg({ error: 'Network error updating email', success: null });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setEmailMsg({ error: null, success: null });
    setEmailLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmailMsg({ error: null, success: data.message });
      } else {
        setEmailMsg({ error: data.error || 'Failed to resend verification link', success: null });
      }
    } catch (err) {
      setEmailMsg({ error: 'Network error resending link', success: null });
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Spinner size={44} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>User not found</h2>
        <button className="btn btn-primary" onClick={onGoBack} style={{ marginTop: '1rem' }}>Return to Explore</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '100%', margin: '0 auto', paddingBottom: '4rem' }}>
      <ImageCropperModal
        isOpen={cropModalState.isOpen}
        imageSrc={cropModalState.imageSrc}
        aspectRatio={1}
        title="Crop Profile Picture (1:1)"
        onComplete={(croppedImg) => {
          setEditPic(croppedImg);
          setCropModalState({ isOpen: false, imageSrc: null });
        }}
        onCancel={() => setCropModalState({ isOpen: false, imageSrc: null })}
      />
      
      {/* Profile Header */}
      <div className="axis-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', backgroundColor: 'var(--container-bg)', borderRadius: '12px', padding: '2rem' }}>
        
        {isEditing ? (
          <div className="avatar-container">
            <label style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer', margin: 0 }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              
              <img src={editPic || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(profile.username)}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              <div className="avatar-overlay">
                <ImageIcon size={28} style={{ marginBottom: '0.25rem' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Change Picture</span>
              </div>
            </label>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={profile.profilePicture || `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(profile.username)}`} alt="Avatar" style={{ width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-primary)' }} />
          </div>
        )}

        <div style={{ width: '100%', maxWidth: '500px' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', lineHeight: 1.2 }}>{profile.username}</h2>
          
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Bio</label>
                <textarea 
                  value={editBio} 
                  onChange={e => setEditBio(e.target.value)} 
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '6px', border: '2px solid #cccccc', background: 'var(--bg-primary)', color: 'var(--text-main)', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Social Media Link</label>
                  <input 
                    type="text" 
                    value={editSocial} 
                    onChange={e => setEditSocial(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #cccccc', background: 'var(--bg-primary)', color: 'var(--text-main)' }}
                  />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px' }}>
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Profile</>}
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {profile.bio && (
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {profile.bio}
                </p>
              )}
              {profile.socialMedia && (
                <a href={profile.socialMedia.startsWith('http') ? profile.socialMedia : `https://${profile.socialMedia}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', textDecoration: 'none', background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
                  <ExternalLink size={14} />
                  {profile.socialMedia.replace(/^https?:\/\//, '')}
                </a>
              )}
              {isOwner && (
                <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)} style={{ marginTop: '0.5rem' }}>
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ margin: '3rem 0 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>
          {activeTab === 'settings' ? 'Account Settings' : `Tests by ${profile.username}`}
        </h2>
        {isOwner && (
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'published' ? 'btn-primary' : ''}`} 
              style={{ background: activeTab === 'published' ? '' : 'transparent', color: activeTab === 'published' ? '' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('published')}
            >
              Published ({publishedTests.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'drafts' ? 'btn-primary' : ''}`} 
              style={{ background: activeTab === 'drafts' ? '' : 'transparent', color: activeTab === 'drafts' ? '' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('drafts')}
            >
              Drafts ({draftTests.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'recycle' ? 'btn-primary' : ''}`} 
              style={{ background: activeTab === 'recycle' ? '' : 'transparent', color: activeTab === 'recycle' ? '' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('recycle')}
            >
              Recycle Bin ({recycleBinTests.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary' : ''}`} 
              style={{ background: activeTab === 'settings' ? '' : 'transparent', color: activeTab === 'settings' ? '' : 'var(--text-muted)' }}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
        )}
      </div>
      
      {activeTab === 'published' && (
        publishedTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--container-bg)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            This user hasn't published any tests yet.
          </div>
        ) : (
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {publishedTests.map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  isOwner={isOwner} 
                  onSelectTest={onSelectTest} 
                  onEditTest={onEditTest} 
                  onDeleteTest={isOwner ? () => setDeleteModal({ isOpen: true, testId: test.id, isHard: false }) : null}
                />
              ))}
            </div>
          </div>
        )
      )}

      {isOwner && activeTab === 'drafts' && (
        draftTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--container-bg)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            No drafts found.
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {draftTests.map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  isOwner={isOwner} 
                  onSelectTest={onSelectTest} 
                  onEditTest={onEditTest} 
                  onDeleteTest={isOwner ? () => setDeleteModal({ isOpen: true, testId: test.id, isHard: false }) : null}
                />
              ))}
            </div>
          </div>
        )
      )}

      {isOwner && activeTab === 'recycle' && (
        recycleBinTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--container-bg)', borderRadius: '12px', color: 'var(--text-muted)' }}>
            Recycle Bin is empty.
          </div>
        ) : (
          <div>
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
              Items in the Recycle Bin will be automatically deleted after 30 days.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {recycleBinTests.map((test) => (
                <div key={test.id} style={{ position: 'relative' }}>
                  <div style={{ opacity: 0.6, pointerEvents: 'none' }}>
                    <TestCard test={test} isOwner={false} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', zIndex: 10 }}>
                    <button className="btn btn-primary" onClick={() => handleRestoreTest(test.id)}>Restore</button>
                    <button className="btn btn-delete" onClick={() => setDeleteModal({ isOpen: true, testId: test.id, isHard: true })}>Permanently Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {isOwner && activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '650px', margin: '0 auto' }}>
          
          {/* Change Username Card */}
          <div className="axis-card" style={{ background: 'var(--container-bg)', borderRadius: '12px', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} /> Change Username
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Update the handle used for your profile and published test URLs.
            </p>

            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#d97706', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Warning:</strong> Changing your username will immediately change all your test URLs from <code>/t/{profile.username}/...</code> to <code>/t/{newUsername || 'new-username'}/...</code>. Any previously shared links or bookmarks will stop working.
              </div>
            </div>

            {usernameMsg.error && <div style={{ color: '#d32f2f', background: 'rgba(211, 47, 47, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{usernameMsg.error}</div>}
            {usernameMsg.success && <div style={{ color: '#2e7d32', background: 'rgba(46, 125, 50, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{usernameMsg.success}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">New Username</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="3-20 chars, letters, numbers, -, _"
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (!newUsername.trim() || newUsername.trim() === profile.username) return;
                  setConfirmUsernameModal(true);
                }}
                disabled={usernameLoading || !newUsername.trim() || newUsername.trim() === profile.username}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '130px' }}
              >
                {usernameLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Handle'}
              </button>
            </div>
          </div>

          {/* Email Management Card */}
          <div className="axis-card" style={{ background: 'var(--container-bg)', borderRadius: '12px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={20} /> Email Address & Recovery
              </h3>
              {profile.email && (
                profile.emailVerified ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#2e7d32', background: 'rgba(46, 125, 50, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    <ShieldCheck size={14} /> Verified
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', background: 'rgba(245, 158, 11, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    Unverified
                  </span>
                )
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Used for account recovery and password resets.
            </p>

            {emailMsg.error && <div style={{ color: '#d32f2f', background: 'rgba(211, 47, 47, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{emailMsg.error}</div>}
            {emailMsg.success && <div style={{ color: '#2e7d32', background: 'rgba(46, 125, 50, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{emailMsg.success}</div>}

            <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={emailLoading} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '110px' }}>
                  {emailLoading ? <Loader2 className="animate-spin" size={16} /> : 'Save Email'}
                </button>
              </div>
            </form>

            {profile.email && !profile.emailVerified && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Didn't receive the verification email?</span>
                <button className="btn btn-outline btn-sm" onClick={handleResendVerification} disabled={emailLoading} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>
                  {emailLoading ? <Loader2 className="animate-spin" size={14} /> : 'Resend Link'}
                </button>
              </div>
            )}
          </div>

          {/* Change Password Card */}
          <div className="axis-card" style={{ background: 'var(--container-bg)', borderRadius: '12px', padding: '2rem' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={20} /> Change Password
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Ensure your account stays secure by using a strong password.
            </p>

            {passwordMsg.error && <div style={{ color: '#d32f2f', background: 'rgba(211, 47, 47, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{passwordMsg.error}</div>}
            {passwordMsg.success && <div style={{ color: '#2e7d32', background: 'rgba(46, 125, 50, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{passwordMsg.success}</div>}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  required
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  required
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '150px' }} disabled={passwordLoading}>
                {passwordLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Confirmation Modal for Username Change */}
      <ConfirmModal
        isOpen={confirmUsernameModal}
        title="Confirm Username Change"
        message={`Are you sure you want to change your username to "${newUsername}"? This will break all old links to your published tests (/t/${profile.username}/...).`}
        confirmText="Yes, Change Username"
        onConfirm={handleChangeUsername}
        onCancel={() => setConfirmUsernameModal(false)}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.isHard ? "Permanently Delete Test?" : "Move to Recycle Bin?"}
        message={deleteModal.isHard ? "Are you sure you want to permanently delete this test? This action cannot be undone." : "Are you sure you want to move this test to the Recycle Bin? It will be automatically deleted in 30 days."}
        confirmText={deleteModal.isHard ? "Permanently Delete" : "Move to Recycle Bin"}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, testId: null, isHard: false })}
      />
    </div>
  );
}
