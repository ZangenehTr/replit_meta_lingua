import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { ErrorHandler } from "./error-handler";
import { installWebRTCErrorHandler } from "./lib/webrtc-error-handler";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onRegisteredSW(_url: string) {
    console.info("[PWA] Service Worker registered.");
  },
  onOfflineReady() {
    console.info("[PWA] App ready for offline use.");
  },
  onNeedRefresh() {
    console.info("[PWA] New SW version available.");
  },
  onRegisterError(error: unknown) {
    console.warn("[PWA] SW registration failed:", error);
  },
});

// Show startup errors visibly in production
const showStartupError = (error: Error | string) => {
  const container = document.getElementById("root");
  if (container) {
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 20px;">
        <div style="max-width: 500px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 24px;">
          <h2 style="color: #dc2626; font-size: 1.25rem; font-weight: 600; margin-bottom: 16px;">Application Error</h2>
          <p style="color: #4b5563; margin-bottom: 16px;">The application encountered an error during startup.</p>
          <pre style="background: #f9fafb; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 0.875rem; color: #374151;">${typeof error === 'string' ? error : error.message || 'Unknown error'}</pre>
          <button onclick="window.location.reload()" style="margin-top: 16px; width: 100%; background: #2563eb; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
  console.error('Startup error:', error);
};

try {
  // Install WebRTC error handler first (before any other handlers)
  installWebRTCErrorHandler();

  // Initialize error handling
  ErrorHandler.init();
} catch (error) {
  showStartupError(error as Error);
  throw error;
}

// Enhanced global error handlers
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason?.toString() || '';
  
  // Handle WebRTC errors silently
  if (message.includes('addIceCandidate') || 
      message.includes('setRemoteDescription') ||
      message.includes('RTCPeerConnection') ||
      message.includes('Called in wrong state')) {
    event.preventDefault();
    console.info('WebRTC timing issue (expected):', message);
    return;
  }
  
  console.error('Unhandled promise rejection:', event.reason);

  // Handle specific error types gracefully
  if (event.reason?.message?.includes('Failed to fetch') || 
      event.reason?.name === 'TypeError' ||
      event.reason?.message?.includes('Network request failed')) {
    console.warn('Network error handled gracefully');
  }

  // Prevent default handling that might crash the app
  event.preventDefault();
}, true); // Use capture phase

window.addEventListener('error', (event) => {
  const message = event.error?.message || event.message || '';
  
  // Handle WebRTC errors silently
  if (message.includes('addIceCandidate') || 
      message.includes('setRemoteDescription') ||
      message.includes('RTCPeerConnection')) {
    event.preventDefault();
    console.info('WebRTC error (expected):', message);
    return;
  }
  
  console.error('Global error:', event.error);

  // Handle specific error types gracefully
  if (event.error?.message?.includes('ResizeObserver loop limit exceeded') ||
      event.error?.message?.includes('Non-Error promise rejection captured')) {
    console.warn('Benign error handled gracefully');
  }

  // Prevent default handling that might crash the app
  event.preventDefault();
}, true); // Use capture phase

// React error boundary fallback
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-4">The application encountered an error. Please refresh the page.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

const container = document.getElementById("root");
if (!container) {
  showStartupError("Root element not found");
  throw new Error("Root element not found");
}

let root: ReturnType<typeof createRoot>;
try {
  root = createRoot(container);
} catch (error) {
  showStartupError(error as Error);
  throw error;
}

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  try {
    root.render(<ErrorFallback error={error as Error} />);
  } catch (fallbackError) {
    showStartupError(error as Error);
  }
}