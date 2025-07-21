// Global error handler to prevent runtime error plugin interference
export function setupErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.debug('Unhandled promise rejection caught:', event.reason);
    
    // Prevent runtime error plugin from showing for network/timeout issues
    if (event.reason && typeof event.reason === 'string') {
      if (event.reason.includes('timeout') || 
          event.reason.includes('abort') || 
          event.reason.includes('Request timeout') ||
          event.reason.includes('fetch')) {
        event.preventDefault();
        return;
      }
    }
    
    // Handle Error objects
    if (event.reason instanceof Error) {
      if (event.reason.message.includes('timeout') ||
          event.reason.message.includes('abort') ||
          event.reason.message.includes('fetch') ||
          event.reason.name === 'AbortError') {
        event.preventDefault();
        return;
      }
    }
  });

  // Handle regular errors
  window.addEventListener('error', (event) => {
    console.debug('Unhandled error caught:', event.error);
    
    if (event.error && event.error.message) {
      if (event.error.message.includes('timeout') ||
          event.error.message.includes('abort') ||
          event.error.message.includes('fetch') ||
          event.error.name === 'AbortError') {
        event.preventDefault();
        return;
      }
    }
  });
}