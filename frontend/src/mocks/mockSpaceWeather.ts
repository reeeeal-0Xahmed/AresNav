import { SpaceWeather } from '../api/types';

export const mockSpaceWeather: SpaceWeather = {
  radiation_status: 'NOMINAL',
  strongest_flare_class: 'C2.4',
  event_time: '2026-11-13T14:22:00Z',
  window_days: 7,
  basis: 'earth_view_flare_proxy',
  source: 'NASA DONKI FLR',
  checked_at: new Date().toISOString(),
};
