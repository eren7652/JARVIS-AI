import { useRef, useState } from 'react';
import { apiFetch } from '../api.js';
import { LANGUAGES } from '../i18n/index.js';
import './Settings.css';

const APP_VERSION = '3.1.0';

export default function Settings({
  user, theme, onThemeChange, language, onLanguageChange, onClose, onLogout, onUserUpdate,
}) {
  const [tab, setTab] = useState('profile');
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef(null);

  const [name, setName] = useState(user.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const handleAvatarPick = (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await apiFetch('/api/auth/me', {
          method: 'PUT',
          body: JSON.stringify({ picture: reader.result }),
        });
        onUserUpdate(data.user);
        setImgError(false);
      } catch (err) {
        console.error('Failed to update picture:', err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    if (!name.trim() || name.trim() === user.name) return;
    setSavingName(true);
    setNameMsg('');
    try {
      const data = await apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify({ name: name.trim() }) });
      onUserUpdate(data.user);
      setNameMsg('Saved');
    } catch (err) {
      setNameMsg(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwBusy(true);
    try {
      await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      setPwMsg('Password updated');
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setPwMsg(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"/></svg>
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-tabs">
            {['profile', 'appearance', 'security', 'about'].map((id) => (
              <button
                key={id}
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id)}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            <button className="settings-logout-tab" onClick={onLogout}>Log out</button>
          </div>

          <div className="settings-content">
            {tab === 'profile' && (
              <div className="settings-section">
                <div className="settings-avatar-row">
                  {user.picture && !imgError ? (
                    <img
                      className="settings-avatar"
                      src={user.picture}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="settings-avatar settings-avatar-fallback">
                      {(user.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <button className="settings-btn-secondary" onClick={() => fileRef.current?.click()}>
                      Change picture
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarPick(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>

                <label className="settings-label">Name</label>
                <div className="settings-input-row">
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                  <button className="settings-btn-secondary" onClick={handleNameSave} disabled={savingName}>
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {nameMsg && <div className="settings-msg">{nameMsg}</div>}

                {user.email && (
                  <>
                    <label className="settings-label">Email</label>
                    <div className="settings-readonly">{user.email}</div>
                  </>
                )}
                {user.phone && (
                  <>
                    <label className="settings-label">Phone</label>
                    <div className="settings-readonly">{user.phone}</div>
                  </>
                )}
              </div>
            )}

            {tab === 'appearance' && (
              <div className="settings-section">
                <label className="settings-label">Theme</label>
                <div className="settings-theme-toggle">
                  <button
                    className={theme === 'dark' ? 'active' : ''}
                    onClick={() => onThemeChange('dark')}
                  >
                    Dark
                  </button>
                  <button
                    className={theme === 'light' ? 'active' : ''}
                    onClick={() => onThemeChange('light')}
                  >
                    Light
                  </button>
                </div>

                <label className="settings-label">Language</label>
                <select
                  className="settings-lang-select"
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}

            {tab === 'security' && (
              <div className="settings-section">
                <label className="settings-label">Sign-in method</label>
                <div className="settings-readonly settings-capitalize">{user.provider}</div>

                {user.provider === 'email' ? (
                  <form className="settings-password-form" onSubmit={handlePasswordChange}>
                    <label className="settings-label">Current password</label>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                    />
                    <label className="settings-label">New password</label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                    {pwMsg && <div className="settings-msg">{pwMsg}</div>}
                    <button className="settings-btn-primary" type="submit" disabled={pwBusy}>
                      {pwBusy ? 'Updating...' : 'Update password'}
                    </button>
                  </form>
                ) : (
                  <p className="settings-hint">
                    This account signs in via {user.provider} — there's no separate JARVIS password to change.
                  </p>
                )}
              </div>
            )}

            {tab === 'about' && (
              <div className="settings-section">
                <p className="settings-about-text">
                  <strong>J.A.R.V.I.S.</strong> — version {APP_VERSION}
                </p>
                <p className="settings-about-text">
                  A JARVIS-inspired AI assistant with voice input/output, real accounts,
                  and chat history backed by MongoDB. Built with React, Express, and the
                  Google Gemini API.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
