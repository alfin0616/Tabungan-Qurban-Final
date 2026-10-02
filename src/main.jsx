import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import AppToaster from './components/AppToaster'
import { initGlobalErrorLogging } from './repositories/loggerRepository'
import App from './App.jsx'
import './index.css'

// Inisialisasi tangkapan unhandled window error & promise rejection (Modul 11)
initGlobalErrorLogging()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 menit data dianggap fresh (tidak fetch ulang saat ganti tab/page)
      gcTime: 1000 * 60 * 60 * 24, // 24 jam cache disimpan di memori & storage
      refetchOnWindowFocus: false, // Hindari request berlebih saat fokus jendela browser
      refetchOnReconnect: true, // Otomatis sync data terbaru saat koneksi internet kembali online
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'SIQURBAN_OFFLINE_CACHE_V1',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
        >
          <ThemeProvider>
            <AuthProvider>
              <App />
              <AppToaster />
            </AuthProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

