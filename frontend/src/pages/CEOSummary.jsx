import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Users, Package, MapPin, AlertCircle, RefreshCw, Zap, Award, Building2 } from 'lucide-react'
import './shared.css'
import './CEOSummary.css'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'

const PRODUCT_COLORS  = { 'SAP': '#14B8A6', 'SAP S/4HANA': '#2563EB', 'Tally': '#6366F1', 'Tally Prime': '#8B5CF6', 'SAP FICO': '#F59E0B' }
const REGION_COLORS   = ['#6366F1', '#10B981', '#14B8A6']
const TOOLTIP_STYLE   = { background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 4px 14px rgba(15,23,42,0.10)' }

export default function CEOSummary() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [dash, emp, clients] = await Promise.all([
        axios.get('/api/dashboard-summary'),
        axios.get('/api/employees'),
        axios.get('/api/clients'),
      ])
      setData({ dash: dash.data, employees: emp.data, clients: clients.data })
      setLastRefresh(new Date())
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 60000); return () => clearInterval(id) }, [fetchData])

  const d = data?.dash
  const kpis = d ? [
    { label: 'Monthly Revenue', value: fmt(d.kpis.total_revenue), change: d.kpis.revenue_change_pct, icon: TrendingUp, color: '#6366F1' },
    { label: 'Transactions',    value: d.kpis.total_transactions, change: null, icon: Package,    color: '#14B8A6' },
    { label: 'Active Clients',  value: d.kpis.active_clients,    change: null, icon: Building2,  color: '#10B981' },
    { label: 'Active Staff',    value: d.kpis.active_employees,  change: null, icon: Users,      color: '#F59E0B' },
  ] : []

  return (
    <div>
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">CEO Summary</h1>
          <p className="dash-subtitle">
            Executive overview · Sai Soft Infosys
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <button className="filter-refresh" onClick={fetchData}><RefreshCw size={12} /> Refresh</button>
      </div>

      {/* CEO Insights strip */}
      {d?.ceo_insights && (
        <div className="insight-strip" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="insight-strip__label"><Zap size={11} /> CEO Insights</div>
          <div className="insight-strip__items">
            {d.ceo_insights.map((ins, i) => (
              <div key={i} className="insight-badge">{ins}</div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {loading ? Array.from({length:4}).map((_,i) => (
          <div key={i} className="kpi-card indigo">
            <div className="skeleton" style={{ height: 11, width: '60%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 28, width: '70%' }} />
          </div>
        )) : kpis.map((k, i) => {
          const up = k.change > 0, down = k.change < 0
          return (
            <div key={k.label} className={`kpi-card ${['indigo','cyan','success','warning'][i]}`}
              style={{ '--card-delay': `${i * 70}ms` }}>
              <div className="kpi-card__header">
                <span className="kpi-card__label">{k.label}</span>
                <div className="kpi-card__icon"><k.icon size={14} /></div>
              </div>
              <div className="kpi-card__value">{k.value}</div>
              {k.change != null && (
                <div className="kpi-card__footer">
                  {up   && <><TrendingUp size={11} className="trend-up" /><span className="trend-up">+{k.change.toFixed(1)}%</span></>}
                  {down && <><TrendingDown size={11} className="trend-down" /><span className="trend-down">{k.change.toFixed(1)}%</span></>}
                  <span className="kpi-footer-suffix">vs prev period</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="ceo-charts-row">
        {/* Revenue trend */}
        <div className="chart-card">
          <div className="chart-card__header">
            <div><div className="chart-card__title">Revenue Trend</div><div className="chart-card__sub">Last 30 days</div></div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d?.trend || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ceoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [fmt(v),'Revenue']} labelFormatter={fmtDate} />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#ceoGrad)" dot={false} activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Region bar & Product pie */}
        <div className="ceo-side-charts">
          <div className="chart-card">
            <div className="chart-card__header">
              <div><div className="chart-card__title">Revenue by Region</div></div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={d?.regions || []} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }} barSize={12}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
                <YAxis type="category" dataKey="region" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [fmt(v), 'Revenue']} />
                <Bar dataKey="revenue" radius={[0,4,4,0]} animationDuration={600}>
                  {(d?.regions || []).map((_, i) => <Cell key={i} fill={REGION_COLORS[i]} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" style={{ marginTop: 'var(--space-md)' }}>
            <div className="chart-card__title" style={{ marginBottom: 8 }}>Products</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={d?.products || []} cx="50%" cy="50%" innerRadius={24} outerRadius={42} dataKey="revenue" animationDuration={700} paddingAngle={3}>
                    {(d?.products || []).map((p, i) => <Cell key={i} fill={PRODUCT_COLORS[p.product_name] || '#6366F1'} opacity={0.85} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n, p) => [fmt(v), p.payload.product_name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(d?.products || []).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: PRODUCT_COLORS[p.product_name] || '#6366F1', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{p.product_name}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 10, color: 'var(--color-text-primary)' }}>{fmt(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Top employees + top clients + today */}
      <div className="ceo-bottom-row">
        {/* Top employees */}
        <div className="chart-card">
          <div className="chart-card__title" style={{ marginBottom: 12 }}>Top Performers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(data?.employees || []).slice(0, 6).map((e, i) => {
              const maxSales = data?.employees?.[0]?.total_sales || 1
              const pct = (e.total_sales / maxSales) * 100
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 5 ? '1px solid rgba(15,23,42,0.05)' : 'none' }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 14, textAlign: 'right', fontFamily: 'JetBrains Mono' }}>#{i+1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3 }}>{e.name}</div>
                    <div style={{ height: 3, background: 'rgba(15,23,42,0.07)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#6366F1', borderRadius: 2, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#6366F1' }}>{fmt(e.total_sales)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Today stats */}
        <div className="chart-card">
          <div className="chart-card__title" style={{ marginBottom: 12 }}>Today — {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
          {d?.today && (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Revenue</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>{fmt(d.today.revenue)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Transactions</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>{d.today.transactions}</div>
                </div>
              </div>
              {d.today.recent_deals?.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(15,23,42,0.05)', fontSize: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRODUCT_COLORS[t.product_name] || '#6366F1', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.client_name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: '#10B981' }}>{fmt(t.amount)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* CEO alerts/insights */}
        <div className="chart-card">
          <div className="chart-card__title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} style={{ color: '#F59E0B' }} /> Action Items
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { text: `Revenue change: ${d?.kpis?.revenue_change_pct?.toFixed(1) ?? '—'}% vs last period`, icon: '📊', color: d?.kpis?.revenue_change_pct < 0 ? '#EF4444' : '#10B981' },
              { text: `${data?.employees?.filter(e => !e.is_active).length ?? 0} staff members inactive`, icon: '👥', color: '#F59E0B' },
              { text: `Top region: ${d?.regions?.sort((a,b) => b.revenue-a.revenue)[0]?.region ?? '—'}`, icon: '🌍', color: '#6366F1' },
              { text: `${data?.clients?.length ?? 0} active client accounts`,  icon: '🏢', color: '#14B8A6' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid rgba(15,23,42,0.06)' }}>
                <span>{a.icon}</span>
                <span style={{ fontSize: 12, color: a.color, fontWeight: 500, lineHeight: 1.5 }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
