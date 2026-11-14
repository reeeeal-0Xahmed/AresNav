import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Activity,
  MapPin,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Server,
  Zap,
  Globe,
  Gauge,
} from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';
import { getRadiationStyle } from '../lib/formatters';

export const BriefingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'AresNav — Jezero Crater Mars Mission Control';
  }, []);

  const spaceWeather = useMissionStore((s) => s.spaceWeather);
  const pois = useMissionStore((s) => s.pois);
  const terrainMeta = useMissionStore((s) => s.terrainMeta);
  const backendStatus = useMissionStore((s) => s.backendStatus);

  const radStyle = spaceWeather
    ? getRadiationStyle(spaceWeather.radiation_status)
    : getRadiationStyle('UNKNOWN');

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
      {/* Hero Section */}
      <section className="shrink-0 relative overflow-hidden border-b border-mars-border bg-gradient-to-b from-mars-panel/60 via-mars-darkest to-mars-darkest py-14 sm:py-20">
        {/* Subtle background radar/grid decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Top Mission Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mars-surface border border-mars-orange/30 text-mars-orange text-xs font-mono uppercase tracking-wider mb-6 shadow-sm shadow-mars-orange/10">
              <span className="w-2 h-2 rounded-full bg-mars-orange animate-ping" />
              <span>NASA Space Apps 2026 • Martian Map</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
              AresNav: Jezero Crater <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mars-orange via-orange-400 to-amber-400">
                Rover Mission Planner
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              Tactical traverse planning and autonomous obstacle evaluation for the{' '}
              <span className="text-white font-semibold">Mars 2020 Perseverance rover</span>.
              Combining published USGS HRSC/MOLA 200m blended elevations, real-time NASA DONKI solar radiation telemetry, and C++17 k-shortest pathfinding.
            </p>

            {/* Call to Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/explorer"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-gradient-to-r from-mars-orange to-mars-rust text-white font-mono font-semibold text-sm shadow-lg shadow-mars-orange/25 hover:shadow-mars-orange/40 hover:brightness-110 transition-all group"
              >
                <Compass className="w-5 h-5 text-white group-hover:rotate-45 transition-transform" />
                <span>Launch Mars Explorer</span>
                <ArrowRight className="w-4 h-4 text-orange-200 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg bg-mars-surface border border-mars-border text-slate-300 hover:text-white hover:border-slate-500 font-mono text-sm transition-all"
              >
                <Info className="w-4 h-4 text-mars-muted" />
                <span>Mission Data & Assumptions</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Mission Telemetry Cards */}
      <section className="shrink-0 py-10 bg-mars-darkest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-mono uppercase tracking-widest text-mars-muted flex items-center gap-2">
              <Activity className="w-4 h-4 text-mars-orange" />
              <span>Live Mission Context Telemetry</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Session: {terrainMeta?.version ? `${terrainMeta.version.slice(0, 8)}...` : 'Synchronizing'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Space Weather & Radiation Card */}
            <div className="bg-mars-surface/80 rounded-xl p-5 border border-mars-border flex flex-col justify-between hover:border-mars-border/80 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-mars-muted uppercase tracking-wider">
                    Solar Radiation Status
                  </span>
                  <Activity className="w-4 h-4 text-mars-orange" />
                </div>

                <div className="mt-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold border ${radStyle.badgeClass}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>{spaceWeather?.radiation_status || 'UNKNOWN'}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-normal">
                  {spaceWeather?.strongest_flare_class
                    ? `Strongest 7d flare: ${spaceWeather.strongest_flare_class}`
                    : 'Awaiting NASA DONKI flare telemetry'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-mars-border/60">
                <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>Earth-view flare proxy, not surface dosimeter</span>
                </span>
              </div>
            </div>

            {/* 2. Science POIs Card */}
            <div className="bg-mars-surface/80 rounded-xl p-5 border border-mars-border flex flex-col justify-between hover:border-mars-border/80 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-mars-muted uppercase tracking-wider">
                    Science Targets & POIs
                  </span>
                  <MapPin className="w-4 h-4 text-mars-orange" />
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-white">
                    {pois.length}
                  </span>
                  <span className="text-xs font-mono text-mars-muted">waypoints in Jezero</span>
                </div>

                <p className="mt-2 text-xs text-slate-400 leading-normal">
                  Mars 2020 Perseverance waypoints, delta scarps, craters & sample sites.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-mars-border/60">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>Source: NASA JPL MMGIS</span>
                </span>
              </div>
            </div>

            {/* 3. Regional Grid Dimensions */}
            <div className="bg-mars-surface/80 rounded-xl p-5 border border-mars-border flex flex-col justify-between hover:border-mars-border/80 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-mars-muted uppercase tracking-wider">
                    Regional DEM Grid
                  </span>
                  <Layers className="w-4 h-4 text-mars-orange" />
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-white">
                    353 × 298
                  </span>
                  <span className="text-xs font-mono text-mars-muted">cells</span>
                </div>

                <p className="mt-2 text-xs text-slate-400 leading-normal">
                  200 m resolution (~70.6 × 59.6 km total extent), 105,194 cells evaluated.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-mars-border/60">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <span>USGS HRSC/MOLA 200m Blend v2</span>
                </span>
              </div>
            </div>

            {/* 4. Backend Engine Status */}
            <div className="bg-mars-surface/80 rounded-xl p-5 border border-mars-border flex flex-col justify-between hover:border-mars-border/80 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-mars-muted uppercase tracking-wider">
                    Solver Engine
                  </span>
                  <Server className="w-4 h-4 text-mars-orange" />
                </div>

                <div className="mt-3">
                  {backendStatus.mockMode ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>MOCK MODE (OFFLINE)</span>
                    </div>
                  ) : backendStatus.online ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>ONLINE ({backendStatus.latencyMs}ms)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-rose-950/60 text-rose-400 border border-rose-500/40 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>OFFLINE</span>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-normal">
                  C++17 k-shortest pathfinder + Laravel mission briefing service.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-mars-border/60">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span>Sub-second multi-route solver</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jezero Regional Map Preview & Geographic Bounds */}
      <section className="shrink-0 py-12 border-t border-mars-border bg-mars-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Map Preview Image */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl overflow-hidden border border-mars-border shadow-2xl bg-mars-surface group">
                <img
                  src="/regional_terrain_preview.png"
                  alt="Jezero Crater 200m regional terrain elevation and traversal cost preview"
                  className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-500"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-mars-darkest/95 via-mars-darkest/70 to-transparent p-4 sm:p-5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-semibold">Jezero Crater Regional Model</span>
                    <span className="text-mars-orange">353 × 298 cells | 200 m nominal</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Left: Raw MOLA/HRSC blended elevation. Right: Computed traversal penalty cost map (costs 1, 2, 4, 8 and blocked -1).
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Regional Boundaries & Planning Assumptions */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white font-sans">
                  Jezero Regional Boundaries
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  The mission planning bounding box matches the user-selected Mars Trek viewport, covering Jezero crater floor, delta fans, and outer rim breaches.
                </p>
              </div>

              {/* Coordinates Box */}
              <div className="bg-mars-surface rounded-xl p-4 border border-mars-border space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-mars-border/60 pb-2">
                  <span className="text-mars-muted">Western Longitude:</span>
                  <span className="text-white font-semibold">76.80291°E</span>
                </div>
                <div className="flex items-center justify-between border-b border-mars-border/60 pb-2">
                  <span className="text-mars-muted">Eastern Longitude:</span>
                  <span className="text-white font-semibold">78.05673°E</span>
                </div>
                <div className="flex items-center justify-between border-b border-mars-border/60 pb-2">
                  <span className="text-mars-muted">Southern Latitude:</span>
                  <span className="text-white font-semibold">17.96349°N</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-mars-muted">Northern Latitude:</span>
                  <span className="text-white font-semibold">18.96874°N</span>
                </div>
              </div>

              {/* Mission Assumptions Box */}
              <div className="bg-mars-panel/60 rounded-xl p-4 border border-amber-900/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-semibold">
                  <Gauge className="w-4 h-4" />
                  <span>Planning Constraints & Assumptions</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11px] leading-relaxed">
                  <li><strong>EVA Walking Speed:</strong> Assumed at 2.0 km/h (suited astronaut / rover pace).</li>
                  <li><strong>EVA Duration Budget:</strong> 8.0 hours max round-trip before NO-GO.</li>
                  <li><strong>Slope Safety:</strong> Caution at ≥10.0°, hard obstacle cut-off at ≥20.0°.</li>
                  <li><strong>Local Deviation:</strong> Blocked if terrain deviation exceeds 80 m.</li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  to="/explorer"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-mars-orange hover:bg-mars-rust text-white font-mono font-semibold text-xs tracking-wider uppercase transition-colors shadow-md shadow-mars-orange/20"
                >
                  <Compass className="w-4 h-4" />
                  <span>Open Interactive Map</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
