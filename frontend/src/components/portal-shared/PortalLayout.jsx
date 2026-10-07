import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PortalLayout({
  portalName,
  portalBadge,
  navSections = [],
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#121212] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="VPD Logo" className="h-7 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-tight leading-none">VPD Technologies</span>
            <span className="text-[10px] text-[#d4af37] font-medium leading-none mt-1">{portalName}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-[#1a1a1a] text-zinc-300 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#121212] border-r border-[#2a2a2a] flex flex-col justify-between transition-transform duration-200 ease-in-out
        md:translate-x-0 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="VPD Logo" className="h-8 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-wider">VPD TECHNOLOGIES</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                <span className="text-[11px] font-semibold text-[#d4af37] uppercase tracking-wider">{portalName}</span>
              </div>
            </div>
          </div>
          {portalBadge && (
            <div className="mt-3 px-2 py-1 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-[11px] text-zinc-400">
              {portalBadge}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group
                      ${isActive
                        ? 'bg-[#d4af37]/15 text-[#d4af37] border-l-2 border-[#d4af37]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon && <span className={`text-base ${isActive ? 'text-[#d4af37]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{item.icon}</span>}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#2a2a2a] text-zinc-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-[#2a2a2a] bg-[#0e0e0e]/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#d4af37] shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
                <p className="text-[10px] text-zinc-500 truncate capitalize">{user?.role || 'Verified'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

