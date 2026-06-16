import { createRoot } from 'react-dom/client'
import { AppProvider } from './store/supabase-store'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Toaster } from 'sonner'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AppProvider>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={3000}
        />
      </BrowserRouter>
    </AppProvider>
  </ErrorBoundary>
)