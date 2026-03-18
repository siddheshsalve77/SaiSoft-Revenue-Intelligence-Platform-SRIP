import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { RefreshCw, CheckCircle, Package, Users, BarChart2 } from 'lucide-react'
import './shared.css'
import './ActivityLog.css'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const PRODUCT_COLORS = { 'Tally': '#6366F1', 'Tally Prime': '#8B5CF6', 'SAP': '#14B8A6', 'SAP S/4HANA': '#2563EB', 'SAP FICO': '#F59E0B' }
const STATUS_COLOR  = { completed: '#10B981', pending: '#F59E0B', cancelled: '#EF4444' }

function groupByDate(items) {
  const groups = {}
  items.forEach(item => {
    const d = item.date || item.period
    if (!groups[d]) groups[d] = []
    groups[d].push(item)
  })
  return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a))
}

export default function ActivityLog() {
  const [txns, setTxns]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [lastRefresh, setLastRefresh]   = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get('/api/transactions', { params: {
        page: 1, page_size: 80,
        status: filterStatus || undefined, region: filterRegion || undefined
      }})
      setTxns(res.data.data || [])
      setLastRefresh(new Date())
    } catch {} finally { setLoading(false) }
  }, [filterStatus, filterRegion])

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 60000); return () => clearInterval(id) }, [fetchData])

  const grouped = groupByDate(txns)

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Activity Log</h1>
          <p className="dash-subtitle">
            Transaction timeline · {txns.length} entries shown
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <div className="filter-bar">
          <button className="filter-refresh" onClick={fetchData}><RefreshCw size={12} /> Refresh</button>
          <select className="filter-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="">All Regions</option>
            <option>Aurangabad MIDC</option>
            <option>Nanded MIDC</option>
            <option>Bangalore MIDC</option>
          </select>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="activity-timeline">
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="timeline-group">
            <div className="skeleton timeline-date-label" style={{ width: 100, height: 14, marginBottom: 12 }} />
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="timeline-row">
                <div className="timeline-dot-col">
                  <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
                </div>
                <div className="timeline-card skeleton" style={{ height: 56 }} />
              </div>
            ))}
          </div>
        ))}

        {!loading && grouped.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <div className="empty-state__title">No activity found</div>
            <div className="empty-state__sub">Try adjusting your filters</div>
          </div>
        )}

        {!loading && grouped.map(([date, items], gi) => (
          <div key={date} className="timeline-group" style={{ animationDelay: `${gi * 30}ms` }}>
            <div className="timeline-date-label">
              <span>{fmtDate(date)}</span>
              <span className="timeline-date-count">{items.length} entr{items.length === 1 ? 'y' : 'ies'}</span>
            </div>
            {items.map((t, i) => {
              const pc = PRODUCT_COLORS[t.product_name] || '#6366F1'
              const sc = STATUS_COLOR[t.status] || '#10B981'
              return (
                <div key={t.id} className="timeline-row" style={{ animationDelay: `${gi * 30 + i * 20}ms` }}>
                  <div className="timeline-dot-col">
                    <div className="timeline-dot" style={{ background: pc }} />
                    {i < items.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-card__top">
                      <span className="timeline-card__id">{t.id}</span>
                      <span className="timeline-card__amount">{fmt(t.amount)}</span>
                    </div>
                    <div className="timeline-card__content">
                      <span className="timeline-card__client">{t.client_name}</span>
                      <div className="timeline-card__meta">
                        <span style={{ color: pc, fontWeight: 600, fontSize: 11 }}>{t.product_name}</span>
                        <span className="timeline-sep">·</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{t.employee_name}</span>
                        <span className="timeline-sep">·</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t.region.replace(' MIDC', '')}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: sc, fontWeight: 600 }}>● {t.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
