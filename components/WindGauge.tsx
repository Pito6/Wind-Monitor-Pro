
import React from 'react';

interface WindGaugeProps {
  speed: number;
  maxSpeed?: number;
}

const WindGauge: React.FC<WindGaugeProps> = ({ speed, maxSpeed = 120 }) => {
  const percentage = Math.min((speed / maxSpeed) * 100, 100);
  const rotation = (percentage / 100) * 180 - 90;

  // Determine color based on speed
  const getColor = (s: number) => {
    if (s < 20) return '#2dd4bf'; // teal
    if (s < 40) return '#fbbf24'; // amber
    if (s < 70) return '#f87171'; // red
    return '#ef4444'; // strong red
  };

  const color = getColor(speed);

  return (
    <div className="relative flex flex-col items-center justify-center w-64 h-40 overflow-hidden">
      {/* Gauge Background */}
      <div className="absolute top-0 w-64 h-64 border-[16px] border-slate-800 rounded-full"></div>
      
      {/* Gauge Fill (Simulated with SVG) */}
      <svg className="absolute top-0 w-64 h-64 -rotate-90 transform overflow-visible">
        <circle
          cx="128"
          cy="128"
          r="112"
          fill="transparent"
          stroke={color}
          strokeWidth="16"
          strokeDasharray="351.8"
          strokeDashoffset={351.8 - (351.8 * (percentage / 200))}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Needle */}
      <div 
        className="absolute bottom-4 w-1 h-32 bg-white origin-bottom transition-transform duration-1000 ease-out rounded-full shadow-lg z-10"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-slate-900"></div>
      </div>

      {/* Center Value */}
      <div className="absolute bottom-4 flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{Math.round(speed)}</span>
        <span className="text-sm text-slate-400 font-medium">km/h</span>
      </div>
    </div>
  );
};

export default WindGauge;
