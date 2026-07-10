'use client';

import React from 'react';
import QuickActionCard from '../cards/QuickActionCard';
import { quickActions } from '../../data/dashboardData';
import './QuickActions.css';

function QuickActions() {
  function handleAction(actionId: string) {
    console.log('Quick action triggered:', actionId);
  }

  return (
    <section className="quick-actions-section" aria-label="Quick actions">
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
  );
}

export default QuickActions;
