import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { LogoIcon } from '../components/Logo'
import { useAuthStore, useThemeStore } from '../store'
import { Sun, Moon } from 'lucide-react'
import '../components/layout.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate async auth (replace with real API call later)
    await new Promise((r) => setTimeout(r, 600))

    if (username === 'admin' && password === 'admin') {
      login(username)
      navigate('/app/dashboard')
    } else {
      setError('Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      background: 'var(--color-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '24px',
    }}>
      {/* Dot grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(90,95,207,0.1) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          width: '36px', height: '36px',
          border: '1px solid var(--color-edge)',
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--color-obsidian)',
        border: '1px solid var(--color-edge)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(90,95,207,0.08)',
        animation: 'fade-in 0.5s var(--ease-out-expo) both',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <LogoIcon size={34} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
              Sai Soft
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Revenue Intelligence Platform
            </div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
          Sign in to access your analytics
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 14px',
            background: 'var(--color-danger-dim)',
            border: '1px solid rgba(217,64,96,0.25)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--color-danger)',
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '0.03em' }}>
              USERNAME
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
              style={{
                width: '100%',
                background: 'var(--color-panel)',
                border: '1px solid var(--color-edge)',
                borderRadius: 'var(--radius-md)',
                padding: '11px 14px',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-indigo)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-edge)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '0.03em' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  background: 'var(--color-panel)',
                  border: '1px solid var(--color-edge)',
                  borderRadius: 'var(--radius-md)',
                  padding: '11px 44px 11px 14px',
                  fontSize: '14px',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-indigo)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--color-edge)' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center',
                }}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '13px',
              fontSize: '14px',
              marginTop: '4px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : (
              <><span>Sign In</span> <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--color-text-subtle)', textAlign: 'center' }}>
          Internal system — authorized access only
        </div>
      </div>
    </div>
  )
}
