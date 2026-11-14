import React from 'react';
import { MARS_RADIUS_METERS } from '../../lib/marsProjection';

interface MarsScaleControlProps {
  resolution: number; // degrees per pixel
  latitude: number;   // degrees
}

export const MarsScaleControl: React.FC<MarsScaleControlProps> = ({ resolution, latitude }) => {
  if (!resolution || isNaN(resolution)) return null;

  // Degrees to meters along parallel at current latitude
  const latRad = (latitude * Math.PI) / 180.0;
  const metersPerDegree = (Math.PI / 180.0) * MARS_RADIUS_METERS * Math.cos(latRad);
  const metersPerPixel = resolution * metersPerDegree;

  // Target standard scale distances in meters
  const candidates = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  let targetMeters = 2000;

  for (const c of candidates) {
    const px = c / metersPerPixel;
    if (px >= 60 && px <= 140) {
      targetMeters = c;
      break;
    }
  }

  const barWidthPx = Math.max(30, Math.round(targetMeters / metersPerPixel));
  const label = targetMeters >= 1000 ? `${targetMeters / 1000} km` : `${targetMeters} m`;

  return (
    <div className="bg-mars-darkest/85 backdrop-blur-sm border border-mars-border/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 shadow-md flex flex-col items-center select-none">
      <div className="flex items-center justify-between w-full text-[9px] text-mars-muted pb-0.5">
        <span>0</span>
        <span className="text-white font-semibold">{label}</span>
      </div>
      <div
        style={{ width: `${barWidthPx}px` }}
        className="h-1.5 border-x border-b border-mars-orange bg-gradient-to-r from-mars-orange/30 to-mars-orange/70"
      />
      <span className="text-[8px] text-mars-muted/80 mt-0.5">Mars Sphere (3,396 km)</span>
    </div>
  );
};
