import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useMissionStore } from '../store/useMissionStore';

export const Layout: React.FC = () => {
  const fetchInitialData = useMissionStore((s) => s.fetchInitialMissionData);
  const location = useLocation();
  const isExplorer = location.pathname.startsWith('/explorer');

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="h-full w-full flex flex-col bg-mars-darkest text-mars-text font-sans antialiased overflow-hidden">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Page Area - fills remaining viewport height exactly */}
      <main className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
        <Outlet />
      </main>

      {/* Mission Control Footer (rendered on briefing, report, and about pages; hidden on /explorer to give map full viewport) */}
      {!isExplorer && (
        <footer className="flex-shrink-0 border-t border-mars-border/80 bg-mars-dark/95 py-2.5 text-xs font-mono text-mars-muted z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-mars-orange inline-block" />
                <span className="text-white font-medium">ARESNAV Mission Control</span>
                <span className="text-mars-border">|</span>
                <span>NASA Space Apps 2026 — Martian Map</span>
              </div>

              <div className="text-[11px] leading-relaxed max-w-2xl text-slate-400">
                <span className="text-amber-400/90 font-semibold mr-1">Honesty Disclaimer:</span>
                Radiation status is an Earth-view solar-flare proxy from NASA DONKI. Walking speed (2 km/h), 8 h EVA budget, and slope thresholds are planning assumptions, not NASA limits.
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
