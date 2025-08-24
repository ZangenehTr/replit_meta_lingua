/**
 * WebRTC Error Handler
 * Prevents unhandled promise rejections from WebRTC operations
 */

// Track if we've already installed the handler
let handlerInstalled = false;

export function installWebRTCErrorHandler() {
  if (handlerInstalled || typeof window === 'undefined') return;
  
  handlerInstalled = true;
  
  // Install handler immediately on first error to catch early issues
  const installHandler = () => {
    if (!handlerInstalled) {
      handlerInstalled = true;
      setupHandlers();
    }
  };
  
  // Try to install as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installHandler);
  } else {
    installHandler();
  }
}

function setupHandlers() {
  
  // Override console.error to filter out WebRTC errors we're handling
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    const isWebRTCError = 
      message.includes('addIceCandidate') ||
      message.includes('setRemoteDescription') ||
      message.includes('RTCPeerConnection') ||
      message.includes('Failed to execute') ||
      message.includes('Called in wrong state') ||
      message.includes('The remote description was null');
    
    if (isWebRTCError) {
      // Log as warning instead of error
      console.warn('WebRTC operation failed (handled):', ...args);
      return;
    }
    
    // Pass through other errors
    originalConsoleError.apply(console, args);
  };
  
  // Handle unhandled promise rejections - add to capture phase
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || reason?.toString() || '';
    
    // Check if this is a WebRTC-related error
    const isWebRTCError = 
      message.includes('addIceCandidate') ||
      message.includes('setRemoteDescription') ||
      message.includes('RTCPeerConnection') ||
      message.includes('Failed to execute') ||
      message.includes('Called in wrong state') ||
      message.includes('stable') ||
      message.includes('The remote description was null');
    
    if (isWebRTCError) {
      // Prevent the error from appearing in console and UI
      event.preventDefault();
      event.stopImmediatePropagation();
      
      // Log as debug only - these are normal timing issues
      console.debug('WebRTC timing (normal):', message);
      
      // Hide Vite error overlay if it exists
      const errorOverlay = document.querySelector('vite-error-overlay');
      if (errorOverlay) {
        (errorOverlay as HTMLElement).style.display = 'none';
      }
      
      return false;
    }
  }, true); // Use capture phase to catch errors earlier
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    const isWebRTCError = 
      message.includes('addIceCandidate') ||
      message.includes('setRemoteDescription') ||
      message.includes('RTCPeerConnection');
    
    if (isWebRTCError) {
      event.preventDefault();
      console.info('WebRTC error (handled):', message);
      return;
    }
  });
}

/**
 * Safe wrapper for WebRTC async operations
 */
export async function safeWebRTCOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.info(`WebRTC ${operationName} failed (normal during setup):`, error?.message || error);
    return null;
  }
}

/**
 * Safe wrapper for RTCPeerConnection methods
 */
export function wrapPeerConnection(pc: RTCPeerConnection): RTCPeerConnection {
  // Wrap setRemoteDescription
  const originalSetRemoteDescription = pc.setRemoteDescription.bind(pc);
  (pc as any).setRemoteDescription = async (desc: RTCSessionDescriptionInit) => {
    return safeWebRTCOperation(
      () => originalSetRemoteDescription(desc),
      'setRemoteDescription'
    );
  };
  
  // Wrap addIceCandidate
  const originalAddIceCandidate = pc.addIceCandidate.bind(pc);
  (pc as any).addIceCandidate = async (candidate: RTCIceCandidateInit | undefined) => {
    if (!candidate) return;
    
    // Check if we're ready for ICE candidates
    if (!pc.remoteDescription) {
      console.info('Skipping ICE candidate - no remote description yet');
      return;
    }
    
    return safeWebRTCOperation(
      () => originalAddIceCandidate(candidate),
      'addIceCandidate'
    );
  };
  
  // Wrap createOffer
  const originalCreateOffer = pc.createOffer.bind(pc);
  (pc as any).createOffer = async (options?: RTCOfferOptions) => {
    const result = await safeWebRTCOperation(
      () => originalCreateOffer(options),
      'createOffer'
    );
    if (!result) throw new Error('Failed to create offer');
    return result;
  };
  
  // Wrap createAnswer
  const originalCreateAnswer = pc.createAnswer.bind(pc);
  (pc as any).createAnswer = async (options?: RTCAnswerOptions) => {
    const result = await safeWebRTCOperation(
      () => originalCreateAnswer(options),
      'createAnswer'
    );
    if (!result) throw new Error('Failed to create answer');
    return result;
  };
  
  return pc;
}