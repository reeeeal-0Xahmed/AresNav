/**
 * Mars Mission API Types
 * Derived from Laravel Backend (AresNav + Jezero Regional 200m)
 */

export type Verdict = 'GO' | 'CAUTION' | 'NO-GO';

export type RadiationStatus =
  | 'NOMINAL'
  | 'ELEVATED'
  | 'HIGH_RADIATION_WARNING'
  | 'STORM'
  | 'UNKNOWN';

export interface SpaceWeather {
  radiation_status: RadiationStatus;
  strongest_flare_class: string | null;
  event_time: string | null;
  window_days: number;
  basis: string; // 'earth_view_flare_proxy'
  source: string;
  checked_at: string;
}

export interface MarsLayer {
  title: string;
  kind: 'base' | 'overlay' | 'elevation';
  url: string;
}

export type MarsLayersMap = Record<string, MarsLayer>;

export interface PoiMetadata {
  mission?: string;
  sol?: number | string;
  elevation_m?: number | null;
  source?: string;
  [key: string]: unknown;
}

export interface Poi {
  id: string | number;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  type: string;
  metadata?: PoiMetadata;
}

export interface MarsImage {
  id: string | null;
  title: string;
  img_src: string;
  date: string;
  source: string;
}

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface ProjectionConfig {
  type: string;
  radiusMeters: number;
  standardParallelDegrees: number;
  centralLongitudeDegrees: number;
  latitudeOriginDegrees: number;
}

export interface ThresholdsConfig {
  blockedSlopeGreaterOrEqualDegrees: number;
  blockedLocalDeviationGreaterOrEqualMeters: number;
  localMeanWindowPlanningCells: number;
  localMeanWindowNominalMeters: number;
  safetyBufferMeters: number;
  slopeCostBreaksDegrees: [number, number, number];
  localDeviationCostBreaksMeters: [number, number, number];
}

export interface TerrainMeta {
  map_id: string;
  title: string;
  width: number;
  height: number;
  cell_size_meters: number;
  version: string;
  grid?: number[][];
  projection: ProjectionConfig;
  affine: [number, number, number, number, number, number];
  requested_bounds: Bounds;
  raster_bounds: Bounds;
  regional_scale: string;
  warnings: string[];
  source?: Record<string, unknown>;
  thresholds: ThresholdsConfig;
  legend: {
    costs: number[];
    labels: Record<string, string>;
  };
}

export interface CoordinateGrid {
  x: number;
  y: number;
}

export interface CoordinateGeo {
  lon: number;
  lat: number;
}

export interface BriefingReason {
  code: string;
  severity: 'CAUTION' | 'NO-GO';
  detail: string;
}

export interface BriefingTerrain {
  distance_m: number;
  steps: number;
  max_slope_deg: number;
  mean_slope_deg: number;
  p95_slope_deg: number;
  ascent_m: number;
  descent_m: number;
  elevation_min_m: number | null;
  elevation_max_m: number | null;
  cost_cells: Record<string, number>;
  high_cost_share: number;
}

export interface BriefingEva {
  one_way_hours: number;
  round_trip_hours: number;
  budget_hours: number;
  walk_speed_kmh: number;
  basis: string; // 'planning_assumption'
}

export interface BriefingRadiation {
  status: RadiationStatus;
  basis: string | null;
}

export interface BriefingScienceStop {
  id: string | number;
  name: string;
  type: string;
  distance_to_path_m: number;
  nearest_path_index: number;
}

export interface Briefing {
  verdict: Verdict;
  reasons: BriefingReason[];
  terrain: BriefingTerrain;
  eva: BriefingEva;
  radiation: BriefingRadiation;
  science_stops: BriefingScienceStop[];
  limitations: string[];
}

export interface GeoJsonPathFeature {
  type: 'Feature';
  properties: {
    rank: number;
    cost: number;
    steps: number;
    distance_meters: number;
    verdict: Verdict;
  };
  geometry: {
    type: 'LineString' | 'Point';
    coordinates: [number, number][] | [number, number];
  };
}

export interface Path {
  rank: number;
  cost: number;
  steps: number;
  distance_meters: number;
  path: CoordinateGrid[];
  geographic_path: CoordinateGeo[];
  geojson: GeoJsonPathFeature;
  briefing: Briefing;
}

export interface RouteResponseSuccess {
  status: 'success';
  request_id: string;
  map_id: string;
  map_version: string;
  start: CoordinateGrid;
  target: CoordinateGrid;
  requested_start: CoordinateGeo | CoordinateGrid;
  requested_target: CoordinateGeo | CoordinateGrid;
  start_geographic?: CoordinateGeo;
  target_geographic?: CoordinateGeo;
  path: CoordinateGrid[];
  paths: Path[];
  geojson: {
    type: 'FeatureCollection';
    features: GeoJsonPathFeature[];
  };
  verdict: Verdict;
  terrain_metadata?: Record<string, unknown>;
  message?: string;
  briefing_error?: string;
}

export interface RouteResponseError {
  status: 'error';
  error_code?: string;
  message: string;
  paths?: [];
  path?: [];
  request_id?: string;
}

export type RouteResponse = RouteResponseSuccess | RouteResponseError;

export interface SavedRouteRecord {
  request_id: string;
  processing_status: 'processing' | 'success' | 'no_path' | 'failed';
  map_id: string;
  start: CoordinateGrid;
  target: CoordinateGrid;
  input_coordinates: {
    start: CoordinateGeo | CoordinateGrid;
    target: CoordinateGeo | CoordinateGrid;
  };
  result: RouteResponseSuccess | RouteResponseError | null;
}

export interface RouteRequestPayload {
  map_id: string;
  map_version: string;
  start: CoordinateGeo | CoordinateGrid;
  target: CoordinateGeo | CoordinateGrid;
}
