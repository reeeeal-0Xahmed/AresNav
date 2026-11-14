import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Image as ImageIcon,
  Activity,
  Navigation,
  ChevronRight,
  ChevronLeft,
  Sliders,
  Search,
  AlertTriangle,
  Grid,
} from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { formatMarsCoord, getRadiationStyle } from '../../lib/formatters';
import { getPoiTypeColor } from '../../lib/poiStyles';
import { MarsImage } from '../../api/types';
import { ImageLightbox } from './ImageLightbox';
import { RoutePlanningPanel } from './RoutePlanningPanel';

export type SidebarTab = 'layers' | 'pois' | 'images' | 'weather' | 'route';

interface ExplorerSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('layers');
  const [poiSearch, setPoiSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<MarsImage | null>(null);

  // Zustand Store
  const layers = useMissionStore((s) => s.layers);
  const activeLayerId = useMissionStore((s) => s.activeLayerId);
  const setActiveLayerId = useMissionStore((s) => s.setActiveLayerId);
  const visibleOverlays = useMissionStore((s) => s.visibleOverlays);
  const toggleOverlay = useMissionStore((s) => s.toggleOverlay);
  const layerOpacities = useMissionStore((s) => s.layerOpacities);
  const setLayerOpacity = useMissionStore((s) => s.setLayerOpacity);
  const layerErrors = useMissionStore((s) => s.layerErrors);
  const showTraversabilityGrid = useMissionStore((s) => s.showTraversabilityGrid);
  const toggleTraversabilityGrid = useMissionStore((s) => s.toggleTraversabilityGrid);

  const pois = useMissionStore((s) => s.pois);
  const selectedPoi = useMissionStore((s) => s.selectedPoi);
  const setSelectedPoi = useMissionStore((s) => s.setSelectedPoi);

  const images = useMissionStore((s) => s.images);
  const spaceWeather = useMissionStore((s) => s.spaceWeather);

  // Categorize layers into base layers vs overlays
  const layerEntries = layers ? Object.entries(layers) : [];
  const baseLayers = layerEntries.filter(([_, l]) => l.kind === 'base' || l.kind === 'elevation');
  const overlayLayers = layerEntries.filter(([_, l]) => l.kind === 'overlay');

  // Filtered POIs
  const poiTypes = Array.from(new Set(pois.map((p) => p.type)));
  const filteredPois = pois.filter((poi) => {
    const matchesSearch =
      poi.name.toLowerCase().includes(poiSearch.toLowerCase()) ||
      (poi.description && poi.description.toLowerCase().includes(poiSearch.toLowerCase()));
    const matchesType = selectedTypeFilter === 'all' || poi.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  const radStyle = spaceWeather
    ? getRadiationStyle(spaceWeather.radiation_status)
    : getRadiationStyle('UNKNOWN');

  return (
    <>
      <div
        className={`relative z-30 flex flex-col bg-mars-dark/95 backdrop-blur-md border-l border-mars-border transition-all duration-300 ${
          isCollapsed ? 'w-12' : 'w-full md:w-96 lg:w-[420px]'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -left-3.5 top-6 z-40 w-7 h-7 bg-mars-surface border border-mars-border rounded-full flex items-center justify-center text-slate-300 hover:text-white shadow-md hover:bg-mars-panel transition-colors"
          title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          aria-label={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Minimized Icon Bar when collapsed */}
        {isCollapsed ? (
          <div className="flex flex-col items-center py-6 gap-6">
            <button
              onClick={() => {
                onToggleCollapse();
                setActiveTab('layers');
              }}
              className="p-2 text-mars-muted hover:text-mars-orange"
              title="Layers"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onToggleCollapse();
                setActiveTab('pois');
              }}
              className="p-2 text-mars-muted hover:text-mars-orange"
              title="Science POIs"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onToggleCollapse();
                setActiveTab('images');
              }}
              className="p-2 text-mars-muted hover:text-mars-orange"
              title="Imagery"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onToggleCollapse();
                setActiveTab('weather');
              }}
              className="p-2 text-mars-muted hover:text-mars-orange"
              title="Space Weather"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onToggleCollapse();
                setActiveTab('route');
              }}
              className="p-2 text-mars-muted hover:text-mars-orange"
              title="Route Planning"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Tab Navigation Header */}
            <div className="flex items-center justify-between border-b border-mars-border bg-mars-darkest px-2 py-2">
              <div className="grid grid-cols-5 w-full gap-1">
                <button
                  onClick={() => setActiveTab('layers')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-[11px] font-mono transition-all ${
                    activeTab === 'layers'
                      ? 'bg-mars-surface text-white border border-mars-orange/40 font-semibold shadow-sm'
                      : 'text-mars-muted hover:text-slate-200 hover:bg-mars-surface/50'
                  }`}
                >
                  <Layers className="w-4 h-4 text-mars-orange mb-0.5" />
                  <span>Layers</span>
                </button>

                <button
                  onClick={() => setActiveTab('pois')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-[11px] font-mono transition-all ${
                    activeTab === 'pois'
                      ? 'bg-mars-surface text-white border border-mars-orange/40 font-semibold shadow-sm'
                      : 'text-mars-muted hover:text-slate-200 hover:bg-mars-surface/50'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-mars-orange mb-0.5" />
                  <span>POIs</span>
                </button>

                <button
                  onClick={() => setActiveTab('images')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-[11px] font-mono transition-all ${
                    activeTab === 'images'
                      ? 'bg-mars-surface text-white border border-mars-orange/40 font-semibold shadow-sm'
                      : 'text-mars-muted hover:text-slate-200 hover:bg-mars-surface/50'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-mars-orange mb-0.5" />
                  <span>Images</span>
                </button>

                <button
                  onClick={() => setActiveTab('weather')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-[11px] font-mono transition-all ${
                    activeTab === 'weather'
                      ? 'bg-mars-surface text-white border border-mars-orange/40 font-semibold shadow-sm'
                      : 'text-mars-muted hover:text-slate-200 hover:bg-mars-surface/50'
                  }`}
                >
                  <Activity className="w-4 h-4 text-mars-orange mb-0.5" />
                  <span>Weather</span>
                </button>

                <button
                  onClick={() => setActiveTab('route')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-[11px] font-mono transition-all ${
                    activeTab === 'route'
                      ? 'bg-mars-surface text-white border border-mars-orange/40 font-semibold shadow-sm'
                      : 'text-mars-muted hover:text-slate-200 hover:bg-mars-surface/50'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-mars-orange mb-0.5" />
                  <span>Route</span>
                </button>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* TAB 1: LAYERS */}
              {activeTab === 'layers' && (
                <div className="space-y-6">
                  {/* Base Layers (Radio Selection) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-mars-muted flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-mars-orange" />
                        <span>Base Maps</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Radio select</span>
                    </div>

                    <div className="space-y-2">
                      {baseLayers.map(([id, layer]) => {
                        const isSelected = activeLayerId === id;
                        const error = layerErrors[id];

                        return (
                          <label
                            key={id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-mars-surface border-mars-orange/50 shadow-md shadow-mars-orange/10'
                                : 'bg-mars-panel/60 border-mars-border hover:bg-mars-surface/60'
                            }`}
                          >
                            <input
                              type="radio"
                              name="base_layer"
                              checked={isSelected}
                              onChange={() => setActiveLayerId(id)}
                              className="mt-1 text-mars-orange focus:ring-mars-orange bg-mars-dark border-mars-border"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white font-sans">
                                  {layer.title}
                                </span>
                                {error ? (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/40">
                                    Offline
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                                    WMTS
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                                {id === 'base_viking' && 'Viking MDIM 2.1 global color mosaic (232 m/px nominal). Primary Mars basemap.'}
                                {id === 'mola_color' && 'MGS MOLA colored relief shaded topography (463 m/px).'}
                                {id === 'ctx_5m' && 'MRO CTX global mosaic (5 m/px). Challenge resource (unverified URL).'}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Overlays (Toggle + Opacity) */}
                  <div className="space-y-3 pt-3 border-t border-mars-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-mars-muted flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-mars-orange" />
                        <span>Science Overlays</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Toggle & Opacity</span>
                    </div>

                    <div className="space-y-3">
                      {overlayLayers.map(([id, layer]) => {
                        const isVisible = visibleOverlays.includes(id);
                        const opacity = layerOpacities[id] !== undefined ? layerOpacities[id] : 0.7;
                        const error = layerErrors[id];

                        return (
                          <div
                            key={id}
                            className={`p-3 rounded-xl border transition-all ${
                              isVisible
                                ? 'bg-mars-surface border-mars-orange/40'
                                : 'bg-mars-panel/40 border-mars-border/80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={() => toggleOverlay(id)}
                                  className="rounded text-mars-orange focus:ring-mars-orange bg-mars-dark border-mars-border"
                                />
                                <span className="text-xs font-semibold text-white">
                                  {layer.title}
                                </span>
                              </label>

                              {error ? (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40">
                                  Check
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
                                  Active
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 pl-6">
                              {id === 'hirise_jezero' && 'Controlled MRO HiRISE orthomosaic covering Jezero crater rim and delta.'}
                              {id === 'geology' && 'USGS Geologic Map of Mars (100 m/px) showing rock units.'}
                            </p>

                            {/* Opacity slider */}
                            {isVisible && (
                              <div className="mt-3 pl-6 flex items-center gap-3">
                                <span className="text-[10px] font-mono text-mars-muted">Opacity:</span>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="1"
                                  step="0.05"
                                  value={opacity}
                                  onChange={(e) => setLayerOpacity(id, parseFloat(e.target.value))}
                                  className="w-full accent-mars-orange h-1.5 bg-mars-dark rounded-lg cursor-pointer"
                                />
                                <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                                  {Math.round(opacity * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Traversability Cost Grid Overlay Card */}
                  <div className="p-3.5 rounded-xl border border-mars-border bg-mars-panel/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-mars-orange" />
                        <span className="text-xs font-semibold text-white">
                          200 m Cost Grid Overlay
                        </span>
                      </div>
                      <button
                        onClick={toggleTraversabilityGrid}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                          showTraversabilityGrid
                            ? 'bg-mars-orange text-white'
                            : 'bg-mars-surface border border-mars-border text-slate-300 hover:text-white'
                        }`}
                      >
                        {showTraversabilityGrid ? 'Visible' : 'Hidden'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-normal">
                      Renders the 353×298 traversal penalty grid aligned with `raster_bounds`.
                    </p>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-mono border-t border-mars-border/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                        <span>Blocked (Slope ≥20°)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                        <span>Cost 1: Low (&lt;2°)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                        <span>Cost 2: Moderate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-orange-600 inline-block" />
                        <span>Cost 4/8: Steep ridge</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: POIs */}
              {activeTab === 'pois' && (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-mars-muted absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search Jezero targets or sols..."
                        value={poiSearch}
                        onChange={(e) => setPoiSearch(e.target.value)}
                        className="w-full bg-mars-surface border border-mars-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-mars-muted focus:outline-none focus:border-mars-orange"
                      />
                    </div>

                    {/* Type Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
                      <button
                        onClick={() => setSelectedTypeFilter('all')}
                        className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                          selectedTypeFilter === 'all'
                            ? 'bg-mars-orange text-white'
                            : 'bg-mars-panel text-mars-muted hover:text-white'
                        }`}
                      >
                        All ({pois.length})
                      </button>
                      {poiTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedTypeFilter(type)}
                          className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                            selectedTypeFilter === type
                              ? 'bg-mars-orange text-white'
                              : 'bg-mars-panel text-mars-muted hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected POI Inspector Detail Card */}
                  {selectedPoi && (
                    <div className="p-4 rounded-xl border border-mars-orange/60 bg-mars-surface shadow-xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-semibold"
                            style={{
                              backgroundColor: `${getPoiTypeColor(selectedPoi.type)}25`,
                              color: getPoiTypeColor(selectedPoi.type),
                            }}
                          >
                            {selectedPoi.type}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1.5">
                            {selectedPoi.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => setSelectedPoi(null)}
                          className="text-xs text-mars-muted hover:text-white p-1"
                          title="Deselect"
                        >
                          ✕
                        </button>
                      </div>

                      {selectedPoi.description && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedPoi.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-mars-dark/80 p-2.5 rounded-lg border border-mars-border">
                        <div>
                          <span className="text-mars-muted">Coordinates:</span>
                          <div className="text-white font-medium">
                            {formatMarsCoord(selectedPoi.lon, selectedPoi.lat, 4)}
                          </div>
                        </div>

                        {selectedPoi.metadata?.sol !== undefined && (
                          <div>
                            <span className="text-mars-muted">Mission Sol:</span>
                            <div className="text-white font-medium">
                              Sol {selectedPoi.metadata.sol}
                            </div>
                          </div>
                        )}

                        {selectedPoi.metadata?.elevation_m !== undefined && (
                          <div>
                            <span className="text-mars-muted">Elevation:</span>
                            <div className="text-white font-medium">
                              {selectedPoi.metadata.elevation_m} m
                            </div>
                          </div>
                        )}

                        {selectedPoi.metadata?.source && (
                          <div>
                            <span className="text-mars-muted">Source:</span>
                            <div className="text-white font-medium">
                              {selectedPoi.metadata.source}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* List of POIs */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {filteredPois.map((poi) => {
                      const isSelected = selectedPoi?.id === poi.id;
                      const color = getPoiTypeColor(poi.type);

                      return (
                        <div
                          key={poi.id}
                          onClick={() => setSelectedPoi(poi)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-mars-surface border-mars-orange text-white shadow-md'
                              : 'bg-mars-panel/50 border-mars-border hover:bg-mars-surface/60 text-slate-300'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold truncate text-white">
                                {poi.name}
                              </h5>
                              {poi.metadata?.sol !== undefined && (
                                <span className="text-[10px] font-mono text-mars-orange flex-shrink-0 ml-2">
                                  Sol {poi.metadata.sol}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-mars-muted mt-0.5">
                              {formatMarsCoord(poi.lon, poi.lat, 3)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: IMAGES */}
              {activeTab === 'images' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-mars-muted">
                      NASA Mars & Jezero Imagery ({images.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Click to enlarge</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img) => (
                      <div
                        key={img.id || img.title}
                        onClick={() => setLightboxImage(img)}
                        className="group relative rounded-xl overflow-hidden border border-mars-border bg-mars-surface cursor-pointer hover:border-mars-orange transition-all shadow-md"
                      >
                        <div className="aspect-video w-full overflow-hidden bg-black">
                          <img
                            src={img.img_src}
                            alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>

                        <div className="p-2 bg-mars-panel/90">
                          <p className="text-[11px] font-sans font-medium text-white truncate" title={img.title}>
                            {img.title}
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-mono text-mars-muted mt-1">
                            <span>{img.date}</span>
                            <span className="text-mars-orange">{img.id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-mars-panel/40 rounded-lg border border-mars-border text-[11px] text-slate-400 font-mono">
                    Imagery ingested via NASA Image and Video Library search (`Perseverance Jezero Crater surface`).
                  </div>
                </div>
              )}

              {/* TAB 4: SPACE WEATHER */}
              {activeTab === 'weather' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-mars-border bg-mars-surface space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-mars-muted">
                        NASA DONKI Flare Monitor
                      </span>
                      <Activity className="w-4 h-4 text-mars-orange" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded text-xs font-mono font-bold border ${radStyle.badgeClass}`}>
                        {spaceWeather?.radiation_status || 'UNKNOWN'}
                      </div>
                      <span className="text-xs text-slate-300 font-mono">
                        {spaceWeather?.strongest_flare_class
                          ? `Max Flare: ${spaceWeather.strongest_flare_class}`
                          : 'No flares recorded'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-mars-border/60 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-mars-muted">Observation Window:</span>
                        <span className="text-white">{spaceWeather?.window_days || 7} days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-mars-muted">Telemetry Source:</span>
                        <span className="text-white">{spaceWeather?.source || 'NASA DONKI FLR'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-mars-muted">Last Assessment:</span>
                        <span className="text-slate-300">
                          {spaceWeather?.checked_at
                            ? new Date(spaceWeather.checked_at).toLocaleTimeString()
                            : 'Synchronized'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Honesty Disclosure Alert */}
                  <div className="p-4 rounded-xl border border-amber-900/50 bg-amber-950/20 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-mono font-semibold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Scientific Honesty Disclaimer</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Radiation risk is evaluated via Earth-view solar flare detection (NASA DONKI) as an orbital proxy. It is not an in-situ Mars surface dosimeter reading. Status `UNKNOWN` reflects API communication interruption and must be treated as unverified.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: ROUTE PLANNING MODE (TASK 3) */}
              {activeTab === 'route' && <RoutePlanningPanel />}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </>
  );
};
