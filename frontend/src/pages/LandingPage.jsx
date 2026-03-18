import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Phone, ExternalLink, TrendingUp } from 'lucide-react'
import LandingNavbar from '../components/LandingNavbar'
import { LogoIcon } from '../components/Logo'
import { useReveal, useCountUp, useFetch } from '../hooks'
import { getStats } from '../utils/api'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import './LandingPage.css'

/* ── MARQUEE DATA ──────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Tally', 'Tally Prime', 'SAP', 'SAP S/4HANA', 'SAP FICO',
  'Aurangabad MIDC', 'Nanded MIDC', 'Bangalore MIDC',
  'Financial Software', 'Enterprise Solutions', 'Maharashtra',
]

/* ── PRODUCTS DATA ─────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 'tally',
    name: 'Tally',
    desc: 'Industry-leading accounting and business management software for SMEs.',
    tag: 'Accounting',
    tagColor: '#1E3A2F', tagText: '#0EA66A',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <rect width="44" height="44" rx="10" fill="rgba(14,166,106,0.12)" />
        <path d="M14 12h16M22 12v20M16 32h12" stroke="#0EA66A" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'tallyprime',
    name: 'Tally Prime',
    desc: 'Next-gen Tally with enhanced UI, faster workflows, and cloud capabilities.',
    tag: 'Accounting+',
    tagColor: '#1E3A2F', tagText: '#0EA66A',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <rect width="44" height="44" rx="10" fill="rgba(14,166,106,0.12)" />
        <path d="M14 12h16M22 12v20M16 32h12" stroke="#0EA66A" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="32" cy="14" r="5" fill="#0EA66A"/>
        <path d="M30 14l1.5 1.5L34 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'sap',
    name: 'SAP',
    desc: 'World-class ERP and enterprise software for mid-to-large organizations.',
    tag: 'ERP',
    tagColor: '#1A2850', tagText: '#5A5FCF',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <rect width="44" height="44" rx="10" fill="rgba(90,95,207,0.12)" />
        <path d="M12 22c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10" stroke="#5A5FCF" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M22 16v6l3.5 3.5" stroke="#5A5FCF" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'sap-s4',
    name: 'SAP S/4HANA',
    desc: 'Real-time intelligent ERP with in-memory computing for enterprises.',
    tag: 'Intelligent ERP',
    tagColor: '#1A2850', tagText: '#5A5FCF',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <rect width="44" height="44" rx="10" fill="rgba(90,95,207,0.12)" />
        <rect x="12" y="18" width="20" height="12" rx="3" stroke="#5A5FCF" strokeWidth="2"/>
        <path d="M16 14h12M19 14v4M25 14v4" stroke="#5A5FCF" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 24h4M17 27h7" stroke="#5A5FCF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'sap-fico',
    name: 'SAP FICO',
    desc: 'Finance & Controlling module: GL, AR/AP, cost centers, and profit analysis.',
    tag: 'Finance Module',
    tagColor: '#1F1730', tagText: '#1DB8D3',
    icon: (
      <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <rect width="44" height="44" rx="10" fill="rgba(29,184,211,0.10)" />
        <path d="M12 30l8-8 5 5 7-10" stroke="#1DB8D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="32" cy="17" r="2" fill="#1DB8D3"/>
      </svg>
    ),
  },
]

/* ── REGIONS ───────────────────────────────────────────────── */
const REGIONS = [
  { name: 'Aurangabad MIDC', state: 'Maharashtra', cx: 145, cy: 175 },
  { name: 'Nanded MIDC',     state: 'Maharashtra', cx: 162, cy: 198 },
  { name: 'Bangalore MIDC',  state: 'Karnataka',   cx: 148, cy: 248 },
]

/* ── MINI CHART DATA (preview) ─────────────────────────────── */
const PREVIEW_CHART = [
  { m: 'Oct', v: 12 }, { m: 'Nov', v: 18 }, { m: 'Dec', v: 15 },
  { m: 'Jan', v: 22 }, { m: 'Feb', v: 19 }, { m: 'Mar', v: 28 },
]

/* ══════════════════════════════════════════════════════════════
   LANDING PAGE COMPONENT
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="landing">
      <LandingNavbar />
      <HeroSection />
      <MarqueeStrip />
      <AboutSection />
      <ProductsSection />
      <RegionsSection />
      <StatsBar />
      <CTASection />
      <Footer />
    </div>
  )
}

/* ── HERO ──────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div className="hero__inner">
        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Internal Analytics Platform
          </div>
          <h1 className="hero__headline">
            Revenue Intelligence,<br />
            <em>Redefined.</em>
          </h1>
          <p className="hero__subtitle">
            The complete analytics command center for Sai Soft Infosys.
            Track revenue, products, regions, and team performance — all in real time.
          </p>
          <div className="hero__actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Launch Dashboard <ArrowRight size={16} />
            </Link>
            <a
              href="#about"
              className="btn btn-ghost btn-lg"
              onClick={(e) => { e.preventDefault(); document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' }) }}
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero__card-wrap">
          <DashboardPreviewCard />
        </div>
      </div>
    </section>
  )
}

function DashboardPreviewCard() {
  return (
    <div className="dashboard-preview">
      <div className="dashboard-preview__header">
        <span className="dashboard-preview__title">Revenue Overview</span>
        <span className="dashboard-preview__live">
          <span className="live-dot" /> Live
        </span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={PREVIEW_CHART} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#5A5FCF" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#5A5FCF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone" dataKey="v"
              stroke="#5A5FCF" strokeWidth={2}
              fill="url(#previewGrad)"
              dot={false}
            />
            <Tooltip
              contentStyle={{ background: 'var(--color-panel)', border: '1px solid var(--color-edge)', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ display: 'none' }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
              formatter={(v) => [`₹${v}L`, '']}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-preview__kpis">
        <div className="kpi-mini">
          <div className="kpi-mini__label">Revenue</div>
          <div className="kpi-mini__value" style={{ fontFamily: 'var(--font-mono)' }}>—</div>
          <div className="kpi-mini__change up" style={{ fontSize: '11px' }}>Live from API</div>
        </div>
        <div className="kpi-mini">
          <div className="kpi-mini__label">Growth</div>
          <div className="kpi-mini__value" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>—</div>
          <div className="kpi-mini__change up" style={{ fontSize: '11px' }}>YoY</div>
        </div>
      </div>
    </div>
  )
}

/* ── MARQUEE ───────────────────────────────────────────────── */
function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS] // duplicate for seamless loop
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span className="marquee-item" key={i}>
            {item}
            <span className="marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── ABOUT ─────────────────────────────────────────────────── */
function AboutSection() {
  const { ref: leftRef, visible: leftVis } = useReveal()
  const { ref: rightRef, visible: rightVis } = useReveal()

  const stats = [
    { value: 12, suffix: '+', label: 'Years of Expertise' },
    { value: 5,  suffix: '',  label: 'Products in Portfolio' },
    { value: 3,  suffix: '',  label: 'Regions Active' },
  ]

  return (
    <section className="section" id="about" style={{ background: 'var(--color-navy)' }}>
      <div className="container">
        <div className="about__grid">
          <div
            ref={leftRef}
            className={`about__stats reveal-left ${leftVis ? 'visible' : ''}`}
          >
            {stats.map((s, i) => (
              <StatTile key={i} value={s.value} suffix={s.suffix} label={s.label} active={leftVis} delay={i * 80} />
            ))}
          </div>

          <div
            ref={rightRef}
            className={`about__content reveal-right ${rightVis ? 'visible' : ''}`}
          >
            <div className="section__label">About the Company</div>
            <h2>
              Helping Maharashtra's businesses unlock enterprise software potential
            </h2>
            <p className="about__body">
              Sai Soft Infosys is a specialized financial software solutions provider,
              delivering Tally, Tally Prime, SAP, SAP S/4HANA, and SAP FICO to businesses
              across MIDC clusters in Maharashtra and Karnataka. With over a decade of
              hands-on implementation experience, we bridge the gap between enterprise software
              and real-world business needs.
            </p>
            <div className="about__address">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={14} style={{ marginTop: '3px', color: 'var(--color-indigo-soft)', flexShrink: 0 }} />
                <span>
                  Golden Dreams Buildcon, Plot no. E-20-45, MIDC, Chilkalthana,<br />
                  Chhatrapati Sambhajinagar, Maharashtra 431006
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} style={{ color: 'var(--color-indigo-soft)' }} />
                  <a href="tel:088066 63011">088066 63011</a>
                </span>
                <a
                  href="https://maps.app.goo.gl/d525MGLGsPHc9sUx6"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  View on Google Maps <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatTile({ value, suffix, label, active, delay }) {
  const count = useCountUp(value, 1200, active)
  return (
    <div className="stat-tile" style={{ transitionDelay: `${delay}ms` }}>
      <div className="stat-tile__number">
        {active ? count : 0}{suffix}
      </div>
      <div className="stat-tile__label">{label}</div>
    </div>
  )
}

/* ── PRODUCTS ──────────────────────────────────────────────── */
function ProductsSection() {
  const { ref, visible } = useReveal()

  return (
    <section className="section" id="products" style={{ background: 'var(--color-obsidian)' }}>
      <div className="container">
        <div className={`section__header reveal ${visible ? 'visible' : ''}`} ref={ref}>
          <div className="section__label">What We Deliver</div>
          <h2 className="section__title">Financial Software Solutions</h2>
          <p className="section__subtitle">
            From SME accounting to enterprise-grade ERP — we implement and support
            the right software for your business scale.
          </p>
        </div>

        <div className="products__grid">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} parentVisible={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product: p, index, parentVisible }) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    if (parentVisible) {
      const t = setTimeout(() => setVis(true), index * 90)
      return () => clearTimeout(t)
    }
  }, [parentVisible, index])

  return (
    <div
      className={`product-card reveal ${vis ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div
        className="product-card__icon"
        style={{ background: p.tagColor }}
      >
        {p.icon}
      </div>
      <div className="product-card__name">{p.name}</div>
      <p className="product-card__desc">{p.desc}</p>
      <span
        className="product-card__tag"
        style={{ background: p.tagColor, color: p.tagText }}
      >
        {p.tag}
      </span>
    </div>
  )
}

/* ── REGIONS ───────────────────────────────────────────────── */
function RegionsSection() {
  const { ref, visible } = useReveal()

  return (
    <section className="section" id="regions" style={{ background: 'var(--color-navy)' }}>
      <div className="container">
        <div className={`section__header reveal ${visible ? 'visible' : ''}`} ref={ref}>
          <div className="section__label">Where We Operate</div>
          <h2 className="section__title">Service Areas</h2>
          <p className="section__subtitle">
            Actively serving MIDC industrial clusters across Maharashtra and Karnataka.
          </p>
        </div>

        <div className="regions__grid">
          <div className="regions__list">
            {REGIONS.map((r, i) => (
              <div
                key={r.name}
                className={`region-card reveal ${visible ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="region-dot" />
                <div>
                  <div className="region-card__name">{r.name}</div>
                  <div className="region-card__state">{r.state}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="india-map-wrap">
            <IndiaMapSVG regions={REGIONS} visible={visible} />
          </div>
        </div>
      </div>
    </section>
  )
}

function IndiaMapSVG({ regions, visible }) {
  return (
    <svg
      className="india-svg"
      viewBox="0 0 300 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified India outline — stylized, not geographically precise */}
      <path
        d="M120,20 L160,18 L200,30 L230,55 L240,90 L235,130 L220,160 L240,190
           L245,220 L220,255 L200,280 L180,310 L165,340 L155,370 L148,385
           L140,370 L130,345 L115,315 L95,285 L70,260 L50,230 L45,200 L55,170
           L60,140 L50,110 L60,80 L85,55 L105,35 Z"
        fill="var(--color-panel)"
        stroke="var(--color-edge)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* State dividers (stylized) */}
      <path d="M85,150 Q150,140 215,155" stroke="var(--color-edge)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.4" />
      <path d="M70,220 Q150,210 230,215" stroke="var(--color-edge)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.4" />

      {/* Region dots */}
      {regions.map((r, i) => (
        <g key={r.name}>
          {/* Pulse ring */}
          <circle
            cx={r.cx} cy={r.cy} r="12"
            fill="rgba(90,95,207,0.1)"
            style={{
              animation: visible ? `region-pulse 2.5s ease ${i * 400}ms infinite` : 'none'
            }}
          />
          {/* Dot */}
          <circle
            cx={r.cx} cy={r.cy} r="5"
            fill="var(--color-indigo)"
            opacity={visible ? 1 : 0}
            style={{ transition: `opacity 0.5s ease ${i * 200 + 300}ms` }}
          />
          <circle cx={r.cx} cy={r.cy} r="2.5" fill="white" opacity="0.9" />
          {/* Label */}
          <text
            x={r.cx + 14} y={r.cy + 4}
            fontSize="10"
            fill="var(--color-text-muted)"
            opacity={visible ? 1 : 0}
            style={{ transition: `opacity 0.5s ease ${i * 200 + 400}ms`, fontFamily: 'Inter, sans-serif' }}
          >
            {r.name.split(' ')[0]}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* ── STATS BAR ─────────────────────────────────────────────── */
function StatsBar() {
  const { ref, visible } = useReveal()
  const { data: stats, loading } = useFetch(getStats, [])

  const items = [
    {
      prefix: '₹',
      value: stats ? parseFloat(stats.total_revenue_cr) : 0,
      suffix: ' Cr+',
      label: 'Revenue Generated',
      isFloat: true,
    },
    {
      prefix: '',
      value: stats?.total_clients ?? 0,
      suffix: '+',
      label: 'Clients Served',
    },
    {
      prefix: '',
      value: stats?.total_products ?? 5,
      suffix: '',
      label: 'Products Delivered',
    },
    {
      prefix: '',
      value: stats?.total_regions ?? 3,
      suffix: '',
      label: 'Regions Active',
    },
  ]

  return (
    <div className="stats-bar">
      <div className="stats-bar__inner" ref={ref}>
        {items.map((item, i) => (
          <StatItem
            key={i}
            {...item}
            active={visible && !loading}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}

function StatItem({ prefix, value, suffix, label, active, loading, isFloat }) {
  const count = useCountUp(isFloat ? Math.round(value * 10) : value, 1400, active)
  const display = isFloat ? (count / 10).toFixed(1) : count

  return (
    <div className="stat-item">
      {loading ? (
        <>
          <div className="skeleton stat-item__skeleton" />
          <div className="stat-item__label">{label}</div>
        </>
      ) : (
        <>
          <div className="stat-item__value">
            {prefix && <span className="prefix">{prefix}</span>}
            {active ? display : '—'}
            {suffix}
          </div>
          <div className="stat-item__label">{label}</div>
        </>
      )}
    </div>
  )
}

/* ── CTA ───────────────────────────────────────────────────── */
function CTASection() {
  const { ref, visible } = useReveal()

  return (
    <section className="section cta-section" style={{ background: 'var(--color-obsidian)' }}>
      <div
        ref={ref}
        className={`container reveal ${visible ? 'visible' : ''}`}
        style={{ textAlign: 'center' }}
      >
        <h2 className="cta-section__title">
          Ready to see your revenue <em>clearly?</em>
        </h2>
        <Link to="/login" className="btn btn-primary btn-lg">
          Launch Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}

/* ── FOOTER ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <LogoIcon size={30} />
          <div className="footer__brand-name">Sai Soft Infosys</div>
          <div className="footer__brand-sub">© {new Date().getFullYear()} · All rights reserved</div>
        </div>

        <div className="footer__contact">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', justifyContent: 'flex-end', marginBottom: '6px' }}>
            <MapPin size={13} style={{ marginTop: '3px', color: 'var(--color-indigo-soft)', flexShrink: 0 }} />
            <span>
              Golden Dreams Buildcon, Plot E-20-45,<br />
              MIDC Chilkalthana, CSB, Maharashtra 431006
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={12} style={{ color: 'var(--color-indigo-soft)' }} />
              <a href="tel:08806663011">088066 63011</a>
            </span>
            <a
              href="https://maps.app.goo.gl/d525MGLGsPHc9sUx6"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Google Maps <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
