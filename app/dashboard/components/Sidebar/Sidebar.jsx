// Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart2,
  Tag,
  Bot,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'feedback-inbox',  label: 'Feedback Inbox', icon: MessageSquare   },
  { id: 'analytics',       label: 'Analytics',      icon: BarChart2       },
  { id: 'themes',          label: 'Themes',         icon: Tag             },
  { id: 'ask-loop',        label: 'Ask LOOP',       icon: Bot             },
  { id: 'reports',         label: 'Reports',        icon: FileText        },
  { id: 'team',            label: 'Team',           icon: Users           },
  { id: 'settings',        label: 'Settings',       icon: Settings        },
];

function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={sidebarClass} aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">LOOP</span>
            <span className="sidebar-logo-tagline">AI Intelligence</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {!collapsed && (
            <p className="sidebar-section-label">Main Menu</p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="nav-icon" size={18} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}

          <div className="sidebar-divider" />

          {!collapsed && (
            <p className="sidebar-section-label">Workspace</p>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="sidebar-logout-btn"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="nav-icon" size={18} />
            <span className="nav-label">Logout</span>
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
