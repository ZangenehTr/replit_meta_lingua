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

// Export SimplePeer with polyfills applied
export default SimplePeer;
export type { Instance, Options, SignalData } from 'simple-peer';