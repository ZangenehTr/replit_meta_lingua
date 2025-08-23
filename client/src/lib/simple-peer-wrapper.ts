// SimplePeer wrapper with browser polyfills
import SimplePeer from 'simple-peer';

// Provide browser-compatible polyfills
if (typeof window !== 'undefined' && !window.process) {
  // @ts-ignore
  window.process = {
    env: {},
    nextTick: (callback: Function) => setTimeout(callback, 0),
  };
}

if (typeof window !== 'undefined' && !window.global) {
  // @ts-ignore
  window.global = window;
}

// Export SimplePeer with polyfills applied
export default SimplePeer;
export type { Instance, Options, SignalData } from 'simple-peer';