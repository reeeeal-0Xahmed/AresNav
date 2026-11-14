import { Bounds } from '../api/types';

export const JEZERO_REQUESTED_BOUNDS: Bounds = {
  west: 76.80291421306124,
  south: 17.96348644765699,
  east: 78.05672888693876,
  north: 18.96873545234301,
};

export const JEZERO_RASTER_BOUNDS: Bounds = {
  west: 76.80196141291616,
  south: 17.96336692522817,
  east: 78.05768168708384,
  north: 18.968854974771837,
};

export function isWithinRequestedBounds(lon: number, lat: number, bounds: Bounds = JEZERO_REQUESTED_BOUNDS): boolean {
  return lon >= bounds.west && lon <= bounds.east && lat >= bounds.south && lat <= bounds.north;
}
