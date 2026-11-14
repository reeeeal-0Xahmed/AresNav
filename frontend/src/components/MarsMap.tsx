import React, { useEffect, useRef, useState, useCallback } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import Translate from 'ol/interaction/Translate';
import Collection from 'ol/Collection';
import { defaults as defaultControls } from 'ol/control';

import { useMissionStore } from '../../store/useMissionStore';
import {
  MARS_PROJECTION,
  createTrekTileGrid,
  normalizeTrekLayerUrl,
  getLayerMaxZoom,
} from '../../lib/marsProjection';
import { JEZERO_REQUESTED_BOUNDS, JEZERO_RASTER_BOUNDS } from '../../lib/bounds';
import { createPoiStyle } from '../../lib/poiStyles';
import { createTraversabilityLayer } from '../../lib/traversabilityOverlay';
import {
  createStartPointStyle,
  createTargetPointStyle,
  createRouteFeatureStyle,
  createScienceStopStyle,
} from '../../lib/routeStyles';
import { MarsScaleControl } from './MarsScaleControl';
import { formatMarsCoord } from '../../lib/formatters';
import { Poi } from '../../api/types';
import {
  Plus,
  Minus,
  Maximize2,
  Compass as CompassIcon,
  Layers,
  AlertTriangle,
  Grid,
  Crosshair,
  X,
} from 'lucide-react';

interface MarsMapProps {
  isSidebarCollapsed?: boolean;
}

export const MarsMap: React.FC<MarsMapProps> = ({ isSidebarCollapsed }) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OlMap | null>(null);

  // Layers & Overlays from Store
  const layers = useMissionStore((s) => s.layers);
  const activeLayerId = useMissionStore((s) => s.activeLayerId);
  const setActiveLayerId = useMissionStore((s) => s.setActiveLayerId);
  const visibleOverlays = useMissionStore((s) => s.visibleOverlays);
  const layerOpacities = useMissionStore((s) => s.layerOpacities);
  const layerErrors = useMissionStore((s) => s.layerErrors);
  const setLayerError = useMissionStore((s) => s.setLayerError);
  const pois = useMissionStore((s) => s.pois);
  const selectedPoi = useMissionStore((s) => s.selectedPoi);
  const setSelectedPoi = useMissionStore((s) => s.setSelectedPoi);
  const terrainMeta = useMissionStore((s) => s.terrainMeta);
  const showTraversabilityGrid = useMissionStore((s) => s.showTraversabilityGrid);
  const toggleTraversabilityGrid = useMissionStore((s) => s.toggleTraversabilityGrid);

  // Route Planning State from Store
  const start = useMissionStore((s) => s.start);
  const target = useMissionStore((s) => s.target);
  const pickingMode = useMissionStore((s) => s.pickingMode);
  const setPickingMode = useMissionStore((s) => s.setPickingMode);
  const blockedPoint = useMissionStore((s) => s.blockedPoint);
  const isLoadingRoute = useMissionStore((s) => s.isLoadingRoute);
  const routeResult = useMissionStore((s) => s.routeResult);
  const selectedPathRank = useMissionStore((s) => s.selectedPathRank);
  const setSelectedPathRank = useMissionStore((s) => s.setSelectedPathRank);

  // Live telemetry state
  const [cursorCoord, setCursorCoord] = useState<{ lon: number; lat: number } | null>(null);
  const [mapResolution, setMapResolution] = useState<number>(0.001373);
  const [viewCenterLat, setViewCenterLat] = useState<number>(18.4661);

  // Layer references for dynamic updates
  const baseTileLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const overlayTileLayersRef = useRef<Map<string, TileLayer<XYZ>>>(new Map());
  const poiVectorLayerRef = useRef<VectorLayer<Cluster> | null>(null);
  const traversabilityLayerRef = useRef<ImageLayer<Static> | null>(null);
  const routeVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const waypointVectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const waypointFeaturesCollectionRef = useRef<Collection<Feature>>(new Collection<Feature>());
  const translateInteractionRef = useRef<Translate | null>(null);

  // Waypoint features
  const startFeatureRef = useRef<Feature | null>(null);
  const targetFeatureRef = useRef<Feature | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    // Use active base layer max zoom (Viking MDIM 2.1 maxZoom is 7)
    const baseKey = activeLayerId || 'base_viking';
    const baseMaxZ = getLayerMaxZoom(baseKey);
    const tileGrid = createTrekTileGrid(baseMaxZ);

    // Base layer (Default: Viking MDIM 2.1)
    const baseSource = new XYZ({
      projection: MARS_PROJECTION,
      tileGrid,
      maxZoom: baseMaxZ,
      url: normalizeTrekLayerUrl(
        layers?.[baseKey]?.url ||
          'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        baseKey
      ),
      crossOrigin: 'anonymous',
      wrapX: true,
    });

    let initBaseLoaded = 0;
    let initBaseErrors = 0;
    baseSource.on('tileloadend', () => {
      initBaseLoaded++;
      setLayerError(baseKey, null);
    });
    baseSource.on('tileloaderror', () => {
      initBaseErrors++;
      if (initBaseLoaded === 0 && initBaseErrors >= 2) {
        setLayerError(
          baseKey,
          `Tile error (404/network) loading ${layers?.[baseKey]?.title || baseKey}`
        );
      }
    });

    const baseTileLayer = new TileLayer({
      source: baseSource,
      zIndex: 1,
    });
    baseTileLayerRef.current = baseTileLayer;

    // Route vector layer setup (LineStrings & Science Stops)
    const routeSource = new VectorSource();
    const routeVectorLayer = new VectorLayer({
      source: routeSource,
      zIndex: 20,
    });
    routeVectorLayerRef.current = routeVectorLayer;

    // POI vector cluster setup
    const poiSource = new VectorSource();
    const clusterSource = new Cluster({
      distance: 10,
      source: poiSource,
    });
    const poiVectorLayer = new VectorLayer({
      source: clusterSource,
      style: (feature) => createPoiStyle(feature, null),
      zIndex: 25,
    });
    poiVectorLayerRef.current = poiVectorLayer;

    // Waypoint vector layer setup (Draggable Start/Target Pins)
    const waypointSource = new VectorSource();
    const waypointVectorLayer = new VectorLayer({
      source: waypointSource,
      zIndex: 30,
    });
    waypointVectorLayerRef.current = waypointVectorLayer;

    // Center on Jezero Crater (Lon: ~77.43°E, Lat: ~18.47°N)
    const centerLon = (JEZERO_REQUESTED_BOUNDS.west + JEZERO_REQUESTED_BOUNDS.east) / 2.0;
    const centerLat = (JEZERO_REQUESTED_BOUNDS.south + JEZERO_REQUESTED_BOUNDS.north) / 2.0;

    const view = new View({
      projection: MARS_PROJECTION,
      center: [centerLon, centerLat],
      zoom: 10,
      minZoom: 3,
      maxZoom: 17,
      extent: [
        JEZERO_REQUESTED_BOUNDS.west - 0.5,
        JEZERO_REQUESTED_BOUNDS.south - 0.5,
        JEZERO_REQUESTED_BOUNDS.east + 0.5,
        JEZERO_REQUESTED_BOUNDS.north + 0.5,
      ],
    });

    const map = new OlMap({
      target: mapElementRef.current,
      layers: [baseTileLayer, routeVectorLayer, poiVectorLayer, waypointVectorLayer],
      view,
      controls: defaultControls({ zoom: false, rotate: false, attribution: false }),
    });

    // Translate Interaction for Draggable Start/Target Markers
    const translateInteraction = new Translate({
      features: waypointFeaturesCollectionRef.current,
    });

    translateInteraction.on('translateend', (evt) => {
      const feature = evt.features.item(0);
      if (!feature) return;
      const geom = feature.getGeometry() as Point;
      if (!geom) return;
      const [rawLon, rawLat] = geom.getCoordinates();
      const clampedLon = Math.max(
        JEZERO_REQUESTED_BOUNDS.west,
        Math.min(JEZERO_REQUESTED_BOUNDS.east, rawLon)
      );
      const clampedLat = Math.max(
        JEZERO_REQUESTED_BOUNDS.south,
        Math.min(JEZERO_REQUESTED_BOUNDS.north, rawLat)
      );
      geom.setCoordinates([clampedLon, clampedLat]);

      const pointType = feature.get('pointType');
      const coord = {
        lon: Number(clampedLon.toFixed(5)),
        lat: Number(clampedLat.toFixed(5)),
      };
      if (pointType === 'start') {
        useMissionStore.getState().setStart(coord);
      } else if (pointType === 'target') {
        useMissionStore.getState().setTarget(coord);
      }
    });

    map.addInteraction(translateInteraction);
    translateInteractionRef.current = translateInteraction;

    // Fit view to requested_bounds
    view.fit(
      [
        JEZERO_REQUESTED_BOUNDS.west,
        JEZERO_REQUESTED_BOUNDS.south,
        JEZERO_REQUESTED_BOUNDS.east,
        JEZERO_REQUESTED_BOUNDS.north,
      ],
      { padding: [40, 40, 40, 40], duration: 400 }
    );

    // Track cursor coordinates
    map.on('pointermove', (evt) => {
      if (!evt.coordinate) return;
      const [lon, lat] = evt.coordinate;
      setCursorCoord({ lon, lat });
    });

    // Track view changes for scale bar
    map.on('moveend', () => {
      const currentRes = view.getResolution();
      const currentCenter = view.getCenter();
      if (currentRes) setMapResolution(currentRes);
      if (currentCenter) setViewCenterLat(currentCenter[1]);
    });

    // Click handler for Waypoint placement, Candidate Routes, and POIs
    map.on('singleclick', (evt) => {
      if (!evt.coordinate) return;
      const [lon, lat] = evt.coordinate;
      const clampedLon = Math.max(
        JEZERO_REQUESTED_BOUNDS.west,
        Math.min(JEZERO_REQUESTED_BOUNDS.east, lon)
      );
      const clampedLat = Math.max(
        JEZERO_REQUESTED_BOUNDS.south,
        Math.min(JEZERO_REQUESTED_BOUNDS.north, lat)
      );
      const coord = {
        lon: Number(clampedLon.toFixed(5)),
        lat: Number(clampedLat.toFixed(5)),
      };

      const currentPickingMode = useMissionStore.getState().pickingMode;

      // Waypoint picking mode from Route tab
      if (currentPickingMode === 'start') {
        useMissionStore.getState().setStart(coord);
        useMissionStore.getState().setPickingMode('target'); // Auto-advance to Target
        return;
      }
      if (currentPickingMode === 'target') {
        useMissionStore.getState().setTarget(coord);
        useMissionStore.getState().setPickingMode(null);
        return;
      }

      // Check if user clicked on a candidate route line or a POI
      let clickedRouteRank: number | null = null;
      let clickedPoi: Poi | null = null;

      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const rank = feature.get('rank');
        if (typeof rank === 'number') {
          clickedRouteRank = rank;
          return true; // Stop iteration
        }

        const cluster = feature.get('features');
        if (Array.isArray(cluster) && cluster.length > 0) {
          clickedPoi = cluster[0].get('poiData') || null;
          return true; // Stop iteration
        }
        return false;
      });

      if (clickedRouteRank !== null) {
        setSelectedPathRank(clickedRouteRank);
        return;
      }

      if (clickedPoi) {
        setSelectedPoi(clickedPoi);
      }
    });

    mapInstanceRef.current = map;

    // Fix map zero-size issue: call map.updateSize() after mount immediately and on subsequent frames
    map.updateSize();
    const animId = requestAnimationFrame(() => {
      map.updateSize();
    });
    const timer1 = setTimeout(() => map.updateSize(), 50);
    const timer2 = setTimeout(() => map.updateSize(), 200);

    // ResizeObserver: automatically update size when container dimensions change
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.updateSize();
      }
    });

    if (mapElementRef.current) {
      resizeObserver.observe(mapElementRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      // The overlay layers belonged to the map being destroyed. Forget them so the
      // overlay effect re-adds HiRISE to the NEW map instead of assuming it is there.
      overlayTileLayersRef.current.clear();
      traversabilityLayerRef.current = null;
      startFeatureRef.current = null;
      targetFeatureRef.current = null;
      waypointFeaturesCollectionRef.current.clear();
    };
    // The map is created once. Base layer / overlays / POIs / route are updated by their own effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map size when side panel opens or closes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.updateSize();
    const t1 = setTimeout(() => map.updateSize(), 100);
    const t2 = setTimeout(() => map.updateSize(), 350); // Sidebar transition duration is 300ms
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isSidebarCollapsed]);

  // Update Base Layer when activeLayerId changes
  useEffect(() => {
    if (!baseTileLayerRef.current || !layers) return;

    const layerConfig = layers[activeLayerId];
    if (!layerConfig) return;

    const maxZ = getLayerMaxZoom(activeLayerId);
    const tileGrid = createTrekTileGrid(maxZ);
    const resolvedUrl = normalizeTrekLayerUrl(layerConfig.url, activeLayerId);

    const source = new XYZ({
      projection: MARS_PROJECTION,
      tileGrid,
      maxZoom: maxZ,
      url: resolvedUrl,
      crossOrigin: 'anonymous',
      wrapX: true,
    });

    let baseLoaded = 0;
    let baseErrors = 0;
    source.on('tileloadend', () => {
      baseLoaded++;
      setLayerError(activeLayerId, null);
    });
    source.on('tileloaderror', () => {
      baseErrors++;
      if (baseLoaded === 0 && baseErrors >= 2) {
        setLayerError(
          activeLayerId,
          `Tiles unavailable on NASA Trek (HTTP 404) for ${layerConfig.title}`
        );
      }
    });

    baseTileLayerRef.current.setSource(source);
  }, [activeLayerId, layers, setLayerError]);

  // Update Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layers) return;

    const currentOverlays = overlayTileLayersRef.current;

    // Check overlays that should be visible
    visibleOverlays.forEach((id) => {
      if (id === activeLayerId) return; // Skip if already base layer
      const layerConfig = layers[id];
      if (!layerConfig) return;

      let layer = currentOverlays.get(id);
      const opacity = layerOpacities[id] !== undefined ? layerOpacities[id] : 0.7;

      if (!layer) {
        const maxZ = getLayerMaxZoom(id);
        const tileGrid = createTrekTileGrid(maxZ);
        const source = new XYZ({
          projection: MARS_PROJECTION,
          tileGrid,
          maxZoom: maxZ,
          url: normalizeTrekLayerUrl(layerConfig.url, id),
          crossOrigin: 'anonymous',
          wrapX: true,
        });

        let loadedTilesCount = 0;
        let errorTilesCount = 0;

        source.on('tileloadend', () => {
          loadedTilesCount++;
          setLayerError(id, null);
        });
        source.on('tileloaderror', () => {
          errorTilesCount++;
          // For local footprint overlays like HiRISE, outside tiles 404 naturally;
          // only mark offline if zero tiles load and errors persist
          if (loadedTilesCount === 0 && errorTilesCount >= 2) {
            setLayerError(
              id,
              `Tiles unavailable on NASA Trek (HTTP 404) for ${layerConfig.title}`
            );
          }
        });

        layer = new TileLayer({
          source,
          opacity,
          zIndex: 5,
        });
        currentOverlays.set(id, layer);
        map.addLayer(layer);
      } else {
        layer.setOpacity(opacity);
      }
    });

    // Remove overlays that are no longer visible
    currentOverlays.forEach((layer, id) => {
      if (!visibleOverlays.includes(id) || id === activeLayerId) {
        map.removeLayer(layer);
        currentOverlays.delete(id);
      }
    });
  }, [visibleOverlays, activeLayerId, layers, layerOpacities, setLayerError]);

  // Update POI features in Vector Layer
  useEffect(() => {
    if (!poiVectorLayerRef.current) return;
    const cluster = poiVectorLayerRef.current.getSource();
    if (!cluster) return;
    const source = cluster.getSource();
    if (!source) return;

    source.clear();

    const features = pois.map((poi) => {
      const feat = new Feature({
        geometry: new Point([poi.lon, poi.lat]),
        poiData: poi,
      });
      return feat;
    });

    source.addFeatures(features);
  }, [pois]);

  // Update POI selection style
  useEffect(() => {
    if (!poiVectorLayerRef.current) return;
    poiVectorLayerRef.current.setStyle((feature) =>
      createPoiStyle(feature, selectedPoi?.id)
    );
  }, [selectedPoi]);

  // Update Optional Traversability Grid Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showTraversabilityGrid) {
      if (!traversabilityLayerRef.current) {
        // If real grid is present, render it; otherwise use generated grid from metadata
        const gridData = terrainMeta?.grid || generateMockCostGrid(353, 298);
        const bounds = terrainMeta?.raster_bounds || JEZERO_RASTER_BOUNDS;

        const layer = createTraversabilityLayer(gridData, 353, 298, bounds);
        traversabilityLayerRef.current = layer;
        map.addLayer(layer);
      }
    } else {
      if (traversabilityLayerRef.current) {
        map.removeLayer(traversabilityLayerRef.current);
        traversabilityLayerRef.current = null;
      }
    }
  }, [showTraversabilityGrid, terrainMeta]);

  // Lock waypoint dragging while route calculation is in progress (Task 3 requirement 3)
  useEffect(() => {
    if (translateInteractionRef.current) {
      translateInteractionRef.current.setActive(!isLoadingRoute);
    }
  }, [isLoadingRoute]);

  // Update Waypoint Markers (Start & Target)
  useEffect(() => {
    const layer = waypointVectorLayerRef.current;
    if (!layer) return;
    const source = layer.getSource();
    if (!source) return;
    const collection = waypointFeaturesCollectionRef.current;

    // Start marker
    if (start) {
      if (!startFeatureRef.current) {
        const feat = new Feature({
          geometry: new Point([start.lon, start.lat]),
          pointType: 'start',
        });
        feat.setStyle(createStartPointStyle(blockedPoint === 'start'));
        startFeatureRef.current = feat;
        source.addFeature(feat);
        collection.push(feat);
      } else {
        const geom = startFeatureRef.current.getGeometry() as Point;
        geom.setCoordinates([start.lon, start.lat]);
        startFeatureRef.current.setStyle(createStartPointStyle(blockedPoint === 'start'));
      }
    } else if (startFeatureRef.current) {
      source.removeFeature(startFeatureRef.current);
      collection.remove(startFeatureRef.current);
      startFeatureRef.current = null;
    }

    // Target marker
    if (target) {
      if (!targetFeatureRef.current) {
        const feat = new Feature({
          geometry: new Point([target.lon, target.lat]),
          pointType: 'target',
        });
        feat.setStyle(createTargetPointStyle(blockedPoint === 'target'));
        targetFeatureRef.current = feat;
        source.addFeature(feat);
        collection.push(feat);
      } else {
        const geom = targetFeatureRef.current.getGeometry() as Point;
        geom.setCoordinates([target.lon, target.lat]);
        targetFeatureRef.current.setStyle(createTargetPointStyle(blockedPoint === 'target'));
      }
    } else if (targetFeatureRef.current) {
      source.removeFeature(targetFeatureRef.current);
      collection.remove(targetFeatureRef.current);
      targetFeatureRef.current = null;
    }
  }, [start, target, blockedPoint]);

  // Update Route Paths & Science Stops
  const lastFittedRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const layer = routeVectorLayerRef.current;
    if (!layer) return;
    const source = layer.getSource();
    if (!source) return;

    source.clear();

    if (!routeResult || !routeResult.paths || routeResult.paths.length === 0) {
      return;
    }

    // Render candidate paths (ranked 1, 2, 3)
    routeResult.paths.forEach((p) => {
      const isSameCell = p.steps === 0 || p.distance_meters === 0 || p.geographic_path.length <= 1;
      let feat: Feature;
      if (isSameCell && p.geographic_path.length > 0) {
        feat = new Feature({
          geometry: new Point([p.geographic_path[0].lon, p.geographic_path[0].lat]),
          rank: p.rank,
          verdict: p.briefing.verdict,
          isSameCell: true,
        });
      } else {
        feat = new Feature({
          geometry: new LineString(p.geographic_path.map((pt) => [pt.lon, pt.lat])),
          rank: p.rank,
          verdict: p.briefing.verdict,
          isSameCell: false,
        });
      }
      feat.setStyle(createRouteFeatureStyle(feat, selectedPathRank));
      source.addFeature(feat);
    });

    // Render nearby science stops along the active path
    const activeP =
      routeResult.paths.find((p) => p.rank === selectedPathRank) || routeResult.paths[0];
    if (activeP?.briefing?.science_stops) {
      activeP.briefing.science_stops.forEach((stop) => {
        const pathPt =
          activeP.geographic_path[stop.nearest_path_index] || activeP.geographic_path[0];
        if (pathPt) {
          const stopFeat = new Feature({
            geometry: new Point([pathPt.lon, pathPt.lat]),
            isScienceStop: true,
          });
          stopFeat.setStyle(createScienceStopStyle(stop.name, stop.distance_to_path_m));
          source.addFeature(stopFeat);
        }
      });
    }

    // Fit view to route extent when a new request_id is loaded
    if (routeResult.request_id !== lastFittedRequestIdRef.current) {
      lastFittedRequestIdRef.current = routeResult.request_id;
      const extent = source.getExtent();
      if (extent && isFinite(extent[0]) && mapInstanceRef.current) {
        mapInstanceRef.current.getView().fit(extent, {
          padding: [70, 70, 70, 70],
          duration: 400,
          maxZoom: 14,
        });
      }
    }
  }, [routeResult, selectedPathRank]);

  // Center on Jezero Bounds
  const handleResetView = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const view = map.getView();
    view.fit(
      [
        JEZERO_REQUESTED_BOUNDS.west,
        JEZERO_REQUESTED_BOUNDS.south,
        JEZERO_REQUESTED_BOUNDS.east,
        JEZERO_REQUESTED_BOUNDS.north,
      ],
      { padding: [50, 50, 50, 50], duration: 500 }
    );
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    const view = mapInstanceRef.current?.getView();
    if (view) view.animate({ zoom: (view.getZoom() || 10) + 1, duration: 250 });
  };

  const handleZoomOut = () => {
    const view = mapInstanceRef.current?.getView();
    if (view) view.animate({ zoom: (view.getZoom() || 10) - 1, duration: 250 });
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-mars-darkest select-none overflow-hidden">
      {/* Map DOM Canvas Container */}
      <div
        ref={mapElementRef}
        className={`w-full h-full min-h-0 ${pickingMode ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {/* Waypoint Picking Mode Banner */}
      {pickingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-mars-darkest/95 border border-mars-orange/80 px-4 py-2 rounded-xl text-xs font-mono shadow-2xl backdrop-blur-md">
          <Crosshair className="w-4 h-4 text-mars-orange animate-spin" />
          <span className="text-white font-semibold">
            Placing{' '}
            <span className={pickingMode === 'start' ? 'text-emerald-400' : 'text-mars-orange'}>
              {pickingMode.toUpperCase()}
            </span>{' '}
            Waypoint:
          </span>
          <span className="text-slate-300">Click map within Jezero bounds</span>
          <button
            onClick={() => setPickingMode(null)}
            className="ml-2 p-1 text-slate-400 hover:text-white rounded hover:bg-mars-surface transition-colors"
            title="Cancel waypoint placement"
            aria-label="Cancel waypoint placement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Floating Telemetry & Layer Status */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Navigation / Zoom Controls */}
        <div className="flex flex-col bg-mars-darkest/90 border border-mars-border rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-mars-surface transition-colors border-b border-mars-border/60"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-mars-surface transition-colors border-b border-mars-border/60"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 text-slate-300 hover:text-white hover:bg-mars-surface transition-colors"
            title="Fit Jezero Regional Bounds"
            aria-label="Fit Jezero Regional Bounds"
          >
            <Maximize2 className="w-4 h-4 text-mars-orange" />
          </button>
        </div>

        {/* Toggle Traversability Grid Button */}
        <button
          onClick={toggleTraversabilityGrid}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md shadow-lg transition-all ${
            showTraversabilityGrid
              ? 'bg-mars-orange/20 border-mars-orange text-mars-orange font-semibold shadow-mars-orange/15'
              : 'bg-mars-darkest/90 border-mars-border text-slate-300 hover:bg-mars-surface'
          }`}
          title="Toggle 200m Traversability Cost Grid Overlay"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">200m Cost Grid</span>
        </button>
      </div>

      {/* Top-Right Active Layer Indicator & Per-Layer Error Badges */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 max-w-sm sm:max-w-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-mars-darkest/85 backdrop-blur-md border border-mars-border px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 shadow-lg">
            <Layers className="w-3.5 h-3.5 text-mars-orange" />
            <span className="text-mars-muted hidden sm:inline">Base:</span>
            <span className="text-white font-medium">
              {layers?.[activeLayerId]?.title || activeLayerId}
            </span>
          </div>
        </div>

        {/* Active Base Layer Error Banner with Quick Action */}
        {layerErrors[activeLayerId] && (
          <div className="flex items-center gap-2 bg-rose-950/90 border border-rose-500/80 text-rose-200 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="text-[11px] leading-tight">
              Base layer 404 ({layers?.[activeLayerId]?.title || activeLayerId})
            </span>
            <button
              onClick={() => setActiveLayerId('base_viking')}
              className="ml-2 px-2 py-0.5 rounded bg-rose-800 hover:bg-rose-700 text-white font-semibold text-[10px] uppercase tracking-wider transition-colors flex-shrink-0"
            >
              Use Viking MDIM
            </button>
          </div>
        )}

        {/* Visible Overlays Per-Layer Error Badges */}
        {Object.entries(layerErrors)
          .filter(
            ([id, err]) =>
              err != null && id !== activeLayerId && visibleOverlays.includes(id)
          )
          .map(([id, err]) => (
            <div
              key={id}
              className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/70 text-amber-200 px-2.5 py-1 rounded-lg text-xs font-mono shadow-lg backdrop-blur-md"
              title={err || undefined}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-[11px]">{layers?.[id]?.title || id}: Offline (404)</span>
            </div>
          ))}
      </div>

      {/* Bottom-Left Controls: North Arrow & Custom Mars Scale */}
      <div className="absolute bottom-5 left-4 z-20 flex items-end gap-3">
        {/* North Indicator */}
        <div
          className="flex flex-col items-center justify-center w-9 h-9 rounded-lg bg-mars-darkest/90 backdrop-blur-md border border-mars-border text-mars-orange shadow-lg"
          title="True Martian North (Planetocentric Grid)"
        >
          <CompassIcon className="w-4 h-4" />
          <span className="text-[9px] font-mono font-bold leading-none text-white">N</span>
        </div>

        {/* Mars Spherical Scale Bar */}
        <MarsScaleControl resolution={mapResolution} latitude={viewCenterLat} />
      </div>

      {/* Bottom Center: Live Cursor Coordinates Banner */}
      <div className="absolute bottom-5 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20">
        <div className="bg-mars-darkest/90 backdrop-blur-md border border-mars-border px-3.5 py-1.5 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-mars-orange animate-pulse" />
          <span className="text-mars-muted text-[11px]">MARS CRS (EPSG:104905):</span>
          <span className="font-semibold text-white">
            {cursorCoord
              ? formatMarsCoord(cursorCoord.lon, cursorCoord.lat, 4)
              : 'Hover to read coordinates'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Generates an approximate cost grid for Jezero Crater rim & delta when full raster is absent
function generateMockCostGrid(width: number, height: number): number[][] {
  const grid: number[][] = [];
  const cx = width * 0.52;
  const cy = height * 0.51;
  const radius = width * 0.38;

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      const rimDist = Math.abs(dist - radius);

      if (rimDist < 4) {
        row.push(-1); // Blocked crater rim wall
      } else if (rimDist < 12) {
        row.push(8);  // Very high slope
      } else if (rimDist < 25) {
        row.push(4);  // High slope
      } else if (dist < radius * 0.5) {
        row.push(1);  // Flat floor
      } else {
        row.push(2);  // Moderate rough floor
      }
    }
    grid.push(row);
  }
  return grid;
}
