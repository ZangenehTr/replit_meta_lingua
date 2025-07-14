// WebRTC Configuration for Meta Lingua Platform
// Supports both free public STUN servers and self-hosted TURN servers

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

// Production-ready WebRTC configuration
export const getWebRTCConfig = (): WebRTCConfig => {
  const useCustomTurnServer = process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD;
  
  if (useCustomTurnServer) {
    // Self-hosted TURN server configuration
    return {
      iceServers: [
        // Free public STUN servers (always include these)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        
        // Your self-hosted TURN server
        {
          urls: process.env.TURN_SERVER_URL!, // e.g., 'turn:your-server.com:3478'
          username: process.env.TURN_USERNAME!,
          credential: process.env.TURN_PASSWORD!
        }
      ]
    };
  } else {
    // Free public servers configuration (sufficient for most deployments)
    return {
      iceServers: [
        // Google's free STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Mozilla's free STUN servers
        { urls: 'stun:stun.services.mozilla.com' },
        
        // OpenRelay free TURN servers (limited but functional)
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject', 
          credential: 'openrelayproject'
        }
      ]
    };
  }
};

// API endpoint to provide WebRTC configuration to clients
export const webrtcConfigEndpoint = (req: any, res: any) => {
  try {
    const config = getWebRTCConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting WebRTC config:', error);
    res.status(500).json({ message: 'Failed to get WebRTC configuration' });
  }
};

// Self-hosting TURN server setup instructions
export const TURN_SERVER_SETUP_GUIDE = `
# Self-Hosted TURN Server Setup (Optional)

## Option 1: Use Free Public Servers (Recommended for Start)
- Already configured in Meta Lingua
- Works for most deployments
- No additional setup required

## Option 2: Install CoTURN (Self-Hosted)

### Ubuntu/CentOS Installation:
sudo apt update && sudo apt install coturn -y
# or
sudo yum install coturn -y

### Configuration (/etc/turnserver.conf):
listening-port=3478
tls-listening-port=5349
relay-ip=YOUR_SERVER_IP
external-ip=YOUR_PUBLIC_IP
realm=metalingua.com
server-name=metalingua.com
fingerprint
use-auth-secret
static-auth-secret=YOUR_SHARED_SECRET
total-quota=100
stale-nonce=600
cert=/path/to/ssl/cert.pem
pkey=/path/to/ssl/private.key

### Environment Variables:
TURN_SERVER_URL=turn:your-server.com:3478
TURN_USERNAME=metalingua
TURN_PASSWORD=your-secure-password

### Firewall Rules:
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp

## Option 3: Managed TURN Service
- Twilio STUN/TURN
- Xirsys
- Metered.ca

## Cost Comparison:
- Free Public: $0/month (sufficient for small-medium deployments)
- Self-hosted CoTURN: $5-20/month (VPS cost)
- Managed Service: $50-200/month (enterprise grade)
`;