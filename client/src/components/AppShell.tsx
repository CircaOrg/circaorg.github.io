import { useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { FiGrid, FiSettings, FiSliders, FiTrendingUp, FiDroplet, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import CircaLogo from './CircaLogo';
import AgentChat from './AgentChat';
import './AppShell.css';

const NAV = [
  { to: '/dashboard',  icon: FiGrid,       label: 'Dashboard'      },
  { to: '/irrigate',   icon: FiDroplet,    label: 'Irrigate'       },
  { to: '/scheduler',  icon: FiCalendar,   label: 'Scheduler'      },
  { to: '/control',    icon: FiSliders,    label: 'Manual Control' },
  { to: '/configure',  icon: FiSettings,   label: 'Configure'      },
  { to: '/prediction', icon: FiTrendingUp, label: 'Prediction'     },
] satisfies Array<{ to: string; icon: IconType; label: string }>;

export default function AppShell() {
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  const activeLabel = NAV.find((n) => location.pathname.startsWith(n.to))?.label ?? '';

  return (
    <div className={`app-shell ${chatOpen ? 'chat-open' : ''}`}>
      {/* ── Sidebar ── */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <CircaLogo className="sidebar-wordmark" />
          </Link>
        </div>

        <div className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon" aria-hidden="true"><item.icon /></span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* AI Chat toggle at bottom of sidebar */}
        <div className="sidebar-ai-toggle-area">
          <button
            className={`sidebar-item sidebar-ai-btn ${chatOpen ? 'active' : ''}`}
            onClick={() => setChatOpen((v) => !v)}
            aria-expanded={chatOpen}
            aria-controls="ai-chat-panel"
            title="Circa AI assistant"
          >
            <span className="sidebar-icon" aria-hidden="true"><FiMessageSquare /></span>
            <span className="sidebar-label">Circa AI</span>
            <span className="sidebar-ai-badge" aria-hidden="true">AI</span>
          </button>
        </div>
      </nav>

      {/* ── AI Chat Panel ── */}
      {chatOpen && (
        <div id="ai-chat-panel" className="chat-panel" role="complementary" aria-label="Circa AI assistant">
          <AgentChat onClose={() => setChatOpen(false)} />
        </div>
      )}

      {/* ── Main ── */}
      <div className="main-content">
        <header className="top-bar">
          <span className="top-bar-title">{activeLabel}</span>
          <div className="top-bar-right" />
        </header>
        <div className="page-content fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
