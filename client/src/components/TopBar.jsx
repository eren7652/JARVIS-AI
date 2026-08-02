import Orb from './Orb.jsx';
import './TopBar.css';

export default function TopBar({ coreState, statusText, greeting, clock, dateline, onMenuClick }) {
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
        <div className="clock">{clock}</div>
        <div className="dateline">{dateline}</div>
        <div className={`status ${statusClass}`}>{statusText}</div>
      </div>
    </header>
  );
}
