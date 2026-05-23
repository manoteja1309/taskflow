import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import './Layout.css';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4'];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="1" width="8" height="8" rx="2" fill="var(--accent)" />
              <rect x="11" y="1" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.5" />
              <rect x="1" y="11" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.5" />
              <rect x="11" y="11" width="8" height="8" rx="2" fill="var(--accent)" />
            </svg>
          </div>
          <span>TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <IconGrid /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <IconFolder /> Projects
          </NavLink>
          <NavLink to="/tasks" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <IconCheck /> Tasks
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{marginTop: 16}}>Admin</div>
              <NavLink to="/team" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <IconUsers /> Team
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar" style={{background: user?.avatar || '#6366f1'}}>
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
            <IconLogout />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu-btn btn-icon" onClick={() => setSidebarOpen(true)}>
            <IconMenu />
          </button>
          <div className="topbar-right">
            <span className="topbar-greeting">
              Hello, <strong>{user?.name?.split(' ')[0]}</strong>
            </span>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function IconGrid() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function IconFolder() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}
function IconCheck() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function IconUsers() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconLogout() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IconMenu() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
