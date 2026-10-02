import { Toaster } from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'

/**
 * react-hot-toast styles via inline JS (not Tailwind classes), sehingga
 * warnanya tidak otomatis ikut dark mode kecuali dibaca manual dari sini.
 * Warna mengikuti token desain terkini (Emerald/Slate), bukan skema lama.
 */
export default function AppToaster() {
  const { isDark } = useTheme()

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#0f172a',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: isDark ? '#34d399' : '#059669', secondary: isDark ? '#1e293b' : '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e293b' : '#ffffff' },
        },
      }}
    />
  )
}
