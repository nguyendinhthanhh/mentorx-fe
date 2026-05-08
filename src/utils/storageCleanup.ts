
/**
 * Clears invalid or corrupted auth storage to prevent JSON parsing errors
 */
export function clearInvalidAuthStorage() {
  try {
    const authStorage = localStorage.getItem('auth-storage')

    if (!authStorage) return

    if (authStorage === 'undefined' || authStorage === 'null') {
      localStorage.removeItem('auth-storage')
      return
    }

    // Attempt to parse to see if it's valid JSON
    const parsed = JSON.parse(authStorage)
    
    // Check if the structure is what we expect from zustand persist
    // It should have a 'state' property
    if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) {
      localStorage.removeItem('auth-storage')
      return
    }

    const state = parsed.state
    
    // Further validate tokens in state if they exist
    if (state) {
      if (
        state.accessToken === 'undefined' || 
        state.accessToken === 'null' ||
        state.refreshToken === 'undefined' ||
        state.refreshToken === 'null'
      ) {
        localStorage.removeItem('auth-storage')
      }
    }
  } catch (e) {
    // If parsing fails, it's definitely invalid
    console.warn('Removing invalid auth-storage due to parsing error')
    localStorage.removeItem('auth-storage')
  }
}

// Execute immediately when this file is imported
clearInvalidAuthStorage()
