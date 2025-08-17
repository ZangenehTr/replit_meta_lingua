// WebRTC Configuration with Dynamic Metered TURN Servers
// Production domain: metalingua.metered.live

// Fetch fresh TURN credentials from Metered.ca API
export const getICEServers = async () => {
  try {
    // API Key for the credential
    const apiKey = 'f3d6e866f1744312d043ffc9271c35ce8914';
    
    // Fetch TURN Server Credentials from Metered.ca API
    const response = await fetch(
      `https://metalingua.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch TURN credentials');
    }
    
    // Get the dynamic credentials
    const iceServers = await response.json();
    
    console.log('Fetched dynamic TURN credentials:', iceServers.length, 'servers');
    
    // Add Google's public STUN server as fallback
    return [
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      ...iceServers
    ];
  } catch (error) {
    console.error('Error fetching TURN credentials:', error);
    
    // Fallback to static configuration if API fails
    return [
      {
        urls: 'stun:stun.l.google.com:19302'
      },
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
  }
};

// Create webrtcConfig dynamically with fresh credentials
export const getWebRTCConfig = async () => {
  const iceServers = await getICEServers();
  
  return {
    iceServers,
    iceCandidatePoolSize: 10,
    // Additional configuration for better connectivity
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
  };
};

// Create SimplePeer configuration dynamically with fresh credentials
export const getSimplePeerConfig = async (initiator: boolean) => {
  const config = await getWebRTCConfig();
  
  return {
    initiator,
    trickle: true,
    config,
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
};