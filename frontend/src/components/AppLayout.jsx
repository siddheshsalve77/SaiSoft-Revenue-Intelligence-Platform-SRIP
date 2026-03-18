import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useThemeStore, useAuthStore } from '../store'
import { LogoIcon } from './Logo'
import {
  LayoutDashboard, Users, ArrowLeftRight, Package,
  UserCheck, FileText, Activity, Radio, BarChart2,
  Bell, LogOut, Sun, Moon, Search, X
} from 'lucide-react'
import api from '../utils/api'
import './layout.css'

const NAV_SECTIONS = [
  {
    label: 'Core',
    links: [
      { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/ceo-summary',  icon: BarChart2,       label: 'CEO Summary' },
      { to: '/app/live-feed',    icon: Radio,           label: 'Live Feed' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { to: '/app/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
      { to: '/app/employees',    icon: Users,           label: 'Employees' },
      { to: '/app/clients',      icon: UserCheck,       label: 'Clients' },
      { to: '/app/products',     icon: Package,         label: 'Products' },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { to: '/app/reports',      icon: FileText,        label: 'Reports' },
      { to: '/app/activity',     icon: Activity,        label: 'Activity Log' },
      { to: '/app/settings',     icon: Bell,            label: 'Alerts & Settings' },
    ],
  },
]

/* ── Static notification data ─────────────────────────────── */
const NOTIFICATIONS = [
  { id: 1, icon: '📈', title: 'Revenue milestone hit', sub: 'Monthly target exceeded by 8%', unread: true,  bg: 'rgba(16,185,129,0.10)', color: '#10B981' },
  { id: 2, icon: '⚠️', title: 'Low activity — Nanded',  sub: 'Only 2 transactions this week',  unread: true,  bg: 'rgba(245,158,11,0.10)', color: '#F59E0B' },
  { id: 3, icon: '🏆', title: 'Top performer: Ganesh',   sub: '₹1.65Cr revenue this quarter',  unread: false, bg: 'rgba(99,102,241,0.10)', color: '#6366F1' },
  { id: 4, icon: '📄', title: 'Report ready',             sub: 'Q1 2026 summary generated',     unread: false, bg: 'rgba(20,184,166,0.10)', color: '#14B8A6' },
]

/* ── Global Search ────────────────────────────────────────── */
function GlobalSearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const inputRef = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    try {
      const [emps, prods] = await Promise.all([
        api.get('/employees').then(r => r.data),
        api.get('/products').then(r => r.data),
      ])
      const q_ = q.toLowerCase()
      setResults({
        employees: emps.filter(e =>
          e.name.toLowerCase().includes(q_) ||
          e.role.toLowerCase().includes(q_) ||
          e.region.toLowerCase().includes(q_)
        ).slice(0, 4),
        products: prods.filter(p =>
          (p.name || p.product_id).toLowerCase().includes(q_)
        ).slice(0, 3),
      })
    } catch { setResults(null) }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { if (query) search(query) }, 260)
    return () => clearTimeout(t)
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const fmt = (v) => {
    if (!v) return '₹0'
    if (v >= 1e7) return `₹${(v/1e7).toFixed(1)}Cr`
    if (v >= 1e5) return `₹${(v/1e5).toFixed(1)}L`
    return `₹${Math.round(v).toLocaleString('en-IN')}`
  }

  const hasResults = results && (results.employees?.length || results.products?.length)

  return (
    <div className="topbar-search" ref={ref}>
      <div className="topbar-search__wrap">
        <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          className="topbar-search__input"
          type="text"
          placeholder="Search employees, products…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          aria-label="Global search"
          id="global-search"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus() }}
            style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
          >
            <X size={12} />
          </button>
        )}
        {open && query && (
          <div className="search-dropdown">
            {loading && (
              <div className="search-empty">Searching…</div>
            )}
            {!loading && !hasResults && (
              <div className="search-empty">No results for "<strong>{query}</strong>"</div>
            )}
            {!loading && results?.employees?.length > 0 && (
              <div className="search-section">
                <div className="search-section-label">Employees</div>
                {results.employees.map((e) => (
                  <div className="search-result-item" key={e.id} onClick={() => setOpen(false)}>
                    <div className="search-result-item__icon" style={{ background: 'rgba(99,102,241,0.1)' }}>
                      <Users size={12} color="var(--color-indigo)" />
                    </div>
                    <div>
                      <div className="search-result-item__name">{e.name}</div>
                      <div className="search-result-item__sub">{e.role} · {e.region.replace(' MIDC','')} · {fmt(e.total_sales)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && results?.products?.length > 0 && (
              <div className="search-section">
                <div className="search-section-label">Products</div>
                {results.products.map((p) => (
                  <div className="search-result-item" key={p.product_id} onClick={() => setOpen(false)}>
                    <div className="search-result-item__icon" style={{ background: 'rgba(20,184,166,0.1)' }}>
                      <Package size={12} color="var(--color-teal)" />
                    </div>
                    <div>
                      <div className="search-result-item__name">{p.name || p.product_id}</div>
                      <div className="search-result-item__sub">{p.total_clients} clients · {fmt(p.total_revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Notification Bell ────────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const ref = useRef(null)
  const unread = notifs.filter(n => n.unread).length

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, unread: false })))

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-btn"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        id="notif-bell"
      >
        <Bell size={14} />
        {unread > 0 && <span className="notif-badge" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header__title">Notifications {unread > 0 && <span style={{ fontSize: '11px', background: 'var(--color-danger)', color: '#fff', borderRadius: '999px', padding: '1px 6px', marginLeft: 6, fontWeight: 600 }}>{unread}</span>}</span>
            {unread > 0 && <button className="notif-mark-read" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifs.map((n) => (
              <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                <div className="notif-item__icon" style={{ background: n.bg }}>{n.icon}</div>
                <div className="notif-item__body">
                  <div className="notif-item__title">{n.title}</div>
                  <div className="notif-item__sub">{n.sub}</div>
                </div>
                {n.unread && <div className="notif-item__dot" />}
              </div>
            ))}
          </div>
          <div className="notif-footer" onClick={() => setOpen(false)}>View all notifications →</div>
        </div>
      )}
    </div>
  )
}

/* ── APP LAYOUT ───────────────────────────────────────────── */
export default function AppLayout() {
  const { theme, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Sync theme attribute on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleLogout = () => { logout(); navigate('/') }

  // Derive page title from route
  const pageLabel = NAV_SECTIONS
    .flatMap(s => s.links)
    .find(l => location.pathname.startsWith(l.to))?.label || 'Dashboard'

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar" aria-label="App navigation">
        <div className="app-sidebar__header">
          <NavLink to="/app/dashboard" className="navbar__logo" style={{ textDecoration: 'none' }}>
            <LogoIcon size={30} />
            <div className="navbar__logo-text">
              <span className="navbar__logo-name">Sai Soft</span>
              <span className="navbar__logo-sub">Infosys · SRIP</span>
            </div>
          </NavLink>
        </div>

        <nav className="app-sidebar__nav" aria-label="Main menu">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="app-sidebar__section-label">{section.label}</div>
              {section.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `app-sidebar__link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <div className="sidebar-user">
            <div className="sidebar-user__avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
            <div className="sidebar-user__info">
              <div className="sidebar-user__name">{user?.username || 'admin'}</div>
              <div className="sidebar-user__role">Owner · Admin</div>
            </div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}
            style={{ width: '100%', borderRadius: 'var(--radius-md)', gap: '8px', fontSize: '13px' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="btn btn-ghost"
            style={{ width: '100%', fontSize: '13px', padding: '8px 12px', justifyContent: 'flex-start', gap: '8px' }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        {/* Top Bar */}
        <div className="app-topbar">
          <span className="topbar-page">{pageLabel}</span>
          <GlobalSearch />
          <div className="topbar-actions">
            <NotificationBell />
          </div>
        </div>

        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
