'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, X } from 'lucide-react';
import QuickActionCard from '../cards/QuickActionCard';
import { quickActions } from '../../data/dashboardData';
import './QuickActions.css';

const ACTION_ROUTES: Record<string, string> = {
  'add-feedback': '/import-feedback?method=manual',
  'upload-csv': '/import-feedback?method=csv',
  'ask-loop': '/ask-loop',
  'generate-report': '/reports/generate',
};

function QuickActions() {
  const pathname = usePathname();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);

  const isGenerateReport =
    pathname === '/reports/generate' || pathname.startsWith('/reports/generate/');
  const showDesktopSection =
    pathname === '/dashboard' || pathname === '/';

  function handleAction(actionId: string) {
    setPanelOpen(false);
    const route = ACTION_ROUTES[actionId];
    if (route) {
      router.push(route);
    }
  }

  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [panelOpen]);

  // Close panel on navigation
  useEffect(() => {
    setPanelOpen(false);
  }, [pathname]);

  // Hide entirely while generating a report
  if (isGenerateReport) {
    return null;
  }

  return (
    <>
      {/* Desktop section — dashboard only */}
      {showDesktopSection && (
        <section
          className="quick-actions-section quick-actions-desktop"
          aria-label="Quick actions"
        >
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
      )}

      {/* Mobile FAB — all pages except generate report */}
      <button
        type="button"
        className="quick-actions-fab"
        onClick={() => setPanelOpen(true)}
        aria-label="Open quick actions"
      >
        <Zap size={22} />
      </button>

      {/* Mobile slide-up panel */}
      <div
        className={`quick-actions-overlay ${panelOpen ? 'open' : ''}`}
        onClick={() => setPanelOpen(false)}
        aria-hidden={!panelOpen}
      />
      <div
        className={`quick-actions-panel ${panelOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Quick actions"
      >
        <div className="quick-actions-panel-header">
          <h3 className="quick-actions-panel-title">Quick Actions</h3>
          <button
            type="button"
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
