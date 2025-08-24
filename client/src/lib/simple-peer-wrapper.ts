// SimplePeer wrapper with browser polyfills
// @ts-nocheck

// Provide browser-compatible polyfills BEFORE importing SimplePeer
if (typeof window !== 'undefined') {
  // Polyfill for process
  if (!window.process) {
    window.process = {
      env: {},
      nextTick: (callback) => Promise.resolve().then(callback),
      version: 'v16.0.0',
      versions: {},
      on: () => {},
      addListener: () => {},
      once: () => {},
      off: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      emit: () => {},
      binding: () => {},
      cwd: () => '/',
      chdir: () => {},
      umask: () => 0,
    };
  }

  // Polyfill for global
  if (!window.global) {
    window.global = window;
  }

  // Polyfill for Buffer
  if (!window.Buffer) {
    window.Buffer = {
      isBuffer: () => false,
      alloc: (size) => new Uint8Array(size),
      from: (data) => {
        if (typeof data === 'string') {
          return new TextEncoder().encode(data);
        }
        return new Uint8Array(data);
      },
      concat: (chunks) => {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        return result;
      },
    };
  }
}

// Now import SimplePeer after polyfills are set
import SimplePeer from 'simple-peer';

// Create a safe wrapper that handles stream property access
const OriginalSimplePeer = SimplePeer;

class SafeSimplePeer extends OriginalSimplePeer {
  constructor(opts?: any) {
    super(opts);
    
    // Patch the stream property to avoid readableState errors
    if (this._pc && this._pc.addStream) {
      const originalAddStream = this._pc.addStream.bind(this._pc);
      this._pc.addStream = (stream: any) => {
        // Ensure stream has required properties
        if (stream && !stream.readableState) {
          Object.defineProperty(stream, 'readableState', {
            value: { flowing: null, ended: false },
            writable: true,
            configurable: true
          });
        }
        return originalAddStream(stream);
      };
    }
  }
  
  // Override addStream to handle missing properties
  addStream(stream: any) {
    if (stream && !stream.readableState) {
      Object.defineProperty(stream, 'readableState', {
        value: { flowing: null, ended: false },
        writable: true,
        configurable: true
      });
    }
    return super.addStream(stream);
  }
}

// Export the safe wrapper
export default SafeSimplePeer;
export type { Instance, Options, SignalData } from 'simple-peer';