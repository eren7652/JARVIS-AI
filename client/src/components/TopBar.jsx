import Orb from './Orb.jsx';
import './TopBar.css';

export default function TopBar({
  coreState, statusText, greeting, clock, dateline, onMenuClick, voiceMuted, onToggleMute,
}) {
  const statusClass =
    coreState === 'listening' ? 'listening' :
    coreState === 'speaking' ? 'speaking' :
    coreState === 'error' ? 'error' : '';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
          </svg>
        </button>
        <Orb state={coreState} size={46} />
        <div className="brand-block">
          <div className="brand">J.A.R.V.I.S.</div>
          <div className="greeting">{greeting}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-right-top">
          <button
            className={`mute-btn ${voiceMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            aria-label={voiceMuted ? 'Unmute JARVIS voice' : 'Mute JARVIS voice'}
            title={voiceMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {voiceMuted ? (
              <svg viewBox="0 0 24 24" width="17" height="17">
                <path fill="currentColor" d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.9 8.9 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="17" height="17">
                <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <div className="clock">{clock}</div>
        </div>
        <div className="dateline">{dateline}</div>
        <div className={`status ${statusClass}`}>{statusText}</div>
      </div>
    </header>
  );
}