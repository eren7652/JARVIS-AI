import { useEffect, useState } from 'react';
import Orb from './Orb.jsx';
import LandingBackground from './LandingBackground.jsx';
import { playBootSound } from '../bootSound.js';
import './Hero.css';

const FEATURES = [
  {
    title: 'Voice activated',
    desc: 'Say "Jarvis" and just start talking — no clicking, no typing, hands-free from wake word to reply.',
    icon: (
      <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12z"/>
    ),
  },
  {
    title: 'Speaks your language',
    desc: 'English, Hindi, Spanish, French, German, Japanese — replies and voice switch together, instantly.',
    icon: (
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 8h-3a15.6 15.6 0 0 0-1.3-5.3A8 8 0 0 1 18.9 10zM12 4c.8 1.3 1.4 3 1.7 6H10.3c.3-3 .9-4.7 1.7-6zm-3.6.7A15.6 15.6 0 0 0 7.1 10h-3a8 8 0 0 1 4.3-5.3zM4.1 12h3a15.6 15.6 0 0 0 1.3 5.3A8 8 0 0 1 4.1 12zM12 20c-.8-1.3-1.4-3-1.7-6h3.4c-.3 3-.9 4.7-1.7 6zm3.6-.7c.7-1.6 1.1-3.4 1.3-5.3h3a8 8 0 0 1-4.3 5.3z"/>
    ),
  },
  {
    title: 'Sees what you show it',
    desc: 'Attach a photo or screenshot and ask about it directly — JARVIS reads images, not just text.',
    icon: (
      <path fill="currentColor" d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v10h14V7H5zm2 8l3.5-4.5 2.5 3 2-2.5L18 15H7z"/>
    ),
  },
  {
    title: 'Your account, your history',
    desc: 'Real sign-in, passwords hashed and never stored in plain text — your conversations stay yours.',
    icon: (
      <path fill="currentColor" d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3zm0 10a1.5 1.5 0 0 0-1.5 1.5c0 .68.38 1.26.94 1.56l-.4 2.44h1.92l-.4-2.44a1.5 1.5 0 0 0-.56-2.9z"/>
    ),
  },
];

const STACK = ['React', 'Node.js', 'Express', 'MongoDB', 'Gemini API', 'Web Speech API'];

export default function Hero({ onEnter, onLogin }) {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    playBootSound();
    const timer = setTimeout(() => setBooting(false), 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hero-page">
      <LandingBackground />

      {booting && (
        <>
          <div className="suit-door suit-door-left" />
          <div className="suit-door suit-door-right" />
        </>
      )}

      <div className={`hero-content ${booting ? 'hero-content-hidden' : ''}`}>
      <nav className="hero-nav">
        <div className="hero-nav-brand">
          <Orb state="idle" size={34} />
          <span>J.A.R.V.I.S.</span>
        </div>
        <button className="hero-nav-login" onClick={onLogin}>Log in</button>
      </nav>

      <section className="hero-main">
        <Orb state="idle" size={110} />
        <h1 className="hero-title">J.A.R.V.I.S.</h1>
        <p className="hero-tagline">Just A Rather Very Intelligent System</p>
        <p className="hero-sub">
          A personal AI assistant you talk to like a person — ask by voice or
          text, in your language, and it remembers where you left off.
        </p>

        <div className="hero-cta-row">
          <button className="hero-cta-primary" onClick={onEnter}>Get started</button>
          <button className="hero-cta-secondary" onClick={onLogin}>Log in</button>
        </div>
      </section>

      <section className="hero-features">
        <h2 className="hero-section-title">What it actually does</h2>
        <div className="hero-feature-grid">
          {FEATURES.map((f) => (
            <div className="hero-feature-card" key={f.title}>
              <svg viewBox="0 0 24 24" width="26" height="26" className="hero-feature-icon">{f.icon}</svg>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hero-stack">
        <span className="hero-stack-label">Built with</span>
        <div className="hero-stack-pills">
          {STACK.map((s) => <span key={s} className="hero-stack-pill">{s}</span>)}
        </div>
      </section>

      <section className="hero-final-cta">
        <h2>Ready to talk to JARVIS?</h2>
        <button className="hero-cta-primary" onClick={onEnter}>Get started — it's free</button>
      </section>

      <footer className="hero-footer">
        <span>© {new Date().getFullYear()} J.A.R.V.I.S.</span>
      </footer>
      </div>
    </div>
  );
}