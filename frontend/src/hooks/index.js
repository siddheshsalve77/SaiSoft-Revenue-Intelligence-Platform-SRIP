import { useEffect, useState, useRef } from 'react'

// ── useReveal: Intersection Observer for scroll entrance animations
export function useReveal(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.12, ...options }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ── useCountUp: Animate numbers from 0 to target
export function useCountUp(target, duration = 1400, active = true) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    let start = null
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, active])

  return value
}

// ── useFetch: Simple data fetcher with loading/error state
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, deps)

  return { data, loading, error, refetch: load }
}

// ── usePolling: Poll an API at interval
export function usePolling(fetchFn, intervalMs = 30000, deps = []) {
  const { data, loading, error, refetch } = useFetch(fetchFn, deps)

  useEffect(() => {
    const id = setInterval(refetch, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { data, loading, error, refetch }
}
