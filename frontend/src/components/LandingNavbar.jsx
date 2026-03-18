import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowRight } from 'lucide-react'
import { useThemeStore } from '../store'
import { LogoIcon } from './Logo'
import './layout.css'

const NAV_LINKS = [
  { label: 'Home',     href: '#hero' },
  { label: 'Products', href: '#products' },
  { label: 'Regions',  href: '#regions' },
  { label: 'About',    href: '#about' },
]

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme } = useThemeStore()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleAnchor = (e, href) => {
    e.preventDefault()
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="navbar__inner">
        {/* Logo */}
        <a href="#hero" onClick={(e) => handleAnchor(e, '#hero')} className="navbar__logo">
          <LogoIcon size={34} />
          <div className="navbar__logo-text">
            <span className="navbar__logo-name">Sai Soft</span>
            <span className="navbar__logo-sub">Infosys</span>
          </div>
        </a>

        {/* Nav Links */}
        <ul className="navbar__links" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="navbar__link"
                onClick={(e) => handleAnchor(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar__actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 18px' }}>
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
