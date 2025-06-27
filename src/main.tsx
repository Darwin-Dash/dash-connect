import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDarkMode } from './lib/dark-mode'
import { NetworkProvider } from './contexts/NetworkContext'
import { enableMockExtension } from './lib/mock-extension-sdk'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize dark mode before rendering
if (typeof initDarkMode === 'function') {
  initDarkMode()
} else {
  console.error('initDarkMode is not a function:', typeof initDarkMode, initDarkMode)
}

// Global function for E2E tests to initialize mock extension
(window as any).__initMockExtension = () => {
  if ((window as any).__mockExtensionEnabled) return; // Already initialized
  
  console.log('[E2E] Initializing mock extension from test');
  (window as any).__mockExtensionEnabled = true;
  
  enableMockExtension({
    autoApprove: true,
    approvalDelay: 500, // Shorter delay for tests
    identityBalance: 1000000000000n
  });
  
  // Reinitialize dash service immediately
  setTimeout(async () => {
    const { dashService } = await import('./lib/dash-service');
    dashService.reinitializeExtensionSDK();
  }, 100);
};

// Enable mock extension in development if requested
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_EXTENSION === 'true') {
  try {
    console.log('[Mock Extension] Mode enabled - will initialize after DOM ready');
    
    // Mark mock mode immediately
    (window as any).__mockExtensionEnabled = true;
    
    // Set up mock extension after a short delay to avoid conflicts
    setTimeout(async () => {
      try {
        console.log('[Mock Extension] Initializing...');
        
        // Debug what's on window before we start
        console.log('[Mock Extension] Current window.dashPlatformSDK:', {
          exists: 'dashPlatformSDK' in window,
          type: typeof (window as any).dashPlatformSDK,
          value: (window as any).dashPlatformSDK
        });
        
        enableMockExtension({
          autoApprove: true,
          approvalDelay: 1500, // Simulate popup delay
          identityBalance: 1000000000000n // Plenty of credits for testing
        });
        
        // Reinitialize dash service after mock is set up
        setTimeout(async () => {
          console.log('[Mock Extension] Reinitializing dash service');
          const { dashService } = await import('./lib/dash-service');
          dashService.reinitializeExtensionSDK();
        }, 300);
        
      } catch (error) {
        console.error('[Mock Extension] Failed to initialize:', error);
      }
    }, 100);
  } catch (error) {
    console.error('[Mock Extension] Setup error:', error);
  }
}

// Wrap app in error boundary to prevent black screens
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <NetworkProvider>
          <App />
        </NetworkProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
} else {
  console.error('Root element not found');
}