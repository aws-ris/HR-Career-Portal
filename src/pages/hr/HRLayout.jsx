import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Briefcase, BarChart2, Settings, ChevronRight } from 'lucide-react';

export default function HRLayout() {
  return (
    <div className="hr-shell">
      {/* ── Sidebar ── */}
      <aside className="hr-sidebar">
        <div className="hr-sidebar-brand">
          <div className="hr-sidebar-logo">
            <img src="/logo.jpg" alt="RIS" />
          </div>
          <span className="hr-sidebar-label">HR Portal</span>
        </div>

        <nav className="hr-sidebar-nav">
          <p className="hr-nav-section-label">MANAGEMENT</p>
          <NavLink to="/hr" end className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}>
            <Briefcase size={18} />
            <span>Job Postings</span>
            <ChevronRight size={14} className="hr-nav-chevron" />
          </NavLink>
          <NavLink to="/hr/analytics" className={({ isActive }) => `hr-nav-item ${isActive ? 'active' : ''}`}>
            <BarChart2 size={18} />
            <span>Analytics</span>
          </NavLink>

          <p className="hr-nav-section-label" style={{ marginTop: '2rem' }}>SYSTEM</p>
          <a className="hr-nav-item disabled" aria-disabled="true">
            <Settings size={18} />
            <span>Settings</span>
          </a>
        </nav>

        <div className="hr-sidebar-footer">
          <span>RIS · New Delhi</span>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="hr-main">
        <Outlet />
      </main>
    </div>
  );
}
