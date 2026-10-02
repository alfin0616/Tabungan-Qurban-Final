import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(undefined)
const THEME_KEY = 'tq_theme'

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'dark') return true
      if (saved === 'light') return false
      // Jikalau belum ada simpanan manual, ikuti otomatis tema sistem HP/Perangkat
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return document.documentElement.classList.contains('dark')
    }
  })

  // Pantau perubahan preferensi tema sistem HP/Perangkat secara real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const saved = localStorage.getItem(THEME_KEY)
      // Jika pengguna tidak mengunci secara manual (misal: belum ubah manual), ikuti perubahan HP
      if (!saved) {
        setIsDark(e.matches)
      }
    }

    // Gunakan addEventListener / addListener untuk kompatibilitas HP lama & baru
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  // Terapkan class `dark` ke <html> setiap kali isDark berubah
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) throw new Error('useTheme harus digunakan di dalam ThemeProvider')
  return ctx
}
