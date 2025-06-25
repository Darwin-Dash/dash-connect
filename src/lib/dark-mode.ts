export function initDarkMode() {
  // Check if user prefers dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  // Apply dark class based on system preference
  if (prefersDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  
  // Listen for changes in system preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })
}