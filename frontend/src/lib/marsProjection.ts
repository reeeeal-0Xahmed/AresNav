import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import Projection from 'ol/proj/Projection';
import TileGrid from 'ol/tilegrid/TileGrid';

// Mars 2000 Sphere Radius in meters
export const MARS_RADIUS_METERS = 3396190.0;

// Register Mars Equirectangular Projection (ESRI 104905)
// Defined as spherical Mars with R = 3,396,190m in degree coordinates
proj4.defs(
  'EPSG:104905',
  '+proj=longlat +a=3396190 +b=3396190 +no_defs'
);
register(proj4);

export const MARS_PROJECTION = new Projection({
  code: 'EPSG:104905',
  units: 'degrees',
  extent: [-180, -90, 180, 90],
  worldExtent: [-180, -90, 180, 90],
  global: true,
});

/**
 * Returns the maximum available zoom level on NASA Trek for a given layer.
 * Viking MDIM 2.1 (232m) and MOLA (463m) global mosaics only have tiles up to Zoom 7.
 * HiRISE Jezero mosaic has ultra high-res tiles up to Zoom 16.
 * Geology and CTX 5m are experimental/unverified layers.
 */
export function getLayerMaxZoom(layerKey: string): number {
  switch (layerKey) {
    case 'base_viking':
      return 7;
    case 'mola_color':
      return 7;
    case 'geology':
      return 7;
    case 'ctx_5m':
      return 14;
    case 'hirise_jezero':
    default:
      return 16;
  }
}

/**
 * Generates the OGC WMTS TileMatrixSet `default028mm` resolutions for OpenLayers.
 * At zoom 0: 2 tiles wide x 1 tile high (512 x 256 px) over 360 degrees = 0.703125 deg/px.
 * Halves resolution at each zoom level up to maxZoom.
 * When a layer's maxZoom is reached (e.g. z=7 for Viking MDIM), OpenLayers automatically
 * clamps resolution lookups to that level and oversamples/upscales the tiles when zoomed in further.
 */
export function createTrekTileGrid(maxZoom: number = 18): TileGrid {
  const resolutions: number[] = [];
  const baseRes = 360.0 / 512.0; // 0.703125 deg/pixel at zoom 0
  for (let z = 0; z <= maxZoom; z++) {
    resolutions.push(baseRes / Math.pow(2, z));
  }

  return new TileGrid({
    extent: [-180, -90, 180, 90],
    origin: [-180, 90], // Top-left origin
    resolutions,
    tileSize: [256, 256],
  });
}

/**
 * Computes great-circle ground distance in meters on Mars between two points.
 * East-positive lon and Planetocentric lat in degrees.
 */
export function marsGreatCircleDistanceMeters(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const rad = Math.PI / 180.0;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const dPhi = (lat2 - lat1) * rad;
  const dLam = (lon2 - lon1) * rad;

  const a =
    Math.sin(dPhi / 2.0) * Math.sin(dPhi / 2.0) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2.0) * Math.sin(dLam / 2.0);
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1.0 - a)));

  return MARS_RADIUS_METERS * c;
}

/**
 * Normalizes a Trek WMTS layer URL to ensure proper case on NASA servers.
 * Converts lowercase /tiles/mars/EQ to /tiles/Mars/EQ.
 * Handles known official product labels on Trek.
 */
export function normalizeTrekLayerUrl(rawUrl: string, layerKey: string): string {
  let url = rawUrl.replace('/tiles/mars/EQ', '/tiles/Mars/EQ');

  // Fix known backend config mismatches with actual NASA Trek product labels:
  if (layerKey === 'base_viking' || url.includes('Mars_Viking_MDIM21_InvCyl')) {
    url = url.replace(
      'Mars_Viking_MDIM21_InvCyl_mosaic_global_232m',
      'Mars_Viking_MDIM21_ClrMosaic_global_232m'
    );
  } else if (layerKey === 'hirise_jezero' || url.includes('MRO_HiRISE_Jezero_Mosaic_Controlled')) {
    url = url.replace(
      'MRO_HiRISE_Jezero_Mosaic_Controlled',
      'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd'
    );
  }

  return url;
}
