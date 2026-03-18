import { useState, useEffect, useMemo, useCallback } from 'react'
import { getEmployees } from '../utils/api'
import { Users, TrendingUp, MapPin, Briefcase, Trophy, Search, X, RefreshCw } from 'lucide-react'
import './shared.css'
import './Employees.css'

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}

/* ── Role system — light-theme semantic colors ── */
const ROLES = {
  'Regional Manager':  { bg: 'rgba(99,102,241,0.10)', color: '#6366F1', label: 'Manager' },
  'Sales Executive':   { bg: 'rgba(16,185,129,0.10)', color: '#10B981', label: 'Sales' },
  'Account Manager':   { bg: 'rgba(20,184,166,0.10)', color: '#14B8A6', label: 'Account' },
  'Support Executive': { bg: 'rgba(245,158,11,0.10)', color: '#F59E0B', label: 'Support' },
}
const REGIONS = {
  'Aurangabad MIDC': { short: 'AUR', color: '#6366F1' },
  'Nanded MIDC':     { short: 'NAN', color: '#10B981' },
  'Bangalore MIDC':  { short: 'BLR', color: '#14B8A6' },
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({ name, role, size = 48 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const r = ROLES[role] || ROLES['Sales Executive']
  return (
    <div className="emp-avatar" style={{
      width: size, height: size, fontSize: size * 0.3,
      background: r.bg,
      border: `2px solid ${r.color}33`,
      color: r.color,
    }}>
      {initials}
    </div>
  )
}

/* ── Performance bar ─────────────────────────────────────────── */
function PerfBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="perf-bar">
      <div className="perf-bar__fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

/* ── Employee Card ───────────────────────────────────────────── */
function EmpCard({ emp, rank, maxSales, onClick }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), rank * 50)
    return () => clearTimeout(t)
  }, [rank])

  const role = ROLES[emp.role] || ROLES['Sales Executive']
  const region = REGIONS[emp.region] || { short: '—', color: '#999' }
  const isTop = rank === 0

  return (
    <div
      className={`emp-card reveal ${visible ? 'visible' : ''} ${isTop ? 'emp-card--top' : ''}`}
      style={{ '--card-delay': `${rank * 50}ms` }}
      onClick={() => onClick(emp)}
    >
      {isTop && (
        <div className="emp-card__crown">
          <Trophy size={10} /> #1 Performer
        </div>
      )}
      {/* Status dot */}
      <div
        className="emp-status-dot"
        title={emp.is_active ? 'Active' : `Inactive since ${emp.exit_date}`}
        style={{ background: emp.is_active ? '#10B981' : '#94A3B8' }}
      />

      <div className="emp-card__header">
        <Avatar name={emp.name} role={emp.role} size={46} />
        <div className="emp-card__badges">
          <span className="role-pill" style={{ background: role.bg, color: role.color }}>
            {role.label}
          </span>
          <span className="region-pill" style={{ background: `${region.color}15`, color: region.color }}>
            {region.short}
          </span>
        </div>
      </div>

      <div className="emp-card__name">{emp.name}</div>
      <div className="emp-card__sub">{emp.role} &nbsp;·&nbsp; {emp.region.replace(' MIDC', '')}</div>

      <PerfBar value={emp.total_sales} max={maxSales} color={role.color} />

      <div className="emp-card__stats">
        <div className="emp-card__stat">
          <span className="emp-card__stat-val" style={{ color: role.color }}>{fmt(emp.total_sales)}</span>
          <span className="emp-card__stat-label">Revenue</span>
        </div>
        <div className="emp-card__stat-divider" />
        <div className="emp-card__stat">
          <span className="emp-card__stat-val">{emp.total_transactions}</span>
          <span className="emp-card__stat-label">Deals</span>
        </div>
        <div className="emp-card__stat-divider" />
        <div className="emp-card__stat">
          <span className="emp-card__stat-val" style={{ fontSize: 11 }}>{emp.top_product}</span>
          <span className="emp-card__stat-label">Top Product</span>
        </div>
      </div>

      {!emp.is_active && (
        <div className="emp-card__inactive-banner">Inactive</div>
      )}
    </div>
  )
}

/* ── Skeleton Card ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="emp-card emp-card--skel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 5 }} />
          <div className="skeleton" style={{ height: 9, width: '30%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 4, width: '100%', marginBottom: 14, borderRadius: 2 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 30, flex: 1 }} />
        <div className="skeleton" style={{ height: 30, flex: 1 }} />
        <div className="skeleton" style={{ height: 30, flex: 1 }} />
      </div>
    </div>
  )
}

/* ── Employee Modal ──────────────────────────────────────────── */
function EmpModal({ emp, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const role = ROLES[emp.role] || ROLES['Sales Executive']

  const kpis = [
    { label: 'Total Revenue',    value: fmt(emp.total_sales),         color: role.color },
    { label: 'Deals Closed',     value: emp.total_transactions,       color: null },
    { label: 'Avg Deal Size',    value: fmt(emp.total_sales / (emp.total_transactions || 1)), color: null },
    { label: 'Top Product',      value: emp.top_product,              color: null },
    { label: 'Employee ID',      value: emp.id,                       color: null },
    { label: 'Joined',           value: emp.join_date,                color: null },
    { label: 'Status',           value: emp.is_active ? 'Active' : `Left ${emp.exit_date}`, color: emp.is_active ? '#10B981' : '#94A3B8' },
    { label: 'Region',           value: emp.region,                   color: null },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={13} /></button>

        {/* Header */}
        <div className="emp-modal-header">
          <Avatar name={emp.name} role={emp.role} size={56} />
          <div className="emp-modal-info">
            <div className="modal-name">{emp.name}</div>
            <div className="modal-role" style={{ color: role.color }}>
              <span className="role-pill" style={{ background: role.bg, color: role.color }}>{emp.role}</span>
            </div>
            <div className="modal-region"><MapPin size={11} style={{ marginRight: 4 }}/>{emp.region}</div>
          </div>
          <span className={`modal-status ${emp.is_active ? 'active' : 'inactive'}`}>
            {emp.is_active ? '● Active' : '○ Inactive'}
          </span>
        </div>

        {/* KPIs */}
        <div className="modal-kpis">
          {kpis.map(k => (
            <div className="modal-kpi" key={k.label}>
              <div className="modal-kpi__label">{k.label}</div>
              <div className="modal-kpi__value" style={k.color ? { color: k.color } : {}}>
                {k.value ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── EMPLOYEES PAGE ──────────────────────────────────────────── */
export default function Employees() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterRole, setFilterRole]     = useState('')
  const [sortBy, setSortBy]             = useState('revenue')
  const [showActive, setShowActive]     = useState(false)
  const [lastRefresh, setLastRefresh]   = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    getEmployees()
      .then(d => { setData(d); setLastRefresh(new Date()) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60000) // poll every 60s
    return () => clearInterval(id)
  }, [fetchData])

  const regions = useMemo(() => [...new Set((data || []).map(e => e.region))], [data])
  const roles   = useMemo(() => [...new Set((data || []).map(e => e.role))], [data])
  const active  = useMemo(() => (data || []).filter(e => e.is_active).length, [data])
  const totalRev = useMemo(() => (data || []).reduce((s, e) => s + e.total_sales, 0), [data])
  const maxSales  = useMemo(() => Math.max(...(data || []).map(e => e.total_sales), 0), [data])

  const filtered = useMemo(() => (data || [])
    .filter(e => !filterRegion || e.region === filterRegion)
    .filter(e => !filterRole   || e.role === filterRole)
    .filter(e => !showActive   || e.is_active)
    .filter(e => !search       || e.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === 'revenue' ? b.total_sales - a.total_sales
      : sortBy === 'deals' ? b.total_transactions - a.total_transactions
      : a.name.localeCompare(b.name)
    ),
  [data, filterRegion, filterRole, showActive, search, sortBy])

  const summaryTiles = [
    { label: 'Total Staff',   value: data?.length ?? '—', icon: Users,      color: '#6366F1' },
    { label: 'Active Now',    value: active || '—',       icon: TrendingUp,  color: '#10B981' },
    { label: 'Regions',       value: regions.length || '—', icon: MapPin,   color: '#14B8A6' },
    { label: 'Team Revenue',  value: fmt(totalRev),       icon: Briefcase,  color: '#F59E0B' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Employees</h1>
          <p className="dash-subtitle">
            {loading ? 'Loading…' : `${data?.length ?? 0} team members · ${active} active`}
            {lastRefresh && (
              <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--color-text-subtle)' }}>
                Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="filter-bar">
          {/* Manual refresh */}
          <button className="filter-refresh" onClick={fetchData} title="Refresh">
            <RefreshCw size={12} /> Refresh
          </button>
          <div className="filter-divider" />
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              className="filter-select"
              style={{ paddingLeft: 30, minWidth: 180 }}
              placeholder="Search name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <div className="filter-divider" />
          <select className="filter-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>
          <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="revenue">Sort: Revenue</option>
            <option value="deals">Sort: Deals</option>
            <option value="name">Sort: Name</option>
          </select>
          <label className="filter-toggle">
            <input type="checkbox" checked={showActive} onChange={e => setShowActive(e.target.checked)} />
            Active only
          </label>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="emp-summary">
        {summaryTiles.map((t, i) => (
          <div className="emp-summary-tile reveal visible" style={{ '--card-delay': `${i * 60}ms` }} key={t.label}>
            <div className="emp-summary-tile__icon" style={{ background: `${t.color}15`, color: t.color }}>
              <t.icon size={16} />
            </div>
            <div>
              {loading
                ? <div className="skeleton" style={{ height: 22, width: 60, marginBottom: 4 }} />
                : <div className="emp-summary-tile__val">{t.value}</div>
              }
              <div className="emp-summary-tile__label">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <div className="empty-state__title">Failed to load employees</div>
          <div className="empty-state__sub">{error}</div>
        </div>
      )}

      {/* Grid */}
      <div className="emp-grid">
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state__icon">👥</div>
            <div className="empty-state__title">No employees match</div>
            <div className="empty-state__sub">Try clearing your filters or search</div>
          </div>
        )}

        {!loading && !error && filtered.map((emp, i) => (
          <EmpCard key={emp.id} emp={emp} rank={i} maxSales={maxSales} onClick={setSelected} />
        ))}
      </div>

      {selected && <EmpModal emp={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
