import '@testing-library/jest-dom'

// Mock window.dashPlatformSDK for tests
Object.defineProperty(window, 'dashPlatformSDK', {
  value: undefined,
  writable: true,
  configurable: true
})