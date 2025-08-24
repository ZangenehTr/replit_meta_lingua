// Safe wrapper for SimplePeer that handles promise rejections
import SimplePeer from './simple-peer-wrapper';

export class SafePeer {
  private peer: any;
  public destroyed = false;
  
  constructor(opts?: any) {
    this.peer = new SimplePeer(opts);
    
    // Patch the internal peer connection to handle promise rejections
    const originalSignal = this.peer.signal.bind(this.peer);
    this.peer.signal = (data: any) => {
      if (this.destroyed) {
        console.log('Peer destroyed, ignoring signal');
        return;
      }
      
      // Handle the signal in a promise-safe way
      Promise.resolve().then(() => {
        try {
          originalSignal(data);
        } catch (error) {
          console.error('Sync error in signal:', error);
        }
      }).catch((error) => {
        console.error('Async error in signal:', error);
      });
    };
    
    // Patch internal WebRTC methods to handle promise rejections
    const pc = (this.peer as any)._pc;
    if (pc) {
      this.patchPeerConnection(pc);
    }
    
    // Also patch when PC is created later
    const self = this;
    Object.defineProperty(this.peer, '_pc', {
      get: function() {
        return this.__pc;
      },
      set: function(value) {
        this.__pc = value;
        if (value) {
          self.patchPeerConnection(value);
        }
      }
    });
  }
  
  private patchPeerConnection(pc: RTCPeerConnection) {
    // Patch setRemoteDescription to handle promise rejections
    const originalSetRemoteDescription = pc.setRemoteDescription.bind(pc);
    pc.setRemoteDescription = (desc: RTCSessionDescriptionInit) => {
      return originalSetRemoteDescription(desc).catch((error: any) => {
        console.error('Error setting remote description:', error);
        // Don't re-throw, just log
      });
    };
    
    // Patch addIceCandidate to handle promise rejections
    const originalAddIceCandidate = pc.addIceCandidate.bind(pc);
    pc.addIceCandidate = (candidate: RTCIceCandidateInit | undefined) => {
      if (!candidate) {
        return Promise.resolve();
      }
      
      // Check signaling state before adding
      if (pc.signalingState === 'closed') {
        console.log('PC closed, not adding ICE candidate');
        return Promise.resolve();
      }
      
      // Check if we have remote description
      if (!pc.remoteDescription) {
        console.log('No remote description yet, not adding ICE candidate');
        return Promise.resolve();
      }
      
      return originalAddIceCandidate(candidate).catch((error: any) => {
        // Log but don't throw - ICE failures are often transient
        console.warn('Error adding ICE candidate (non-fatal):', error?.message || error);
      });
    };
  }
  
  // Proxy all methods to the underlying peer
  signal(data: any) {
    this.peer.signal(data);
  }
  
  destroy() {
    this.destroyed = true;
    this.peer.destroy();
  }
  
  send(data: any) {
    this.peer.send(data);
  }
  
  addStream(stream: MediaStream) {
    this.peer.addStream(stream);
  }
  
  removeStream(stream: MediaStream) {
    this.peer.removeStream(stream);
  }
  
  on(event: string, handler: Function) {
    this.peer.on(event, handler);
  }
  
  off(event: string, handler: Function) {
    this.peer.off(event, handler);
  }
  
  get connected() {
    return (this.peer as any).connected;
  }
  
  get _pc() {
    return (this.peer as any)._pc;
  }
  
  replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream) {
    if ((this.peer as any).replaceTrack) {
      return (this.peer as any).replaceTrack(oldTrack, newTrack, stream);
    }
  }
}

export default SafePeer;