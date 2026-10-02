import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logger, SOURCES } from '../repositories/loggerRepository'

/**
 * Global Error Boundary — menangkap error React yang tidak tertangani
 * (render error, lifecycle error, dll) agar aplikasi tidak crash total
 * dan menampilkan fallback UI yang informatif.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Catat ke database via Centralized Logger Service (Modul 11)
    logger.error(SOURCES.FRONTEND, `Uncaught React Component Crash: ${error.message || error}`, error, {
      componentStack: errorInfo?.componentStack,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Jika parent menyuplai fallback kustom
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-canvas-dark p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Terjadi Kesalahan
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Aplikasi mengalami error yang tidak terduga. Silakan coba muat ulang halaman.
            </p>

            {/* Detail error — hanya di development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 rounded-lg bg-red-50 p-3 text-left text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <summary className="cursor-pointer font-medium">Detail Error</summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </button>
              <button
                onClick={() => window.location.replace('/dashboard')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
