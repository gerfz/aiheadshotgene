/**
 * Auth Ready Service
 * 
 * Provides a global promise that resolves when the Supabase auth session
 * is confirmed. All authenticated API calls should await this before
 * attempting to get tokens.
 * 
 * This prevents the race condition where API calls fire before
 * the auth session is restored (causing "Missing authorization header" errors).
 */

let _resolveAuthReady: () => void;
let _isAuthReady = false;
let _authReadyTimeout: ReturnType<typeof setTimeout> | null = null;

// Promise that resolves when auth session is confirmed
export const authReadyPromise = new Promise<void>((resolve) => {
  _resolveAuthReady = resolve;
});

/**
 * Call this ONCE when the Supabase session is confirmed in _layout.tsx
 * After this, all API calls waiting on authReadyPromise will proceed
 */
export function setAuthReady() {
  if (!_isAuthReady) {
    _isAuthReady = true;
    if (_authReadyTimeout) {
      clearTimeout(_authReadyTimeout);
      _authReadyTimeout = null;
    }
    console.log('✅ Auth ready - all API calls can proceed');
    _resolveAuthReady();
  }
}

/**
 * Check if auth is ready (non-blocking)
 */
export function isAuthReady(): boolean {
  return _isAuthReady;
}

/**
 * Wait for auth to be ready with a timeout
 * Returns true if auth is ready, false if timed out
 */
export async function waitForAuth(timeoutMs: number = 15000): Promise<boolean> {
  if (_isAuthReady) return true;
  
  return Promise.race([
    authReadyPromise.then(() => true),
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        if (!_isAuthReady) {
          console.warn(`⚠️ Auth not ready after ${timeoutMs}ms timeout`);
        }
        resolve(_isAuthReady);
      }, timeoutMs);
    }),
  ]);
}

/**
 * Reset auth state (for logout/session expiry)
 */
export function resetAuthReady() {
  _isAuthReady = false;
  // Note: We can't re-create the promise after it's resolved,
  // but in practice the app restarts on logout
  console.log('🔄 Auth ready state reset');
}
