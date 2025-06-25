import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDarkMode } from './lib/dark-mode'
import { NetworkProvider } from './contexts/NetworkContext'

// Initialize dark mode before rendering
initDarkMode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkProvider>
      <App />
    </NetworkProvider>
  </StrictMode>,
)
