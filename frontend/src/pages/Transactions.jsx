import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import api from '../utils/api'
import {
  BarChart, Bar, Cell, PieChart, Pie, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts'
import {
  ArrowLeftRight, IndianRupee, TrendingUp, Calendar,
  Search, X, RefreshCw, Download, ChevronLeft, ChevronRight,
  Zap, Award, MapPin, ChevronUp, ChevronDown, Plus
} from 'lucide-react'
import './shared.css'
import './Transactions.css'

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—'
const fmtShortDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  : '—'

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'rgba(16,185,129,0.10)', color: '#10B981', dot: '#10B981' },
  pending:   { label: 'Pending',   bg: 'rgba(245,158,11,0.10)', color: '#F59E0B', dot: '#F59E0B' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.09)',  color: '#EF4444', dot: '#EF4444' },
}

const PRODUCT_COLORS = {
  'Tally':       '#6366F1',
  'Tally Prime': '#8B5CF6',
  'SAP':         '#14B8A6',
  'SAP S/4HANA': '#2563EB',
  'SAP FICO':    '#F59E0B',
}
const PAGE_SIZE = 25

/* ── Export CSV ──────────────────────────────────────────────── */
function exportCSV(rows) {
  const headers = ['ID', 'Date', 'Product', 'Client', 'Employee', 'Region', 'Amount', 'Status']
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      r.id, r.date, r.product_name,
      `"${r.client_name}"`, `"${r.employee_name}"`,
      `"${r.region}"`, r.amount, r.status
    ].join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

/* ── Insight Strip ───────────────────────────────────────────── */
function InsightStrip({ summary, topEmp, topRegion, highestTxn }) {
  const badges = [
    topRegion  && { icon: <MapPin size={10}/>, text: `Top region: ${topRegion}`, color: '#6366F1' },
    topEmp     && { icon: <Award size={10}/>,  text: `Top employee: ${topEmp}`,  color: '#10B981' },
    highestTxn && { icon: <Zap size={10}/>,   text: `Highest sale: ${fmt(highestTxn?.amount)} — ${highestTxn?.product_name}`, color: '#F59E0B' },
    summary    && { icon: <TrendingUp size={10}/>, text: `${summary.completed} completed · ${summary.pending} pending`, color: '#14B8A6' },
  ].filter(Boolean)

  return (
    <div className="insight-strip" style={{ marginBottom: 'var(--space-lg)' }}>
      <div className="insight-strip__label"><Zap size={11}/> Insights</div>
      <div className="insight-strip__items">
        {badges.map((b, i) => (
          <div key={i} className="insight-badge" style={{ color: b.color, borderColor: `${b.color}20`, background: `${b.color}08` }}>
            {b.icon}&nbsp;{b.text}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Mini Charts Panel ───────────────────────────────────────── */
function MiniChartsPanel({ analytics }) {
  if (!analytics) return null
  const { products, regions, trend, statusDist } = analytics

  const TOOLTIPSTYLE = { background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 4px 14px rgba(15,23,42,0.1)' }

  return (
    <div className="txn-charts-row">
      {/* Revenue by Product — bar */}
      <div className="txn-mini-chart">
        <div className="txn-mini-chart__title">Revenue by Product</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={products} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
            <XAxis dataKey="product_name" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false}
              tickFormatter={v => v.replace('Tally Prime','T.Prime').replace('SAP S/4HANA','S/4').replace('SAP FICO','FICO')} />
            <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
            <Tooltip contentStyle={TOOLTIPSTYLE} formatter={v => [fmt(v), 'Revenue']} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} animationDuration={700}>
              {products.map((p, i) => (
                <Cell key={i} fill={PRODUCT_COLORS[p.product_name] || '#6366F1'} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution — donut */}
      <div className="txn-mini-chart">
        <div className="txn-mini-chart__title">Status Distribution</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 120 }}>
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={statusDist} cx="50%" cy="50%" innerRadius={28} outerRadius={48}
                dataKey="value" animationDuration={700} paddingAngle={3}>
                {statusDist.map((s, i) => (
                  <Cell key={i} fill={STATUS_CONFIG[s.status]?.dot || '#94A3B8'} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIPSTYLE} formatter={(v, n, p) => [v, p.payload.status]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {statusDist.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_CONFIG[s.status]?.dot || '#94A3B8', flexShrink: 0 }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{s.status}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 'auto' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Trend — area line */}
      <div className="txn-mini-chart txn-mini-chart--wide">
        <div className="txn-mini-chart__title">Revenue Trend (30 days)</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
            <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={fmtShortDate} />
            <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
            <Tooltip contentStyle={TOOLTIPSTYLE} formatter={v => [fmt(v), 'Revenue']} labelFormatter={fmtDate} />
            <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={1.5}
              fill="url(#tGrad)" dot={false} activeDot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
              animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── Top 5 Recent Transactions ───────────────────────────────── */
function Top5Panel({ items, onSelect }) {
  return (
    <div className="txn-top5">
      <div className="txn-top5__header">
        <span className="txn-top5__title">Recent Transactions</span>
        <span className="txn-top5__sub">{items.length} latest</span>
      </div>
      <div className="txn-top5__list">
        {items.map((t, i) => {
          const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.completed
          const pc = PRODUCT_COLORS[t.product_name] || '#6366F1'
          return (
            <div key={t.id} className="txn-top5-item" onClick={() => onSelect(t)}
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="txn-top5-item__dot" style={{ background: pc }} />
              <div className="txn-top5-item__content">
                <div className="txn-top5-item__name">{t.client_name}</div>
                <div className="txn-top5-item__meta">
                  <span style={{ color: pc, fontWeight: 600 }}>{t.product_name}</span>
                  <span>·</span>
                  <span>{fmtShortDate(t.date)}</span>
                </div>
              </div>
              <div className="txn-top5-item__right">
                <div className="txn-top5-item__amount">{fmt(t.amount)}</div>
                <div className="txn-top5-item__status" style={{ color: st.color }}>{st.label}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Transaction Detail Modal ────────────────────────────────── */
function TxnModal({ txn, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const st = STATUS_CONFIG[txn.status] || STATUS_CONFIG.completed
  const pc = PRODUCT_COLORS[txn.product_name] || '#6366F1'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={13} /></button>

        {/* TXN ID + status */}
        <div className="txn-modal-id">
          <span className="txn-modal-id__label">Transaction</span>
          <span className="txn-modal-id__code">{txn.id}</span>
          <span className="txn-status-pill" style={{ background: st.bg, color: st.color }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block', marginRight: 4 }} />
            {st.label}
          </span>
        </div>

        {/* Amount hero */}
        <div className="txn-modal-amount">{fmt(txn.amount)}</div>
        <div className="txn-modal-date">{fmtDate(txn.date)}</div>

        {/* Product tag */}
        <div style={{ marginTop: 8, marginBottom: 20 }}>
          <span className="txn-product-tag" style={{ color: pc, background: `${pc}12`, borderColor: `${pc}25`, fontSize: 12, padding: '4px 12px' }}>
            {txn.product_name}
          </span>
        </div>

        {/* Detail grid — grouped sections */}
        <div className="txn-modal-section-label">Deal Details</div>
        <div className="modal-kpis">
          {[
            { label: 'Client',     value: txn.client_name },
            { label: 'Employee',   value: txn.employee_name },
            { label: 'Region',     value: txn.region },
            { label: 'Product ID', value: txn.product_id?.toUpperCase() },
          ].map(k => (
            <div className="modal-kpi" key={k.label}>
              <div className="modal-kpi__label">{k.label}</div>
              <div className="modal-kpi__value">{k.value ?? '—'}</div>
            </div>
          ))}
        </div>

        <div className="txn-modal-section-label" style={{ marginTop: 14 }}>References</div>
        <div className="modal-kpis">
          {[
            { label: 'Client ID',  value: txn.client_id },
            { label: 'Employee ID', value: txn.employee_id },
            { label: 'TXN Date',   value: txn.date },
            { label: 'Status',     value: st.label, color: st.color },
          ].map(k => (
            <div className="modal-kpi" key={k.label}>
              <div className="modal-kpi__label">{k.label}</div>
              <div className="modal-kpi__value" style={k.color ? { color: k.color } : {}}>{k.value ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── TRANSACTIONS PAGE ───────────────────────────────────────── */
export default function Transactions() {
  const [data,      setData]      = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [error,     setError]     = useState(null)
  const [page,      setPage]      = useState(1)
  const [lastRefresh, setLastRefresh] = useState(null)

  /* Sorting */
  const [sortCol, setSortCol]     = useState('date')
  const [sortDir, setSortDir]     = useState('desc')

  /* Filters */
  const [filterRegion,  setFilterRegion]  = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterFrom,    setFilterFrom]    = useState('')
  const [filterTo,      setFilterTo]      = useState('')
  const [search,        setSearch]        = useState('')

  const tableRef = useRef(null)

  /* Fetch paginated transactions */
  const fetchData = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, page_size: PAGE_SIZE }
      if (filterRegion)  params.region     = filterRegion
      if (filterProduct) params.product_id = filterProduct
      if (filterStatus)  params.status     = filterStatus
      if (filterFrom)    params.date_from  = filterFrom
      if (filterTo)      params.date_to    = filterTo
      const res = await api.get('/transactions', { params })
      setData(res.data)
      setLastRefresh(new Date())
      setPage(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [filterRegion, filterProduct, filterStatus, filterFrom, filterTo])

  /* Fetch analytics from dashboard-summary */
  const fetchAnalytics = useCallback(async () => {
    try {
      const [dash, txnAll] = await Promise.all([
        api.get('/dashboard-summary'),
        api.get('/transactions', { params: { page: 1, page_size: 50 } }),
      ])
      const txns = txnAll.data.data || []
      const statusDist = ['completed','pending','cancelled'].map(s => ({
        status: s, value: txns.filter(t => t.status === s).length
      })).filter(s => s.value > 0)

      setAnalytics({
        products:   dash.data.products || [],
        regions:    dash.data.regions  || [],
        trend:      dash.data.trend    || [],
        recent:     dash.data.recent_activity || txns.slice(0, 5),
        statusDist,
      })
    } catch {}
  }, [])

  useEffect(() => { fetchData(1); fetchAnalytics() }, [fetchData, fetchAnalytics])
  useEffect(() => {
    const id = setInterval(() => { fetchData(page); fetchAnalytics() }, 60000)
    return () => clearInterval(id)
  }, [fetchData, fetchAnalytics, page])

  /* Client-side search + sort */
  const rows = useMemo(() => {
    let r = data?.data || []
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(t =>
        t.id.toLowerCase().includes(q)            ||
        t.client_name.toLowerCase().includes(q)   ||
        t.employee_name.toLowerCase().includes(q) ||
        t.product_name.toLowerCase().includes(q)
      )
    }
    return [...r].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortCol === 'amount') return dir * (a.amount - b.amount)
      if (sortCol === 'date')   return dir * (new Date(a.date) - new Date(b.date))
      return 0
    })
  }, [data, search, sortCol, sortDir])

  /* Derived KPIs */
  const summary = useMemo(() => {
    const d = data?.data || []
    return {
      total:     data?.total ?? 0,
      revenue:   d.reduce((s, t) => s + (t.status === 'completed' ? t.amount : 0), 0),
      completed: d.filter(t => t.status === 'completed').length,
      pending:   d.filter(t => t.status === 'pending').length,
    }
  }, [data])

  /* Insight computations */
  const topRegion   = analytics?.regions?.sort((a, b) => b.revenue - a.revenue)[0]?.region
  const topEmpData  = analytics?.recent?.[0]
  const topEmp      = topEmpData?.employee_name
  const highestTxn  = analytics?.recent?.reduce((max, t) => t.amount > (max?.amount || 0) ? t : max, null)
  const totalPages  = data ? Math.ceil(data.total / PAGE_SIZE) : 1
  const hasFilter   = filterRegion || filterProduct || filterStatus || filterFrom || filterTo

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }
  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronUp size={11} style={{ opacity: 0.25 }} />
    return sortDir === 'asc' ? <ChevronUp size={11} style={{ color: '#6366F1' }} /> : <ChevronDown size={11} style={{ color: '#6366F1' }} />
  }

  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Transactions</h1>
          <p className="dash-subtitle">
            {loading ? 'Loading…' : `${data?.total?.toLocaleString() ?? 0} records`}
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="filter-bar">
          <button className="quick-action-btn indigo" onClick={() => alert('Add Transaction — modal coming soon!')}>
            <Plus size={13} /> Add Transaction
          </button>
          <button className="quick-action-btn success" onClick={() => data?.data && exportCSV(data.data)}>
            <Download size={13} /> Export CSV
          </button>
          <div className="filter-divider" />
          <button className="filter-refresh" onClick={() => { fetchData(1); fetchAnalytics() }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Insight Strip */}
      <InsightStrip summary={summary} topEmp={topEmp} topRegion={topRegion} highestTxn={highestTxn} />

      {/* Summary Tiles */}
      <div className="txn-summary">
        {[
          { label: 'Total Records',  value: data?.total?.toLocaleString() ?? '—', icon: ArrowLeftRight, color: '#6366F1' },
          { label: 'Page Revenue',   value: fmt(summary.revenue),                  icon: IndianRupee,   color: '#10B981' },
          { label: 'Completed',      value: summary.completed,                     icon: TrendingUp,    color: '#10B981' },
          { label: 'Pending',        value: summary.pending,                        icon: Calendar,      color: '#F59E0B' },
        ].map((t, i) => (
          <div className="txn-summary-tile" key={t.label} style={{ '--card-delay': `${i * 60}ms` }}>
            <div className="txn-summary-tile__icon" style={{ background: `${t.color}14`, color: t.color }}>
              <t.icon size={15} />
            </div>
            <div>
              {loading
                ? <div className="skeleton" style={{ height: 22, width: 70, marginBottom: 4 }} />
                : <div className="txn-summary-tile__val">{t.value}</div>
              }
              <div className="txn-summary-tile__label">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics + Recent panel */}
      <div className="txn-analytics-row">
        <MiniChartsPanel analytics={analytics} />
        {analytics?.recent && (
          <Top5Panel items={analytics.recent.slice(0, 5)} onSelect={setSelected} />
        )}
      </div>

      {/* Filter row */}
      <div className="txn-filter-row">
        <input type="date" className="filter-select" style={{ minWidth: 128 }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>to</span>
        <input type="date" className="filter-select" style={{ minWidth: 128 }} value={filterTo}   onChange={e => setFilterTo(e.target.value)} />
        <div className="filter-divider" />
        <select className="filter-select" value={filterRegion}  onChange={e => setFilterRegion(e.target.value)}>
          <option value="">All Regions</option>
          <option>Aurangabad MIDC</option>
          <option>Nanded MIDC</option>
          <option>Bangalore MIDC</option>
        </select>
        <select className="filter-select" value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
          <option value="">All Products</option>
          <option value="tally">Tally</option>
          <option value="tallyprime">Tally Prime</option>
          <option value="sap">SAP</option>
          <option value="sap-s4">SAP S/4HANA</option>
          <option value="sap-fico">SAP FICO</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {hasFilter && (
          <button className="filter-refresh" onClick={() => { setFilterRegion(''); setFilterProduct(''); setFilterStatus(''); setFilterFrom(''); setFilterTo('') }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="txn-table-card" ref={tableRef}>
        {/* Toolbar */}
        <div className="txn-table-toolbar">
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input className="filter-select" style={{ paddingLeft: 30, width: '100%' }}
              placeholder="Search ID, client, employee…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <span className="txn-count-label">Showing {rows.length} of {data?.total?.toLocaleString() ?? 0}</span>
        </div>

        {/* Table */}
        <div className="txn-table-wrap">
          <table className="txn-table">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th className="txn-th-sort" onClick={() => toggleSort('date')}>
                  Date <SortIcon col="date" />
                </th>
                <th>Product</th>
                <th>Client</th>
                <th>Employee</th>
                <th>Region</th>
                <th className="txn-th-sort" style={{ textAlign: 'right' }} onClick={() => toggleSort('amount')}>
                  Amount <SortIcon col="amount" />
                </th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="txn-row--skel">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 12, width: j === 6 ? 60 : j === 0 ? 80 : 100, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state" style={{ padding: '60px 0' }}>
                    <div className="empty-state__icon">📋</div>
                    <div className="empty-state__title">No transactions found</div>
                    <div className="empty-state__sub">Try adjusting your filters</div>
                  </div>
                </td></tr>
              )}

              {!loading && rows.map((txn, i) => {
                const st = STATUS_CONFIG[txn.status] || STATUS_CONFIG.completed
                const pc = PRODUCT_COLORS[txn.product_name] || '#6366F1'
                return (
                  <tr key={txn.id} className="txn-row"
                    style={{ animationDelay: `${i * 15}ms` }}
                    onClick={() => setSelected(txn)}>
                    <td className="txn-id">{txn.id}</td>
                    <td className="txn-date">{fmtDate(txn.date)}</td>
                    <td><span className="txn-product-tag" style={{ color: pc, background: `${pc}12`, borderColor: `${pc}22` }}>{txn.product_name}</span></td>
                    <td className="txn-client">{txn.client_name}</td>
                    <td className="txn-emp">{txn.employee_name}</td>
                    <td className="txn-region">{txn.region.replace(' MIDC','')}</td>
                    <td className="txn-amount">{fmt(txn.amount)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="txn-status-pill" style={{ background: st.bg, color: st.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block', marginRight: 4 }} />
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data && totalPages > 1 && (
          <div className="txn-pagination">
            <span className="txn-pagination__info">Page {page} of {totalPages} · {data.total} records</span>
            <div className="txn-pagination__controls">
              <button className="pgn-btn" disabled={page <= 1} onClick={() => fetchData(page - 1)}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const p = i + 1
                return (
                  <button key={p} className={`pgn-btn ${page === p ? 'pgn-btn--active' : ''}`}
                    onClick={() => fetchData(p)}>{p}</button>
                )
              })}
              {totalPages > 7 && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>…{totalPages}</span>}
              <button className="pgn-btn" disabled={page >= totalPages} onClick={() => fetchData(page + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {selected && <TxnModal txn={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
