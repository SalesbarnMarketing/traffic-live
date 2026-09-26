import React, { useEffect, useState, useMemo } from 'react';
import { TripBuddyPlan } from '../types';

interface DigitalClusterSpeedometerProps {
  currentSpeed?: number;
  maxSpeed?: number;
  batteryLevel?: number;
  remainingDistanceKm?: number;
  totalTravelledKm?: number;
  avgSpeedKmh?: number;
  ambientTempC?: number;
  humidityPercent?: number;
  driveMode?: 'P' | 'D' | 'R' | 'N' | 'S';
  compact?: boolean;
  className?: string;
}

export const DigitalClusterSpeedometer: React.FC<DigitalClusterSpeedometerProps> = ({
  currentSpeed = 0,
  maxSpeed = 140,
  batteryLevel = 72,
  remainingDistanceKm = 116,
  totalTravelledKm = 346.5,
  avgSpeedKmh = 54,
  ambientTempC = 27,
  humidityPercent = 36,
  driveMode = 'D',
  compact = false,
  className = ''
}) => {
  // Live clock for center hub
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute angles for needles
  // Center Main Speedo (0 to 140 km/h mapped across ~240 degrees from -120deg to +120deg)
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, currentSpeed));
  const speedRatio = clampedSpeed / maxSpeed;
  const speedNeedleDeg = -120 + speedRatio * 240;

  // Left Sub-dial: Power / Energy (e.g. 0-40 kW or consumption)
  const powerVal = Math.round(15 + (clampedSpeed / 140) * 20);
  const powerNeedleDeg = -110 + (powerVal / 40) * 220;

  // Right Sub-dial: RPM (0 to 5 x1000)
  const rpmVal = clampedSpeed === 0 ? 0 : Math.min(5, 0.8 + (clampedSpeed / 140) * 3.4);
  const rpmNeedleDeg = -110 + (rpmVal / 5) * 220;

  // Battery status arc calculation (0 to 100%)
  const clampedBattery = Math.min(100, Math.max(0, batteryLevel));
  // 120-degree arc from 150deg to 30deg (or -60 to +60)
  const batteryArcLength = 160;
  const batteryDashOffset = batteryArcLength * (1 - clampedBattery / 100);

  // Speedometer tick marks generation (0, 20, 40, 60, 80, 100, 120, 140)
  const speedoTicks = [0, 20, 40, 60, 80, 100, 120, 140];
  const minorTicks = Array.from({ length: 29 }, (_, i) => i * 5); // every 5 km/h

  return (
    <div className={`flex flex-col items-center select-none bg-black text-white rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden border border-slate-800 ${className}`}>
      
      {/* Cluster Instruments Container (Left Gauge, Center Speedo, Right Gauge) */}
      <div className="relative flex items-center justify-center w-full max-w-[620px] sm:max-w-[700px] h-[240px] sm:h-[310px]">
        
        {/* ========================================================= */}
        {/* LEFT SUB-DIAL: POWER / REGEN CONSUMPTION GAUGE           */}
        {/* ========================================================= */}
        <div className={`absolute left-0 sm:left-2 bottom-6 sm:bottom-8 w-28 h-28 sm:w-40 sm:h-40 z-10 ${compact ? 'hidden sm:block' : ''}`}>
          <div className="relative w-full h-full rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-slate-300">
            
            {/* White Bezel Labels */}
            <span className="absolute top-2.5 sm:top-3.5 text-[8px] sm:text-[10px] font-black text-slate-800 tracking-wider">
              POWER
            </span>
            <span className="absolute bottom-2.5 sm:bottom-3.5 text-[8px] sm:text-[10px] font-black text-slate-800 tracking-wider">
              REGEN
            </span>
            <span className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-[9px] sm:text-xs font-black text-slate-900">
              0
            </span>

            {/* Sub-Dial Power Color Arc (Green to Red) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 p-2 sm:p-3" viewBox="0 0 100 100">
              {/* Regen Arc (Green) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeDasharray="60 200"
                strokeDashoffset="10"
                strokeLinecap="round"
              />
              {/* Power Arc (Yellow -> Red) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#ef4444"
                strokeWidth="5"
                strokeDasharray="80 200"
                strokeDashoffset="-70"
                strokeLinecap="round"
              />
            </svg>

            {/* Left Dial Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${powerNeedleDeg}deg)` }}
            >
              <div className="w-1.5 sm:w-2 h-10 sm:h-14 bg-gradient-to-t from-red-600 to-red-500 rounded-t-full -translate-y-4 sm:-translate-y-6 shadow-md" />
            </div>

            {/* Center Glossy Black Sphere */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-slate-900 via-black to-slate-950 shadow-inner flex flex-col items-center justify-center border-2 border-slate-700/60 z-20">
              {/* Gloss Reflection Highlight */}
              <div className="absolute top-1 w-8 sm:w-12 h-3 sm:h-5 rounded-full bg-white/20 blur-[1px]" />
              <span className="text-sm sm:text-xl font-black font-mono text-white leading-none">
                {powerVal}
              </span>
              <span className="text-[6px] sm:text-[8px] font-bold text-slate-300 tracking-tight mt-0.5">
                kWh/100km
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER MAIN SPEEDOMETER (The Core High-Precision Dial)   */}
        {/* ========================================================= */}
        <div className="relative w-[210px] h-[210px] sm:w-[290px] sm:h-[290px] rounded-full z-20 flex items-center justify-center">
          
          {/* Outer White Bezel Ring with calibrated Tick Marks */}
          <div className="absolute inset-0 rounded-full bg-white shadow-2xl border-4 border-slate-200 overflow-hidden">
            
            {/* Speed Numbers (0, 20, 40, 60, 80, 100, 120, 140) */}
            {speedoTicks.map((val) => {
              const angleDeg = -120 + (val / 140) * 240;
              const angleRad = (angleDeg - 90) * (Math.PI / 180);
              // Radius positioning for text
              const r = 40; // in percent
              const x = 50 + r * Math.cos(angleRad);
              const y = 50 + r * Math.sin(angleRad);
              return (
                <span
                  key={val}
                  className="absolute font-black text-slate-950 font-sans text-xs sm:text-sm -translate-x-1/2 -translate-y-1/2 tracking-tighter"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {val}
                </span>
              );
            })}

            {/* km/h Label on outer dial */}
            <span className="absolute bottom-5 sm:bottom-7 right-7 sm:right-10 text-[8px] sm:text-[10px] font-bold text-slate-700">
              km/h
            </span>
          </div>

          {/* Inner Segmented Radial Emerald Green Arc & Grid */}
          <div className="absolute inset-3 sm:inset-4 rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-2 border-slate-800">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <defs>
                {/* Emerald Glow Radial Gradient */}
                <radialGradient id="greenClusterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#16a34a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="1" />
                </radialGradient>
                <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Green Segmented Background Disk */}
              <circle cx="100" cy="100" r="88" fill="url(#greenClusterGlow)" />

              {/* Concentric Circular Grid Lines */}
              <circle cx="100" cy="100" r="70" fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.45" />
              <circle cx="100" cy="100" r="54" fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.45" />

              {/* Radial Segment Grid Lines radiating from center */}
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 22.5) * (Math.PI / 180);
                const x1 = 100 + 46 * Math.cos(angle);
                const y1 = 100 + 46 * Math.sin(angle);
                const x2 = 100 + 88 * Math.cos(angle);
                const y2 = 100 + 88 * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeOpacity="0.45"
                  />
                );
              })}

              {/* Outer Dial Minor Ticks */}
              {minorTicks.map((val) => {
                const angleDeg = -120 + (val / 140) * 240 - 90;
                const rad = angleDeg * (Math.PI / 180);
                const isMajor = val % 20 === 0;
                const innerR = isMajor ? 78 : 82;
                const x1 = 100 + innerR * Math.cos(rad);
                const y1 = 100 + innerR * Math.sin(rad);
                const x2 = 100 + 88 * Math.cos(rad);
                const y2 = 100 + 88 * Math.sin(rad);
                return (
                  <line
                    key={val}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#ffffff"
                    strokeWidth={isMajor ? '2' : '1'}
                    strokeOpacity={isMajor ? '0.9' : '0.6'}
                  />
                );
              })}
            </svg>

            {/* Red Speedometer Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out z-30 pointer-events-none"
              style={{ transform: `rotate(${speedNeedleDeg}deg)` }}
            >
              <div className="relative flex flex-col items-center">
                {/* Sleek Tapered Red Needle */}
                <div className="w-2 sm:w-2.5 h-16 sm:h-24 bg-gradient-to-t from-red-600 via-red-500 to-rose-400 rounded-t-full -translate-y-8 sm:-translate-y-12 shadow-2xl" />
              </div>
            </div>

            {/* Center Glossy Black Sphere / Globe Hub */}
            <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-slate-900 via-black to-slate-950 shadow-2xl flex flex-col items-center justify-center border-2 border-slate-700/80 z-40 overflow-hidden">
              {/* Spherical Reflection Highlight on top */}
              <div className="absolute top-1 sm:top-2 w-14 sm:w-20 h-5 sm:h-8 rounded-full bg-white/25 blur-[2px] pointer-events-none" />
              
              {/* Live Time */}
              <span className="text-[9px] sm:text-xs font-mono font-medium text-slate-300 leading-none">
                {currentTime}
              </span>

              {/* Huge Bold Digital Speed */}
              <span className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight leading-none my-0.5 sm:my-1 drop-shadow-md">
                {clampedSpeed}
              </span>

              {/* Speed Unit */}
              <span className="text-[9px] sm:text-xs font-bold text-slate-300 leading-none">
                km/h
              </span>

              {/* Range & Distance Remaining */}
              <div className="flex flex-col items-center mt-1 sm:mt-2">
                <span className="text-xs sm:text-base font-black font-mono text-white leading-none">
                  {remainingDistanceKm}
                </span>
                <span className="text-[7px] sm:text-[9px] font-semibold text-slate-400 leading-tight">
                  Range in km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SUB-DIAL: DRIVE MODE (D) & RPM CLUSTER             */}
        {/* ========================================================= */}
        <div className={`absolute right-0 sm:right-2 bottom-6 sm:bottom-8 w-28 h-28 sm:w-40 sm:h-40 z-10 ${compact ? 'hidden sm:block' : ''}`}>
          <div className="relative w-full h-full rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-slate-300">
            
            {/* White Bezel Labels: RPM scale */}
            <span className="absolute top-1.5 sm:top-2 text-[7px] sm:text-[9px] font-bold text-slate-700 leading-none text-center">
              r/min<br />x1000
            </span>
            <span className="absolute top-1 sm:top-1.5 right-10 sm:right-14 text-[8px] sm:text-xs font-black text-slate-900">
              0
            </span>
            <span className="absolute right-2 sm:right-3.5 top-7 sm:top-10 text-[8px] sm:text-xs font-black text-slate-900">
              1
            </span>
            <span className="absolute right-1 sm:right-2.5 top-1/2 -translate-y-1/2 text-[8px] sm:text-xs font-black text-slate-900">
              2
            </span>
            <span className="absolute right-3 sm:right-4 bottom-6 sm:bottom-8 text-[8px] sm:text-xs font-black text-slate-900">
              3
            </span>
            <span className="absolute bottom-1.5 sm:bottom-2.5 right-9 sm:right-12 text-[8px] sm:text-xs font-black text-slate-900">
              4
            </span>
            <span className="absolute bottom-5 sm:bottom-7 left-3 sm:left-4 text-[8px] sm:text-xs font-black text-slate-900">
              5
            </span>

            {/* Redline Zone Arc (Between 4 and 5 RPM) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 p-2 sm:p-3" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#dc2626"
                strokeWidth="5"
                strokeDasharray="45 200"
                strokeDashoffset="-120"
                strokeLinecap="round"
              />
            </svg>

            {/* Right Dial Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${rpmNeedleDeg}deg)` }}
            >
              <div className="w-1.5 sm:w-2 h-10 sm:h-14 bg-gradient-to-t from-red-600 to-red-500 rounded-t-full -translate-y-4 sm:-translate-y-6 shadow-md" />
            </div>

            {/* Center Glossy Black Sphere with Gear Selector 'D' */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-slate-900 via-black to-slate-950 shadow-inner flex flex-col items-center justify-center border-2 border-slate-700/60 z-20">
              {/* Gloss Highlight */}
              <div className="absolute top-1 w-8 sm:w-12 h-3 sm:h-5 rounded-full bg-white/20 blur-[1px]" />
              <span className="text-xl sm:text-3xl font-black italic font-serif text-white leading-none drop-shadow">
                {clampedSpeed > 0 ? 'D' : driveMode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM BATTERY ARC STATUS SUB-GAUGE                      */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center -mt-3 sm:-mt-5 mb-2 z-30">
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Battery status
        </span>
        <span className="text-xs sm:text-base font-black font-mono text-white leading-tight">
          {clampedBattery}%
        </span>

        {/* Rainbow Arc Meter (Red -> Yellow -> Green) */}
        <div className="relative w-28 sm:w-36 h-4 sm:h-5 mt-0.5">
          <svg className="w-full h-full" viewBox="0 0 120 20">
            <defs>
              <linearGradient id="batteryRainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="30%" stopColor="#f97316" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            {/* Background Arc */}
            <path
              d="M 10 18 Q 60 2 110 18"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Colored Battery Arc */}
            <path
              d="M 10 18 Q 60 2 110 18"
              fill="none"
              stroke="url(#batteryRainbow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="110"
              strokeDashoffset={110 * (1 - clampedBattery / 100)}
              className="transition-all duration-700"
            />
          </svg>
        </div>

        {/* Battery Ticks 0, 50, 100 */}
        <div className="flex justify-between w-28 sm:w-36 text-[7px] sm:text-[9px] font-mono text-slate-400 -mt-0.5 px-1">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM TELEMETRY BAR                                     */}
      {/* ========================================================= */}
      <div className="w-full grid grid-cols-5 gap-1 pt-2 sm:pt-3 border-t border-slate-900 text-center text-slate-300">
        
        {/* 1. Avg Consumption */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-base font-black font-mono text-white leading-none">
            {powerVal}
          </span>
          <span className="text-[7px] sm:text-[9px] text-slate-400 leading-tight mt-0.5">
            Avg. Consumption<br />kWh/100km
          </span>
        </div>

        {/* 2. Avg Speed */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-base font-black font-mono text-white leading-none">
            {avgSpeedKmh}
          </span>
          <span className="text-[7px] sm:text-[9px] text-slate-400 leading-tight mt-0.5">
            Avg. Speed<br />km/h
          </span>
        </div>

        {/* 3. Total Trip / Odometer Distance */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-base font-black font-mono text-white leading-none">
            {totalTravelledKm.toFixed(1)}
          </span>
          <span className="text-[7px] sm:text-[9px] text-slate-400 leading-tight mt-0.5">
            km<br />Odometer
          </span>
        </div>

        {/* 4. Air Temperature */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-base font-black font-mono text-white leading-none">
            {ambientTempC}
          </span>
          <span className="text-[7px] sm:text-[9px] text-slate-400 leading-tight mt-0.5">
            Air Temp<br />°C
          </span>
        </div>

        {/* 5. Air Humidity */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-base font-black font-mono text-white leading-none">
            {humidityPercent}
          </span>
          <span className="text-[7px] sm:text-[9px] text-slate-400 leading-tight mt-0.5">
            Air Humidity<br />%
          </span>
        </div>

      </div>
    </div>
  );
};
