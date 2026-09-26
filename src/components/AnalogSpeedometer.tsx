import React, { useMemo } from 'react';

interface AnalogSpeedometerProps {
  currentSpeed?: number;      // Current speed in km/h
  maxSpeed?: number;          // Maximum dial speed (default: 220 km/h)
  tripDistanceKm?: number;    // Odometer / trip distance
  speedLimit?: number;        // Speed limit marker (default: 120 km/h)
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';  // Size variant
  showOdometer?: boolean;
}

export const AnalogSpeedometer: React.FC<AnalogSpeedometerProps> = ({
  currentSpeed = 0,
  maxSpeed = 220,
  tripDistanceKm = 0,
  speedLimit = 120,
  className = '',
  size = 'sm',
  showOdometer = true
}) => {
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, currentSpeed));

  // Analog Needle Sweep: from -135deg (at 0 km/h) to +135deg (at maxSpeed km/h) -> 270 degree total sweep
  const sweepDegrees = 270;
  const startAngleDeg = -135;
  const needleAngleDeg = startAngleDeg + (clampedSpeed / maxSpeed) * sweepDegrees;

  // Major ticks every 20 km/h (0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220)
  const majorTickValues = useMemo(() => {
    const ticks: number[] = [];
    for (let s = 0; s <= maxSpeed; s += 20) {
      ticks.push(s);
    }
    return ticks;
  }, [maxSpeed]);

  // Minor ticks every 5 km/h
  const minorTickValues = useMemo(() => {
    const ticks: number[] = [];
    for (let s = 0; s <= maxSpeed; s += 5) {
      if (s % 20 !== 0) ticks.push(s);
    }
    return ticks;
  }, [maxSpeed]);

  // Dimensions based on size prop
  const dimensions = {
    xs: { w: 104, h: 104, padding: 1 },
    sm: { w: 128, h: 128, padding: 2 },
    md: { w: 220, h: 220, padding: 3 },
    lg: { w: 290, h: 290, padding: 4 }
  }[size];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Outer Analog Gauge Housing with Multi-Tiered Chrome & Beveled Metal Bezel */}
      <div 
        className="relative rounded-full flex items-center justify-center p-3 shadow-2xl transition-transform"
        style={{
          width: dimensions.w,
          height: dimensions.h,
          background: 'radial-gradient(circle, #2d3748 0%, #1a202c 60%, #0f172a 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.8), 0 0 0 4px #475569, 0 0 0 7px #0f172a, 0 0 0 9px #334155'
        }}
      >
        {/* Glass Reflection Arc */}
        <div className="absolute inset-2 rounded-full overflow-hidden pointer-events-none z-30">
          <div className="w-full h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-full" />
        </div>

        {/* Gauge Dial Face */}
        <svg 
          className="w-full h-full" 
          viewBox="0 0 300 300"
        >
          <defs>
            {/* Radial Dial Face Gradient */}
            <radialGradient id="dialFaceGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="75%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Needle Shadow Filter */}
            <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
            </filter>

            {/* Red Speed Warning Zone Gradient */}
            <linearGradient id="speedLimitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Dial Background Face */}
          <circle cx="150" cy="150" r="140" fill="url(#dialFaceGrad)" stroke="#334155" strokeWidth="2" />
          <circle cx="150" cy="150" r="136" fill="none" stroke="#1e293b" strokeWidth="1.5" />

          {/* Inner Accent Ring */}
          <circle cx="150" cy="150" r="105" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />

          {/* 120+ km/h Warning Arc (Red line zone) */}
          {(() => {
            const startRatio = speedLimit / maxSpeed;
            const startDeg = startAngleDeg + startRatio * sweepDegrees - 90;
            const endDeg = startAngleDeg + sweepDegrees - 90;
            const startRad = (startDeg * Math.PI) / 180;
            const endRad = (endDeg * Math.PI) / 180;
            const r = 126;
            const x1 = 150 + r * Math.cos(startRad);
            const y1 = 150 + r * Math.sin(startRad);
            const x2 = 150 + r * Math.cos(endRad);
            const y2 = 150 + r * Math.sin(endRad);
            return (
              <path
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="url(#speedLimitGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.9"
              />
            );
          })()}

          {/* Minor Ticks (Every 5 km/h) */}
          {minorTickValues.map((val) => {
            const angle = startAngleDeg + (val / maxSpeed) * sweepDegrees - 90;
            const rad = (angle * Math.PI) / 180;
            const isWarn = val >= speedLimit;
            const x1 = 150 + 124 * Math.cos(rad);
            const y1 = 150 + 124 * Math.sin(rad);
            const x2 = 150 + 132 * Math.cos(rad);
            const y2 = 150 + 132 * Math.sin(rad);
            return (
              <line
                key={`minor-${val}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isWarn ? '#ef4444' : '#94a3b8'}
                strokeWidth="1.5"
                opacity={isWarn ? '0.85' : '0.6'}
              />
            );
          })}

          {/* Major Ticks & Calibrated Speed Numbers (Every 20 km/h) */}
          {majorTickValues.map((val) => {
            const angle = startAngleDeg + (val / maxSpeed) * sweepDegrees - 90;
            const rad = (angle * Math.PI) / 180;
            const isWarn = val >= speedLimit;

            // Tick line
            const x1 = 150 + 118 * Math.cos(rad);
            const y1 = 150 + 118 * Math.sin(rad);
            const x2 = 150 + 134 * Math.cos(rad);
            const y2 = 150 + 134 * Math.sin(rad);

            // Number text position (inset radius 96)
            const textR = 95;
            const tx = 150 + textR * Math.cos(rad);
            const ty = 150 + textR * Math.sin(rad) + 5;

            return (
              <g key={`major-${val}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isWarn ? '#f87171' : '#ffffff'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isWarn ? '#fca5a5' : '#f8fafc'}
                  fontSize={val >= 100 ? '15' : '16'}
                  fontWeight="900"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Speedometer Unit Branding (km/h) */}
          <text
            x="150"
            y="190"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="14"
            fontWeight="900"
            letterSpacing="2"
            fontFamily="monospace"
          >
            km/h
          </text>

          {/* Odometer Window Frame */}
          <rect
            x="110"
            y="206"
            width="80"
            height="22"
            rx="4"
            fill="#090d16"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Mechanical Odometer Digits */}
          <text
            x="150"
            y="222"
            textAnchor="middle"
            fill="#f1f5f9"
            fontSize="12"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {tripDistanceKm.toFixed(1).padStart(6, '0')} km
          </text>

          {/* Analog Needle (Rotates around center [150, 150]) */}
          <g 
            transform={`rotate(${needleAngleDeg}, 150, 150)`}
            filter="url(#needleShadow)"
            style={{ transition: 'transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1)' }}
          >
            {/* Tapered Needle Blade */}
            <polygon
              points="147.5,150 149,30 151,30 152.5,150"
              fill="url(#needleColorGrad)"
            />
            {/* Needle Counterweight Tail */}
            <polygon
              points="146.5,150 148,182 152,182 153.5,150"
              fill="#991b1b"
            />
            {/* Needle Center Line Stripe */}
            <line
              x1="150"
              y1="34"
              x2="150"
              y2="175"
              stroke="#fecaca"
              strokeWidth="0.8"
            />
          </g>

          {/* Needle Gradient Definition */}
          <linearGradient id="needleColorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          {/* Chrome Center Pivot Cap */}
          <circle
            cx="150"
            cy="150"
            r="16"
            fill="#1e293b"
            stroke="#64748b"
            strokeWidth="3"
            filter="url(#needleShadow)"
          />
          <circle
            cx="150"
            cy="150"
            r="10"
            fill="radial-gradient(circle, #e2e8f0 0%, #64748b 80%, #334155 100%)"
          />
          <circle cx="150" cy="150" r="5" fill="#0f172a" />
        </svg>
      </div>
    </div>
  );
};
