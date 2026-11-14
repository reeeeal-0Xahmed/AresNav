import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  ShieldAlert,
  Layers,
  Compass,
  ArrowLeft,
  Route,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  // Document Title
  useEffect(() => {
    document.title = 'AresNav — Scientific Documentation & Data Sources';
  }, []);

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto print-page-wrapper selection:bg-mars-orange/30">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="border-b border-mars-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mars-surface border border-mars-border text-mars-orange text-xs font-mono uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>NASA Space Apps 2026 • Documentation & Attribution</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-sans tracking-tight">
            Data Sources, Physics Models & Scientific Honesty
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
            AresNav is built on authentic planetary datasets from NASA and USGS, paired with rigorous traversal heuristics. This document outlines every active data layer, mathematical assumptions, elevation accuracy constraints, and operational limitations.
          </p>
        </div>

        {/* =================================================================
            1. HONESTY RULES & OPERATIONAL DISCLAIMER
           ================================================================= */}
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-6 text-slate-200 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-mono font-bold text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>Operational Reality & Scientific Honesty Rules</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            AresNav adheres strictly to scientific honesty guidelines. All pathfinding metrics, slope calculations, and radiation statuses are experimental regional planning tools:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300 pt-1">
            <div className="p-3 rounded-xl bg-mars-dark/60 border border-mars-border/80">
              <strong className="text-amber-400">Regional Spacing ≠ Point Accuracy:</strong> Nominal 200 m raster cell spacing reflects cell-centre measurements, not rock- or crater-scale hazard detection.
            </div>
            <div className="p-3 rounded-xl bg-mars-dark/60 border border-mars-border/80">
              <strong className="text-amber-400">Earth-View Flare Proxy:</strong> Solar radiation telemetry from NASA DONKI detects orbital solar flares, not Mars-surface dosimeter measurements.
            </div>
            <div className="p-3 rounded-xl bg-mars-dark/60 border border-mars-border/80">
              <strong className="text-amber-400">Planning Assumptions:</strong> The 2.0 km/h speed, 8.0 h EVA budget, and 10°/20° slope thresholds are operational heuristics, not NASA flight limits.
            </div>
            <div className="p-3 rounded-xl bg-mars-dark/60 border border-mars-border/80">
              <strong className="text-amber-400">Negative Elevations Normal:</strong> Elevations below 0 m represent authentic Martian datum (areoid) depths in Jezero Crater, not obstacles.
            </div>
          </div>
        </div>

        {/* =================================================================
            2. THE 5 NASA MARS TREK WMTS TILE LAYERS
           ================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-mars-border pb-3">
            <div>
              <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
                <Compass className="w-5 h-5 text-mars-orange" />
                <span>NASA Mars Trek WMTS Tile Layers</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                OGC Web Map Tile Services rendered in Mars spherical equirectangular CRS (EPSG:104905)
              </p>
            </div>
            <span className="text-xs font-mono text-mars-muted bg-mars-surface px-2.5 py-1 rounded border border-mars-border">
              R = 3,396,190 m
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Layer 1: Viking MDIM 2.1 */}
            <div className="bg-mars-surface border border-mars-border rounded-xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Viking MDIM 2.1 Color Mosaic</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-panel text-emerald-400 border border-emerald-500/30">
                  Default Base • Verified (200 OK)
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Global 232 m/pixel natural-color mosaic created from Viking Orbiter images. Serves as the reliable regional base layer for broad geological context across Jezero Crater. Native tiles serve Zoom 0–7; clamped tilegrid enables sharp client-side oversampling at Zoom 8–14.
              </p>
              <div className="pt-1 text-[10px] font-mono text-mars-muted flex items-center justify-between border-t border-mars-border/50">
                <span>Product: Mars_Viking_MDIM21_ClrMosaic_global_232m</span>
                <span>Zoom 0–7</span>
              </div>
            </div>

            {/* Layer 2: HiRISE Jezero */}
            <div className="bg-mars-surface border border-mars-border rounded-xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>HiRISE Jezero Crater Orthomosaic</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-panel text-cyan-400 border border-cyan-500/30">
                  High-Res Inset • Verified (200 OK)
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Ultra-high-resolution 25 cm/pixel orthorectified mosaic from the Mars Reconnaissance Orbiter (MRO) High Resolution Imaging Science Experiment (HiRISE). Covers the Perseverance landing site and western fan delta with remarkable boulder- and outcrop-scale clarity.
              </p>
              <div className="pt-1 text-[10px] font-mono text-mars-muted flex items-center justify-between border-t border-mars-border/50">
                <span>Product: JEZ_hirise_soc_006_orthoMosaic_25cm</span>
                <span>Zoom 0–16</span>
              </div>
            </div>

            {/* Layer 3: MGS MOLA Color Shaded Relief */}
            <div className="bg-mars-surface border border-mars-border rounded-xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>MOLA Color Shaded Relief</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-panel text-amber-400 border border-amber-500/30">
                  Topography • Verified (200 OK)
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Mars Global Surveyor (MGS) Mars Orbiter Laser Altimeter 463 m/pixel color-coded topographic relief. Provides instant visual recognition of regional elevation gradients, crater wall scarps, and delta scarp incisions across the Jezero quadrangle.
              </p>
              <div className="pt-1 text-[10px] font-mono text-mars-muted flex items-center justify-between border-t border-mars-border/50">
                <span>Product: Mars_MGS_MOLA_ClrShade_merge_global_463m</span>
                <span>Zoom 0–7</span>
              </div>
            </div>

            {/* Layer 4: USGS Geologic Map */}
            <div className="bg-mars-surface border border-mars-border rounded-xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>USGS Jezero Geologic Units Map</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-panel text-purple-400 border border-purple-500/30">
                  Geology • Regional 100m
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Scientific mapping of Jezero crater floor units, olivine-bearing bedrock, delta front sandstones, and crater rim carbonates. If backend tiles are unconfigured, AresNav shows a visible layer alert badge without disrupting the primary Viking base map.
              </p>
              <div className="pt-1 text-[10px] font-mono text-mars-muted flex items-center justify-between border-t border-mars-border/50">
                <span>Product: USGS SIM 3464 Geologic Map</span>
                <span>Zoom 0–14</span>
              </div>
            </div>

            {/* Layer 5: MRO CTX Mosaic */}
            <div className="bg-mars-surface border border-mars-border rounded-xl p-5 space-y-2.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>MRO CTX Regional Mosaic</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-panel text-slate-300 border border-slate-500/30">
                  Context • 5 m/pixel
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Context Camera (CTX) regional black-and-white surface mosaic (~5 to 6 m/pixel) bridging the spatial scale between regional Viking imagery and targeted HiRISE swaths. Provides seamless morphologic context across the entire 70 km Jezero impact basin.
              </p>
              <div className="pt-1 text-[10px] font-mono text-mars-muted flex items-center justify-between border-t border-mars-border/50">
                <span>Product: Mars_MRO_CTX_Jezero_Mosaic</span>
                <span>Zoom 0–14</span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            3. DIGITAL ELEVATION MODEL (DEM) & ACCURACY LIMITS
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="border-b border-mars-border pb-3">
            <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
              <Layers className="w-5 h-5 text-mars-orange" />
              <span>Digital Elevation Model (DEM) & Physical Accuracy Limits</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Citation: Fergason, R. L., Hare, T. M., & Laura, J. (2018). HRSC and MOLA Blended DEM at 200m v2
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              The regional elevation substrate in AresNav is derived directly from the published USGS global 200 m GeoTIFF (Fergason et al., 2018). It is resampled into a 353 × 298 spherical raster grid covering coordinates from <strong>76.8029°E to 78.0567°E</strong> and <strong>17.9635°N to 18.9687°N</strong>.
            </p>

            <div className="p-4 rounded-xl bg-mars-dark/80 border border-mars-border space-y-2">
              <div className="font-mono font-bold text-mars-orange text-xs">
                Key Methodological Findings & Limits (from SOURCES.md):
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-300 font-mono">
                <li>
                  <strong>200 m pixel spacing ≠ 200 m independent accuracy:</strong> The USGS blended model combines Mars Global Surveyor MOLA altimetry (~463 m) with Mars Express High Resolution Stereo Camera (HRSC) stereogrammetry (~50 m) using spatial interpolation.
                </li>
                <li>
                  <strong>44% HRSC Coverage:</strong> HRSC digital elevation data covers approximately 44% of Mars; outside HRSC tracks, elevation values revert to interpolated MOLA points.
                </li>
                <li>
                  <strong>Regional Planning Only:</strong> Slope calculations represent differences between adjacent 200 m grid cell centers. Sub-pixel local slopes, boulders, sand ripples, and rover-scale ditches can be substantially steeper than the mean cell slope.
                </li>
                <li>
                  <strong>Martian Areoid Datum:</strong> Martian elevations are referenced to the Martian gravity datum (areoid). Elevations in Jezero Crater range from -2,580 m to -2,300 m. These negative numbers are natural topographies and do not represent obstacles.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* =================================================================
            4. PATHFINDING ENGINE & TRAVERSAL COST MATHEMATICS
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="border-b border-mars-border pb-3">
            <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
              <Route className="w-5 h-5 text-mars-orange" />
              <span>Pathfinder Architecture & Cost Penalty Mathematics</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Deterministic multi-alternative grid search on a 353 × 298 traversability friction matrix
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <h3 className="font-mono font-bold text-white text-sm">Traversability Cost Function</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Rather than calculating simple Euclidean straight-line distance, AresNav assigns an empirical traversal friction score to each 200 m raster cell based on slope steepness and localized roughness:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded bg-mars-dark border border-mars-border flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">Cost 1 (Multiplier 1.0):</span>
                  <span>Slope &lt; 2.0° (Flat terrain)</span>
                </div>
                <div className="p-2 rounded bg-mars-dark border border-mars-border flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">Cost 2 (Multiplier 2.0):</span>
                  <span>Slope 2.0° – 5.0° (Moderate)</span>
                </div>
                <div className="p-2 rounded bg-mars-dark border border-mars-border flex items-center justify-between">
                  <span className="text-amber-400 font-bold">Cost 4 (Multiplier 4.0):</span>
                  <span>Slope 5.0° – 10.0° (Steep)</span>
                </div>
                <div className="p-2 rounded bg-mars-dark border border-mars-border flex items-center justify-between">
                  <span className="text-rose-400 font-bold">Cost 8 (Multiplier 8.0):</span>
                  <span>Slope &gt; 10.0° (Caution)</span>
                </div>
                <div className="p-2 rounded bg-rose-950/40 border border-rose-500/40 flex items-center justify-between text-rose-300">
                  <span className="font-bold">Cost ∞ (Impassable Barrier):</span>
                  <span>Slope ≥ 20.0° (Cliff / Wall)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono font-bold text-white text-sm">3-Candidate Alternative Routing</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The pathfinder generates up to 3 distinct candidate trajectories (Rank 1, 2, and 3) using an iterative penalty-weighting algorithm:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[11px] text-slate-300 font-mono">
                <li>
                  <strong>Rank 1 (Primary):</strong> The global optimal path minimizing cumulative traversal cost.
                </li>
                <li>
                  <strong>Rank 2 & Rank 3 (Alternatives):</strong> Distinct routes computed by penalizing previously selected corridors, offering alternative approaches around crater scarps and delta terraces.
                </li>
                <li>
                  <strong>Same-Cell Handling:</strong> If Start and Target waypoints reside within the same 200 m raster cell, the system returns a single-point traverse with distance 0, steps 0, and cost 0.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* =================================================================
            5. MISSION VERDICTS & PLANNING ASSUMPTIONS
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="border-b border-mars-border pb-3">
            <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Verdict Determination Criteria</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Standardized criteria evaluated for every candidate traverse
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>GO Verdict</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Traverse is continuous and traversable. All slopes are &lt; 10°, round-trip EVA is &le; 8.0 hours, and space weather radiation telemetry is NOMINAL.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>CAUTION Verdict</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Path remains technically traversable, but traverses terrain cells with slopes between 10° and 20°, or solar weather telemetry reports ELEVATED flare activity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>NO-GO Verdict</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Traverse is blocked by an impassable &ge; 20° cliff, round-trip EVA exceeds the 8.0 hour budget, or solar radiation reports a severe solar STORM event.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================================
            6. CHALLENGE INFO, CITATIONS & CREDITS
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="border-b border-mars-border pb-3">
            <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-mars-orange" />
              <span>Challenge, Attribution & Open-Source Licensing</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              NASA Space Apps Challenge 2026: "Interplanetary Survival Guide – Martian Map"
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              AresNav was developed as a mission-control-grade planetary rover navigation tool for the NASA Space Apps Challenge 2026. The front-end leverages modern web standards including React, TypeScript, Tailwind CSS, OpenLayers, Proj4, and Zustand.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-mars-dark/60 border border-mars-border space-y-1">
                <div className="text-white font-bold">MGS MOLA Data:</div>
                <div className="text-slate-400">Public Domain / CC0 1.0 Universal</div>
              </div>
              <div className="p-3 rounded-lg bg-mars-dark/60 border border-mars-border space-y-1">
                <div className="text-white font-bold">MEX HRSC Stereo DEM:</div>
                <div className="text-slate-400">ESA / DLR / CC BY-SA 3.0 IGO</div>
              </div>
              <div className="p-3 rounded-lg bg-mars-dark/60 border border-mars-border space-y-1">
                <div className="text-white font-bold">NASA Mars Trek Tiles:</div>
                <div className="text-slate-400">NASA JPL / Solar System Treks (Public Access)</div>
              </div>
              <div className="p-3 rounded-lg bg-mars-dark/60 border border-mars-border space-y-1">
                <div className="text-white font-bold">NASA DONKI Space Weather:</div>
                <div className="text-slate-400">NASA Goddard Space Flight Center (Open Data)</div>
              </div>
            </div>

            {/* External Links */}
            <div className="pt-3 border-t border-mars-border flex flex-wrap items-center gap-4 text-xs font-mono">
              <a
                href="https://astrogeology.usgs.gov/search/map/mars_mgs_mola_mex_hrsc_blended_dem_global_200m"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
              >
                <span>USGS DEM Specification</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://trek.nasa.gov/mars/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
              >
                <span>NASA Mars Trek</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
              >
                <span>NASA DONKI Space Weather</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://mars.nasa.gov/mars2020/mission/where-is-the-rover/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
              >
                <span>NASA Perseverance Rover (JPL)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-6 border-t border-mars-border flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-mars-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Mission Briefing</span>
          </Link>

          <Link
            to="/explorer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-mars-orange hover:bg-mars-rust text-white text-xs font-mono font-semibold transition-colors shadow-md shadow-mars-orange/20"
          >
            <span>Launch Mars Explorer</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
