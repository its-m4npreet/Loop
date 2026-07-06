"use client";

import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import DashboardContent from './DashboardContent';
import './styles/global.css';

function DashboardClient({ user }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNavigate(page) {
    setActivePage(page);
  }

  function handleToggleCollapse() {
    setCollapsed((v) => !v);
  }

  function handleToggleMobile() {
    setMobileOpen((v) => !v);
  }

  function handleCloseMobile() {
    setMobileOpen(false);
  }

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
      default:
        return <DashboardContent />;
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
      />

      {/* Main area */}
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Navbar */}
        <Navbar
          collapsed={collapsed}
          onToggleMobile={handleToggleMobile}
          user={user}
        />

        <div className="app-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default DashboardClient;
