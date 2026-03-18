import { useState, useEffect } from 'react'
import { getProducts } from '../utils/api'
import './shared.css'
import './Products.css'

/* ── Product icon SVGs ──────────────────────────────────────── */
const PRODUCT_ICONS = {
  tally: (
    <svg viewBox="0 0 44 44" fill="none" width="36" height="36">
      <rect width="44" height="44" rx="10" fill="rgba(14,166,106,0.14)"/>
      <path d="M14 12h16M22 12v20M16 32h12" stroke="#0EA66A" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  tallyprime: (
    <svg viewBox="0 0 44 44" fill="none" width="36" height="36">
      <rect width="44" height="44" rx="10" fill="rgba(14,166,106,0.14)"/>
      <path d="M14 12h16M22 12v20M16 32h12" stroke="#0EA66A" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="32" cy="14" r="6" fill="#0EA66A"/>
      <path d="M29.5 14l1.8 1.8L34 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sap: (
    <svg viewBox="0 0 44 44" fill="none" width="36" height="36">
      <rect width="44" height="44" rx="10" fill="rgba(90,95,207,0.14)"/>
      <path d="M12 22c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10" stroke="#5A5FCF" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M22 16v6l3.5 3.5" stroke="#5A5FCF" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  'sap-s4': (
    <svg viewBox="0 0 44 44" fill="none" width="36" height="36">
      <rect width="44" height="44" rx="10" fill="rgba(116,119,212,0.14)"/>
      <rect x="12" y="18" width="20" height="12" rx="3" stroke="#7477D4" strokeWidth="2"/>
      <path d="M16 14h12M19 14v4M25 14v4" stroke="#7477D4" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 24h4M17 27h7" stroke="#7477D4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'sap-fico': (
    <svg viewBox="0 0 44 44" fill="none" width="36" height="36">
      <rect width="44" height="44" rx="10" fill="rgba(29,184,211,0.12)"/>
      <path d="M12 30l8-8 5 5 7-10" stroke="#1DB8D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="32" cy="17" r="2" fill="#1DB8D3"/>
    </svg>
  ),
}

const PRODUCT_ACCENTS = {
  tally:      { color: '#0EA66A', dim: 'rgba(14,166,106,0.10)', tag: 'Accounting' },
  tallyprime: { color: '#0EA66A', dim: 'rgba(14,166,106,0.10)', tag: 'Accounting+' },
  sap:        { color: '#5A5FCF', dim: 'rgba(90,95,207,0.10)',  tag: 'ERP' },
  'sap-s4':   { color: '#7477D4', dim: 'rgba(116,119,212,0.10)', tag: 'Intelligent ERP' },
  'sap-fico': { color: '#1DB8D3', dim: 'rgba(29,184,211,0.09)',  tag: 'Finance Module' },
}

const PRODUCT_DESCRIPTIONS = {
  tally:      'Industry-leading accounting and business management software trusted by SMEs across India.',
  tallyprime: 'Next-generation Tally with modern UI, faster workflows, and cloud-readiness built in.',
  sap:        'World-class ERP system for mid-to-large enterprises. Covers all key business processes.',
  'sap-s4':   'SAP\'s intelligent ERP with in-memory HANA computing for real-time business insight.',
  'sap-fico': 'SAP Finance & Controlling module covering GL, AR/AP, cost centers, and profit analysis.',
}

const fmt = (v) => {
  if (!v) return '₹0'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}

/* ── Product Card ────────────────────────────────────────────── */
function ProductCard({ product, totalRevenue, index, onClick }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80)
    return () => clearTimeout(t)
  }, [index])

  const accent = PRODUCT_ACCENTS[product.product_id] || { color: '#888', dim: 'rgba(136,136,136,0.1)', tag: '—' }
  const pct    = totalRevenue > 0 ? ((product.total_revenue / totalRevenue) * 100).toFixed(1) : 0

  return (
    <div
      className={`prod-card reveal ${visible ? 'visible' : ''}`}
      onClick={() => onClick(product)}
    >
      {/* Icon + tag */}
      <div className="prod-card__top">
        <div className="prod-card__icon">
          {PRODUCT_ICONS[product.product_id] || PRODUCT_ICONS['sap']}
        </div>
        <span
          className="prod-card__tag"
          style={{ background: accent.dim, color: accent.color, borderColor: `${accent.color}33` }}
        >
          {accent.tag}
        </span>
      </div>

      {/* Name */}
      <div className="prod-card__name">{product.name || product.product_id}</div>
      <div className="prod-card__desc">{PRODUCT_DESCRIPTIONS[product.product_id] || ''}</div>

      {/* Revenue bar */}
      <div className="prod-card__bar-wrap">
        <div
          className="prod-card__bar-fill"
          style={{ width: `${pct}%`, background: accent.color, opacity: 0.8 }}
        />
      </div>

      {/* Stats row */}
      <div className="prod-card__stats">
        <div className="prod-card__stat">
          <div className="prod-card__stat-val">{fmt(product.total_revenue)}</div>
          <div className="prod-card__stat-label">Revenue</div>
        </div>
        <div className="prod-card__stat-divider" />
        <div className="prod-card__stat">
          <div className="prod-card__stat-val">{product.total_clients}</div>
          <div className="prod-card__stat-label">Clients</div>
        </div>
        <div className="prod-card__stat-divider" />
        <div className="prod-card__stat">
          <div className="prod-card__stat-val">{product.total_transactions}</div>
          <div className="prod-card__stat-label">Deals</div>
        </div>
      </div>

      <div className="prod-card__share" style={{ color: accent.color }}>
        {pct}% of total revenue
      </div>
    </div>
  )
}

/* ── Product Modal ────────────────────────────────────────────── */
function ProductModal({ product, totalRevenue, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const accent = PRODUCT_ACCENTS[product.product_id] || { color: '#888', dim: '#111', tag: '—' }
  const pct = totalRevenue > 0 ? ((product.total_revenue / totalRevenue) * 100).toFixed(1) : 0
  const avgDeal = product.total_transactions > 0
    ? product.total_revenue / product.total_transactions
    : 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-top" style={{ alignItems: 'flex-start' }}>
          {PRODUCT_ICONS[product.product_id]}
          <div style={{ flex: 1 }}>
            <div className="modal-name">{product.name || product.product_id}</div>
            <span
              className="prod-card__tag"
              style={{
                background: accent.dim,
                color: accent.color,
                borderColor: `${accent.color}33`,
                display: 'inline-block',
                marginTop: 4,
                fontSize: '11px',
                padding: '3px 9px',
                borderRadius: 4,
                border: '1px solid',
              }}
            >
              {accent.tag}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.65 }}>
          {PRODUCT_DESCRIPTIONS[product.product_id]}
        </p>

        <div className="modal-kpis">
          {[
            { label: 'Total Revenue',   value: fmt(product.total_revenue) },
            { label: 'Revenue Share',   value: `${pct}%` },
            { label: 'Deals Closed',    value: product.total_transactions },
            { label: 'Unique Clients',  value: product.total_clients },
            { label: 'Avg Deal Size',   value: fmt(avgDeal) },
            { label: 'Base Price',      value: `₹${(product.base_price || 0).toLocaleString('en-IN')}` },
          ].map((kpi) => (
            <div className="modal-kpi" key={kpi.label}>
              <div className="modal-kpi__label">{kpi.label}</div>
              <div className="modal-kpi__value" style={{ color: kpi.label === 'Total Revenue' ? accent.color : 'var(--color-text-primary)' }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── PRODUCTS PAGE ──────────────────────────────────────────── */
export default function Products() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getProducts()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalRevenue = (data || []).reduce((s, p) => s + p.total_revenue, 0)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="dash-title">Products</h1>
          <p className="dash-subtitle">Financial software portfolio — revenue analytics</p>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && data && (
        <div className="prod-summary">
          {[
            { label: 'Products',    value: data.length },
            { label: 'Total Revenue', value: fmt(totalRevenue) },
            { label: 'Total Clients', value: [...new Set(data.flatMap(() => []))].length || data.reduce((s,p) => s + p.total_clients, 0) },
            { label: 'Total Deals',   value: data.reduce((s, p) => s + p.total_transactions, 0) },
          ].map((s) => (
            <div className="prod-summary-tile" key={s.label}>
              <div className="prod-summary-tile__val">{s.value}</div>
              <div className="prod-summary-tile__label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="prod-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="prod-card" style={{ cursor: 'default' }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 11, width: '90%', marginBottom: 4, borderRadius: 3 }} />
              <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 20, borderRadius: 3 }} />
              <div className="skeleton" style={{ height: 4, width: '100%', borderRadius: 2, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 28, width: '100%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <div className="empty-state__title">Failed to load products</div>
          <div className="empty-state__sub">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <div className="prod-grid">
          {(data || []).map((product, i) => (
            <ProductCard
              key={product.product_id}
              product={product}
              totalRevenue={totalRevenue}
              index={i}
              onClick={setSelected}
            />
          ))}
        </div>
      )}

      {selected && (
        <ProductModal
          product={selected}
          totalRevenue={totalRevenue}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
