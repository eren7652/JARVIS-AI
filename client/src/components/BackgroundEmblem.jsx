import './BackgroundEmblem.css';

// decorative bg orb, no interaction
export default function BackgroundEmblem() {
  return (
    <div className="bg-emblem" aria-hidden="true">
      <svg viewBox="0 0 800 800" className="bg-emblem-svg">
        <defs>
          <radialGradient id="emblem-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.95" />
            <stop offset="35%" stopColor="var(--cyan)" stopOpacity="0.35" />
            <stop offset="70%" stopColor="var(--amber)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="emblem-halo" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="var(--cyan)" stopOpacity="0" />
            <stop offset="85%" stopColor="var(--cyan)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle className="e-halo" cx="400" cy="400" r="380" fill="url(#emblem-halo)" />
        <circle className="e-glow" cx="400" cy="400" r="190" fill="url(#emblem-core)" />

        <circle className="e-ring e-ring-1" cx="400" cy="400" r="330" />
        <circle className="e-ring e-ring-2" cx="400" cy="400" r="270" />
        <circle className="e-ring e-ring-3" cx="400" cy="400" r="210" />
        <circle className="e-ring e-ring-4" cx="400" cy="400" r="150" />

        <g className="e-ticks">
          {Array.from({ length: 60 }, (_, i) => {
            const angle = (i / 60) * 2 * Math.PI;
            const r1 = 355, r2 = i % 5 === 0 ? 330 : 344;
            const x1 = 400 + r1 * Math.cos(angle);
            const y1 = 400 + r1 * Math.sin(angle);
            const x2 = 400 + r2 * Math.cos(angle);
            const y2 = 400 + r2 * Math.sin(angle);
            return <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} />;
          })}
        </g>

        <polygon className="e-tri e-tri-outer" points="400,235 520,465 280,465" />
        <polygon className="e-tri e-tri-inner" points="400,290 470,430 330,430" />
      </svg>
    </div>
  );
}
