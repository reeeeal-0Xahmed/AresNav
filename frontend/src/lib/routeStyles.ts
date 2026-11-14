import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { Verdict } from '../api/types';

// Verdict colors matching mission control design
export const VERDICT_LINE_COLORS: Record<Verdict, string> = {
  'GO': '#10b981',       // Emerald Green
  'CAUTION': '#f59e0b',  // Amber
  'NO-GO': '#ef4444',    // Red / Rose
};

/**
 * OpenLayers style for the Start waypoint pin.
 */
export function createStartPointStyle(isBlocked = false): Style {
  return new Style({
    image: new CircleStyle({
      radius: isBlocked ? 14 : 11,
      fill: new Fill({ color: isBlocked ? '#ef4444' : '#10b981' }),
      stroke: new Stroke({
        color: '#ffffff',
        width: isBlocked ? 3 : 2,
      }),
    }),
    text: new Text({
      text: isBlocked ? 'START (BLOCKED)' : 'START',
      offsetY: -20,
      font: 'bold 11px monospace',
      fill: new Fill({ color: '#ffffff' }),
      backgroundFill: new Fill({ color: isBlocked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)' }),
      backgroundStroke: new Stroke({ color: '#ffffff', width: 1 }),
      padding: [2, 6, 2, 6],
    }),
    zIndex: 100,
  });
}

/**
 * OpenLayers style for the Target waypoint pin.
 */
export function createTargetPointStyle(isBlocked = false): Style {
  return new Style({
    image: new CircleStyle({
      radius: isBlocked ? 14 : 11,
      fill: new Fill({ color: isBlocked ? '#ef4444' : '#ea580c' }),
      stroke: new Stroke({
        color: '#ffffff',
        width: isBlocked ? 3 : 2,
      }),
    }),
    text: new Text({
      text: isBlocked ? 'TARGET (BLOCKED)' : 'TARGET',
      offsetY: -20,
      font: 'bold 11px monospace',
      fill: new Fill({ color: '#ffffff' }),
      backgroundFill: new Fill({ color: isBlocked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(234, 88, 12, 0.9)' }),
      backgroundStroke: new Stroke({ color: '#ffffff', width: 1 }),
      padding: [2, 6, 2, 6],
    }),
    zIndex: 100,
  });
}

/**
 * OpenLayers style for route candidate line strings and same-cell points.
 */
export function createRouteFeatureStyle(
  feature: FeatureLike,
  selectedRank: number
): Style[] {
  const rank = feature.get('rank') as number;
  const verdict = (feature.get('verdict') as Verdict) || 'GO';
  const isSameCell = feature.get('isSameCell') as boolean;
  const isSelected = rank === selectedRank;

  const baseColor = VERDICT_LINE_COLORS[verdict] || '#ea580c';

  if (isSameCell) {
    // Single cell stop (cost 0, steps 0)
    return [
      new Style({
        image: new CircleStyle({
          radius: 12,
          fill: new Fill({ color: baseColor }),
          stroke: new Stroke({ color: '#ffffff', width: 3 }),
        }),
        text: new Text({
          text: 'SAME-CELL STOP (Cost 0)',
          offsetY: -22,
          font: 'bold 11px monospace',
          fill: new Fill({ color: '#ffffff' }),
          backgroundFill: new Fill({ color: 'rgba(15, 23, 42, 0.9)' }),
          backgroundStroke: new Stroke({ color: baseColor, width: 1 }),
          padding: [3, 6, 3, 6],
        }),
        zIndex: 50,
      }),
    ];
  }

  if (isSelected) {
    // Selected path: casing stroke + thick verdict line
    return [
      new Style({
        stroke: new Stroke({
          color: 'rgba(7, 8, 11, 0.85)',
          width: 8,
          lineCap: 'round',
          lineJoin: 'round',
        }),
        zIndex: 30,
      }),
      new Style({
        stroke: new Stroke({
          color: baseColor,
          width: 4.5,
          lineCap: 'round',
          lineJoin: 'round',
        }),
        zIndex: 31,
      }),
    ];
  }

  // Candidate non-selected paths (dashed, lower zIndex)
  return [
    new Style({
      stroke: new Stroke({
        color: 'rgba(15, 23, 42, 0.7)',
        width: 5,
        lineDash: [6, 6],
      }),
      zIndex: 20,
    }),
    new Style({
      stroke: new Stroke({
        color: 'rgba(148, 163, 184, 0.75)', // Slate-400 dashed
        width: 2.5,
        lineDash: [6, 6],
      }),
      zIndex: 21,
    }),
  ];
}

/**
 * OpenLayers style for science stops along the route.
 */
export function createScienceStopStyle(name: string, distanceM: number): Style {
  return new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: '#06b6d4' }), // Cyan
      stroke: new Stroke({ color: '#ffffff', width: 1.5 }),
    }),
    text: new Text({
      text: `${name} (+${distanceM}m)`,
      offsetY: -14,
      font: '10px monospace',
      fill: new Fill({ color: '#e2e8f0' }),
      backgroundFill: new Fill({ color: 'rgba(15, 23, 42, 0.85)' }),
      backgroundStroke: new Stroke({ color: '#06b6d4', width: 1 }),
      padding: [2, 4, 2, 4],
    }),
    zIndex: 40,
  });
}
