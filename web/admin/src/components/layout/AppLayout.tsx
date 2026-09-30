'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="admin-shell min-h-screen overflow-x-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileMenuToggle={() => setMobileSidebarOpen((open) => !open)}
      />
      <main
        className={`min-h-screen transition-[margin-left] duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[284px]'
        }`}
        style={{ paddingTop: 'var(--topbar-height)' }}
      >
        <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
