import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Briefcase, BarChart2, Settings, ChevronRight, LogOut } from 'lucide-react';

export default function HRLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('hr_token');

  useEffect(() => {
    if (!token) {
      navigate('/hr/login', { replace: true });
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('hr_token');
    navigate('/');
  };

  if (!token) {
    return null;
  }

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

        <div className="hr-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 14px',
              background: '#fee2e2',
              color: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fca5a5'; e.currentTarget.style.color = '#b91c1c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>RIS · New Delhi</span>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="hr-main">
        <Outlet />
      </main>
    </div>
  );
}
