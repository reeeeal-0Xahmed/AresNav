import React, { useState, useEffect } from 'react';
import { MarsMap } from '../components/map/MarsMap';
import { ExplorerSidebar } from '../components/explorer/ExplorerSidebar';

export const ExplorerPage: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.title = 'AresNav — Mars Explorer';
  }, []);

  return (
    <div
      className="flex-1 flex flex-col md:flex-row relative w-full h-[calc(100vh_-_4rem)] min-h-0 overflow-hidden"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* Interactive Mars Map (Fills all available area) */}
      <div className="flex-1 min-h-0 relative h-full w-full overflow-hidden">
        <MarsMap isSidebarCollapsed={isSidebarCollapsed} />
      </div>

      {/* Collapsible Mission Control Right Sidebar */}
      <ExplorerSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
    </div>
  );
};
