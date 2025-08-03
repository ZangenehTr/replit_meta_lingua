
// Global error handler for the application
export class ErrorHandler {
  static init() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent default browser behavior
      event.preventDefault();
      
      // Log to console for debugging
      if (event.reason?.message) {
        console.error('Error message:', event.reason.message);
      }
      
      // Optionally show user-friendly error
      if (event.reason?.message?.includes('Failed to fetch')) {
        console.warn('Network error detected - check internet connection');
      }
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });

    // Handle React errors (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Error handler initialized for development');
    }
  }

  static logError(error: Error, context?: string) {
    console.error(`[${context || 'App'}] Error:`, error);
  }
}
