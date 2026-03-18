import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users, TrendingUp, MapPin, Building2, Star, Search, X, RefreshCw, Zap, Award } from 'lucide-react'
import './shared.css'
import './Clients.css'

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const SEGMENTS = {
  'Manufacturing': { color: '#6366F1', bg: 'rgba(99,102,241,0.10)' },
  'SME':          { color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
  'Trader':       { color: '#14B8A6', bg: 'rgba(20,184,166,0.10)' },
  'Service':      { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
}
const REGIONS = {
  'Aurangabad MIDC': { color: '#6366F1', short: 'AUR' },
  'Nanded MIDC':     { color: '#10B981', short: 'NAN' },
  'Bangalore MIDC':  { color: '#14B8A6', short: 'BLR' },
}
const TIER_CONFIG = {
  'high-value': { label: 'High Value', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  'mid-value':  { label: 'Mid Value',  color: '#6366F1', bg: 'rgba(99,102,241,0.10)' },
  'low-value':  { label: 'Low Value',  color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' },
}

const TOOLTIP_STYLE = {
  background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.08)',
  borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
  boxShadow: '0 4px 14px rgba(15,23,42,0.10)'
}

/* ── Client Card ─────────────────────────────────────────────── */
function ClientCard({ client, rank, maxRev, onClick }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), rank * 40); return () => clearTimeout(t) }, [rank])

  const seg    = SEGMENTS[client.segment]      || SEGMENTS['SME']
  const region = REGIONS[client.region]        || { color: '#999', short: '—' }
  const tier   = TIER_CONFIG[client.value_tier]|| TIER_CONFIG['high-value']
  const pct    = maxRev > 0 ? (client.total_revenue / maxRev) * 100 : 0
  const daysSince = client.last_deal
    ? Math.floor((new Date() - new Date(client.last_deal)) / 86400000)
    : null

  return (
    <div className={`client-card reveal ${visible ? 'visible' : ''} ${rank < 3 ? 'client-card--top' : ''}`}
      style={{ '--card-delay': `${rank * 40}ms` }}
      onClick={() => onClick(client)}>

      {rank < 3 && <div className="client-rank-badge">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'} #{rank + 1}</div>}

      <div className="client-card__header">
        <div className="client-avatar" style={{ background: seg.bg, color: seg.color }}>
          {client.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="client-card__badges">
          <span className="role-pill" style={{ background: seg.bg, color: seg.color }}>{client.segment}</span>
          <span className="region-pill" style={{ background: `${region.color}14`, color: region.color }}>{region.short}</span>
        </div>
      </div>

      <div className="client-card__name">{client.name}</div>
      <div className="client-card__sub">{client.region.replace(' MIDC', '')} · {client.id}</div>

      {/* Revenue bar */}
      <div className="perf-bar" title={`Revenue: ${fmt(client.total_revenue)}`}>
        <div className="perf-bar__fill" style={{ width: `${pct}%`, background: seg.color }} />
      </div>

      <div className="client-card__stats">
        <div className="client-card__stat">
          <span className="emp-card__stat-val" style={{ color: seg.color }}>{fmt(client.total_revenue)}</span>
          <span className="emp-card__stat-label">Revenue</span>
        </div>
        <div className="emp-card__stat-divider" />
        <div className="client-card__stat">
          <span className="emp-card__stat-val">{client.total_transactions}</span>
          <span className="emp-card__stat-label">Deals</span>
        </div>
        <div className="emp-card__stat-divider" />
        <div className="client-card__stat">
          <span className="emp-card__stat-val" style={{ fontSize: 11, color: daysSince > 90 ? '#EF4444' : '#10B981' }}>
            {daysSince != null ? `${daysSince}d ago` : '—'}
          </span>
          <span className="emp-card__stat-label">Last Deal</span>
        </div>
      </div>
    </div>
  )
}

/* ── Skeleton Card ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="client-card" style={{ pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 11, width: '40%', marginBottom: 5 }} />
          <div className="skeleton" style={{ height: 9,  width: '25%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 10, width: '55%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 3, width: '100%', marginBottom: 14, borderRadius: 2 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 28, flex: 1 }} />
        <div className="skeleton" style={{ height: 28, flex: 1 }} />
        <div className="skeleton" style={{ height: 28, flex: 1 }} />
      </div>
    </div>
  )
}

/* ── Client Modal ────────────────────────────────────────────── */
function ClientModal({ client, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const seg  = SEGMENTS[client.segment] || SEGMENTS['SME']
  const tier = TIER_CONFIG[client.value_tier] || TIER_CONFIG['high-value']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={13} /></button>
        <div className="emp-modal-header">
          <div className="client-avatar" style={{ width: 56, height: 56, fontSize: 18, background: seg.bg, color: seg.color, borderRadius: 14 }}>
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="emp-modal-info">
            <div className="modal-name">{client.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span className="role-pill" style={{ background: seg.bg, color: seg.color }}>{client.segment}</span>
              <span className="role-pill" style={{ background: tier.bg, color: tier.color }}>{tier.label}</span>
            </div>
            <div className="modal-region" style={{ marginTop: 5 }}><MapPin size={11} style={{ marginRight: 4 }} />{client.region}</div>
          </div>
        </div>

        <div className="txn-modal-section-label">Performance</div>
        <div className="modal-kpis">
          {[
            { label: 'Total Revenue',  value: fmt(client.total_revenue),          color: seg.color },
            { label: 'Total Deals',    value: client.total_transactions },
            { label: 'Avg Deal Size',  value: fmt(client.total_revenue / (client.total_transactions || 1)) },
            { label: 'Products Bought', value: client.products_bought?.length ?? '—' },
          ].map(k => (
            <div className="modal-kpi" key={k.label}>
              <div className="modal-kpi__label">{k.label}</div>
              <div className="modal-kpi__value" style={k.color ? { color: k.color } : {}}>{k.value ?? '—'}</div>
            </div>
          ))}
        </div>

        <div className="txn-modal-section-label" style={{ marginTop: 14 }}>History</div>
        <div className="modal-kpis">
          {[
            { label: 'Client ID',   value: client.id },
            { label: 'First Deal',  value: fmtDate(client.first_deal) },
            { label: 'Last Deal',   value: fmtDate(client.last_deal) },
            { label: 'Tenure',      value: client.first_deal ? `${Math.floor((new Date() - new Date(client.first_deal)) / (365.25 * 86400000))}y` : '—' },
          ].map(k => (
            <div className="modal-kpi" key={k.label}>
              <div className="modal-kpi__label">{k.label}</div>
              <div className="modal-kpi__value">{k.value ?? '—'}</div>
            </div>
          ))}
        </div>

        {client.products_bought?.length > 0 && (
          <>
            <div className="txn-modal-section-label" style={{ marginTop: 14 }}>Products</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {client.products_bought.map(p => (
                <span key={p} className="txn-product-tag" style={{ color: '#6366F1', background: 'rgba(99,102,241,0.09)', borderColor: 'rgba(99,102,241,0.18)', fontSize: 11 }}>{p}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── CLIENTS PAGE ────────────────────────────────────────────── */
export default function Clients() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')
  const [filterRegion, setFilterRegion]   = useState('')
  const [filterSegment, setFilterSegment] = useState('')
  const [sortBy, setSortBy]               = useState('revenue')
  const [lastRefresh, setLastRefresh]     = useState(null)

  const fetchData = useCallback(() => {
    axios.get('/api/clients')
      .then(r => { setData(r.data); setLastRefresh(new Date()) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 60000); return () => clearInterval(id) }, [fetchData])

  const regions  = useMemo(() => [...new Set((data || []).map(c => c.region))], [data])
  const segments = useMemo(() => [...new Set((data || []).map(c => c.segment))], [data])
  const maxRev   = useMemo(() => Math.max(...(data || []).map(c => c.total_revenue), 0), [data])
  const totalRev = useMemo(() => (data || []).reduce((s, c) => s + c.total_revenue, 0), [data])

  const filtered = useMemo(() => (data || [])
    .filter(c => !filterRegion  || c.region   === filterRegion)
    .filter(c => !filterSegment || c.segment  === filterSegment)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'revenue' ? b.total_revenue - a.total_revenue
      : sortBy === 'deals' ? b.total_transactions - a.total_transactions
      : a.name.localeCompare(b.name)),
  [data, filterRegion, filterSegment, search, sortBy])

  /* Analytics data */
  const segmentData = useMemo(() => segments.map(s => ({
    name: s, value: (data || []).filter(c => c.segment === s).length,
    revenue: (data || []).filter(c => c.segment === s).reduce((t, c) => t + c.total_revenue, 0),
  })), [data, segments])

  const regionData = useMemo(() => regions.map(r => ({
    name: r.replace(' MIDC', ''), revenue: (data || []).filter(c => c.region === r).reduce((t, c) => t + c.total_revenue, 0),
    clients: (data || []).filter(c => c.region === r).length,
  })), [data, regions])

  const topClient    = (data || [])[0]
  const recentClient = [...(data || [])].sort((a, b) => new Date(b.last_deal) - new Date(a.last_deal))[0]
  const churnRisk    = (data || []).filter(c => {
    const days = c.last_deal ? Math.floor((new Date() - new Date(c.last_deal)) / 86400000) : 0
    return days > 90
  }).length

  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Clients</h1>
          <p className="dash-subtitle">
            {loading ? 'Loading…' : `${data?.length ?? 0} clients · ${fmt(totalRev)} total revenue`}
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <div className="filter-bar">
          <button className="filter-refresh" onClick={fetchData}><RefreshCw size={12} /> Refresh</button>
          <div className="filter-divider" />
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input className="filter-select" style={{ paddingLeft: 30, minWidth: 180 }} placeholder="Search client…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}><X size={12} /></button>}
          </div>
          <select className="filter-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>
          <select className="filter-select" value={filterSegment} onChange={e => setFilterSegment(e.target.value)}>
            <option value="">All Segments</option>
            {segments.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="revenue">Sort: Revenue</option>
            <option value="deals">Sort: Deals</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Insight Strip */}
      <div className="insight-strip" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="insight-strip__label"><Zap size={11} /> Insights</div>
        <div className="insight-strip__items">
          {topClient && <div className="insight-badge" style={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.07)' }}>
            <Award size={10} />&nbsp;Top client: {topClient.name} · {fmt(topClient.total_revenue)}
          </div>}
          {churnRisk > 0 && <div className="insight-badge" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}>
            ⚠️ {churnRisk} clients inactive 90+ days
          </div>}
          {recentClient && <div className="insight-badge" style={{ color: '#10B981', borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.07)' }}>
            <TrendingUp size={10} />&nbsp;Most recent: {recentClient.name}
          </div>}
          <div className="insight-badge">
            <MapPin size={10} />&nbsp;{regions.length} active regions · {segments.length} segments
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="emp-summary">
        {[
          { label: 'Total Clients', value: data?.length ?? '—',   icon: Users,     color: '#6366F1' },
          { label: 'Total Revenue', value: fmt(totalRev),          icon: TrendingUp, color: '#10B981' },
          { label: 'Avg Revenue',   value: fmt(data?.length ? totalRev / data.length : 0), icon: Star, color: '#F59E0B' },
          { label: 'Churn Risk',    value: churnRisk,              icon: Building2,  color: '#EF4444' },
        ].map((t, i) => (
          <div className="emp-summary-tile reveal visible" style={{ '--card-delay': `${i * 60}ms` }} key={t.label}>
            <div className="emp-summary-tile__icon" style={{ background: `${t.color}15`, color: t.color }}><t.icon size={16} /></div>
            <div>
              {loading ? <div className="skeleton" style={{ height: 22, width: 60, marginBottom: 4 }} /> : <div className="emp-summary-tile__val">{t.value}</div>}
              <div className="emp-summary-tile__label">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics row */}
      <div className="client-analytics-row">
        {/* Segment donut */}
        <div className="txn-mini-chart" style={{ padding: 16 }}>
          <div className="txn-mini-chart__title">By Segment</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 130 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" animationDuration={700} paddingAngle={3}>
                  {segmentData.map((s, i) => <Cell key={i} fill={SEGMENTS[s.name]?.color || '#94A3B8'} opacity={0.85} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n, p) => [v + ' clients', p.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {segmentData.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: SEGMENTS[s.name]?.color || '#94A3B8', flexShrink: 0 }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 'auto' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Region revenue bar */}
        <div className="txn-mini-chart" style={{ padding: 16 }}>
          <div className="txn-mini-chart__title">Revenue by Region</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={regionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [fmt(v), 'Revenue']} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} animationDuration={700}>
                {regionData.map((r, i) => <Cell key={i} fill={Object.values(REGIONS)[i % 3]?.color || '#6366F1'} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 clients list */}
        <div className="txn-top5" style={{ minWidth: 240 }}>
          <div className="txn-top5__header">
            <span className="txn-top5__title">Top Clients</span>
            <span className="txn-top5__sub">by revenue</span>
          </div>
          <div className="txn-top5__list">
            {(data || []).slice(0, 5).map((c, i) => {
              const seg = SEGMENTS[c.segment] || SEGMENTS['SME']
              return (
                <div key={c.id} className="txn-top5-item" onClick={() => setSelected(c)} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="txn-top5-item__dot" style={{ background: seg.color }} />
                  <div className="txn-top5-item__content">
                    <div className="txn-top5-item__name">{c.name}</div>
                    <div className="txn-top5-item__meta">
                      <span style={{ color: seg.color }}>{c.segment}</span><span>·</span>
                      <span>{c.region.replace(' MIDC', '')}</span>
                    </div>
                  </div>
                  <div className="txn-top5-item__right">
                    <div className="txn-top5-item__amount">{fmt(c.total_revenue)}</div>
                    <div className="txn-top5-item__status" style={{ color: '#94A3B8' }}>{c.total_transactions} deals</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="emp-grid">
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state__icon">🏢</div>
            <div className="empty-state__title">No clients match</div>
            <div className="empty-state__sub">Try clearing your filters</div>
          </div>
        )}
        {!loading && filtered.map((c, i) => (
          <ClientCard key={c.id} client={c} rank={i} maxRev={maxRev} onClick={setSelected} />
        ))}
      </div>

      {selected && <ClientModal client={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
