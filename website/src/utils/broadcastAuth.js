export function setupAuthBroadcast(auth) {
  // Listen for auth state changes from Better Auth
  auth.onAuthStateChange((user, session) => {
    // Broadcast to any extensions listening
    if (window.postMessage) {
      window.postMessage({
        type: 'AUTH_STATE_CHANGED',
        authState: {
          isAuthenticated: !!user,
          user: user,
          session: session
        }
      }, window.location.origin);
    }
  });
}