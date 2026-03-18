import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { FileText, Download, Filter, Calendar, MapPin, Package, RefreshCw, FileSpreadsheet, BarChart2, TrendingUp } from 'lucide-react'
import './shared.css'
import './Reports.css'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  return `₹${Math.round(v).toLocaleString('en-IN')}`
}

const REPORT_TYPES = [
  { id: 'revenue-summary',  title: 'Revenue Summary',       icon: TrendingUp,      color: '#6366F1', desc: 'Monthly and quarterly revenue breakdown by region and product' },
  { id: 'employee-perf',    title: 'Employee Performance',  icon: BarChart2,       color: '#10B981', desc: 'Individual and team performance metrics, deal counts, revenue' },
  { id: 'client-analysis',  title: 'Client Analysis',       icon: FileText,        color: '#14B8A6', desc: 'Client segmentation, revenue contribution, deal history' },
  { id: 'product-report',   title: 'Product Report',        icon: Package,         color: '#8B5CF6', desc: 'Product-wise revenue, adoption rate, growth trends' },
  { id: 'region-report',    title: 'Regional Analysis',     icon: MapPin,          color: '#F59E0B', desc: 'Region-to-region comparison: revenue, clients, employees' },
  { id: 'txn-log',          title: 'Transaction Export',    icon: FileSpreadsheet, color: '#2563EB', desc: 'Full transaction history export with filters applied' },
]

function exportCSV(rows, filename) {
  if (!rows?.length) return
  const keys = Object.keys(rows[0])
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a    = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}

function ReportCard({ report, onGenerate, generating }) {
  return (
    <div className={`report-card reveal visible ${generating === report.id ? 'report-card--generating' : ''}`}>
      <div className="report-card__icon" style={{ background: `${report.color}12`, color: report.color }}>
        <report.icon size={18} />
      </div>
      <div className="report-card__info">
        <div className="report-card__title">{report.title}</div>
        <div className="report-card__desc">{report.desc}</div>
      </div>
      <div className="report-card__actions">
        <button className="report-btn report-btn--csv" onClick={() => onGenerate(report.id, 'csv')}
          disabled={generating === report.id}>
          {generating === report.id ? <span className="report-spinner" /> : <Download size={12} />}
          CSV
        </button>
        <button className="report-btn report-btn--pdf" onClick={() => onGenerate(report.id, 'pdf')}
          disabled>
          PDF <span style={{ fontSize: 9, marginLeft: 2, opacity: 0.6 }}>soon</span>
        </button>
      </div>
    </div>
  )
}

export default function Reports() {
  const [dash,    setDash]    = useState(null)
  const [employees, setEmployees] = useState([])
  const [clients, setClients] = useState([])
  const [transactions, setTransactions] = useState([])
  const [generating, setGenerating] = useState(null)
  const [filterRegion, setFilterRegion] = useState('')
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')
  const [lastRefresh, setLastRefresh]   = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [d, e, c, t] = await Promise.all([
        axios.get('/api/dashboard-summary'),
        axios.get('/api/employees'),
        axios.get('/api/clients'),
        axios.get('/api/transactions', { params: { page: 1, page_size: 100, region: filterRegion || undefined, date_from: filterFrom || undefined, date_to: filterTo || undefined } }),
      ])
      setDash(d.data); setEmployees(e.data); setClients(c.data)
      setTransactions(t.data.data || [])
      setLastRefresh(new Date())
    } catch {}
  }, [filterRegion, filterFrom, filterTo])

  useEffect(() => { fetchData() }, [fetchData])

  const generate = async (id, format) => {
    setGenerating(id)
    await new Promise(r => setTimeout(r, 600)) // simulate generation
    switch (id) {
      case 'revenue-summary':
        exportCSV(dash?.products?.map(p => ({ product: p.product_name, revenue: p.revenue, count: p.count })), 'revenue_summary.csv')
        break
      case 'employee-perf':
        exportCSV(employees.map(e => ({ id: e.id, name: e.name, role: e.role, region: e.region, revenue: e.total_sales, deals: e.total_transactions, product: e.top_product, active: e.is_active })), 'employee_performance.csv')
        break
      case 'client-analysis':
        exportCSV(clients.map(c => ({ id: c.id, name: c.name, region: c.region, segment: c.segment, revenue: c.total_revenue, deals: c.total_transactions, first_deal: c.first_deal, last_deal: c.last_deal })), 'client_analysis.csv')
        break
      case 'txn-log':
        exportCSV(transactions.map(t => ({ id: t.id, date: t.date, product: t.product_name, client: t.client_name, employee: t.employee_name, region: t.region, amount: t.amount, status: t.status })), 'transactions_export.csv')
        break
      default:
        alert(`${id} report: CSV export not yet supported for this type.`)
    }
    setGenerating(null)
  }

  const summaries = dash ? [
    { label: 'Monthly Revenue', value: fmt(dash.kpis.total_revenue), color: '#6366F1' },
    { label: 'Transactions',    value: dash.kpis.total_transactions, color: '#14B8A6' },
    { label: 'Active Clients',  value: dash.kpis.active_clients,    color: '#10B981' },
    { label: 'Active Staff',    value: dash.kpis.active_employees,  color: '#F59E0B' },
  ] : []

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Reports</h1>
          <p className="dash-subtitle">Download and export business data
            {lastRefresh && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-subtle)' }}>
              · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>}
          </p>
        </div>
        <div className="filter-bar">
          <input type="date" className="filter-select" style={{ minWidth: 128 }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <input type="date" className="filter-select" style={{ minWidth: 128 }} value={filterTo}   onChange={e => setFilterTo(e.target.value)} />
          <select className="filter-select" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="">All Regions</option>
            <option>Aurangabad MIDC</option>
            <option>Nanded MIDC</option>
            <option>Bangalore MIDC</option>
          </select>
          <button className="filter-refresh" onClick={fetchData}><RefreshCw size={12} /> Refresh</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="reports-summary">
        {summaries.map((s, i) => (
          <div className="reports-summary-tile" key={s.label} style={{ '--card-delay': `${i * 60}ms`, borderTop: `3px solid ${s.color}` }}>
            <div className="emp-summary-tile__val" style={{ color: s.color }}>{s.value}</div>
            <div className="emp-summary-tile__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter notice */}
      {(filterRegion || filterFrom || filterTo) && (
        <div className="insight-strip" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="insight-strip__label"><Filter size={11} /> Active Filters</div>
          <div className="insight-strip__items">
            {filterRegion && <span className="insight-badge">{filterRegion}</span>}
            {filterFrom   && <span className="insight-badge">From: {filterFrom}</span>}
            {filterTo     && <span className="insight-badge">To: {filterTo}</span>}
            <span className="insight-badge" style={{ color: '#10B981' }}>Transaction export will apply these filters</span>
          </div>
        </div>
      )}

      {/* Report cards grid */}
      <div className="reports-grid">
        {REPORT_TYPES.map((r, i) => (
          <ReportCard key={r.id} report={r} onGenerate={generate} generating={generating} />
        ))}
      </div>

      {/* Note */}
      <div className="reports-note">
        <FileText size={13} /> CSV exports download immediately. PDF reports are coming in the next release.
      </div>
    </div>
  )
}
