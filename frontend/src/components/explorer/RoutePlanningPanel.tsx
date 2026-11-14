import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  MapPin,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Crosshair,
  X,
} from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { formatMarsCoord, getVerdictStyle } from '../../lib/formatters';
import { DEMO_PRESETS, DemoPreset } from '../../lib/demoPresets';

export const RoutePlanningPanel: React.FC = () => {
  const navigate = useNavigate();
  const [showLimitations, setShowLimitations] = useState(false);

  // Store state
  const start = useMissionStore((s) => s.start);
  const target = useMissionStore((s) => s.target);
  const setStart = useMissionStore((s) => s.setStart);
  const setTarget = useMissionStore((s) => s.setTarget);
  const pickingMode = useMissionStore((s) => s.pickingMode);
  const setPickingMode = useMissionStore((s) => s.setPickingMode);
  const blockedPoint = useMissionStore((s) => s.blockedPoint);
  const rateLimitCountdown = useMissionStore((s) => s.rateLimitCountdown);
  const isLoadingRoute = useMissionStore((s) => s.isLoadingRoute);
  const routeError = useMissionStore((s) => s.routeError);
  const routeResult = useMissionStore((s) => s.routeResult);
  const selectedRank = useMissionStore((s) => s.selectedPathRank);
  const setSelectedPathRank = useMissionStore((s) => s.setSelectedPathRank);
  const planRoute = useMissionStore((s) => s.planRoute);
  const resetRoute = useMissionStore((s) => s.resetRoute);
  const pois = useMissionStore((s) => s.pois);
  const setSelectedPoi = useMissionStore((s) => s.setSelectedPoi);

  // Active path and verdict style
  const activePath =
    routeResult?.paths?.find((p) => p.rank === selectedRank) ||
    routeResult?.paths?.[0];
  const verdictStyle = activePath ? getVerdictStyle(activePath.briefing.verdict) : null;

  const handleApplyPreset = (preset: DemoPreset) => {
    setStart(preset.start);
    setTarget(preset.target);
    setPickingMode(null);
  };

  const handleOpenReport = () => {
    navigate('/report');
  };

  return (
    <div className="space-y-6">
      {/* Waypoint Selection Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-mars-muted flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-mars-orange" />
            <span>Mission Waypoints</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {pickingMode ? `Click map to place ${pickingMode}` : 'Drag markers on map'}
          </span>
        </div>

        {/* Start Point Card */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            blockedPoint === 'start'
              ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
              : pickingMode === 'start'
              ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
              : 'bg-mars-surface border-mars-border'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-xs font-mono font-semibold text-white">Start Point:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPickingMode(pickingMode === 'start' ? null : 'start')}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                  pickingMode === 'start'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-mars-panel text-slate-300 hover:text-white hover:bg-mars-dark'
                }`}
                title="Click on the Mars map to set Start position"
              >
                <Crosshair className="w-3 h-3 text-emerald-400" />
                <span>{pickingMode === 'start' ? 'Click Map...' : 'Pick on Map'}</span>
              </button>

              {start && (
                <button
                  onClick={() => setStart(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-mars-panel"
                  title="Clear Start point"
                  aria-label="Clear Start point"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span className="text-[11px]">
              {start ? formatMarsCoord(start.lon, start.lat, 4) : 'Not selected'}
            </span>

            {/* Quick POI dropdown selector */}
            <select
              aria-label="Select Start from known POI"
              onChange={(e) => {
                const poi = pois.find((p) => String(p.id) === e.target.value);
                if (poi) {
                  setStart({ lon: Number(poi.lon.toFixed(5)), lat: Number(poi.lat.toFixed(5)) });
                  setPickingMode(null);
                }
              }}
              value=""
              className="bg-mars-dark text-slate-300 border border-mars-border rounded px-2 py-0.5 text-[10px] font-mono focus:outline-none focus:border-mars-orange"
            >
              <option value="" disabled>
                Select POI...
              </option>
              {pois.map((poi) => (
                <option key={poi.id} value={poi.id}>
                  {poi.name}
                </option>
              ))}
            </select>
          </div>

          {blockedPoint === 'start' && (
            <div className="mt-2 text-[11px] font-mono text-rose-300 flex items-center gap-1.5 pt-1 border-t border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>Blocked cell (&gt;20° slope / crater cliff). Drag marker to flatter ground.</span>
            </div>
          )}
        </div>

        {/* Target Point Card */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            blockedPoint === 'target'
              ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
              : pickingMode === 'target'
              ? 'bg-mars-orange/20 border-mars-orange ring-1 ring-mars-orange/50'
              : 'bg-mars-surface border-mars-border'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-mars-orange flex-shrink-0" />
              <span className="text-xs font-mono font-semibold text-white">Target Point:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPickingMode(pickingMode === 'target' ? null : 'target')}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                  pickingMode === 'target'
                    ? 'bg-mars-orange text-white font-semibold'
                    : 'bg-mars-panel text-slate-300 hover:text-white hover:bg-mars-dark'
                }`}
                title="Click on the Mars map to set Target position"
              >
                <Crosshair className="w-3 h-3 text-mars-orange" />
                <span>{pickingMode === 'target' ? 'Click Map...' : 'Pick on Map'}</span>
              </button>

              {target && (
                <button
                  onClick={() => setTarget(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-mars-panel"
                  title="Clear Target point"
                  aria-label="Clear Target point"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span className="text-[11px]">
              {target ? formatMarsCoord(target.lon, target.lat, 4) : 'Not selected'}
            </span>

            {/* Quick POI dropdown selector */}
            <select
              aria-label="Select Target from known POI"
              onChange={(e) => {
                const poi = pois.find((p) => String(p.id) === e.target.value);
                if (poi) {
                  setTarget({ lon: Number(poi.lon.toFixed(5)), lat: Number(poi.lat.toFixed(5)) });
                  setPickingMode(null);
                }
              }}
              value=""
              className="bg-mars-dark text-slate-300 border border-mars-border rounded px-2 py-0.5 text-[10px] font-mono focus:outline-none focus:border-mars-orange"
            >
              <option value="" disabled>
                Select POI...
              </option>
              {pois.map((poi) => (
                <option key={poi.id} value={poi.id}>
                  {poi.name}
                </option>
              ))}
            </select>
          </div>

          {blockedPoint === 'target' && (
            <div className="mt-2 text-[11px] font-mono text-rose-300 flex items-center gap-1.5 pt-1 border-t border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>Blocked cell (&gt;20° slope / crater cliff). Drag marker to flatter ground.</span>
            </div>
          )}
        </div>
      </div>

      {/* Demo Traverse Presets */}
      <div className="space-y-2 pt-2 border-t border-mars-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-mars-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Demo Traverse Presets</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-mars-surface text-amber-400/90 border border-amber-500/30">
            Unverified (Regional 200m)
          </span>
        </div>

        <div className="space-y-1.5">
          {DEMO_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="w-full p-2.5 rounded-lg bg-mars-surface hover:bg-mars-panel border border-mars-border hover:border-mars-orange/50 text-left transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-mars-orange transition-colors">
                  {preset.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {preset.description} (~{preset.approxKm} km)
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-mars-muted group-hover:text-mars-orange transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons: Plan Route & Reset */}
      <div className="space-y-2 pt-2 border-t border-mars-border">
        <button
          onClick={planRoute}
          disabled={!start || !target || isLoadingRoute || rateLimitCountdown > 0}
          className={`w-full py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            !start || !target || rateLimitCountdown > 0
              ? 'bg-mars-surface text-slate-500 border border-mars-border cursor-not-allowed'
              : isLoadingRoute
              ? 'bg-mars-rust text-white cursor-wait animate-pulse'
              : 'bg-gradient-to-r from-mars-orange to-mars-red hover:from-orange-500 hover:to-red-600 text-white shadow-mars-orange/25 hover:shadow-mars-orange/40'
          }`}
        >
          <Navigation className={`w-4 h-4 ${isLoadingRoute ? 'animate-spin' : ''}`} />
          <span>
            {rateLimitCountdown > 0
              ? `Rate Limit Cooldown (${rateLimitCountdown}s)`
              : isLoadingRoute
              ? 'Computing 200m Paths...'
              : 'Compute Traverse Paths'}
          </span>
        </button>

        {routeResult && (
          <button
            onClick={resetRoute}
            className="w-full py-2 px-3 rounded-lg bg-mars-surface hover:bg-mars-panel text-slate-300 hover:text-white border border-mars-border text-xs font-mono flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-mars-muted" />
            <span>Reset Traverse</span>
          </button>
        )}
      </div>

      {/* Route Error Notice Banner (Human-readable per Task 3 requirement 7) */}
      {routeError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 text-xs font-mono space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              {routeError.code === 'BLOCKED_POINT'
                ? 'Impassable Waypoint Terrain'
                : routeError.code === 'MAP_CHANGED'
                ? 'Map Version Reloaded'
                : routeError.code === 'NO_PATH'
                ? 'No Traversable Path'
                : routeError.status === 429
                ? 'Planner Rate Limit (5/min)'
                : 'Traverse Calculation Error'}
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-300">
            {routeError.code === 'BLOCKED_POINT'
              ? 'The selected marker lies on a blocked cell (slope ≥ 20° / steep cliff wall). Please drag the marker to smoother ground.'
              : routeError.code === 'NO_PATH'
              ? 'A safe continuous path between these coordinates could not be computed without exceeding slope limits.'
              : routeError.code === 'MAP_CHANGED'
              ? 'Terrain grid version updated on server. The map metadata has been re-synced; please retry planning.'
              : routeError.status === 429
              ? `You have reached the server rate limit of 5 route calculations per minute. Please wait ${rateLimitCountdown || 5}s.`
              : routeError.message}
          </p>
        </div>
      )}

      {/* Route Results Briefing Card (Task 3 requirement 5) */}
      {routeResult && activePath && (
        <div className="space-y-4 pt-2 border-t border-mars-border">
          {/* Candidate Path Rank Selector */}
          {routeResult.paths && routeResult.paths.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-mars-muted">
                Candidate Paths:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {routeResult.paths.map((p) => {
                  const isCur = p.rank === selectedRank;
                  const vStyle = getVerdictStyle(p.briefing.verdict);
                  return (
                    <button
                      key={p.rank}
                      onClick={() => setSelectedPathRank(p.rank)}
                      className={`py-2 px-2 rounded-lg border text-xs font-mono transition-all flex flex-col items-center justify-center gap-1 ${
                        isCur
                          ? 'bg-mars-surface border-mars-orange text-white shadow-sm'
                          : 'bg-mars-dark/60 border-mars-border text-slate-400 hover:text-white hover:bg-mars-surface'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        <span>Rank {p.rank}</span>
                        {p.rank === 1 && <span className="text-[9px] text-emerald-400">★</span>}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${vStyle.badgeClass}`}>
                        {p.briefing.verdict}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verdict Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              verdictStyle ? verdictStyle.badgeClass : 'bg-mars-surface border-mars-border'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-xs font-mono uppercase tracking-wider">Traverse Verdict</div>
                <div className="text-lg font-bold font-mono tracking-wide">
                  {activePath.briefing.verdict}
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-300">
              <div>Penalty Cost: <span className="font-bold text-white">{activePath.cost}</span></div>
              <div className="text-[10px] text-slate-400">({activePath.steps} cells @ 200m)</div>
            </div>
          </div>

          {/* Reasons List */}
          {activePath.briefing.reasons && activePath.briefing.reasons.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-mars-muted uppercase tracking-wider">
                Verdict Evaluation Reasons:
              </span>
              <div className="space-y-1">
                {activePath.briefing.reasons.map((r, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-mars-surface border border-mars-border text-xs font-mono text-slate-200 flex items-start gap-2"
                  >
                    <span className="text-amber-400 font-bold">•</span>
                    <div className="leading-snug">
                      <span className="text-amber-300 font-semibold mr-1.5">[{r.code}]:</span>
                      <span>{r.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Distance */}
            <div className="p-2.5 rounded-xl bg-mars-surface border border-mars-border">
              <div className="text-mars-muted text-[10px]">Distance (Horizontal)</div>
              <div className="text-base font-bold text-white mt-0.5">
                {(activePath.distance_meters / 1000).toFixed(2)} km
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activePath.distance_meters.toLocaleString()} m ground length
              </div>
            </div>

            {/* Traversal Cost */}
            <div className="p-2.5 rounded-xl bg-mars-surface border border-mars-border">
              <div className="text-mars-muted text-[10px]">Cost (Traversal Penalty)</div>
              <div className="text-base font-bold text-mars-orange mt-0.5">
                {activePath.cost}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {activePath.steps} grid steps (NOT distance)
              </div>
            </div>

            {/* EVA Hours */}
            <div className="p-2.5 rounded-xl bg-mars-surface border border-mars-border">
              <div className="text-mars-muted text-[10px] flex items-center justify-between">
                <span>EVA Time (Round-trip)</span>
                <Clock className="w-3 h-3 text-slate-400" />
              </div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  activePath.briefing.eva.round_trip_hours > 8.0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {activePath.briefing.eva.round_trip_hours.toFixed(1)} h
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Budget: 8.0 h (speed 2 km/h assumption)
              </div>
            </div>

            {/* Radiation Proxy */}
            <div className="p-2.5 rounded-xl bg-mars-surface border border-mars-border">
              <div className="text-mars-muted text-[10px] flex items-center justify-between">
                <span>Radiation Flare Proxy</span>
                <Activity className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {activePath.briefing.radiation.status}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Earth-view DONKI solar proxy
              </div>
            </div>
          </div>

          {/* Terrain Slope & Elevation Stats */}
          <div className="p-3 rounded-xl bg-mars-surface border border-mars-border space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-mars-border pb-1.5 text-mars-muted">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-mars-orange" />
                <span>Terrain Slopes &amp; Elevations</span>
              </span>
              <span className="text-[10px] text-slate-400">200m DEM Statistics</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-mars-dark/60 p-2 rounded-lg">
                <div className="text-[10px] text-mars-muted">Max Slope</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {activePath.briefing.terrain.max_slope_deg.toFixed(1)}°
                </div>
              </div>
              <div className="bg-mars-dark/60 p-2 rounded-lg">
                <div className="text-[10px] text-mars-muted">Mean Slope</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {activePath.briefing.terrain.mean_slope_deg.toFixed(1)}°
                </div>
              </div>
              <div className="bg-mars-dark/60 p-2 rounded-lg">
                <div className="text-[10px] text-mars-muted">95th % Slope</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {activePath.briefing.terrain.p95_slope_deg.toFixed(1)}°
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">Ascent / Descent:</span>
              <span className="font-semibold text-white">
                +{activePath.briefing.terrain.ascent_m.toFixed(0)}m / -{activePath.briefing.terrain.descent_m.toFixed(0)}m
              </span>
            </div>

            {activePath.briefing.terrain.elevation_min_m != null && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Elevation Range:</span>
                <span className="font-semibold text-white">
                  {activePath.briefing.terrain.elevation_min_m.toFixed(0)}m to{' '}
                  {activePath.briefing.terrain.elevation_max_m?.toFixed(0)}m
                </span>
              </div>
            )}

            {/* Cost Cells Distribution Bar */}
            <div className="pt-2 border-t border-mars-border">
              <div className="flex items-center justify-between text-[10px] text-mars-muted mb-1">
                <span>Cost Cell Breakdown:</span>
                <span>
                  High-Cost Share: {(activePath.briefing.terrain.high_cost_share * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full bg-mars-dark rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      ((activePath.briefing.terrain.cost_cells['1'] || 0) / activePath.steps) * 100
                    }%`,
                  }}
                  className="bg-emerald-500 h-full"
                  title="Cost 1 (<2° flat floor)"
                />
                <div
                  style={{
                    width: `${
                      ((activePath.briefing.terrain.cost_cells['2'] || 0) / activePath.steps) * 100
                    }%`,
                  }}
                  className="bg-yellow-500 h-full"
                  title="Cost 2 (2–5° moderate)"
                />
                <div
                  style={{
                    width: `${
                      ((activePath.briefing.terrain.cost_cells['4'] || 0) / activePath.steps) * 100
                    }%`,
                  }}
                  className="bg-orange-500 h-full"
                  title="Cost 4 (>5° steep)"
                />
                <div
                  style={{
                    width: `${
                      ((activePath.briefing.terrain.cost_cells['8'] || 0) / activePath.steps) * 100
                    }%`,
                  }}
                  className="bg-rose-600 h-full"
                  title="Cost 8 (>10° high slope)"
                />
              </div>
            </div>
          </div>

          {/* Science Stops along route */}
          {activePath.briefing.science_stops && activePath.briefing.science_stops.length > 0 && (
            <div className="p-3 rounded-xl bg-mars-surface border border-mars-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-mars-muted border-b border-mars-border pb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>En-Route Science Targets ({activePath.briefing.science_stops.length})</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {activePath.briefing.science_stops.map((stop, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const matched = pois.find((p) => p.name === stop.name || p.id === stop.id);
                      if (matched) setSelectedPoi(matched);
                    }}
                    className="p-2 rounded-lg bg-mars-dark/60 hover:bg-mars-dark cursor-pointer border border-mars-border/80 flex items-center justify-between text-xs font-mono transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {stop.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{stop.type.replace('_', ' ')}</div>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-semibold">
                      +{stop.distance_to_path_m}m to path
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Limitations (API strings verbatim) */}
          {activePath.briefing.limitations && activePath.briefing.limitations.length > 0 && (
            <div className="rounded-xl border border-mars-border bg-mars-surface/60 overflow-hidden">
              <button
                onClick={() => setShowLimitations(!showLimitations)}
                className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-mono text-mars-muted hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Mission Planning Limitations</span>
                </div>
                {showLimitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showLimitations && (
                <div className="px-3 pb-3 space-y-2 border-t border-mars-border pt-2 text-xs font-mono text-slate-300">
                  {activePath.briefing.limitations.map((lim, i) => (
                    <div key={i} className="flex items-start gap-2 leading-relaxed text-[11px]">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Open Mission Report Button (Task 3 requirement 9) */}
          <button
            onClick={handleOpenReport}
            className="w-full py-3 px-4 rounded-xl bg-mars-surface hover:bg-mars-panel border border-mars-orange/60 hover:border-mars-orange text-white text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <FileText className="w-4 h-4 text-mars-orange" />
            <span>Open Mission Report →</span>
          </button>
        </div>
      )}
    </div>
  );
};
