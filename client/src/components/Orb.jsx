import { useMemo } from 'react';
import './Orb.css';

// state: idle | listening | thinking | speaking | error
export default function Orb({ state = 'idle', size = 64 }) {
  const ticks = useMemo(() => {
    const cx = 100, cy = 100, r = 84, count = 32;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + (r - 6) * Math.cos(angle);
      const y2 = cy + (r - 6) * Math.sin(angle);
      return { x1, y1, x2, y2, major: i % 4 === 0 };
    });
  }, []);

  return (
    <div className={`orb orb-${state}`} style={{ width: size, height: size }}>
      <svg className="orb-rings" viewBox="0 0 200 200">
        <circle className="ring ring-1" cx="100" cy="100" r="78" />
        <circle className="ring ring-2" cx="100" cy="100" r="62" />
        <circle className="ring ring-3" cx="100" cy="100" r="48" />
        <g>
          {ticks.map((tk, i) => (
            <line
              key={i}
              x1={tk.x1.toFixed(1)} y1={tk.y1.toFixed(1)}
              x2={tk.x2.toFixed(1)} y2={tk.y2.toFixed(1)}
              opacity={tk.major ? 0.7 : 0.25}
            />
          ))}
        </g>
      </svg>
      <div className="orb-glow" />
    </div>
  );
}
