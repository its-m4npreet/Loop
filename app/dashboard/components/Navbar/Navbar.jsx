// Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  FileBarChart,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  User,
  Briefcase,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { notifications } from '../../data/dashboardData';
import './Navbar.css';

const NOTIF_ICONS = {
  CheckCircle:   CheckCircle,
  FileText:      FileText,
  AlertTriangle: AlertTriangle,
  Users:         Users,
};

function Navbar({ collapsed, onToggleMobile, user }) {
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifList, setNotifList]     = useState(notifications);
  const [searchValue, setSearchValue] = useState('');

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifList.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
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
      {/* Hamburger (mobile) */}
      <button
        className="navbar-hamburger"
        onClick={onToggleMobile}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="navbar-search">
        <Search className="navbar-search-icon" size={16} />
        <input
          type="text"
          placeholder="Search feedback, themes, reports…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Global search"
          id="navbar-search-input"
        />
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Notification Bell */}
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

        {/* Generate Report */}
        <button className="navbar-report-btn" id="navbar-report-btn">
          <FileBarChart size={16} />
          <span>Generate Report</span>
        </button>

        {/* Profile Avatar */}
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
            {user?.avatar || 'JD'}
          </div>

          <div className={`navbar-dropdown profile-dropdown ${profileOpen ? 'open' : ''}`}>
            <div className="profile-dropdown-header">
              <p className="profile-name">{user?.name || 'Jane Doe'}</p>
              <p className="profile-email">{user?.email || 'jane.doe@company.com'}</p>
            </div>
            <div className="profile-menu-list">
              {[
                { label: 'My Profile',  icon: User,     id: 'profile-menu-profile'   },
                { label: 'Workspace',   icon: Briefcase,id: 'profile-menu-workspace' },
                { label: 'Settings',    icon: Settings, id: 'profile-menu-settings'  },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} id={item.id} className="profile-menu-item">
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
              <div className="profile-menu-divider" />
              <button className="profile-menu-item danger" id="profile-menu-logout">
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
