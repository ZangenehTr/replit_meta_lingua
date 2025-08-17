// WebRTC Configuration with Metered TURN Servers
export const getICEServers = () => {
  return [
    // Google's public STUN server
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    // Metered TURN servers (Global)
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65c5e48a3edc8afdb679',
      credential: 'GV9gJZLb6XR5WqBP'
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'e8dd65c5e48a3edc8afdb679',
      credential: 'GV9gJZLb6XR5WqBP'
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65c5e48a3edc8afdb679',
      credential: 'GV9gJZLb6XR5WqBP'
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65c5e48a3edc8afdb679',
      credential: 'GV9gJZLb6XR5WqBP'
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