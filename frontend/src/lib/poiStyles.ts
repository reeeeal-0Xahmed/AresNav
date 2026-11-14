import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { Poi } from '../api/types';

export function getPoiTypeColor(type: string): string {
  switch (type) {
    case 'landing_site':
      return '#eab308'; // Gold
    case 'science_target':
      return '#06b6d4'; // Cyan
    case 'geologic_feature':
      return '#f97316'; // Orange
    case 'sampling_site':
      return '#a855f7'; // Purple
    case 'impact_crater':
      return '#ef4444'; // Red
    case 'valley_inflow':
      return '#3b82f6'; // Blue
    case 'rover_waypoint':
    default:
      return '#10b981'; // Emerald
  }
}

/**
 * Creates styles for individual POIs or clusters.
 */
export function createPoiStyle(feature: FeatureLike, selectedPoiId?: string | number | null): Style {
  // Check if clustered feature
  const clusteredFeatures = feature.get('features');
  if (Array.isArray(clusteredFeatures) && clusteredFeatures.length > 1) {
    const size = clusteredFeatures.length;
    return new Style({
      image: new CircleStyle({
        radius: Math.min(12 + size * 1.5, 24),
        fill: new Fill({ color: 'rgba(234, 88, 12, 0.85)' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
      text: new Text({
        text: size.toString(),
        fill: new Fill({ color: '#ffffff' }),
        font: 'bold 11px monospace',
      }),
    });
  }

  // Single POI feature
  const originalFeature = Array.isArray(clusteredFeatures) && clusteredFeatures.length === 1
    ? clusteredFeatures[0]
    : feature;

  const poi: Poi | undefined = originalFeature.get('poiData');
  const type = poi?.type || 'rover_waypoint';
  const color = getPoiTypeColor(type);
  const isSelected = selectedPoiId != null && poi?.id === selectedPoiId;

  return new Style({
    image: new CircleStyle({
      radius: isSelected ? 9 : 6,
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: isSelected ? '#ffffff' : '#07080b',
        width: isSelected ? 3 : 1.5,
      }),
    }),
    text: isSelected && poi?.name
      ? new Text({
          text: poi.name,
          offsetY: -16,
          fill: new Fill({ color: '#ffffff' }),
          backgroundFill: new Fill({ color: 'rgba(7, 8, 11, 0.9)' }),
          backgroundStroke: new Stroke({ color: '#ea580c', width: 1 }),
          padding: [3, 6, 3, 6],
          font: '11px sans-serif',
        })
      : undefined,
  });
}
