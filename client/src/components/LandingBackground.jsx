import './LandingBackground.css';

// Hero background for the login page: giant JARVIS wordmark + the reactor
// symbol, layered behind the login card. Purely decorative.
export default function LandingBackground() {
  return (
    <div className="landing-bg" aria-hidden="true">
      <div className="landing-bg-word">J.A.R.V.I.S.</div>
      <svg className="landing-bg-symbol" viewBox="0 0 400 400">
        <defs>
          <radialGradient id="lb-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.9" />
            <stop offset="45%" stopColor="var(--cyan)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="lb-glow" cx="200" cy="200" r="90" fill="url(#lb-core)" />
        <circle className="lb-ring lb-ring-1" cx="200" cy="200" r="160" />
        <circle className="lb-ring lb-ring-2" cx="200" cy="200" r="130" />
        <circle className="lb-ring lb-ring-3" cx="200" cy="200" r="100" />
        <polygon className="lb-tri" points="200,120 270,240 130,240" />
      </svg>
    </div>
  );
}
