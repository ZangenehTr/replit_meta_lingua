import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Global error handlers to prevent runtime error plugin from triggering
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's an authentication error or network error we can handle gracefully
  if (event.reason?.message?.includes('Authentication error') || 
      event.reason?.message?.includes('401') || 
      event.reason?.message?.includes('403') ||
      event.reason?.name === 'AuthenticationError') {
    console.warn('Handled authentication error:', event.reason.message);
    event.preventDefault(); // Prevent the runtime error overlay
    return;
  }
  
  // Let other errors through for debugging
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  // Handle certain types of errors gracefully
  if (event.error?.message?.includes('Authentication error')) {
    console.warn('Handled authentication error:', event.error.message);
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
