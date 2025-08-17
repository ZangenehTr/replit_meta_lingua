// WebRTC Configuration with Metered TURN Servers
// Production domain: metalingua.metered.live
export const getICEServers = () => {
  return [
    // Google's public STUN server
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    // Metered TURN servers - Production (metalingua.metered.live)
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'metalingua',
      credential: 'g6qOeKd-yYFCnlLV2SF5MyQzYwVpPeDcWMkzTNKFBuRsCfI_'
    },
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'metalingua',
      credential: 'g6qOeKd-yYFCnlLV2SF5MyQzYwVpPeDcWMkzTNKFBuRsCfI_'
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'metalingua',
      credential: 'g6qOeKd-yYFCnlLV2SF5MyQzYwVpPeDcWMkzTNKFBuRsCfI_'
    },
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'metalingua',
      credential: 'g6qOeKd-yYFCnlLV2SF5MyQzYwVpPeDcWMkzTNKFBuRsCfI_'
    }
  ];
};

export const webrtcConfig = {
  iceServers: getICEServers(),
  iceCandidatePoolSize: 10,
  // Additional configuration for better connectivity
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
};

// SimplePeer configuration
export const simplePeerConfig = {
  initiator: false, // Will be set dynamically
  trickle: true,
  config: webrtcConfig,
  constraints: {
    video: {
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 }
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }
};