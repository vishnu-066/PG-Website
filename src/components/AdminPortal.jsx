import React, { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import AdminLogin from './AdminLogin';
import DashboardView from './DashboardView';
import RoomView from './RoomView';
import TenantView from './TenantView';
import RentView from './RentView';
import ReportsView from './ReportsView';
import SettingsView from './SettingsView';
import logo from '../logo.jpg';

export default function AdminPortal({ onBackToHome }) {
  const { isAuthenticated, adminProfile, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Close mobile sidebar on navigation
  const navigateTo = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // If not authenticated, render Login view
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Render view depending on active tab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'rooms':
        return <RoomView />;
      case 'tenants':
        return <TenantView />;
      case 'rent':
        return <RentView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="admin-portal-wrapper">
      <div className="admin-mobile-bottom-nav no-print">
        <button 
          className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Rooms</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>Tenants</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'rent' ? 'active' : ''}`}
          onClick={() => setActiveTab('rent')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Rent</span>
        </button>

        <button 
          className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.2" fill="none">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>

      {/* Mobile Header (No-Print) */}
      <div className="admin-mobile-header no-print">
        <div className="mobile-header-left">
          <button 
            className="mobile-menu-trigger-btn" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="mobile-header-title">
            {activeTab === 'dashboard' ? 'Overview' :
             activeTab === 'rooms' ? 'Rooms & Beds' :
             activeTab === 'tenants' ? 'Tenants' :
             activeTab === 'rent' ? 'Rent Ledger' :
             activeTab === 'reports' ? 'Reports' : 'Settings'}
          </span>
        </div>
        
        <div className="mobile-header-right">
          {/* Notifications Trigger */}
          <div className="mobile-header-notification-wrapper">
            <button 
              className="mobile-header-icon-btn notif-btn" 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notif-badge-dot"></span>
            </button>
            
            {showNotifDropdown && (
              <div className="mobile-notifications-tray glass-card animate-fade-in">
                <div className="tray-header">
                  <h4>Notifications</h4>
                  <button className="clear-btn" onClick={() => setShowNotifDropdown(false)}>Close</button>
                </div>
                <div className="tray-body">
                  <div className="tray-item">
                    <span className="tray-dot warning"></span>
                    <p>Rent overdue for <strong>Rahul Verma</strong> (Room 102)</p>
                  </div>
                  <div className="tray-item">
                    <span className="tray-dot success"></span>
                    <p>3 vacant beds ready for boarding on Floor 5</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button className="mobile-header-icon-btn theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
              </svg>
            )}
          </button>

          {/* User Avatar */}
          <div className="mobile-header-avatar" onClick={() => navigateTo('settings')}>
            {adminProfile.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </div>

      {/* Sidebar Backdrop Overlay (No-Print) */}
      {sidebarOpen && (
        <div className="admin-sidebar-backdrop no-print" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar Container (No-Print) */}
      <div className={`admin-sidebar no-print ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-info">
            <img src={logo} alt="Sri Venkateswara Logo" />
            <div>
              <h3>Sri Venkateswara</h3>
              <span>Gents PG Management</span>
            </div>
          </div>
          <button 
            className="mobile-sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`sidebar-nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => navigateTo('rooms')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Rooms & Beds</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => navigateTo('tenants')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Tenants Registry</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'rent' ? 'active' : ''}`}
            onClick={() => navigateTo('rent')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Rent Collection</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => navigateTo('reports')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Reports & Audit</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="sidebar-footer">
          <div className="admin-user-profile-badge">
            <div className="profile-initials">
              {adminProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profile-details">
              <h4>{adminProfile.name}</h4>
              <span>@{adminProfile.username}</span>
            </div>
          </div>
          
          <div className="sidebar-action-buttons">
            <button className="sidebar-action-btn back-home" onClick={onBackToHome} title="Go back to Public Website">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Public Website</span>
            </button>
            <button className="sidebar-action-btn logout-btn" onClick={logout} title="Secure Log Out">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Secure Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="admin-main-panel">
        {/* Desktop Header Area (No-Print) */}
        <header className="admin-desktop-header no-print">
          <div className="header-breadcrumbs">
            <span>Admin Portal</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-active">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
          </div>

          <div className="header-right-controls">
            {/* Desktop Theme Toggle */}
            <button className="admin-header-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <div className="divider-h"></div>
            <div className="user-profile-badge">
              <span className="user-role-lbl">Owner</span>
              <span className="user-name-lbl">{adminProfile.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab View */}
        <main className="admin-inner-view">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
