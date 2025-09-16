import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { ErrorHandler } from './error-handler';
import { installWebRTCErrorHandler } from './lib/webrtc-error-handler';

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

  // Handle specific error types gracefully - only prevent default for network errors
  if (event.reason?.message?.includes('Failed to fetch') || 
      event.reason?.name === 'TypeError' ||
      event.reason?.message?.includes('Network request failed')) {
    console.warn('Network error handled gracefully');
    event.preventDefault();
  }
  
  // Let other errors surface for debugging
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

  // Handle specific error types gracefully - only prevent default for benign errors
  if (event.error?.message?.includes('ResizeObserver loop limit exceeded') ||
      event.error?.message?.includes('Non-Error promise rejection captured')) {
    console.warn('Benign error handled gracefully');
    event.preventDefault();
  }
  
  // Let other errors surface for debugging
}, true); // Use capture phase

const root = createRoot(document.getElementById('root')!);
root.render(<App />);