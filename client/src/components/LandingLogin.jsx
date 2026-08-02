import { useEffect, useRef, useState } from 'react';
import Orb from './Orb.jsx';
import LandingBackground from './LandingBackground.jsx';
import { apiFetch, setToken } from '../api.js';
import { playBootSound } from '../bootSound.js';
import './LandingLogin.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordIssue(password) {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include a letter and a number';
  }
  return null;
}

export default function LandingLogin({ onLogin }) {
  const googleBtnRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [booting, setBooting] = useState(true);

  // 'select' (default: Google + Create account) | 'login' | 'signup' | 'phone-number' | 'phone-otp'
  const [view, setView] = useState('select');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devCode, setDevCode] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    playBootSound();
    const timer = setTimeout(() => setBooting(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || view !== 'select') return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setError('');
        setBusy(true);
        try {
          const data = await apiFetch('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential: response.credential }),
          });
          setToken(data.token);
          onLogin(data.user);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      },
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 280,
      });
      setGoogleReady(true);
    }
  }, [onLogin, view]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    if (view === 'signup') {
      if (!name.trim()) return setError('Enter your name');
      const pwErr = passwordIssue(password);
      if (pwErr) return setError(pwErr);
    }

    setBusy(true);
    try {
      const path = view === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = view === 'login'
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

      const data = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (phone.replace(/[^\d]/g, '').length < 8) {
      setError('Enter a valid phone number');
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch('/api/auth/phone/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      if (data.devMode) setDevCode(data.devCode);
      setView('phone-otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch('/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code: otp.trim() }),
      });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const goTo = (v) => { setView(v); setError(''); };

  return (
    <div className="landing">
      <LandingBackground />

      {booting && (
        <>
          <div className="suit-door suit-door-left" />
          <div className="suit-door suit-door-right" />
        </>
      )}

      <div className={`landing-card ${booting ? 'landing-card-hidden' : ''}`}>
        <Orb state="idle" size={130} />
        <h1 className="landing-title">J.A.R.V.I.S.</h1>
        <p className="landing-tagline">Just A Rather Very Intelligent System</p>

        <div key={view} className="view-anim landing-view">
          {view === 'select' && (
            <>
              <div className="landing-google-btn" ref={googleBtnRef} />
              {!googleReady && (
                <div className="landing-google-fallback">
                  Sign in with Google isn't configured yet.
                </div>
              )}

              <button type="button" className="landing-primary-btn" onClick={() => goTo('signup')}>
                Create a new account
              </button>

              <button type="button" className="landing-switch-link" onClick={() => goTo('login')}>
                Already have an account? Log in
              </button>
              <button type="button" className="landing-switch-link" onClick={() => goTo('phone-number')}>
                Continue with phone number
              </button>
            </>
          )}

          {(view === 'login' || view === 'signup') && (
            <>
              <form className="landing-form" onSubmit={handleEmailSubmit}>
                {view === 'signup' && (
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="landing-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="landing-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M12 6c-5 0-9.27 3.11-11 7.5C2.73 17.89 7 21 12 21s9.27-3.11 11-7.5C21.27 9.11 17 6 12 6zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M2 4.27l2.28 2.28.46.46A11.8 11.8 0 0 0 1 13.5C2.73 17.89 7 21 12 21c1.9 0 3.7-.45 5.28-1.24l.5.5L20.06 22.5l1.28-1.27L3.28 3zm7.53 7.53a2.5 2.5 0 0 0 3.4 3.4zM12 6c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-3.11 4.34l-1.44-1.44A5 5 0 0 0 12 8.5c-.53 0-1.04.09-1.51.25L9.06 7.32C10 6.5 11 6 12 6z"/></svg>
                    )}
                  </button>
                </div>
                {error && <div className="landing-error">{error}</div>}
                <button type="submit" className="landing-primary-btn" disabled={busy}>
                  {busy ? 'Please wait...' : view === 'login' ? 'Log in' : 'Create account'}
                </button>
              </form>

              <button
                type="button"
                className="landing-switch-link"
                onClick={() => goTo(view === 'login' ? 'signup' : 'login')}
              >
                {view === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
              </button>
              <button type="button" className="landing-switch-link" onClick={() => goTo('select')}>
                Back
              </button>
            </>
          )}

          {view === 'phone-number' && (
            <form className="landing-form" onSubmit={handleSendCode}>
              <input
                type="tel"
                placeholder="Phone number (e.g. +1 555 123 4567)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {error && <div className="landing-error">{error}</div>}
              <button type="submit" className="landing-primary-btn" disabled={busy}>
                {busy ? 'Sending...' : 'Send code'}
              </button>
              <button type="button" className="landing-switch-link" onClick={() => goTo('select')}>Back</button>
            </form>
          )}

          {view === 'phone-otp' && (
            <form className="landing-form" onSubmit={handleVerifyCode}>
              <p className="landing-otp-hint">Enter the 6-digit code sent to {phone}</p>
              {devCode && (
                <p className="landing-dev-code">
                  Demo mode (no SMS provider configured) — your code is <strong>{devCode}</strong>
                </p>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              {error && <div className="landing-error">{error}</div>}
              <button type="submit" className="landing-primary-btn" disabled={busy}>
                {busy ? 'Verifying...' : 'Verify & continue'}
              </button>
              <button type="button" className="landing-switch-link" onClick={() => goTo('phone-number')}>Back</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
