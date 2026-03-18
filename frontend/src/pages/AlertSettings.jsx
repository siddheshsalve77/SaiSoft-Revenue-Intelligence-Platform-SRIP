import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { Bell, BellOff, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Users, Package, RefreshCw, Settings, ToggleLeft, ToggleRight } from 'lucide-react'
import './shared.css'
import './AlertSettings.css'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}

const ALERT_TYPES = [
  { id: 'revenue-drop',    label: 'Revenue Drop Alert',      desc: 'Notify when revenue drops > 20% vs previous period', icon: TrendingDown, color: '#EF4444', default: true },
  { id: 'revenue-milestone', label: 'Revenue Milestone',    desc: 'Notify when monthly revenue crosses ₹1Cr threshold',   icon: TrendingUp,  color: '#10B981', default: true },
  { id: 'inactive-employee', label: 'Inactive Staff Alert', desc: 'Alert when an employee has no deals for 30 days',      icon: Users,       color: '#F59E0B', default: false },
  { id: 'new-client',      label: 'New Client Added',        desc: 'Notify when a new client is onboarded into system',   icon: CheckCircle, color: '#6366F1', default: true },
  { id: 'pending-txn',     label: 'Pending Transaction',     desc: 'Alert when a transaction is pending for > 7 days',    icon: Package,     color: '#8B5CF6', default: false },
  { id: 'churn-risk',      label: 'Churn Risk Warning',      desc: 'Alert when client is inactive for 90+ days',          icon: AlertCircle, color: '#F59E0B', default: true },
]

export default function AlertSettings() {
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('srip-alert-settings')
    if (saved) return JSON.parse(saved)
    return Object.fromEntries(ALERT_TYPES.map(a => [a.id, a.default]))
  })
  const [saved, setSaved] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [dash, emp, clients] = await Promise.all([
        api.get('/dashboard-summary'),
        api.get('/employees'),
        api.get('/clients'),
      ])
      setData({ dash: dash.data, employees: emp.data, clients: clients.data })
      setLastRefresh(new Date())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleAlert(id) {
    setAlerts(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('srip-alert-settings', JSON.stringify(next))
      return next
    })
  }

  function saveAll() {
    localStorage.setItem('srip-alert-settings', JSON.stringify(alerts))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  /* Live alerts from data */
  const liveAlerts = data ? [
    data.dash.kpis.revenue_change_pct < -20 && alerts['revenue-drop'] && {
      level: 'danger', icon: TrendingDown, text: `Revenue down ${Math.abs(data.dash.kpis.revenue_change_pct).toFixed(1)}% vs last period`, time: 'Now'
    },
    data.employees.filter(e => !e.is_active).length > 0 && alerts['inactive-employee'] && {
      level: 'warning', icon: Users, text: `${data.employees.filter(e => !e.is_active).length} staff members marked inactive`, time: 'Current'
    },
    alerts['churn-risk'] && {
      level: 'warning', icon: AlertCircle,
      text: `${data.clients.filter(c => c.last_deal && Math.floor((new Date()-new Date(c.last_deal))/86400000) > 90).length} clients inactive 90+ days — churn risk`,
      time: 'Current'
    },
    data.dash.kpis.total_revenue > 1e7 && alerts['revenue-milestone'] && {
      level: 'success', icon: TrendingUp, text: `Revenue milestone reached: ${fmt(data.dash.kpis.total_revenue)}`, time: 'This period'
    },
  ].filter(Boolean) : []

  const LEVEL_CFG = {
    danger:  { bg: 'rgba(239,68,68,0.08)',   color: '#EF4444', border: 'rgba(239,68,68,0.18)' },
    warning: { bg: 'rgba(245,158,11,0.08)',  color: '#F59E0B', border: 'rgba(245,158,11,0.18)' },
    success: { bg: 'rgba(16,185,129,0.08)',  color: '#10B981', border: 'rgba(16,185,129,0.18)' },
    info:    { bg: 'rgba(99,102,241,0.08)',  color: '#6366F1', border: 'rgba(99,102,241,0.18)' },
  }

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Alerts & Settings</h1>
          <p className="dash-subtitle">Manage system notifications and preferences
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <div className="filter-bar">
          <button className="filter-refresh" onClick={fetchData}><RefreshCw size={12} /> Refresh</button>
          <button className={`quick-action-btn ${saved ? 'success' : 'indigo'}`} onClick={saveAll}>
            {saved ? <><CheckCircle size={13} /> Saved!</> : <><Settings size={13} /> Save Settings</>}
          </button>
        </div>
      </div>

      <div className="alerts-layout">
        {/* Left: Alert settings */}
        <div>
          <div className="chart-card" style={{ marginBottom: 'var(--space-md)' }}>
            <div className="chart-card__title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} style={{ color: '#6366F1' }} /> Notification Settings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALERT_TYPES.map(a => (
                <div key={a.id} className={`alert-toggle-row ${alerts[a.id] ? 'alert-toggle-row--on' : ''}`}>
                  <div className="alert-toggle-row__icon" style={{ background: `${a.color}12`, color: a.color }}>
                    <a.icon size={14} />
                  </div>
                  <div className="alert-toggle-row__info">
                    <div className="alert-toggle-row__label">{a.label}</div>
                    <div className="alert-toggle-row__desc">{a.desc}</div>
                  </div>
                  <button className="alert-toggle-btn" onClick={() => toggleAlert(a.id)}>
                    {alerts[a.id]
                      ? <ToggleRight size={22} style={{ color: '#10B981' }} />
                      : <ToggleLeft  size={22} style={{ color: '#94A3B8' }} />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live alerts */}
        <div>
          <div className="chart-card">
            <div className="chart-card__title" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} style={{ color: '#F59E0B' }} /> Live Alerts
              {liveAlerts.length > 0 && (
                <span style={{ marginLeft: 4, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{liveAlerts.length}</span>
              )}
            </div>
            {loading && <div className="skeleton" style={{ height: 60, margin: '8px 0' }} />}
            {!loading && liveAlerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
                <CheckCircle size={28} style={{ color: '#10B981', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>All clear</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>No active alerts matching your settings</div>
              </div>
            )}
            {liveAlerts.map((a, i) => {
              const cfg = LEVEL_CFG[a.level]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-md)', marginBottom: 8, animation: 'card-enter 0.4s var(--ease-out-expo) both', animationDelay: `${i * 80}ms` }}>
                  <a.icon size={14} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: cfg.color, fontWeight: 600, lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* System info */}
          <div className="chart-card" style={{ marginTop: 'var(--space-md)' }}>
            <div className="chart-card__title" style={{ marginBottom: 12 }}>System Status</div>
            {[
              { label: 'Backend API',   status: 'Online',  color: '#10B981' },
              { label: 'Data Engine',   status: 'Running', color: '#10B981' },
              { label: 'Auto Refresh',  status: '60s',     color: '#6366F1' },
              { label: 'Total Records', status: '2,111+',  color: '#14B8A6' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(15,23,42,0.05)' : 'none', fontSize: 12.5 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 0 2px ${s.color}25` }} />
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: s.color }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
