'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { logout } from '../../utils/logout';
import {
  Search,
  Bell,
  FileBarChart,
  Upload,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  User,
  Briefcase,
  Settings,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { notifications } from '../../data/dashboardData';
import Avatar from '../Avatar';
import './Navbar.css';

const NOTIF_ICONS: Record<string, LucideIcon> = {
  CheckCircle:   CheckCircle,
  FileText:      FileText,
  AlertTriangle: AlertTriangle,
  Users:         Users,
};

interface Notification {
  id: number;
  type: string;
  icon: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

interface NavbarProps {
  collapsed: boolean;
  onToggleMobile: () => void;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

function Navbar({ collapsed, onToggleMobile, userName, userEmail, userImage }: NavbarProps) {
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifList, setNotifList]     = useState<Notification[]>(notifications);
  const [searchValue, setSearchValue] = useState('');

  const notifRef   = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifList.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function markAllRead() {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <header className={`navbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="navbar-hamburger"
        onClick={onToggleMobile}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* <div className="navbar-search">
        <Search className="navbar-search-icon" size={16} />
        <input
          type="text"
          placeholder="Search feedback, themes, reports…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Global search"
          id="navbar-search-input"
        />
      </div> */}

      <div className="navbar-actions">
        <div className="navbar-notification-wrapper" ref={notifRef}>
          <button
            className="navbar-icon-btn"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            aria-label={`Notifications – ${unreadCount} unread`}
            id="notification-bell-btn"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          <div className={`navbar-dropdown notifications-dropdown ${notifOpen ? 'open' : ''}`}>
            <div className="dropdown-header">
              <h3>Notifications</h3>
              <button className="mark-all-read" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
            <div className="notification-list">
              {notifList.map((notif) => {
                const Icon = NOTIF_ICONS[notif.icon] || Bell;
                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.read ? '' : 'unread'}`}
                  >
                    <div className={`notif-icon-wrap ${notif.type}`}>
                      <Icon size={14} />
                    </div>
                    <div className="notif-content">
                      <p className="notif-title">{notif.title}</p>
                      <p className="notif-detail">{notif.detail}</p>
                    </div>
                    <span className="notif-time">{notif.time}</span>
                    {!notif.read && <span className="unread-dot" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Link
          href="/import-feedback"
          className="navbar-import-btn"
          id="navbar-import-btn"
          aria-label="Import Feedback"
          title="Import Feedback"
        >
          <Upload size={16} />
          <span>Import</span>
        </Link>

        <Link href="/reports/generate" className="navbar-report-btn" id="navbar-report-btn">
          <FileBarChart size={16} />
          <span>Generate Report</span>
        </Link>

        <div className="navbar-profile-wrapper" ref={profileRef}>
          <div
            className={`navbar-avatar ${profileOpen ? 'open' : ''}`}
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            id="profile-avatar-btn"
            onKeyDown={(e) => e.key === 'Enter' && setProfileOpen((v) => !v)}
          >
            <Avatar name={userName} src={userImage} size="md" />
          </div>

          <div className={`navbar-dropdown profile-dropdown ${profileOpen ? 'open' : ''}`}>
            <div className="profile-dropdown-header">
              <p className="profile-name">{userName || 'User'}</p>
              <p className="profile-email">{userEmail || 'user@example.com'}</p>
            </div>
            <div className="profile-menu-list">
              {[
                { label: 'My Profile',  icon: User,     href: '/profile',  id: 'profile-menu-profile'   },
                { label: 'Workspace',   icon: Briefcase, href: '/workspace', id: 'profile-menu-workspace' },
                { label: 'Settings',    icon: Settings, href: '/settings', id: 'profile-menu-settings'  },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    id={item.id}
                    className="profile-menu-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="profile-menu-divider" />
              <button className="profile-menu-item danger" id="profile-menu-logout" onClick={logout}>
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
