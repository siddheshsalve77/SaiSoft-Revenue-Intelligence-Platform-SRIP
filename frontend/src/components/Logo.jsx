// SVG Logo icon for Sai Soft Infosys
// Geometric S-form with upward analytics trend line
export function LogoIcon({ size = 34, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5A5FCF" />
          <stop offset="100%" stopColor="#1DB8D3" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#logo-grad)" opacity="0.12" />
      {/* S-form path */}
      <path
        d="M26 13.5C26 11.567 24.433 10 22.5 10H16C13.791 10 12 11.791 12 14C12 16.209 13.791 18 16 18H24C26.209 18 28 19.791 28 22C28 24.209 26.209 26 24 26H17.5C15.567 26 14 24.433 14 22.5"
        stroke="url(#logo-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Trend sparkline (top-right accent) */}
      <polyline
        points="22,19 25,16 28,17 31,13"
        stroke="#1DB8D3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Trend dot */}
      <circle cx="31" cy="13" r="1.8" fill="#1DB8D3" opacity="0.9" />
    </svg>
  )
}

// Favicon SVG (simplified)
export function FaviconSVG() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#5A5FCF" />
      <path
        d="M21 10.5C21 9.12 19.88 8 18.5 8H13C11.343 8 10 9.343 10 11C10 12.657 11.343 14 13 14H19C20.657 14 22 15.343 22 17C22 18.657 20.657 20 19 20H13.5C12.12 20 11 18.88 11 17.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
