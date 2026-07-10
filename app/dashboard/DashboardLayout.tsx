'use client';

import React, { useState, type ReactNode } from 'react';
import Navbar from '../components/navbar/Navbar';
import Sidebar from '../components/sidebar/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="dashboard-main">
        <Navbar
          collapsed={collapsed}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
