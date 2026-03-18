import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import {
  IndianRupee, TrendingUp, Users, ArrowLeftRight, Package,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  Zap, BrainCircuit, Radio, PlusCircle, FileText,
  Trophy, Sparkles
} from 'lucide-react'
import api from '../utils/api'
import './shared.css'
import './Dashboard.css'

/* ── API helper ─────────────────────────────────────────────── */

/* ── Formatters ─────────────────────────────────────────────── */
const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}
const fmtShort = (v) => {
  if (!v) return '0'
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`
  return Math.round(v).toLocaleString('en-IN')
}
const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/* ── Count-up hook ──────────────────────────────────────────── */
function useCountUp(target, duration = 1200, enabled = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!enabled || !target) return
    let start = null
    const raf = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration, enabled])
  return val
}

/* ── Custom tooltip ─────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip__label">{label}</div>
      <div className="custom-tooltip__value">{fmt(payload[0]?.value ?? 0)}</div>
    </div>
  )
}

/* ── Sparkline (tiny chart inside KPI card) ─────────────────── */
function Sparkline({ data, color }) {
  if (!data?.length) return null
  const points = data.slice(-10)
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#','')})`}
          dot={false}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [filters, setFilters] = useState({ period: 'month', region: '', product_id: '' })
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [topEmployee, setTopEmployee] = useState(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const params = { period: filters.period }
      if (filters.region)     params.region = filters.region
      if (filters.product_id) params.product_id = filters.product_id
      const [dash, emps] = await Promise.all([
        api.get('/dashboard-summary', { params }).then(r => r.data),
        api.get('/employees').then(r => r.data),
      ])
      setData(dash)
      if (emps?.length) setTopEmployee(emps[0])
      setLastRefresh(Date.now())
    } catch (e) {
      console.error('Dashboard error:', e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])
  useEffect(() => {
    const id = setInterval(fetchDashboard, 60000)
    return () => clearInterval(id)
  }, [fetchDashboard])

  const setFilter = (key, val) => setFilters((p) => ({ ...p, [key]: val }))

  const timeSince = useMemo(() => {
    const s = Math.floor((Date.now() - lastRefresh) / 1000)
    if (s < 60) return `${s}s ago`
    return `${Math.floor(s / 60)}m ago`
  }, [lastRefresh])

  /* Insight strip messages derived from live data */
  const insights = useMemo(() => {
    if (!data) return []
    const msgs = []
    const top = data.regions?.[0]
    const topProd = data.products?.[0]
    if (top) msgs.push({ icon: '📍', text: `${top.region} MIDC leads revenue with ${fmt(top.revenue)} this period` })
    if (topProd) msgs.push({ icon: '🏆', text: `${topProd.product_name} is top-selling — ${topProd.count} deals closed` })
    if (topEmployee) msgs.push({ icon: '⭐', text: `Top performer: ${topEmployee.name} · ${fmt(topEmployee.total_sales)} total` })
    if (data.kpis?.revenue_change_pct > 0) msgs.push({ icon: '📈', text: `Revenue up ${data.kpis.revenue_change_pct}% vs previous period` })
    else if (data.kpis?.revenue_change_pct < 0) msgs.push({ icon: '📉', text: `Revenue down ${Math.abs(data.kpis.revenue_change_pct)}% — review pipeline` })
    return msgs
  }, [data, topEmployee])

  return (
    <div>
      {/* Header + Filters */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Revenue Dashboard</h1>
          <div className="dash-subtitle">{today} &nbsp;·&nbsp; Updated {timeSince}</div>
        </div>
        <FilterBar filters={filters} setFilter={setFilter} onRefresh={fetchDashboard} loading={loading} />
      </div>

      {/* Insight Strip */}
      {!loading && insights.length > 0 && <InsightStrip insights={insights} />}

      {/* KPI Cards */}
      <KPIGrid data={data} loading={loading} trendData={data?.trend} />

      {/* Row 1: Revenue Trend + Live Feed */}
      <div className="chart-row chart-row-1">
        <RevenueTrendChart data={data?.trend} loading={loading} period={filters.period} />
        <LiveFeedPanel activity={data?.recent_activity} loading={loading} />
      </div>

      {/* Row 2: Product Donut + Region Bar */}
      <div className="chart-row chart-row-2">
        <ProductDonutChart
          data={data?.products}
          loading={loading}
          selected={selectedProduct}
          onSelect={(p) => {
            if (!p) return
            const id = p.product_id
            setSelectedProduct(id === selectedProduct ? null : id)
            setFilter('product_id', id === selectedProduct ? '' : id)
          }}
        />
        <RegionBarChart
          data={data?.regions}
          loading={loading}
          activeRegion={filters.region}
          onBarClick={(region) => setFilter('region', filters.region === region ? '' : region)}
        />
      </div>

      {/* Bottom panels */}
      <div className="bottom-row">
        <TodayPanel data={data?.today} loading={loading} />
        <CEOPanel insights={data?.ceo_insights} loading={loading} />
        <RightPanel
          topEmployee={topEmployee}
          filters={filters}
          setFilter={setFilter}
          data={data}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  )
}

/* ── FILTER BAR ─────────────────────────────────────────────── */
const PERIODS = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'This Year' },
  { value: 'all',     label: 'All Time' },
]
const REGION_OPTIONS = [
  { value: '', label: 'All Regions' },
  { value: 'Aurangabad MIDC', label: 'Aurangabad MIDC' },
  { value: 'Nanded MIDC',     label: 'Nanded MIDC' },
  { value: 'Bangalore MIDC',  label: 'Bangalore MIDC' },
]
const PRODUCT_OPTIONS = [
  { value: '',          label: 'All Products' },
  { value: 'tally',     label: 'Tally' },
  { value: 'tallyprime',label: 'Tally Prime' },
  { value: 'sap',       label: 'SAP' },
  { value: 'sap-s4',    label: 'SAP S/4HANA' },
  { value: 'sap-fico',  label: 'SAP FICO' },
]

function FilterBar({ filters, setFilter, onRefresh, loading }) {
  return (
    <div className="filter-bar">
      <select id="fp" className="filter-select" value={filters.period}
        onChange={(e) => setFilter('period', e.target.value)}>
        {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <div className="filter-divider" />
      <select id="fr" className="filter-select" value={filters.region}
        onChange={(e) => setFilter('region', e.target.value)} style={{ minWidth: 150 }}>
        {REGION_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <select id="fpd" className="filter-select" value={filters.product_id}
        onChange={(e) => setFilter('product_id', e.target.value)} style={{ minWidth: 138 }}>
        {PRODUCT_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <div className="filter-divider" />
      <button className="filter-refresh" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={13} style={{ transition: 'transform 0.4s ease' }} /> Refresh
      </button>
    </div>
  )
}

/* ── INSIGHT STRIP ──────────────────────────────────────────── */
function InsightStrip({ insights }) {
  return (
    <div className="insight-strip">
      <span className="insight-strip__label">
        <Sparkles size={12} /> Live Insights
      </span>
      <div className="insight-strip__items">
        {insights.map((ins, i) => (
          <span key={i} className="insight-badge">
            {ins.icon} {ins.text}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── KPI GRID ───────────────────────────────────────────────── */
function KPIGrid({ data, loading, trendData }) {
  const kpis = [
    {
      id: 'revenue', label: 'Total Revenue', icon: IndianRupee, color: 'indigo',
      rawVal: data?.kpis?.total_revenue,
      displayVal: data ? fmt(data.kpis.total_revenue) : null,
      change: data?.kpis?.revenue_change_pct,
      suffix: 'vs prev period',
      sparkColor: '#6366F1',
    },
    {
      id: 'txns', label: 'Transactions', icon: ArrowLeftRight, color: 'cyan',
      rawVal: data?.kpis?.total_transactions,
      displayVal: data ? data.kpis.total_transactions.toLocaleString() : null,
      change: null, suffix: 'completed',
      sparkColor: '#14B8A6',
    },
    {
      id: 'clients', label: 'Active Clients', icon: Users, color: 'success',
      rawVal: data?.kpis?.active_clients,
      displayVal: data ? data.kpis.active_clients : null,
      change: null, suffix: 'this period',
      sparkColor: '#10B981',
    },
    {
      id: 'staff', label: 'Active Staff', icon: Package, color: 'warning',
      rawVal: data?.kpis?.active_employees,
      displayVal: data ? data.kpis.active_employees : null,
      change: null, suffix: 'across regions',
      sparkColor: '#F59E0B',
    },
  ]

  return (
    <div className="kpi-grid">
      {kpis.map((k, i) => (
        <KPICard key={k.id} {...k} loading={loading} delay={i * 70} trendData={trendData} />
      ))}
    </div>
  )
}

function KPICard({ label, icon: Icon, color, displayVal, rawVal, change, suffix, loading, delay, sparkColor, trendData }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay || 0)
    return () => clearTimeout(t)
  }, [delay])

  const trendUp = change > 0
  const trendDown = change < 0
  const TrendIcon = trendUp ? ArrowUpRight : trendDown ? ArrowDownRight : Minus
  const trendClass = trendUp ? 'trend-up' : trendDown ? 'trend-down' : 'trend-flat'

  return (
    <div
      className={`kpi-card ${color} reveal ${visible ? 'visible' : ''}`}
      style={{ '--card-delay': `${delay}ms` }}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        <div className={`kpi-card__icon`}>
          <Icon size={14} />
        </div>
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 30, width: '65%', borderRadius: 5, marginTop: 4 }} />
          <div className="skeleton" style={{ height: 36, width: '100%', marginTop: 12, borderRadius: 4 }} />
        </>
      ) : (
        <>
          <div className="kpi-card__value">{displayVal ?? '—'}</div>
          {/* Sparkline */}
          <div className="kpi-card__spark">
            <Sparkline data={trendData} color={sparkColor} />
          </div>
          <div className={`kpi-card__footer ${trendClass}`}>
            {change !== null && change !== undefined ? (
              <>
                <TrendIcon size={12} />
                <span>{Math.abs(change)}%</span>
                <span className="kpi-footer-suffix">{suffix}</span>
              </>
            ) : (
              <span className="kpi-footer-suffix">{suffix}</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ── REVENUE TREND ──────────────────────────────────────────── */
function RevenueTrendChart({ data, loading, period }) {
  const tickFmt = (v) => {
    if (!v) return ''
    if (period === 'year' || period === 'all') return v.slice(0, 7)
    return v.slice(5)
  }
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Revenue Trend</div>
          <div className="chart-card__sub">Period-over-period performance</div>
        </div>
        <span className="chart-card__badge">{period}</span>
      </div>
      {loading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={data || []} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#5A5FCF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,59,0.7)" vertical={false} />
            <XAxis dataKey="period" tickFormatter={tickFmt}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis tickFormatter={fmtShort}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }}
              axisLine={false} tickLine={false} width={56}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue"
              stroke="#6366F1" strokeWidth={2}
              fill="url(#revGrad)" dot={false}
              activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
              animationDuration={800} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ── REGION BAR ─────────────────────────────────────────────── */
function RegionBarChart({ data, loading, onBarClick, activeRegion }) {
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Region Revenue</div>
          <div className="chart-card__sub">Click to drill down</div>
        </div>
        {activeRegion && (
          <span className="chart-card__badge" style={{ color: 'var(--color-indigo-soft)', borderColor: 'rgba(90,95,207,0.3)' }}>
            {activeRegion.split(' ')[0]}
          </span>
        )}
      </div>
      {loading ? <ChartSkeleton /> : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data || []} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
            onClick={(e) => { if (e?.activePayload?.[0]) onBarClick(e.activePayload[0].payload.full_region) }}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,42,59,0.7)" vertical={false} />
            <XAxis dataKey="region"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
            />
            <YAxis tickFormatter={fmtShort}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontFamily: 'Inter' }}
              axisLine={false} tickLine={false} width={56}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="revenue" radius={[6,6,0,0]} animationDuration={700} animationEasing="ease-out">
              {(data || []).map((d, i) => (
                <Cell key={i}
                  fill={['#6366F1','#10B981','#14B8A6'][i % 3]}
                  opacity={!activeRegion || activeRegion === d.full_region ? 0.85 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ── PRODUCT DONUT ──────────────────────────────────────────── */
function ProductDonutChart({ data, loading, selected, onSelect }) {
  const total = useMemo(() => (data || []).reduce((s, d) => s + d.revenue, 0), [data])
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div>
          <div className="chart-card__title">Product Mix</div>
          <div className="chart-card__sub">Click to filter</div>
        </div>
      </div>
      {loading ? <ChartSkeleton height={180} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={data || []} cx="50%" cy="50%"
                innerRadius={36} outerRadius={60}
                dataKey="revenue" paddingAngle={3}
                animationDuration={700} animationEasing="ease-out"
                onClick={onSelect} style={{ cursor: 'pointer' }}
              >
                {(data || []).map((e) => (
                  <Cell key={e.product_id} fill={e.color}
                    opacity={selected && selected !== e.product_id ? 0.28 : 1}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v), '']}
                contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-edge)', borderRadius: '8px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="product-legend">
            {(data || []).map((p) => {
              const pct = total > 0 ? ((p.revenue / total) * 100).toFixed(1) : 0
              return (
                <div key={p.product_id}
                  className="legend-item clickable"
                  onClick={() => onSelect(p)}
                  style={{ opacity: selected && selected !== p.product_id ? 0.38 : 1 }}
                >
                  <div className="legend-dot" style={{ background: p.color }} />
                  <span className="legend-label">{p.product_name}</span>
                  <span className="legend-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── TODAY PANEL ────────────────────────────────────────────── */
function TodayPanel({ data, loading }) {
  const changeSign = (data?.revenue_change_vs_yesterday ?? 0) >= 0
  return (
    <div className="today-panel">
      <div className="today-panel__title">
        <Zap size={14} style={{ color: 'var(--color-warning)' }} />
        What Changed Today
        <span className="today-panel__date">{today}</span>
      </div>
      {loading ? (
        <>{[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 14, width: `${75 + i*7}%`, marginBottom: 10, borderRadius: 4 }} />)}</>
      ) : (
        <>
          <div className="today-stat">
            <span className="today-stat__label">Transactions</span>
            <span className="today-stat__value">{data?.transactions ?? 0}</span>
          </div>
          <div className="today-stat">
            <span className="today-stat__label">Today's revenue</span>
            <span className="today-stat__value">{fmt(data?.revenue ?? 0)}</span>
          </div>
          <div className="today-stat">
            <span className="today-stat__label">vs Yesterday</span>
            <span className="today-stat__value"
              style={{ color: changeSign ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {changeSign ? '+' : ''}{fmt(data?.revenue_change_vs_yesterday ?? 0)}
            </span>
          </div>
          {(data?.recent_deals?.length > 0) && (
            <div className="today-deals">
              <div className="today-deals__label">Latest Deals</div>
              {data.recent_deals.slice(0, 4).map((d) => (
                <div className="today-deal" key={d.id}>
                  <span className="today-deal__dot" />
                  <span className="today-deal__product">{d.product_name}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', flex: 1 }}>→ {d.client_name}</span>
                  <span className="today-deal__amount">{fmt(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {!data?.transactions && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 8 }}>
              No transactions recorded today yet.
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── CEO PANEL ──────────────────────────────────────────────── */
function CEOPanel({ insights, loading }) {
  return (
    <div className="ceo-panel">
      <div className="ceo-panel__title">
        <BrainCircuit size={14} style={{ color: 'var(--color-indigo-soft)' }} />
        CEO Insights
      </div>
      {loading
        ? [1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 13, width: `${68+i*7}%`, marginBottom: 10, borderRadius: 4 }} />)
        : (insights || []).map((ins, i) => (
            <div key={i} className="ceo-insight">{ins}</div>
          ))
      }
    </div>
  )
}

/* ── RIGHT PANEL: Top Performer + Active Filters ───────────── */
function RightPanel({ topEmployee, filters, setFilter, data }) {
  const topRegion  = data?.regions?.[0]
  const topProduct = data?.products?.[0]
  const hasFilter  = filters.region || filters.product_id || filters.period !== 'month'

  const clearFilters = () => {
    setFilter('region', '')
    setFilter('product_id', '')
    setFilter('period', 'month')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Top Performer */}
      {topEmployee && (
        <div className="today-panel" style={{ background: 'rgba(14,166,106,0.06)', borderColor: 'rgba(14,166,106,0.2)' }}>
          <div className="today-panel__title" style={{ color: 'var(--color-success)' }}>
            <Trophy size={14} /> Top Performer
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 12 }}>
            <svg width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="18" fill="rgba(14,166,106,0.15)" stroke="#0EA66A" strokeWidth="1.5"/>
              <text x="19" y="24" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="Plus Jakarta Sans" fill="#0EA66A">
                {topEmployee.name.split(' ').map(w => w[0]).join('').slice(0,2)}
              </text>
            </svg>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{topEmployee.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{topEmployee.role} · {topEmployee.region.split(' ')[0]}</div>
            </div>
          </div>
          <div className="today-stat">
            <span className="today-stat__label">Revenue</span>
            <span className="today-stat__value" style={{ color: 'var(--color-success)' }}>{fmt(topEmployee.total_sales)}</span>
          </div>
          <div className="today-stat">
            <span className="today-stat__label">Deals</span>
            <span className="today-stat__value">{topEmployee.total_transactions}</span>
          </div>
          <div className="today-stat">
            <span className="today-stat__label">Top Product</span>
            <span className="today-stat__value" style={{ fontSize: '12px' }}>{topEmployee.top_product}</span>
          </div>
        </div>
      )}

      {/* Active Filter Summary */}
      <div className="today-panel">
        <div className="today-panel__title">
          <Radio size={13} style={{ color: 'var(--color-cyan)' }} />
          Active Filters
        </div>
        <div className="today-stat">
          <span className="today-stat__label">Period</span>
          <span className="today-stat__value" style={{ fontSize: '12px', textTransform: 'capitalize' }}>{filters.period}</span>
        </div>
        <div className="today-stat">
          <span className="today-stat__label">Region</span>
          <span className="today-stat__value" style={{ fontSize: '11px' }}>{filters.region || 'All'}</span>
        </div>
        <div className="today-stat">
          <span className="today-stat__label">Product</span>
          <span className="today-stat__value" style={{ fontSize: '11px' }}>
            {filters.product_id ? PRODUCT_OPTIONS.find(p => p.value === filters.product_id)?.label : 'All'}
          </span>
        </div>
        {topRegion && (
          <div className="today-stat">
            <span className="today-stat__label">Top Region</span>
            <span className="today-stat__value" style={{ fontSize: '11px', color: 'var(--color-success)' }}>{topRegion.region}</span>
          </div>
        )}
        {hasFilter && (
          <button onClick={clearFilters} className="clear-filter-btn">Clear Filters</button>
        )}
      </div>
    </div>
  )
}

/* ── LIVE FEED ──────────────────────────────────────────────── */
const PRODUCT_COLORS = {
  'Tally':       '#0EA66A',
  'Tally Prime': '#14B87A',
  'SAP':         '#5A5FCF',
  'SAP S/4HANA': '#7477D4',
  'SAP FICO':    '#1DB8D3',
}

function LiveFeedPanel({ activity, loading }) {
  return (
    <div className="live-feed">
      <div className="live-feed__header">
        <div className="live-feed__title">
          <span className="live-pulse" /> Live Activity
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Latest 15</span>
      </div>
      <div className="live-feed__list">
        {loading
          ? [1,2,3,4,5].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 6px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 11, width: '70%', marginBottom: 4, borderRadius: 3 }} />
                  <div className="skeleton" style={{ height: 9, width: '45%', borderRadius: 3 }} />
                </div>
              </div>
            ))
          : (activity || []).slice(0, 15).map((item, i) => (
              <div className="feed-item" key={`${item.id}-${i}`} style={{ animationDelay: `${i * 35}ms` }}>
                <div className="feed-item__dot" style={{ background: PRODUCT_COLORS[item.product_name] || 'var(--color-indigo)' }} />
                <div className="feed-item__content">
                  <div className="feed-item__product">{item.product_name}</div>
                  <div className="feed-item__client">{item.client_name} · {item.region.replace(' MIDC','')}</div>
                </div>
                <div>
                  <div className="feed-item__amount">{fmt(item.amount)}</div>
                  <div className="feed-item__time">{item.date?.slice(5)}</div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

/* ── QUICK ACTIONS ──────────────────────────────────────────── */
function QuickActions() {
  return (
    <div className="quick-actions">
      <span className="quick-actions__label">Quick Actions</span>
      <button className="quick-action-btn indigo">
        <PlusCircle size={14} /> Add Transaction
      </button>
      <button className="quick-action-btn success">
        <FileText size={14} /> Generate Report
      </button>
      <button className="quick-action-btn cyan">
        <TrendingUp size={14} /> View Trends
      </button>
    </div>
  )
}

/* ── Chart loading skeleton ─────────────────────────────────── */
function ChartSkeleton({ height = 180 }) {
  return (
    <div className="chart-loading" style={{ height }}>
      <div className="chart-loading__spinner" />
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Loading...</span>
    </div>
  )
}
