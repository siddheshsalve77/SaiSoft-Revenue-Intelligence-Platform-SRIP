import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Theme Store ──────────────────────────────────────────────
// Light is the permanent default.
// We do NOT persist theme anymore — always starts light,
// user can toggle dark within the session.
export const useThemeStore = create(
  (set) => ({
    theme: 'light',
    toggleTheme: () =>
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        return { theme: next }
      }),
    initTheme: () => {
      // Always enforce light. Ignore any previous localStorage value.
      document.documentElement.setAttribute('data-theme', 'light')
    },
  })
)

// ── Auth Store ───────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username) => set({ isAuthenticated: true, user: { username } }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'srip-auth',
    }
  )
)
