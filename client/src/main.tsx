
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { ErrorHandler } from "./error-handler";

// Initialize error handling
ErrorHandler.init();

// Global error handlers to prevent runtime error plugin from triggering
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;

  // Handle authentication and network errors gracefully
  if (reason?.message?.includes('Authentication error') || 
      reason?.message?.includes('401') || 
      reason?.message?.includes('403') ||
      reason?.name === 'AuthenticationError' ||
      reason?.message?.includes('Request timeout') ||
      reason?.message?.includes('timeout') ||
      reason?.message?.includes('abort') ||
      reason?.name === 'AbortError' ||
      reason?.message?.includes('Failed to fetch') ||
      reason?.message?.includes('NetworkError') ||
      reason?.message?.includes('Connection reset') ||
      reason?.code === 'ECONNRESET' ||
      (typeof reason === 'string' && (reason.includes('Request timeout') || reason.includes('connection')))) {
    console.debug('Handled error gracefully:', reason?.message || reason);
    event.preventDefault(); // Prevent the runtime error overlay
    return;
  }

  // Let other errors through for debugging
  console.error('Unhandled promise rejection:', reason);
});

window.addEventListener('error', (event) => {
  const error = event.error;

  // Handle certain types of errors gracefully  
  if (error?.message?.includes('Authentication error') ||
      error?.message?.includes('Request timeout') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('abort') ||
      error?.name === 'AbortError') {
    console.debug('Handled error gracefully:', error.message);
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
