import { RouteResponseSuccess, RouteRequestPayload, Path, GeoJsonPathFeature, Verdict, BriefingReason } from '../api/types';
import { marsGreatCircleDistanceMeters } from '../lib/marsProjection';
import { mockPois } from './mockPois';

// Pre-calculated default coordinates for Jezero Crater delta traverse (~4.1 km)
const sampleGeoPathRank1 = [
  { lon: 77.45088, lat: 18.44462 },
  { lon: 77.44210, lat: 18.44710 },
  { lon: 77.43320, lat: 18.44980 },
  { lon: 77.42410, lat: 18.45190 },
  { lon: 77.41500, lat: 18.45320 },
  { lon: 77.40610, lat: 18.45410 },
  { lon: 77.39700, lat: 18.45480 },
  { lon: 77.38245, lat: 18.45512 },
];

const sampleGeoPathRank2 = [
  { lon: 77.45088, lat: 18.44462 },
  { lon: 77.44100, lat: 18.44120 },
  { lon: 77.43000, lat: 18.43890 },
  { lon: 77.41900, lat: 18.44200 },
  { lon: 77.40800, lat: 18.44650 },
  { lon: 77.39500, lat: 18.45100 },
  { lon: 77.38245, lat: 18.45512 },
];

const sampleGeoPathRank3 = [
  { lon: 77.45088, lat: 18.44462 },
  { lon: 77.44500, lat: 18.45200 },
  { lon: 77.43500, lat: 18.45700 },
  { lon: 77.42200, lat: 18.45900 },
  { lon: 77.40900, lat: 18.45800 },
  { lon: 77.39500, lat: 18.45600 },
  { lon: 77.38245, lat: 18.45512 },
];

const sampleGridPath1 = [
  { x: 180, y: 145 },
  { x: 178, y: 145 },
  { x: 175, y: 144 },
  { x: 172, y: 144 },
  { x: 169, y: 143 },
  { x: 166, y: 143 },
  { x: 163, y: 142 },
  { x: 160, y: 142 },
];

export const mockRouteSuccess: RouteResponseSuccess = {
  status: 'success',
  request_id: 'b1dbbab6-7480-4a0d-aa8d-3684c35d594d',
  map_id: 'jezero-regional-200m',
  map_version: '4fb5ccfa255e5517a86050b5184c715f07cdb142688d96b7f7416c6ed6a8eb88',
  start: { x: 180, y: 145 },
  target: { x: 160, y: 142 },
  requested_start: { lon: 77.45088, lat: 18.44462 },
  requested_target: { lon: 77.38245, lat: 18.45512 },
  start_geographic: { lon: 77.45088, lat: 18.44462 },
  target_geographic: { lon: 77.38245, lat: 18.45512 },
  verdict: 'GO',
  path: sampleGridPath1,
  paths: [
    {
      rank: 1,
      cost: 14,
      steps: 8,
      distance_meters: 4120,
      path: sampleGridPath1,
      geographic_path: sampleGeoPathRank1,
      geojson: {
        type: 'Feature',
        properties: {
          rank: 1,
          cost: 14,
          steps: 8,
          distance_meters: 4120,
          verdict: 'GO',
        },
        geometry: {
          type: 'LineString',
          coordinates: sampleGeoPathRank1.map((p) => [p.lon, p.lat] as [number, number]),
        },
      },
      briefing: {
        verdict: 'GO',
        reasons: [],
        terrain: {
          distance_m: 4120,
          steps: 8,
          max_slope_deg: 4.87,
          mean_slope_deg: 2.14,
          p95_slope_deg: 4.52,
          ascent_m: 68.4,
          descent_m: 112.1,
          elevation_min_m: -2570.0,
          elevation_max_m: -2501.6,
          cost_cells: { '1': 6, '2': 2, '4': 0, '8': 0 },
          high_cost_share: 0,
        },
        eva: {
          one_way_hours: 2.06,
          round_trip_hours: 4.12,
          budget_hours: 8.0,
          walk_speed_kmh: 2.0,
          basis: 'planning_assumption',
        },
        radiation: {
          status: 'NOMINAL',
          basis: 'earth_view_flare_proxy',
        },
        science_stops: [
          {
            id: 'm20_kodiak_butte',
            name: 'Kodiak Butte (Delta Remnant)',
            type: 'geologic_feature',
            distance_to_path_m: 420,
            nearest_path_index: 3,
          },
          {
            id: 'm20_delta_front_hawksbill',
            name: 'Hawksbill Gap (Delta Front)',
            type: 'science_target',
            distance_to_path_m: 0,
            nearest_path_index: 7,
          },
        ],
        limitations: [
          'Slope is measured between 200 m cell centres; local slopes are steeper.',
          'Radiation status is an Earth-view solar-flare proxy, not a Mars surface measurement.',
          'Speeds, EVA budget and thresholds are planning assumptions, not NASA operational limits.',
        ],
      },
    },
    {
      rank: 2,
      cost: 18,
      steps: 7,
      distance_meters: 4450,
      path: sampleGridPath1,
      geographic_path: sampleGeoPathRank2,
      geojson: {
        type: 'Feature',
        properties: {
          rank: 2,
          cost: 18,
          steps: 7,
          distance_meters: 4450,
          verdict: 'GO',
        },
        geometry: {
          type: 'LineString',
          coordinates: sampleGeoPathRank2.map((p) => [p.lon, p.lat] as [number, number]),
        },
      },
      briefing: {
        verdict: 'GO',
        reasons: [],
        terrain: {
          distance_m: 4450,
          steps: 7,
          max_slope_deg: 5.62,
          mean_slope_deg: 2.45,
          p95_slope_deg: 5.10,
          ascent_m: 74.0,
          descent_m: 120.5,
          elevation_min_m: -2572.0,
          elevation_max_m: -2498.0,
          cost_cells: { '1': 4, '2': 3, '4': 0, '8': 0 },
          high_cost_share: 0,
        },
        eva: {
          one_way_hours: 2.23,
          round_trip_hours: 4.45,
          budget_hours: 8.0,
          walk_speed_kmh: 2.0,
          basis: 'planning_assumption',
        },
        radiation: {
          status: 'NOMINAL',
          basis: 'earth_view_flare_proxy',
        },
        science_stops: [
          {
            id: 'm20_seitah_south',
            name: 'South Séítah Geologic Unit',
            type: 'sampling_site',
            distance_to_path_m: 680,
            nearest_path_index: 2,
          },
        ],
        limitations: [
          'Slope is measured between 200 m cell centres; local slopes are steeper.',
          'Radiation status is an Earth-view solar-flare proxy, not a Mars surface measurement.',
          'Speeds, EVA budget and thresholds are planning assumptions, not NASA operational limits.',
        ],
      },
    },
    {
      rank: 3,
      cost: 25,
      steps: 7,
      distance_meters: 4680,
      path: sampleGridPath1,
      geographic_path: sampleGeoPathRank3,
      geojson: {
        type: 'Feature',
        properties: {
          rank: 3,
          cost: 25,
          steps: 7,
          distance_meters: 4680,
          verdict: 'CAUTION',
        },
        geometry: {
          type: 'LineString',
          coordinates: sampleGeoPathRank3.map((p) => [p.lon, p.lat] as [number, number]),
        },
      },
      briefing: {
        verdict: 'CAUTION',
        reasons: [
          {
            code: 'STEEP_SECTION',
            severity: 'CAUTION',
            detail: 'Max slope 11.4° on at least one step exceeds 10.0° caution threshold.',
          },
        ],
        terrain: {
          distance_m: 4680,
          steps: 7,
          max_slope_deg: 11.4,
          mean_slope_deg: 4.12,
          p95_slope_deg: 10.8,
          ascent_m: 135.2,
          descent_m: 178.6,
          elevation_min_m: -2580.0,
          elevation_max_m: -2444.8,
          cost_cells: { '1': 3, '2': 2, '4': 2, '8': 0 },
          high_cost_share: 0.286,
        },
        eva: {
          one_way_hours: 2.34,
          round_trip_hours: 4.68,
          budget_hours: 8.0,
          walk_speed_kmh: 2.0,
          basis: 'planning_assumption',
        },
        radiation: {
          status: 'NOMINAL',
          basis: 'earth_view_flare_proxy',
        },
        science_stops: [],
        limitations: [
          'Slope is measured between 200 m cell centres; local slopes are steeper.',
          'Radiation status is an Earth-view solar-flare proxy, not a Mars surface measurement.',
          'Speeds, EVA budget and thresholds are planning assumptions, not NASA operational limits.',
        ],
      },
    },
  ],
  geojson: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          rank: 1,
          cost: 14,
          steps: 8,
          distance_meters: 4120,
          verdict: 'GO',
        },
        geometry: {
          type: 'LineString',
          coordinates: sampleGeoPathRank1.map((p) => [p.lon, p.lat] as [number, number]),
        },
      },
      {
        type: 'Feature',
        properties: {
          rank: 2,
          cost: 18,
          steps: 7,
          distance_meters: 4450,
          verdict: 'GO',
        },
        geometry: {
          type: 'LineString',
          coordinates: sampleGeoPathRank2.map((p) => [p.lon, p.lat] as [number, number]),
        },
      },
      {
        type: 'Feature',
        properties: {
          rank: 3,
          cost: 25,
          steps: 7,
          distance_meters: 4680,
          verdict: 'CAUTION',
        },
        geometry: {
          type: 'LineString',
          coordinates: sampleGeoPathRank3.map((p) => [p.lon, p.lat] as [number, number]),
        },
      },
    ],
  },
};

/**
 * Dynamically computes a realistic 3-candidate Mars route in mock mode for any Start/Target points.
 * Handles same-cell (GeoJSON Point, cost 0, distance 0).
 */
export function generateDynamicMockRoute(payload: RouteRequestPayload): RouteResponseSuccess {
  const start = payload.start as { lon: number; lat: number };
  const target = payload.target as { lon: number; lat: number };

  const directDistM = marsGreatCircleDistanceMeters(start.lon, start.lat, target.lon, target.lat);
  const isSameCell = directDistM < 50;

  if (isSameCell) {
    const pointFeature: GeoJsonPathFeature = {
      type: 'Feature',
      properties: {
        rank: 1,
        cost: 0,
        steps: 0,
        distance_meters: 0,
        verdict: 'GO',
      },
      geometry: {
        type: 'Point',
        coordinates: [start.lon, start.lat],
      },
    };

    const sameCellPath: Path = {
      rank: 1,
      cost: 0,
      steps: 0,
      distance_meters: 0,
      path: [{ x: 175, y: 145 }],
      geographic_path: [{ lon: start.lon, lat: start.lat }],
      geojson: pointFeature,
      briefing: {
        verdict: 'GO',
        reasons: [],
        terrain: {
          distance_m: 0,
          steps: 0,
          max_slope_deg: 0,
          mean_slope_deg: 0,
          p95_slope_deg: 0,
          ascent_m: 0,
          descent_m: 0,
          elevation_min_m: -2500,
          elevation_max_m: -2500,
          cost_cells: { '1': 1, '2': 0, '4': 0, '8': 0 },
          high_cost_share: 0,
        },
        eva: {
          one_way_hours: 0,
          round_trip_hours: 0,
          budget_hours: 8.0,
          walk_speed_kmh: 2.0,
          basis: 'planning_assumption',
        },
        radiation: {
          status: 'NOMINAL',
          basis: 'earth_view_flare_proxy',
        },
        science_stops: [],
        limitations: [
          'Slope is measured between 200 m cell centres; local slopes are steeper.',
          'Radiation status is an Earth-view solar-flare proxy, not a Mars surface measurement.',
          'Speeds, EVA budget and thresholds are planning assumptions, not NASA operational limits.',
        ],
      },
    };

    return {
      status: 'success',
      request_id: 'mock-req-' + Math.random().toString(36).substring(2, 10),
      map_id: payload.map_id,
      map_version: payload.map_version,
      start: { x: 175, y: 145 },
      target: { x: 175, y: 145 },
      requested_start: start,
      requested_target: target,
      start_geographic: start,
      target_geographic: target,
      verdict: 'GO',
      path: [{ x: 175, y: 145 }],
      paths: [sameCellPath],
      geojson: {
        type: 'FeatureCollection',
        features: [pointFeature],
      },
    };
  }

  // Generate 3 candidate paths
  const stepsBase = Math.max(3, Math.round(directDistM / 200));

  const buildPath = (rank: number, curvatureFactor: number, costMultiplier: number): Path => {
    const geoPoints: { lon: number; lat: number }[] = [];
    const gridPoints: { x: number; y: number }[] = [];
    const steps = stepsBase + (rank - 1) * 3;
    const distanceM = Math.round(directDistM * (1 + (rank - 1) * 0.08));

    // Perpendicular offset for curvature
    const dLon = target.lon - start.lon;
    const dLat = target.lat - start.lat;
    const perpLon = -dLat * curvatureFactor;
    const perpLat = dLon * curvatureFactor;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Parabolic curve arc
      const arc = 4 * t * (1 - t);
      const lon = start.lon + dLon * t + perpLon * arc;
      const lat = start.lat + dLat * t + perpLat * arc;
      geoPoints.push({
        lon: Number(lon.toFixed(5)),
        lat: Number(lat.toFixed(5)),
      });
      gridPoints.push({
        x: Math.round(150 + t * 40),
        y: Math.round(140 + t * 30),
      });
    }

    const oneWayHours = Number((distanceM / 1000 / 2.0).toFixed(2));
    const roundTripHours = Number((oneWayHours * 2).toFixed(2));
    const cost = Math.round(steps * costMultiplier);

    // Briefing verdict logic
    const reasons: BriefingReason[] = [];
    let verdict: Verdict = 'GO';

    if (roundTripHours > 8.0) {
      verdict = 'NO-GO';
      reasons.push({
        code: 'EVA_TIME_EXCEEDED',
        severity: 'NO-GO',
        detail: `Round trip ~${roundTripHours} h exceeds the 8.0 h EVA budget.`,
      });
    }

    const maxSlope = rank === 1 ? 4.8 : rank === 2 ? 8.4 : 12.5;
    const meanSlope = rank === 1 ? 1.8 : rank === 2 ? 2.9 : 4.1;
    const p95Slope = rank === 1 ? 4.1 : rank === 2 ? 7.6 : 10.8;

    if (p95Slope >= 10.0 && verdict !== 'NO-GO') {
      verdict = 'CAUTION';
      reasons.push({
        code: 'STEEP_SLOPE_CAUTION',
        severity: 'CAUTION',
        detail: `95th percentile slope (${p95Slope}°) approaches caution threshold.`,
      });
    }

    // Nearby science stops along this path
    const scienceStops = mockPois
      .filter((poi) => {
        const d = marsGreatCircleDistanceMeters(
          poi.lon,
          poi.lat,
          geoPoints[Math.floor(geoPoints.length / 2)].lon,
          geoPoints[Math.floor(geoPoints.length / 2)].lat
        );
        return d < 2500;
      })
      .slice(0, 2)
      .map((poi, idx) => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        distance_to_path_m: Math.round(80 + idx * 140),
        nearest_path_index: Math.floor(geoPoints.length / 2),
      }));

    const feature: GeoJsonPathFeature = {
      type: 'Feature',
      properties: {
        rank,
        cost,
        steps,
        distance_meters: distanceM,
        verdict,
      },
      geometry: {
        type: 'LineString',
        coordinates: geoPoints.map((p) => [p.lon, p.lat] as [number, number]),
      },
    };

    return {
      rank,
      cost,
      steps,
      distance_meters: distanceM,
      path: gridPoints,
      geographic_path: geoPoints,
      geojson: feature,
      briefing: {
        verdict,
        reasons,
        terrain: {
          distance_m: distanceM,
          steps,
          max_slope_deg: maxSlope,
          mean_slope_deg: meanSlope,
          p95_slope_deg: p95Slope,
          ascent_m: Math.round(distanceM * 0.015),
          descent_m: Math.round(distanceM * 0.022),
          elevation_min_m: -2580,
          elevation_max_m: -2420,
          cost_cells: {
            '1': Math.round(steps * 0.7),
            '2': Math.round(steps * 0.25),
            '4': Math.round(steps * 0.05),
            '8': 0,
          },
          high_cost_share: rank === 3 ? 0.08 : 0.02,
        },
        eva: {
          one_way_hours: oneWayHours,
          round_trip_hours: roundTripHours,
          budget_hours: 8.0,
          walk_speed_kmh: 2.0,
          basis: 'planning_assumption',
        },
        radiation: {
          status: 'NOMINAL',
          basis: 'earth_view_flare_proxy',
        },
        science_stops: scienceStops,
        limitations: [
          'Slope is measured between 200 m cell centres; local slopes are steeper.',
          'Radiation status is an Earth-view solar-flare proxy, not a Mars surface measurement.',
          'Speeds, EVA budget and thresholds are planning assumptions, not NASA operational limits.',
        ],
      },
    };
  };

  const path1 = buildPath(1, 0.08, 1.2);
  const path2 = buildPath(2, -0.14, 1.6);
  const path3 = buildPath(3, 0.24, 2.3);

  const paths = [path1, path2, path3];

  return {
    status: 'success',
    request_id: 'mock-req-' + Math.random().toString(36).substring(2, 10),
    map_id: payload.map_id,
    map_version: payload.map_version,
    start: path1.path[0],
    target: path1.path[path1.path.length - 1],
    requested_start: start,
    requested_target: target,
    start_geographic: start,
    target_geographic: target,
    verdict: path1.briefing.verdict,
    path: path1.path,
    paths,
    geojson: {
      type: 'FeatureCollection',
      features: paths.map((p) => p.geojson),
    },
  };
}
