import React, { useState } from 'react';
import { X, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export function AuthModal({ onClose, onLoginSuccess, initialView = 'login', initialResetToken = null }) {
  const [view, setView] = useState(initialView); // 'login' | 'register' | 'forgot' | 'reset'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState(initialResetToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (view === 'login') {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          onLoginSuccess(data.user, data.token);
        } else {
          setError(data.error || 'Authentication failed');
        }
      } else if (view === 'register') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, email: email.trim() || undefined })
        });
        const data = await res.json();
        if (data.success) {
          onLoginSuccess(data.user, data.token);
        } else {
          setError(data.error || 'Registration failed');
        }
      } else if (view === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        const data = await res.json();
        setSuccessMsg(data.message || 'If an account exists, a reset link was sent.');
      } else if (view === 'reset') {
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken.trim(), newPassword })
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg(data.message);
          setTimeout(() => {
            setView('login');
            setSuccessMsg(null);
          }, 2000);
        } else {
          setError(data.error || 'Failed to reset password');
        }
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: 'var(--container-bg, #eee)', 
        padding: '2rem', 
        borderRadius: '12px', 
        width: '100%', 
        maxWidth: '420px',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {view !== 'login' && view !== 'register' && (
          <button 
            onClick={() => { setView('login'); setError(null); setSuccessMsg(null); }}
            style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        
        <h2 style={{ marginBottom: '1.25rem', textAlign: 'center', marginTop: (view === 'forgot' || view === 'reset') ? '0.5rem' : '0' }}>
          {view === 'login' && 'Welcome Back'}
          {view === 'register' && 'Create Account'}
          {view === 'forgot' && 'Reset Password'}
          {view === 'reset' && 'Set New Password'}
        </h2>

        {error && (
          <div style={{ color: '#d32f2f', background: 'rgba(211, 47, 47, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ color: '#2e7d32', background: 'rgba(46, 125, 50, 0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {view === 'register' && (
            <>
              <div>
                <label className="form-label">Username <span style={{ color: '#d32f2f' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder="letters, numbers, _ or -"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Email (Optional)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="For password recovery"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Password <span style={{ color: '#d32f2f' }}>*</span></label>
                <input 
                  type="password" 
                  className="form-input" 
                  required
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {view === 'login' && (
            <>
              <div>
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <span 
                    style={{ color: '#2196f3', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '0.25rem' }}
                    onClick={() => { setView('forgot'); setError(null); setSuccessMsg(null); }}
                  >
                    Forgot password?
                  </span>
                </div>
                <input 
                  type="password" 
                  className="form-input" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {view === 'forgot' && (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Enter the email address associated with your account, and we'll send you a password reset link.
              </p>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          {view === 'reset' && (
            <>
              <div>
                <label className="form-label">Reset Token</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
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
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Processing...' : (
              view === 'login' ? 'Log In' :
              view === 'register' ? 'Create Account' :
              view === 'forgot' ? 'Send Reset Link' : 'Save New Password'
            )}
          </button>
        </form>

        {view === 'login' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Don't have an account?{' '}
            <span 
              style={{ color: '#2196f3', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => { setView('register'); setError(null); setSuccessMsg(null); }}
            >
              Register
            </span>
          </div>
        )}

        {view === 'register' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <span 
              style={{ color: '#2196f3', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => { setView('login'); setError(null); setSuccessMsg(null); }}
            >
              Log In
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
