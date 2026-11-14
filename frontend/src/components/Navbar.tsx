import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  FileText,
  Info,
  Radio,
  Activity,
  Menu,
  X,
  Server,
  Layers,
} from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';
import { getRadiationStyle } from '../lib/formatters';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const backendStatus = useMissionStore((s) => s.backendStatus);
  const spaceWeather = useMissionStore((s) => s.spaceWeather);
  const terrainMeta = useMissionStore((s) => s.terrainMeta);

  const radStyle = spaceWeather
    ? getRadiationStyle(spaceWeather.radiation_status)
    : getRadiationStyle('UNKNOWN');

  const navItems = [
    { to: '/', label: 'Briefing', icon: Radio },
    { to: '/explorer', label: 'Mars Explorer', icon: Compass },
    { to: '/report', label: 'Mission Report', icon: FileText },
    { to: '/about', label: 'Data & About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-mars-darkest/90 backdrop-blur-md border-b border-mars-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Mission Name */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-mars-orange to-mars-red flex items-center justify-center p-0.5 shadow-lg shadow-mars-orange/20 ring-1 ring-white/20 group-hover:ring-mars-orange/60 transition-all">
                <div className="w-full h-full bg-mars-darkest rounded-[6px] flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-mars-orange animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tracking-wider text-base text-white">
                    ARES<span className="text-mars-orange">NAV</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-mars-panel text-mars-muted border border-mars-border">
                    M20-JEZERO
                  </span>
                </div>
                <span className="text-[11px] text-mars-muted tracking-tight">
                  Perseverance Mission Planner
                </span>
              </div>
            </NavLink>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono tracking-wide transition-all ${
                      isActive
                        ? 'bg-mars-surface text-white border border-mars-orange/40 shadow-sm shadow-mars-orange/10'
                        : 'text-mars-muted hover:text-mars-text hover:bg-mars-surface/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-mars-orange" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Status Indicators (Backend & Space Weather) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Space Weather Telemetry Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${radStyle.badgeClass}`}
              title={`NASA DONKI Flare Status: ${spaceWeather?.radiation_status || 'UNKNOWN'} (Earth-view proxy)`}
            >
              <Activity className="w-3 h-3 text-current" />
              <span className="text-mars-muted text-[10px]">RAD:</span>
              <span className="font-semibold">{spaceWeather?.radiation_status || 'UNKNOWN'}</span>
            </div>

            {/* Grid Version Badge */}
            {terrainMeta && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-mars-surface text-mars-muted border border-mars-border"
                title={`Map ID: ${terrainMeta.map_id} | Version: ${terrainMeta.version.slice(0, 10)}... | 353×298 cells @ 200m`}
              >
                <Layers className="w-3 h-3 text-mars-orange" />
                <span>200m DEM</span>
              </div>
            )}

            {/* Backend Connection Status */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-mars-surface border border-mars-border text-[11px] font-mono">
              <Server className="w-3 h-3 text-mars-muted" />
              {backendStatus.mockMode ? (
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span>MOCK MODE</span>
                </div>
              ) : backendStatus.online ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>ONLINE {backendStatus.latencyMs ? `(${backendStatus.latencyMs}ms)` : ''}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  <span>OFFLINE</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md bg-mars-surface text-mars-muted hover:text-white border border-mars-border"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-mars-border bg-mars-surface/95 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono ${
                    isActive
                      ? 'bg-mars-panel text-white border border-mars-orange/50'
                      : 'text-mars-muted hover:text-white hover:bg-mars-panel/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-mars-orange" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-3 border-t border-mars-border flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-mars-muted">
              <span>Backend Status:</span>
              <span className={backendStatus.mockMode ? 'text-cyan-400' : backendStatus.online ? 'text-emerald-400' : 'text-rose-400'}>
                {backendStatus.mockMode ? 'MOCK MODE' : backendStatus.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-mars-muted">
              <span>Radiation Proxy:</span>
              <span className={radStyle.textClass}>
                {spaceWeather?.radiation_status || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
