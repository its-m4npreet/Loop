'use client';

import React, { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import QuickActionCard from '../cards/QuickActionCard';
import { quickActions } from '../../data/dashboardData';
import './QuickActions.css';

function QuickActions() {
  const [panelOpen, setPanelOpen] = useState(false);

  function handleAction(actionId: string) {
    console.log('Quick action triggered:', actionId);
    setPanelOpen(false);
  }

  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [panelOpen]);

  return (
    <>
      {/* Desktop section */}
      <section className="quick-actions-section quick-actions-desktop" aria-label="Quick actions">
        <div className="quick-actions-header">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <p className="quick-actions-subtitle">Jump straight into common tasks</p>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => handleAction(action.id)}
            />
          ))}
        </div>
      </section>

      {/* Mobile FAB */}
      <button
        className="quick-actions-fab"
        onClick={() => setPanelOpen(true)}
        aria-label="Open quick actions"
      >
        <Zap size={22} />
      </button>

      {/* Mobile slide-up panel */}
      <div className={`quick-actions-overlay ${panelOpen ? 'open' : ''}`} onClick={() => setPanelOpen(false)} />
      <div className={`quick-actions-panel ${panelOpen ? 'open' : ''}`}>
        <div className="quick-actions-panel-header">
          <h3 className="quick-actions-panel-title">Quick Actions</h3>
          <button
            className="quick-actions-panel-close"
            onClick={() => setPanelOpen(false)}
            aria-label="Close quick actions"
          >
            <X size={20} />
          </button>
        </div>
        <div className="quick-actions-panel-body">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => handleAction(action.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default QuickActions;
