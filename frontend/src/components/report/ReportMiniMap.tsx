import React, { useEffect, useRef } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';

import { RouteResponseSuccess, Poi, CoordinateGeo } from '../../api/types';
import {
  MARS_PROJECTION,
  createTrekTileGrid,
  normalizeTrekLayerUrl,
  getLayerMaxZoom,
} from '../../lib/marsProjection';
import { JEZERO_REQUESTED_BOUNDS } from '../../lib/bounds';
import {
  createStartPointStyle,
  createTargetPointStyle,
  createRouteFeatureStyle,
  createScienceStopStyle,
} from '../../lib/routeStyles';
import { formatMarsCoord } from '../../lib/formatters';

interface ReportMiniMapProps {
  routeResult: RouteResponseSuccess;
  selectedRank: number;
  pois?: Poi[];
  className?: string;
}

export const ReportMiniMap: React.FC<ReportMiniMapProps> = ({
  routeResult,
  selectedRank,
  pois = [],
  className = '',
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OlMap | null>(null);

  const activePath =
    routeResult.paths?.find((p) => p.rank === selectedRank) ||
    routeResult.paths?.[0];

  useEffect(() => {
    if (!mapElementRef.current) return;

    // Destroy any existing instance before re-creating
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }

    const baseMaxZ = getLayerMaxZoom('base_viking');
    const tileGrid = createTrekTileGrid(baseMaxZ);

    const baseSource = new XYZ({
      projection: MARS_PROJECTION,
      tileGrid,
      maxZoom: baseMaxZ,
      url: normalizeTrekLayerUrl(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        'base_viking'
      ),
      crossOrigin: 'anonymous',
      wrapX: true,
    });

    const baseTileLayer = new TileLayer({
      source: baseSource,
      zIndex: 1,
    });

    const vectorSource = new VectorSource();

    // 1. Add Route Candidate Paths
    (routeResult.paths || []).forEach((path) => {
      const geoCoords = path.geographic_path;
      if (!geoCoords || geoCoords.length === 0) return;

      if (geoCoords.length === 1) {
        const feature = new Feature({
          geometry: new Point([geoCoords[0].lon, geoCoords[0].lat]),
          rank: path.rank,
          verdict: path.briefing.verdict,
          isSameCellPoint: true,
        });
        vectorSource.addFeature(feature);
      } else {
        const coords = geoCoords.map((c) => [c.lon, c.lat]);
        const feature = new Feature({
          geometry: new LineString(coords),
          rank: path.rank,
          verdict: path.briefing.verdict,
        });
        vectorSource.addFeature(feature);
      }
    });

    // 2. Add Start & Target Waypoints
    const startGeo: CoordinateGeo | null =
      routeResult.start_geographic ||
      (routeResult.requested_start && 'lon' in routeResult.requested_start
        ? (routeResult.requested_start as CoordinateGeo)
        : null);

    const targetGeo: CoordinateGeo | null =
      routeResult.target_geographic ||
      (routeResult.requested_target && 'lon' in routeResult.requested_target
        ? (routeResult.requested_target as CoordinateGeo)
        : null);

    if (startGeo) {
      const startFeature = new Feature({
        geometry: new Point([startGeo.lon, startGeo.lat]),
        role: 'start',
      });
      startFeature.setStyle(createStartPointStyle(false));
      vectorSource.addFeature(startFeature);
    }

    if (targetGeo) {
      const targetFeature = new Feature({
        geometry: new Point([targetGeo.lon, targetGeo.lat]),
        role: 'target',
      });
      targetFeature.setStyle(createTargetPointStyle(false));
      vectorSource.addFeature(targetFeature);
    }

    // 3. Add En-Route Science Stops
    if (activePath?.briefing?.science_stops && activePath.briefing.science_stops.length > 0) {
      activePath.briefing.science_stops.forEach((stop) => {
        // Try to match with POI coords or nearest path point
        const matchingPoi = pois.find((p) => p.name.toLowerCase() === stop.name.toLowerCase());
        let stopLon: number | null = null;
        let stopLat: number | null = null;

        if (matchingPoi) {
          stopLon = matchingPoi.lon;
          stopLat = matchingPoi.lat;
        } else if (
          activePath.geographic_path &&
          stop.nearest_path_index >= 0 &&
          stop.nearest_path_index < activePath.geographic_path.length
        ) {
          stopLon = activePath.geographic_path[stop.nearest_path_index].lon;
          stopLat = activePath.geographic_path[stop.nearest_path_index].lat;
        }

        if (stopLon !== null && stopLat !== null) {
          const stopFeature = new Feature({
            geometry: new Point([stopLon, stopLat]),
            name: stop.name,
            distance: stop.distance_to_path_m,
          });
          stopFeature.setStyle(createScienceStopStyle(stop.name, stop.distance_to_path_m));
          vectorSource.addFeature(stopFeature);
        }
      });
    }

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const role = feature.get('role');
        if (role === 'start') return createStartPointStyle(false);
        if (role === 'target') return createTargetPointStyle(false);
        if (feature.get('distance') !== undefined) return undefined; // already styled
        return createRouteFeatureStyle(feature, selectedRank);
      },
      zIndex: 10,
    });

    // Center & Bounds
    const centerLon = (JEZERO_REQUESTED_BOUNDS.west + JEZERO_REQUESTED_BOUNDS.east) / 2.0;
    const centerLat = (JEZERO_REQUESTED_BOUNDS.south + JEZERO_REQUESTED_BOUNDS.north) / 2.0;

    const view = new View({
      projection: MARS_PROJECTION,
      center: [centerLon, centerLat],
      zoom: 10,
      minZoom: 3,
      maxZoom: 16,
    });

    // Create Non-Interactive Map (Static preview for report & PDF)
    const map = new OlMap({
      target: mapElementRef.current,
      layers: [baseTileLayer, vectorLayer],
      view,
      controls: defaultControls({ zoom: false, rotate: false, attribution: false }),
      interactions: defaultInteractions({
        doubleClickZoom: false,
        dragPan: false,
        keyboard: false,
        mouseWheelZoom: false,
        pinchZoom: false,
      }),
    });

    mapInstanceRef.current = map;

    // Fit view to route bounds
    const extent = vectorSource.getExtent();
    if (extent && isFinite(extent[0]) && extent[0] !== Infinity) {
      view.fit(extent, {
        padding: [45, 45, 45, 45],
        maxZoom: 13,
      });
    }

    // ResizeObserver for reliable dimension sync
    const ro = new ResizeObserver(() => {
      map.updateSize();
    });
    ro.observe(mapElementRef.current);

    const timer = setTimeout(() => {
      map.updateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, [routeResult, selectedRank, pois]);

  const startCoord =
    routeResult.start_geographic ||
    (routeResult.requested_start && 'lon' in routeResult.requested_start
      ? (routeResult.requested_start as CoordinateGeo)
      : null);

  const targetCoord =
    routeResult.target_geographic ||
    (routeResult.requested_target && 'lon' in routeResult.requested_target
      ? (routeResult.requested_target as CoordinateGeo)
      : null);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-mars-border bg-mars-surface shadow-inner ${className}`}
    >
      {/* Map Canvas Container */}
      <div ref={mapElementRef} className="w-full h-full min-h-[300px]" />

      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 bg-mars-dark/90 backdrop-blur-sm border border-mars-border px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 flex items-center gap-2 pointer-events-none z-10 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="font-semibold text-white">JEZERO CRATER TRAVERSE PREVIEW</span>
        <span className="text-mars-muted">•</span>
        <span className="text-mars-muted text-[10px]">EPSG:104905</span>
      </div>

      {/* Alternative Paths Legend */}
      <div className="absolute top-3 right-3 bg-mars-dark/90 backdrop-blur-sm border border-mars-border px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-3 pointer-events-none z-10 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-1 bg-emerald-400 rounded-sm inline-block" />
          <span>Active (Rank #{selectedRank})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
          <span>Alternatives</span>
        </div>
      </div>

      {/* Bottom Coordinates & Scale Badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-mars-dark/90 backdrop-blur-sm border border-mars-border px-2.5 py-1 rounded text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-md">
          {startCoord && (
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">START:</span>
              <span>{formatMarsCoord(startCoord.lon, startCoord.lat)}</span>
            </div>
          )}
          {targetCoord && (
            <div className="flex items-center gap-1">
              <span className="text-mars-orange font-semibold">TARGET:</span>
              <span>{formatMarsCoord(targetCoord.lon, targetCoord.lat)}</span>
            </div>
          )}
        </div>

        <div className="bg-mars-dark/90 backdrop-blur-sm border border-mars-border px-2 py-0.5 rounded text-[10px] font-mono text-mars-muted shadow-md">
          DEM Cell Spacing: 200 m
        </div>
      </div>
    </div>
  );
};
