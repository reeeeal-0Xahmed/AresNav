import { CoordinateGeo } from '../api/types';

export interface DemoPreset {
  id: string;
  title: string;
  description: string;
  approxKm: number;
  start: CoordinateGeo;
  target: CoordinateGeo;
  expectedVerdict: 'GO' | 'CAUTION' | 'NO-GO';
  startName: string;
  targetName: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'delta-front',
    title: 'Delta Front Traverse',
    description: 'Octavia E. Butler Landing Site to Belva Crater Delta Rim',
    approxKm: 4.1,
    start: { lon: 77.45088, lat: 18.44462 },
    target: { lon: 77.41050, lat: 18.46020 },
    expectedVerdict: 'GO',
    startName: 'Octavia E. Butler Landing Site',
    targetName: 'Belva Crater Delta Rim',
  },
  {
    id: 'kodiak-butte',
    title: 'Kodiak Butte Approach',
    description: 'Kodiak Butte to Hawksbill Gap (Lower Delta Fan)',
    approxKm: 3.8,
    start: { lon: 77.44200, lat: 18.41800 },
    target: { lon: 77.42000, lat: 18.44500 },
    expectedVerdict: 'GO',
    startName: 'Kodiak Butte',
    targetName: 'Hawksbill Gap',
  },
  {
    id: 'south-seitah',
    title: 'South Séítah Recon',
    description: 'South Séítah entry to Artuby Ridge cumulate bedrock',
    approxKm: 3.5,
    start: { lon: 77.42511, lat: 18.41235 },
    target: { lon: 77.45200, lat: 18.39500 },
    expectedVerdict: 'GO',
    startName: 'Séítah Entry',
    targetName: 'Artuby Ridge',
  },
];
