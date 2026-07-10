'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard',       label: 'Dashboard',      icon: LayoutDashboard, href: '/dashboard' },
  { id: 'feedback-inbox',  label: 'Feedback Inbox', icon: MessageSquare,   href: '/feedback-inbox' },
  { id: 'analytics',       label: 'Analytics',      icon: BarChart2,       href: '/analytics' },
  { id: 'themes',          label: 'Themes',         icon: Tag,             href: '/themes' },
  { id: 'ask-loop',        label: 'Ask LOOP',       icon: Bot,             href: '/ask-loop' },
  { id: 'reports',         label: 'Reports',        icon: FileText,        href: '/reports' },
  { id: 'team',            label: 'Team',           icon: Users,           href: '/team' },
  { id: 'settings',        label: 'Settings',       icon: Settings,        href: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={sidebarClass} aria-label="Main navigation">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={18} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">LOOP</span>
            <span className="sidebar-logo-tagline">AI Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {!collapsed && (
            <p className="sidebar-section-label">Main Menu</p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="nav-icon" size={18} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}

          <div className="sidebar-divider" />

          {!collapsed && (
            <p className="sidebar-section-label">Workspace</p>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-logout-btn"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="nav-icon" size={18} />
            <span className="nav-label">Logout</span>
          </button>
        </div>

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
