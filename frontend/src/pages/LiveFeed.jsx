import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../utils/api'
import { RefreshCw, Zap } from 'lucide-react'
import './shared.css'
import './LiveFeed.css'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''

const PRODUCT_COLORS = { 'Tally': '#6366F1', 'Tally Prime': '#8B5CF6', 'SAP': '#14B8A6', 'SAP S/4HANA': '#2563EB', 'SAP FICO': '#F59E0B' }
const STATUS_CFG     = { completed: { color: '#10B981' }, pending: { color: '#F59E0B' }, cancelled: { color: '#EF4444' } }

export default function LiveFeed() {
  const [feed, setFeed]       = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [newCount, setNewCount] = useState(0)
  const [paused, setPaused]   = useState(false)
  const listRef = useRef(null)

  const fetchFeed = useCallback(async () => {
    if (paused) return
    try {
      const res  = await api.get('/transactions', { params: { page: 1, page_size: 30 } })
      const fresh = res.data.data || []
      setFeed(prev => {
        const prevIds = new Set(prev.map(t => t.id))
        const added   = fresh.filter(t => !prevIds.has(t.id)).length
        if (added > 0) setNewCount(n => n + added)
        return fresh
      })
      setLastRefresh(new Date())
    } catch {} finally { setLoading(false) }
  }, [paused])

  useEffect(() => { fetchFeed() }, [fetchFeed])
  useEffect(() => { const id = setInterval(fetchFeed, 15000); return () => clearInterval(id) }, [fetchFeed])

  const totalAmt = feed.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Live Activity Feed</h1>
          <p className="dash-subtitle">Real-time transaction stream · 15s refresh
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <div className="filter-bar">
          <button className={`quick-action-btn ${paused ? 'warning' : 'success'}`} onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="filter-refresh" onClick={() => { setNewCount(0); fetchFeed() }}><RefreshCw size={12} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="livefeed-stats">
        {[
          { label: 'Transactions', value: `${feed.length} shown`, color: '#6366F1' },
          { label: 'Completed Revenue', value: fmt(totalAmt), color: '#10B981' },
          { label: 'Pending', value: feed.filter(t => t.status === 'pending').length, color: '#F59E0B' },
          { label: 'Refresh Rate', value: paused ? 'Paused' : '15s', color: paused ? '#94A3B8' : '#10B981' },
        ].map((s, i) => (
          <div className="livefeed-stat-tile" key={s.label} style={{ '--card-delay': `${i * 50}ms` }}>
            <div className="livefeed-stat-tile__val" style={{ color: s.color }}>{s.value}</div>
            <div className="livefeed-stat-tile__label">{s.label}</div>
          </div>
        ))}
      </div>

      {newCount > 0 && (
        <div className="livefeed-new-badge" onClick={() => { setNewCount(0); listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <Zap size={12} /> {newCount} new — click to scroll up
        </div>
      )}

      <div className="livefeed-card">
        <div className="livefeed-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`live-pulse ${paused ? 'live-pulse--paused' : ''}`} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{paused ? 'Paused' : 'Live'}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{feed.length} entries</span>
        </div>

        <div className="livefeed-list" ref={listRef}>
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="livefeed-row livefeed-row--skel">
              <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: '65%', marginBottom: 5 }} />
                <div className="skeleton" style={{ height: 10, width: '45%' }} />
              </div>
              <div className="skeleton" style={{ height: 12, width: 60 }} />
            </div>
          ))}

          {!loading && feed.map((t, i) => {
            const pc = PRODUCT_COLORS[t.product_name] || '#6366F1'
            const st = STATUS_CFG[t.status] || STATUS_CFG.completed
            return (
              <div key={t.id} className="livefeed-row" style={{ animationDelay: `${i * 12}ms` }}>
                <div className="livefeed-row__dot" style={{ background: pc }} />
                <div className="livefeed-row__content">
                  <div className="livefeed-row__top">
                    <span className="livefeed-row__client">{t.client_name}</span>
                    <span className="livefeed-row__amount">{fmt(t.amount)}</span>
                  </div>
                  <div className="livefeed-row__bottom">
                    <span style={{ color: pc, fontWeight: 600, fontSize: 11 }}>{t.product_name}</span>
                    <span className="livefeed-row__sep">·</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{t.employee_name}</span>
                    <span className="livefeed-row__sep">·</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t.region.replace(' MIDC','')}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: st.color, fontWeight: 600 }}>● {t.status}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-subtle)', marginLeft: 6 }}>{fmtDate(t.date)}</span>
                  </div>
                </div>
                <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono', color: '#94A3B8', flexShrink: 0, marginLeft: 8 }}>{t.id}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
