import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { ErrorHandler } from "./error-handler";
import { installWebRTCErrorHandler } from "./lib/webrtc-error-handler";

// Install WebRTC error handler first (before any other handlers)
installWebRTCErrorHandler();

// Initialize error handling
ErrorHandler.init();

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
  throw new Error("Root element not found");
}

const root = createRoot(container);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  root.render(<ErrorFallback error={error as Error} />);
}