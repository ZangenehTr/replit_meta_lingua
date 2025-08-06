# Self-Hosted TURN Server Setup for Meta Lingua

## Overview
Meta Lingua's Callern video calling system requires a TURN server for WebRTC connections when users are behind NAT or firewalls. This guide explains how to set up your own TURN server for complete self-hosting.

## Why TURN Server is Needed
- WebRTC peer-to-peer connections may fail when users are behind restrictive NATs or firewalls
- TURN server acts as a relay to ensure connectivity in all network conditions
- For Meta Lingua's self-hosted requirement, we use coturn (open-source TURN server)

## Installation Options

### Option 1: Local Network Only (No TURN Required)
If all users are on the same local network:
- WebRTC will work without any TURN/STUN servers
- Direct peer-to-peer connections will be established
- No additional configuration needed

### Option 2: Self-Hosted Coturn Server

#### Requirements
- Linux server (Ubuntu/Debian recommended)
- Static IP address or domain name
- Open ports: 3478 (TCP/UDP), 5349 (TCP/UDP), 49152-65535 (UDP)
- At least 1GB RAM, 2+ CPU cores recommended

#### Installation Steps

1. **Install Coturn**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install coturn

# CentOS/RHEL
sudo yum install coturn
```

2. **Configure Coturn**
Edit `/etc/turnserver.conf`:
```conf
# Basic configuration
listening-port=3478
tls-listening-port=5349
relay-ip=YOUR_SERVER_INTERNAL_IP
external-ip=YOUR_SERVER_PUBLIC_IP

# Authentication
lt-cred-mech
user=metalingua:yourSecurePassword123

# Security
fingerprint
no-cli
no-software-attribute
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255

# Performance
min-port=49152
max-port=65535
verbose

# Domain (if you have one)
realm=yourdomain.local
server-name=yourdomain.local
```

3. **Enable and Start Coturn**
```bash
# Enable coturn
sudo sed -i 's/#TURNSERVER_ENABLED/TURNSERVER_ENABLED/' /etc/default/coturn

# Start the service
sudo systemctl enable coturn
sudo systemctl start coturn

# Check status
sudo systemctl status coturn
```

4. **Configure Firewall**
```bash
# Open required ports
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp
```

## Integration with Meta Lingua

Update the WebRTC service configuration in `client/src/services/webrtc-service.ts`:

```typescript
const iceServers: RTCIceServer[] = [
  {
    urls: 'turn:your-server.local:3478',
    username: 'metalingua',
    credential: 'yourSecurePassword123',
  },
  {
    urls: 'turn:your-server.local:3478?transport=tcp',
    username: 'metalingua',
    credential: 'yourSecurePassword123',
  }
];
```

## Testing Your TURN Server

1. **Test with turnutils**
```bash
turnutils_uclient -v -u metalingua -w yourSecurePassword123 your-server.local
```

2. **Test from browser console**
```javascript
const pc = new RTCPeerConnection({
  iceServers: [{
    urls: 'turn:your-server.local:3478',
    username: 'metalingua',
    credential: 'yourSecurePassword123'
  }]
});

pc.createDataChannel('test');
pc.createOffer().then(offer => pc.setLocalDescription(offer));
pc.onicecandidate = (e) => {
  if (e.candidate && e.candidate.candidate.includes('relay')) {
    console.log('TURN server working!', e.candidate);
  }
};
```

## Security Best Practices

1. **Use Strong Credentials**
   - Generate random passwords: `openssl rand -hex 32`
   - Rotate credentials regularly

2. **Network Security**
   - Use firewall rules to restrict access
   - Consider VPN for additional security
   - Monitor server logs regularly

3. **SSL/TLS Configuration**
   - Generate SSL certificates for TLS connections
   - Use Let's Encrypt for free certificates if you have a domain

## Monitoring and Maintenance

1. **Check TURN server logs**
```bash
sudo journalctl -u coturn -f
```

2. **Monitor usage**
```bash
sudo turnserver -v
```

3. **Regular updates**
```bash
sudo apt-get update && sudo apt-get upgrade coturn
```

## Troubleshooting

### Common Issues

1. **Connection fails**
   - Check firewall rules
   - Verify TURN credentials
   - Ensure ports are open

2. **High latency**
   - Check server resources (CPU, RAM, bandwidth)
   - Consider deploying multiple TURN servers

3. **Authentication errors**
   - Verify username/password format
   - Check realm configuration

## Alternative: Docker Deployment

For easier deployment, use Docker:

```yaml
# docker-compose.yml
version: '3'
services:
  coturn:
    image: coturn/coturn:latest
    network_mode: host
    volumes:
      - ./turnserver.conf:/etc/coturn/turnserver.conf
    restart: unless-stopped
```

## Support

For Meta Lingua specific configuration:
- Check the main documentation in `/README.md`
- Review WebRTC service logs in browser console
- Contact your system administrator for network configuration

## Notes for Iranian Deployment

- All components are self-hosted within Iran
- No dependency on external services
- Works with local network infrastructure
- Compatible with Iranian ISP configurations