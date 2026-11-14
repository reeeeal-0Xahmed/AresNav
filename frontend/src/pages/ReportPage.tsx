import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  Layers,
  Activity,
  Clock,
  Sparkles,
  RefreshCw,
  Info,
  MapPin,
  ArrowRight,
  Database,
} from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';
import { formatMarsCoord, getVerdictStyle } from '../lib/formatters';
import { ReportMiniMap } from '../components/report/ReportMiniMap';
import { DEMO_PRESETS, DemoPreset } from '../lib/demoPresets';
import { CoordinateGeo } from '../api/types';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Document Title
  useEffect(() => {
    document.title = 'AresNav — Mission Traverse Report';
  }, []);

  // Store state
  const routeResult = useMissionStore((s) => s.routeResult);
  const selectedRank = useMissionStore((s) => s.selectedPathRank);
  const setSelectedPathRank = useMissionStore((s) => s.setSelectedPathRank);
  const pois = useMissionStore((s) => s.pois);
  const spaceWeather = useMissionStore((s) => s.spaceWeather);
  const applyDemoPreset = useMissionStore((s) => s.applyDemoPreset);
  const loadRouteByRequestId = useMissionStore((s) => s.loadRouteByRequestId);
  const isLoadingRoute = useMissionStore((s) => s.isLoadingRoute);

  // Local state
  const [copiedId, setCopiedId] = useState(false);
  const [requestIdInput, setRequestIdInput] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const activePath =
    routeResult?.paths?.find((p) => p.rank === selectedRank) ||
    routeResult?.paths?.[0];
  const verdictStyle = activePath ? getVerdictStyle(activePath.briefing.verdict) : null;

  const startCoord: CoordinateGeo | null =
    routeResult?.start_geographic ||
    (routeResult?.requested_start && 'lon' in routeResult.requested_start
      ? (routeResult.requested_start as CoordinateGeo)
      : null);

  const targetCoord: CoordinateGeo | null =
    routeResult?.target_geographic ||
    (routeResult?.requested_target && 'lon' in routeResult.requested_target
      ? (routeResult.requested_target as CoordinateGeo)
      : null);

  // Copy Request ID to clipboard
  const handleCopyRequestId = () => {
    if (!routeResult?.request_id) return;
    navigator.clipboard.writeText(routeResult.request_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Download Route Result as JSON
  const handleDownloadJson = () => {
    if (!routeResult) return;
    const jsonStr = JSON.stringify(routeResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aresnav-mission-report-${routeResult.request_id || 'traverse'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger Print dialog
  const handlePrint = () => {
    window.print();
  };

  // Reload route by request ID
  const handleLoadByRequestId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestIdInput.trim()) return;
    setLoadError(null);
    const success = await loadRouteByRequestId(requestIdInput.trim());
    if (!success) {
      setLoadError(`Unable to retrieve route with Request ID "${requestIdInput.trim()}". Note that saved routes are retained within the active session only.`);
    }
  };

  // Quick Preset Loader from Empty State
  const handleLoadPreset = async (preset: DemoPreset) => {
    await applyDemoPreset(preset);
  };

  // =========================================================================
  // EMPTY STATE: No Route in Memory or SessionStorage
  // =========================================================================
  if (!routeResult || !activePath) {
    return (
      <div className="flex-1 min-h-0 w-full overflow-y-auto print-page-wrapper">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-mars-surface border border-mars-border rounded-2xl p-8 sm:p-10 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-mars-panel border border-mars-orange/40 text-mars-orange flex items-center justify-center mx-auto mb-6 shadow-lg shadow-mars-orange/15">
              <FileText className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mars-panel border border-mars-border text-mars-orange text-xs font-mono uppercase tracking-wider mb-4">
              <span>Mission Control Report Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white font-sans">
              No Active Traverse in Memory
            </h1>

            <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              A traverse must be planned in Mars Explorer before generating an operational mission report. You can plan a new route, reload a previous session request, or load a verified demonstration traverse.
            </p>

            {/* Reload by Request ID Form */}
            <div className="mt-8 max-w-lg mx-auto bg-mars-dark/80 p-5 rounded-xl border border-mars-border text-left">
              <label htmlFor="reqIdInput" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Reload Traverse by Request ID (Active Session)
              </label>
              <form onSubmit={handleLoadByRequestId} className="flex gap-2">
                <input
                  id="reqIdInput"
                  type="text"
                  placeholder="e.g. mock-req-zvk5627h"
                  value={requestIdInput}
                  onChange={(e) => setRequestIdInput(e.target.value)}
                  className="flex-1 bg-mars-panel border border-mars-border rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-mars-orange"
                />
                <button
                  type="submit"
                  disabled={isLoadingRoute || !requestIdInput.trim()}
                  className="px-4 py-2 rounded-lg bg-mars-orange hover:bg-mars-rust disabled:opacity-50 text-white text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                >
                  {isLoadingRoute ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Load</span>
                  )}
                </button>
              </form>

              {loadError && (
                <div className="mt-3 text-xs font-mono text-rose-300 bg-rose-950/40 border border-rose-500/40 p-2.5 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{loadError}</span>
                </div>
              )}
            </div>

            {/* Verified Demo Traverse Loaders */}
            <div className="mt-8 pt-8 border-t border-mars-border text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-mars-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Or Load a Verified Demonstration Traverse</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mars-dark text-slate-400 border border-mars-border">
                  Jezero 200m DEM
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    disabled={isLoadingRoute}
                    className="p-3.5 rounded-xl bg-mars-panel hover:bg-mars-dark border border-mars-border hover:border-mars-orange/50 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-mars-orange transition-colors">
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {preset.description}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-mars-border/50 flex items-center justify-between text-[10px] font-mono text-mars-muted">
                      <span>~{preset.approxKm} km</span>
                      <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Load <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Explorer Action */}
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mars-panel hover:bg-mars-surface border border-mars-border text-xs font-mono text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Mission Briefing</span>
              </Link>
              <Link
                to="/explorer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mars-orange hover:bg-mars-rust text-white text-xs font-mono font-semibold transition-colors shadow-lg shadow-mars-orange/20"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Mars Explorer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN REPORT: Full 9-Section NASA Traverse Report
  // =========================================================================
  const briefing = activePath.briefing;
  const terrain = briefing.terrain;
  const eva = briefing.eva;
  const radiation = briefing.radiation;
  const scienceStops = briefing.science_stops || [];
  const limitations = briefing.limitations || [];
  const reasons = briefing.reasons || [];

  const dateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto print-page-wrapper selection:bg-mars-orange/30">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* =================================================================
            OFFICIAL PRINT HEADER (Visible only in Print / PDF export)
           ================================================================= */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-slate-600">
            <span>NASA Space Apps Challenge 2026</span>
            <span>Interplanetary Survival Guide – Martian Map</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans mt-2">
            AresNav Expedition Traverse Mission Report
          </h1>
          <div className="text-xs font-mono text-slate-700 mt-1 flex items-center justify-between">
            <span>Target Region: Jezero Crater, Mars (200m Blended DEM)</span>
            <span>Generated: {dateFormatted}</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500 border-t border-slate-300 pt-1">
            CONFIDENTIALITY: UNCLASSIFIED / SCIENTIFIC MISSION PLANNING ONLY • NOT FLIGHT CERTIFIED
          </div>
        </div>

        {/* =================================================================
            TOP ACTION TOOLBAR (Hidden in Print)
           ================================================================= */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-mars-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/explorer')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mars-surface hover:bg-mars-panel border border-mars-border text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Explorer</span>
            </button>
            <div className="text-xs font-mono text-mars-muted hidden sm:inline-block">
              Request ID: <span className="text-slate-200 font-semibold">{routeResult.request_id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-mars-panel hover:bg-mars-surface border border-mars-border text-xs font-mono text-white hover:text-mars-orange transition-colors shadow-sm"
              title="Print or export as clean ink-friendly PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-mars-orange hover:bg-mars-rust text-white text-xs font-mono font-semibold transition-colors shadow-md shadow-mars-orange/20"
              title="Download raw route result JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* =================================================================
            SECTION 1: DOCUMENT HEADER & METADATA
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-mars-border/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mars-panel border border-mars-border text-mars-orange text-xs font-mono uppercase tracking-wider mb-2">
                <span>Traverse Mission Specification</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white print-text-dark font-sans tracking-tight">
                Jezero Surface Traverse Mission Plan
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 print-text-muted font-mono mt-1">
                Planetary Coordinates: Planetocentric East-Positive Degrees • Spherical Equirectangular
              </p>
            </div>

            {/* Request ID & Timestamp Badge */}
            <div className="bg-mars-dark/90 print-subcard border border-mars-border p-3.5 rounded-xl text-right flex flex-col items-start md:items-end gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-mars-muted uppercase">Request ID:</span>
                <span className="text-xs font-mono font-bold text-white print-text-dark">{routeResult.request_id}</span>
                <button
                  onClick={handleCopyRequestId}
                  className="no-print text-mars-muted hover:text-mars-orange transition-colors"
                  title="Copy Request ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-400 print-text-muted">
                Generated: {dateFormatted}
              </div>

              <div className="text-[10px] font-mono text-mars-muted flex items-center gap-2 mt-1">
                <span>Map ID: <strong className="text-slate-300 print-text-dark">{routeResult.map_id}</strong></span>
                <span>•</span>
                <span title={`Version: ${routeResult.map_version}`}>
                  Ver: <code className="text-mars-orange">{routeResult.map_version.slice(0, 10)}...</code>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Route Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-center">
            <div className="bg-mars-dark/50 print-subcard p-3 rounded-xl border border-mars-border/60">
              <div className="text-[11px] font-mono text-mars-muted uppercase">Horizontal Distance</div>
              <div className="text-lg font-bold font-mono text-white print-text-dark mt-0.5">
                {(activePath.distance_meters / 1000).toFixed(2)} km
              </div>
              <div className="text-[10px] font-mono text-slate-400 print-text-muted">
                {activePath.distance_meters.toLocaleString()} meters
              </div>
            </div>

            <div className="bg-mars-dark/50 print-subcard p-3 rounded-xl border border-mars-border/60">
              <div className="text-[11px] font-mono text-mars-muted uppercase">Raster Grid Steps</div>
              <div className="text-lg font-bold font-mono text-white print-text-dark mt-0.5">
                {activePath.steps} cells
              </div>
              <div className="text-[10px] font-mono text-slate-400 print-text-muted">
                200 m resolution
              </div>
            </div>

            <div className="bg-mars-dark/50 print-subcard p-3 rounded-xl border border-mars-border/60">
              <div className="text-[11px] font-mono text-mars-muted uppercase">Traversal Penalty</div>
              <div className="text-lg font-bold font-mono text-mars-orange print-text-dark mt-0.5">
                {Math.round(activePath.cost)}
              </div>
              <div className="text-[10px] font-mono text-slate-400 print-text-muted">
                Score (not distance)
              </div>
            </div>

            <div className="bg-mars-dark/50 print-subcard p-3 rounded-xl border border-mars-border/60">
              <div className="text-[11px] font-mono text-mars-muted uppercase">Round-Trip EVA</div>
              <div className="text-lg font-bold font-mono text-white print-text-dark mt-0.5">
                {eva.round_trip_hours.toFixed(1)} h
              </div>
              <div className={`text-[10px] font-mono ${eva.round_trip_hours > 8 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                {eva.round_trip_hours > 8 ? 'Exceeds 8.0h Budget' : 'Within 8.0h Budget'}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            SECTION 2: EXECUTIVE VERDICT SUMMARY & REASONS
           ================================================================= */}
        <div className={`border rounded-2xl p-6 print-card shadow-lg bg-mars-surface ${verdictStyle?.borderClass || 'border-mars-border'} ${verdictStyle?.bgGlow || ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl text-base font-bold font-mono tracking-wider border shadow-md flex items-center gap-2 ${verdictStyle?.badgeClass}`}>
                {briefing.verdict === 'GO' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {briefing.verdict === 'CAUTION' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {briefing.verdict === 'NO-GO' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                <span>VERDICT: {briefing.verdict}</span>
              </div>

              <div>
                <h2 className="text-base font-semibold text-white print-text-dark">
                  {briefing.verdict === 'GO' && 'Mission Safe to Proceed'}
                  {briefing.verdict === 'CAUTION' && 'Traversable with Operational Cautions'}
                  {briefing.verdict === 'NO-GO' && 'Traverse Prohibited — Operational Blockers Detected'}
                </h2>
                <div className="text-xs font-mono text-slate-300 print-text-muted">
                  Path Rank #{activePath.rank} Evaluation against Jezero 200m regional terrain constraints
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-300 print-text-muted bg-mars-dark/60 print-subcard px-3 py-1.5 rounded-lg border border-mars-border/60 self-start sm:self-auto">
              Selected Candidate: <strong>Rank #{activePath.rank} of {routeResult.paths?.length || 1}</strong>
            </div>
          </div>

          {/* Reasons List */}
          {reasons.length > 0 ? (
            <div className="mt-5 space-y-2 pt-4 border-t border-mars-border/60">
              <div className="text-xs font-mono font-semibold text-slate-200 print-text-dark uppercase tracking-wider">
                Key Mission Assessment Factors:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-mars-dark/80 print-subcard border border-mars-border/80 flex items-start gap-3"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border flex-shrink-0 mt-0.5 ${
                        reason.severity === 'NO-GO'
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      }`}
                    >
                      {reason.severity}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-mono font-semibold text-white print-text-dark">
                        [{reason.code}]
                      </div>
                      <div className="text-xs text-slate-300 print-text-muted mt-0.5 leading-relaxed">
                        {reason.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-emerald-500/20 text-xs font-mono text-emerald-300 print-text-dark flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>All traversal criteria (slope, EVA duration, and space weather) strictly satisfy mission safety constraints.</span>
            </div>
          )}
        </div>

        {/* =================================================================
            SECTION 3: SELECTED ROUTE & ALTERNATIVES COMPARISON TABLE
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mars-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-white print-text-dark font-sans flex items-center gap-2">
                <Compass className="w-5 h-5 text-mars-orange" />
                <span>Selected Route & Candidate Alternatives</span>
              </h2>
              <p className="text-xs text-slate-400 print-text-muted font-mono mt-0.5">
                Comparison of the 3 distinct alternative paths generated on the 353 × 298 cost matrix
              </p>
            </div>

            <div className="text-xs font-mono text-mars-muted bg-mars-dark print-subcard px-2.5 py-1 rounded border border-mars-border">
              Cost = Traversal Penalty (Slope Friction + Roughness)
            </div>
          </div>

          {/* Waypoints Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-mars-dark/70 print-subcard p-4 rounded-xl border border-mars-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Traverse Start Waypoint
                </div>
                <div className="text-sm font-mono font-bold text-white print-text-dark mt-1">
                  {startCoord ? formatMarsCoord(startCoord.lon, startCoord.lat) : 'N/A'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 print-text-muted mt-0.5">
                  Raster Cell: X {routeResult.start.x}, Y {routeResult.start.y}
                </div>
              </div>
            </div>

            <div className="bg-mars-dark/70 print-subcard p-4 rounded-xl border border-mars-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-950/70 border border-mars-orange/50 flex items-center justify-center text-mars-orange flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-mono text-mars-orange font-semibold uppercase tracking-wider">
                  Traverse Target Waypoint
                </div>
                <div className="text-sm font-mono font-bold text-white print-text-dark mt-1">
                  {targetCoord ? formatMarsCoord(targetCoord.lon, targetCoord.lat) : 'N/A'}
                </div>
                <div className="text-[11px] font-mono text-slate-400 print-text-muted mt-0.5">
                  Raster Cell: X {routeResult.target.x}, Y {routeResult.target.y}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-mars-border rounded-xl overflow-hidden">
              <thead className="bg-mars-panel print:bg-slate-100 text-slate-300 print-text-dark border-b border-mars-border">
                <tr>
                  <th className="py-2.5 px-3">Path Option</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3 text-right">Distance</th>
                  <th className="py-2.5 px-3 text-right">Steps</th>
                  <th className="py-2.5 px-3 text-right">Penalty Cost</th>
                  <th className="py-2.5 px-3 text-right">Max / Mean Slope</th>
                  <th className="py-2.5 px-3 text-right">EVA Round-Trip</th>
                  <th className="py-2.5 px-3 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mars-border/60">
                {(routeResult.paths || []).map((path) => {
                  const isSelected = path.rank === selectedRank;
                  const pVerdict = getVerdictStyle(path.briefing.verdict);
                  return (
                    <tr
                      key={path.rank}
                      className={`${
                        isSelected
                          ? 'bg-mars-orange/10 font-semibold text-white'
                          : 'bg-mars-dark/40 hover:bg-mars-panel/50 text-slate-300'
                      } transition-colors`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-mars-orange' : 'bg-slate-500'
                            }`}
                          />
                          <span className="font-bold">Rank #{path.rank}</span>
                          {path.rank === 1 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-mars-panel text-mars-orange border border-mars-orange/30">
                              Primary
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${pVerdict.badgeClass}`}
                        >
                          {path.briefing.verdict}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {(path.distance_meters / 1000).toFixed(2)} km
                      </td>

                      <td className="py-3 px-3 text-right">
                        {path.steps} cells
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-mars-orange print-text-dark">
                        {Math.round(path.cost)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {path.briefing.terrain.max_slope_deg.toFixed(1)}° / {path.briefing.terrain.mean_slope_deg.toFixed(1)}°
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={
                            path.briefing.eva.round_trip_hours > 8
                              ? 'text-rose-400 font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          {path.briefing.eva.round_trip_hours.toFixed(1)} h
                        </span>
                        <span className="text-mars-muted text-[10px]"> / 8h</span>
                      </td>

                      <td className="py-3 px-3 text-center no-print">
                        {isSelected ? (
                          <span className="text-mars-orange text-[11px] font-bold">Active</span>
                        ) : (
                          <button
                            onClick={() => setSelectedPathRank(path.rank)}
                            className="px-2 py-1 rounded bg-mars-surface hover:bg-mars-panel border border-mars-border text-[11px] text-slate-300 hover:text-white transition-colors"
                          >
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* =================================================================
            SECTION 4: STATIC NON-INTERACTIVE MINI-MAP
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-mars-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-white print-text-dark font-sans flex items-center gap-2">
                <Layers className="w-5 h-5 text-mars-orange" />
                <span>Planetary Context & Traverse Geometry Map</span>
              </h2>
              <p className="text-xs text-slate-400 print-text-muted font-mono mt-0.5">
                Static overview of candidate path geometry, Start/Target waypoints, and proximity science stops
              </p>
            </div>

            <div className="text-[11px] font-mono text-mars-muted bg-mars-dark print-subcard px-2.5 py-1 rounded border border-mars-border">
              Base: Viking MDIM 2.1 (232m)
            </div>
          </div>

          {/* Render the static non-interactive OpenLayers MiniMap */}
          <ReportMiniMap
            routeResult={routeResult}
            selectedRank={selectedRank}
            pois={pois}
            className="h-80 sm:h-96 w-full"
          />

          <div className="text-[11px] font-mono text-mars-muted print-text-muted flex items-center justify-between pt-1">
            <span>Projection: Spherical Equirectangular (EPSG:104905) • Mars Radius: 3,396,190 m</span>
            <span>Spatial Coverage: Jezero Regional Extent</span>
          </div>
        </div>

        {/* =================================================================
            SECTION 5: TERRAIN & EVA PROFILE NUMBERS
           ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* A. Terrain Topography & Slopes */}
          <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white print-text-dark font-sans flex items-center gap-2 border-b border-mars-border pb-3">
              <Layers className="w-4 h-4 text-mars-orange" />
              <span>Terrain Slopes & Relief Profile</span>
            </h2>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-mars-dark/60 print-subcard p-3 rounded-xl border border-mars-border">
                <div className="text-[10px] font-mono text-mars-muted uppercase">Max Slope</div>
                <div className={`text-base font-bold font-mono mt-0.5 ${terrain.max_slope_deg >= 10 ? 'text-amber-400' : 'text-white print-text-dark'}`}>
                  {terrain.max_slope_deg.toFixed(1)}°
                </div>
                <div className="text-[9px] font-mono text-slate-400 print-text-muted">Caution ≥10°</div>
              </div>

              <div className="bg-mars-dark/60 print-subcard p-3 rounded-xl border border-mars-border">
                <div className="text-[10px] font-mono text-mars-muted uppercase">Mean Slope</div>
                <div className="text-base font-bold font-mono text-white print-text-dark mt-0.5">
                  {terrain.mean_slope_deg.toFixed(1)}°
                </div>
                <div className="text-[9px] font-mono text-slate-400 print-text-muted">Traverse Average</div>
              </div>

              <div className="bg-mars-dark/60 print-subcard p-3 rounded-xl border border-mars-border">
                <div className="text-[10px] font-mono text-mars-muted uppercase">p95 Slope</div>
                <div className="text-base font-bold font-mono text-white print-text-dark mt-0.5">
                  {terrain.p95_slope_deg.toFixed(1)}°
                </div>
                <div className="text-[9px] font-mono text-slate-400 print-text-muted">95th Percentile</div>
              </div>
            </div>

            {/* Elevation Ascent / Descent */}
            <div className="space-y-2 text-xs font-mono pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mars-dark/40 print-subcard border border-mars-border/60">
                <span className="text-slate-400 print-text-muted">Total Cumulative Ascent:</span>
                <span className="font-bold text-emerald-400">+{terrain.ascent_m.toLocaleString()} m</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mars-dark/40 print-subcard border border-mars-border/60">
                <span className="text-slate-400 print-text-muted">Total Cumulative Descent:</span>
                <span className="font-bold text-amber-400">-{terrain.descent_m.toLocaleString()} m</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-mars-dark/40 print-subcard border border-mars-border/60">
                <span className="text-slate-400 print-text-muted">Elevation Min / Max (Areoid Datum):</span>
                <span className="font-bold text-white print-text-dark">
                  {terrain.elevation_min_m !== null ? `${terrain.elevation_min_m} m` : 'N/A'} /{' '}
                  {terrain.elevation_max_m !== null ? `${terrain.elevation_max_m} m` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Cost Cells Distribution Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 print-text-dark mb-1.5">
                <span>Cost Cell Breakdown:</span>
                <span className="text-mars-muted">High-Cost Share: {(terrain.high_cost_share * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-mars-dark flex overflow-hidden border border-mars-border">
                <div
                  style={{ width: `${Math.max(5, (terrain.cost_cells?.['1'] || 0) / terrain.steps * 100)}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Cost 1 (<2° flat): ${terrain.cost_cells?.['1'] || 0} cells`}
                />
                <div
                  style={{ width: `${((terrain.cost_cells?.['2'] || 0) / terrain.steps * 100)}%` }}
                  className="bg-cyan-500 h-full"
                  title={`Cost 2 (2-5° moderate): ${terrain.cost_cells?.['2'] || 0} cells`}
                />
                <div
                  style={{ width: `${((terrain.cost_cells?.['4'] || 0) / terrain.steps * 100)}%` }}
                  className="bg-amber-500 h-full"
                  title={`Cost 4 (5-10° steep): ${terrain.cost_cells?.['4'] || 0} cells`}
                />
                <div
                  style={{ width: `${((terrain.cost_cells?.['8'] || 0) / terrain.steps * 100)}%` }}
                  className="bg-rose-500 h-full"
                  title={`Cost 8 (>10° caution): ${terrain.cost_cells?.['8'] || 0} cells`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-mars-muted mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" />Cost 1 (&lt;2°)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" />Cost 2 (2-5°)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" />Cost 4 (5-10°)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" />Cost 8 (&gt;10°)</span>
              </div>
            </div>
          </div>

          {/* B. EVA Duration & Planning Budget */}
          <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white print-text-dark font-sans flex items-center gap-2 border-b border-mars-border pb-3">
              <Clock className="w-4 h-4 text-mars-orange" />
              <span>EVA Time Budget & Velocity Parameters</span>
            </h2>

            <div className="space-y-3">
              <div className="bg-mars-dark/60 print-subcard p-4 rounded-xl border border-mars-border space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 print-text-muted">Round-Trip EVA Duration:</span>
                  <span className={`text-base font-bold ${eva.round_trip_hours > 8 ? 'text-rose-400' : 'text-white print-text-dark'}`}>
                    {eva.round_trip_hours.toFixed(2)} hours
                  </span>
                </div>

                {/* Progress bar against 8h budget */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-mars-muted">
                    <span>Budget Utilized: {((eva.round_trip_hours / 8.0) * 100).toFixed(1)}%</span>
                    <span>Max Operational Limit: 8.0 h</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-mars-darkest border border-mars-border overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (eva.round_trip_hours / 8.0) * 100)}%` }}
                      className={`h-full ${eva.round_trip_hours > 8 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-mars-dark/40 print-subcard p-3 rounded-lg border border-mars-border/60">
                  <div className="text-mars-muted text-[10px] uppercase">One-Way Time</div>
                  <div className="text-sm font-bold text-white print-text-dark mt-0.5">
                    {eva.one_way_hours.toFixed(2)} h
                  </div>
                </div>

                <div className="bg-mars-dark/40 print-subcard p-3 rounded-lg border border-mars-border/60">
                  <div className="text-mars-muted text-[10px] uppercase">Assumed Walking Speed</div>
                  <div className="text-sm font-bold text-white print-text-dark mt-0.5">
                    {eva.walk_speed_kmh} km/h
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] font-mono text-amber-300 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Planning Assumption Notice:</span>
                </div>
                <span>
                  Walking speed (2.0 km/h) and the 8.0 h EVA budget are operational planning assumptions for this study and do not represent certified NASA flight limits.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            SECTION 6: RADIATION & SPACE WEATHER TELEMETRY
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-mars-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-white print-text-dark font-sans flex items-center gap-2">
                <Activity className="w-5 h-5 text-mars-orange" />
                <span>Space Weather & Radiation Telemetry</span>
              </h2>
              <p className="text-xs text-slate-400 print-text-muted font-mono mt-0.5">
                NASA DONKI solar flare monitoring and surface radiation proxy
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                radiation.status === 'NOMINAL'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : radiation.status === 'ELEVATED'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  : radiation.status === 'STORM'
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}>
                {radiation.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-mars-dark/60 print-subcard p-3 rounded-xl border border-mars-border">
              <div className="text-mars-muted text-[10px] uppercase">Telemetry Source</div>
              <div className="font-bold text-white print-text-dark mt-1">NASA DONKI API</div>
              <div className="text-[10px] text-slate-400 print-text-muted">Space Weather Notification System</div>
            </div>

            <div className="bg-mars-dark/60 print-subcard p-3 rounded-xl border border-mars-border">
              <div className="text-mars-muted text-[10px] uppercase">Solar Flare Activity</div>
              <div className="font-bold text-white print-text-dark mt-1">
                {spaceWeather?.strongest_flare_class ? `Class ${spaceWeather.strongest_flare_class}` : 'No Major Flare Detected'}
              </div>
              <div className="text-[10px] text-slate-400 print-text-muted">Earth-view orbital observation</div>
            </div>

            <div className="bg-mars-dark/60 print-subcard p-3 rounded-xl border border-mars-border">
              <div className="text-mars-muted text-[10px] uppercase">Proxy Assessment</div>
              <div className="font-bold text-emerald-400 mt-1">
                {radiation.status === 'NOMINAL' ? 'Unrestricted Surface Operations' : 'Elevated Exposure Warning'}
              </div>
              <div className="text-[10px] text-slate-400 print-text-muted">Based on 24h flare record</div>
            </div>
          </div>

          {/* Honesty Rule Banner */}
          <div className="bg-mars-dark/80 print-subcard border border-amber-500/40 rounded-xl p-4 text-slate-200">
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs mb-1">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Scientific Honesty Disclaimer (NASA Space Apps 2026):</span>
            </div>
            <p className="text-xs text-slate-300 print-text-muted leading-relaxed">
              Radiation status is an <strong>Earth-view solar-flare proxy</strong> from NASA DONKI, not a direct Mars-surface dosimeter measurement. Atmospheric shielding variations, galactic cosmic rays, and secondary neutron showers are not simulated in this regional proxy.
            </p>
          </div>
        </div>

        {/* =================================================================
            SECTION 7: EN-ROUTE SCIENCE STOPS
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-mars-border pb-3">
            <div>
              <h2 className="text-lg font-bold text-white print-text-dark font-sans flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mars-orange" />
                <span>En-Route Science Stops Along Traverse</span>
              </h2>
              <p className="text-xs text-slate-400 print-text-muted font-mono mt-0.5">
                Perseverance mission points of interest located within corridor proximity of the active path
              </p>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded bg-mars-dark print-subcard border border-mars-border text-slate-300">
              {scienceStops.length} Target{scienceStops.length === 1 ? '' : 's'} Identified
            </span>
          </div>

          {scienceStops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-mars-border rounded-xl overflow-hidden">
                <thead className="bg-mars-panel print:bg-slate-100 text-slate-300 print-text-dark border-b border-mars-border">
                  <tr>
                    <th className="py-2.5 px-3">Target Name</th>
                    <th className="py-2.5 px-3">Science Classification</th>
                    <th className="py-2.5 px-3 text-right">Path Deviation</th>
                    <th className="py-2.5 px-3 text-right">Nearest Raster Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mars-border/60">
                  {scienceStops.map((stop, idx) => (
                    <tr key={idx} className="bg-mars-dark/40 print-subcard">
                      <td className="py-2.5 px-3 font-semibold text-white print-text-dark flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{stop.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 print-text-muted">
                        <span className="px-2 py-0.5 rounded bg-mars-panel text-cyan-300 border border-cyan-500/30 text-[10px]">
                          {stop.type || 'Geologic Feature'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-200 print-text-dark">
                        +{stop.distance_to_path_m.toLocaleString()} m
                      </td>
                      <td className="py-2.5 px-3 text-right text-mars-muted print-text-muted">
                        Step #{stop.nearest_path_index}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-mars-dark/50 print-subcard border border-mars-border text-center text-xs font-mono text-slate-400">
              No cataloged Perseverance science points of interest intersect the immediate traverse corridor for this path.
            </div>
          )}
        </div>

        {/* =================================================================
            SECTION 8: HAZARDS & LIMITATIONS (BUILT ONLY FROM BRIEFING & LIMITATIONS)
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-4">
          <div className="border-b border-mars-border pb-3">
            <h2 className="text-lg font-bold text-white print-text-dark font-sans flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Hazards, Operational Warnings & Physical Limitations</span>
            </h2>
            <p className="text-xs text-slate-400 print-text-muted font-mono mt-0.5">
              Compiled strictly from pathfinder engine telemetry and verbatim dataset constraints
            </p>
          </div>

          {/* Operational Warnings from briefing.reasons */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-slate-200 print-text-dark uppercase tracking-wider">
              1. Traverse Assessment Flags:
            </div>
            {reasons.length > 0 ? (
              <div className="space-y-2">
                {reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-mars-dark/70 print-subcard border border-mars-border flex items-start gap-3"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border flex-shrink-0 mt-0.5 ${
                        reason.severity === 'NO-GO'
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      }`}
                    >
                      {reason.severity}
                    </span>
                    <div className="text-xs font-mono leading-relaxed text-slate-200 print-text-dark">
                      <strong>[{reason.code}]:</strong> {reason.detail}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-mars-dark/50 print-subcard border border-mars-border text-xs font-mono text-emerald-400">
                No active hazard flags triggered for Rank #{activePath.rank}.
              </div>
            )}
          </div>

          {/* Verbatim Limitations from API */}
          <div className="space-y-3 pt-3 border-t border-mars-border">
            <div className="text-xs font-mono font-bold text-slate-200 print-text-dark uppercase tracking-wider">
              2. Scientific Model Limitations (Verbatim Backend Strings):
            </div>
            <ul className="space-y-2 text-xs font-mono text-slate-300 print-text-muted">
              {limitations.map((limit, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-mars-dark/50 print-subcard border border-mars-border flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="italic leading-relaxed">"{limit}"</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* =================================================================
            SECTION 9: DATA SOURCES, CITATIONS & PLANNING ASSUMPTIONS
           ================================================================= */}
        <div className="bg-mars-surface border border-mars-border rounded-2xl p-6 print-card shadow-lg space-y-5">
          <div className="border-b border-mars-border pb-3">
            <h2 className="text-lg font-bold text-white print-text-dark font-sans flex items-center gap-2">
              <Database className="w-5 h-5 text-mars-orange" />
              <span>Data Sources, Citations & Scientific Methodology</span>
            </h2>
            <p className="text-xs text-slate-400 print-text-muted font-mono mt-0.5">
              Attribution standards per NASA Space Apps 2026 guidelines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Primary Elevation Citation */}
            <div className="p-4 rounded-xl bg-mars-dark/70 print-subcard border border-mars-border space-y-2">
              <div className="text-white print-text-dark font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-mars-orange" />
                <span>USGS HRSC + MOLA Blended DEM (200m v2)</span>
              </div>
              <p className="text-slate-300 print-text-muted leading-relaxed text-[11px]">
                Fergason, R. L., Hare, T. M., & Laura, J. (2018). HRSC and MOLA Blended Digital Elevation Model at 200m v2. Astrogeology PDS Annex, U.S. Geological Survey.
              </p>
              <div className="text-[10px] text-mars-muted print-text-muted pt-1 border-t border-mars-border/50">
                Licensing: MOLA CC0 • HRSC CC BY-SA 3.0 IGO
              </div>
            </div>

            {/* NASA Mars Trek Tiles */}
            <div className="p-4 rounded-xl bg-mars-dark/70 print-subcard border border-mars-border space-y-2">
              <div className="text-white print-text-dark font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-mars-orange" />
                <span>NASA Mars Trek WMTS Layers</span>
              </div>
              <p className="text-slate-300 print-text-muted leading-relaxed text-[11px]">
                Tile service rendered in Mars spherical equirectangular CRS (EPSG:104905). Viking MDIM 2.1 global color mosaic (232m) and MRO HiRISE Jezero orthomosaic (25cm).
              </p>
              <div className="text-[10px] text-mars-muted print-text-muted pt-1 border-t border-mars-border/50">
                Data Provider: NASA JPL / Solar System Treks Project
              </div>
            </div>
          </div>

          {/* Operational Planning Assumptions Table */}
          <div className="p-4 rounded-xl bg-mars-dark/50 print-subcard border border-mars-border space-y-2">
            <div className="text-xs font-mono font-bold text-slate-200 print-text-dark uppercase tracking-wider">
              Summary of Operational Planning Assumptions:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 print-text-muted">
              <div>• Walking Speed: <strong>2.0 km/h</strong> (Model assumption)</div>
              <div>• Maximum EVA Budget: <strong>8.0 hours</strong> (Model assumption)</div>
              <div>• Caution Slope Threshold: <strong>10.0°</strong> (Empirical rating)</div>
              <div>• Impassable Obstacle Slope: <strong>20.0°</strong> (Cliff barrier)</div>
              <div>• Raster Resolution: <strong>200 meters / cell</strong> (Regional)</div>
              <div>• Negative Elevations: <strong>Natural datum topographies</strong></div>
            </div>
          </div>
        </div>

        {/* =================================================================
            BOTTOM ACTION BAR & NAVIGATION
           ================================================================= */}
        <div className="no-print pt-4 border-t border-mars-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/explorer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mars-panel hover:bg-mars-surface border border-mars-border text-xs font-mono text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Mars Explorer</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-mars-surface hover:bg-mars-panel border border-mars-border text-xs font-mono text-slate-300 transition-colors"
            >
              <span>Data Sources & Scientific Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mars-orange hover:bg-mars-rust text-white text-xs font-mono font-semibold transition-colors shadow-lg shadow-mars-orange/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
