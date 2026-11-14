import { Verdict, RadiationStatus } from '../api/types';

/**
 * Formats Mars coordinates (East-positive longitude, Planetocentric latitude).
 */
export function formatMarsCoord(lon: number, lat: number, decimals = 4): string {
  const lonStr = `${Math.abs(lon).toFixed(decimals)}°${lon >= 0 ? 'E' : 'W'}`;
  const latStr = `${Math.abs(lat).toFixed(decimals)}°${lat >= 0 ? 'N' : 'S'}`;
  return `${lonStr}, ${latStr}`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatDurationHours(hours: number): string {
  return `${hours.toFixed(1)} h`;
}

export interface VerdictStyle {
  label: string;
  badgeClass: string;
  bgGlow: string;
  borderClass: string;
  textClass: string;
}

export function getVerdictStyle(verdict: Verdict | 'UNKNOWN'): VerdictStyle {
  switch (verdict) {
    case 'GO':
      return {
        label: 'GO',
        badgeClass: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-emerald-900/30',
        bgGlow: 'shadow-[0_0_15px_rgba(34,197,94,0.25)]',
        borderClass: 'border-emerald-500/40',
        textClass: 'text-emerald-400',
      };
    case 'CAUTION':
      return {
        label: 'CAUTION',
        badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-amber-900/30',
        bgGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        borderClass: 'border-amber-500/40',
        textClass: 'text-amber-400',
      };
    case 'NO-GO':
      return {
        label: 'NO-GO',
        badgeClass: 'bg-red-950/70 text-red-300 border-red-500/50 shadow-red-900/30',
        bgGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]',
        borderClass: 'border-red-500/40',
        textClass: 'text-red-400',
      };
    default:
      return {
        label: 'UNKNOWN',
        badgeClass: 'bg-slate-900/80 text-slate-300 border-slate-600/50',
        bgGlow: 'shadow-none',
        borderClass: 'border-slate-600/40',
        textClass: 'text-slate-400',
      };
  }
}

export function getRadiationStyle(status: RadiationStatus): VerdictStyle {
  switch (status) {
    case 'NOMINAL':
      return {
        label: 'NOMINAL (SAFE)',
        badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
        bgGlow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]',
        borderClass: 'border-emerald-500/30',
        textClass: 'text-emerald-300',
      };
    case 'ELEVATED':
      return {
        label: 'ELEVATED',
        badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
        bgGlow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        borderClass: 'border-amber-500/30',
        textClass: 'text-amber-300',
      };
    case 'HIGH_RADIATION_WARNING':
    case 'STORM':
      return {
        label: 'STORM WARNING',
        badgeClass: 'bg-red-950/70 text-red-300 border-red-500/50',
        bgGlow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
        borderClass: 'border-red-500/40',
        textClass: 'text-red-300',
      };
    case 'UNKNOWN':
    default:
      return {
        label: 'UNKNOWN (UNVERIFIED)',
        badgeClass: 'bg-slate-900/80 text-slate-400 border-slate-600/60 border-dashed',
        bgGlow: 'shadow-none',
        borderClass: 'border-slate-700',
        textClass: 'text-slate-400',
      };
  }
}
