# WebRTC Infrastructure Setup for CallerN (24/7 AI Video Tutoring)

## Overview

CallerN requires WebRTC for video calling between students and AI tutors. This guide covers setting up self-hosted TURN/STUN servers for optimal performance in Iran.

---

## What is TURN/STUN?

- **STUN (Session Traversal Utilities for NAT)**: Helps clients discover their public IP address
- **TURN (Traversal Using Relays around NAT)**: Relays media when direct connection is impossible

Both are **essential** for reliable video calling in restricted networks.

---

## Quick Start (5 minutes)

### 1. Install coturn (TURN/STUN Server)

```bash
sudo apt install -y coturn
```

### 2. Generate Credentials

```bash
sudo mkdir -p /etc/coturn
openssl rand -base64 32 | sudo tee /etc/coturn/static-auth-secret.txt > /dev/null
```

### 3. Configure turnserver.conf

```bash
sudo tee /etc/coturn/turnserver.conf > /dev/null << 'EOF'
# Meta Lingua TURN/STUN Configuration
listening-port=3478
listening-ip=0.0.0.0
relay-ip=YOUR_SERVER_IP

# Credentials (persistent)
user=metalingua:strong_password
realm=your-domain.com
static-auth-secret-file=/etc/coturn/static-auth-secret.txt

# Performance tuning
max-clients=500
bps-capacity=0
max-bps=0
min-port=49152
max-port=65535

# Logging
log-file=/var/log/coturn/turnserver.log
verbosity=0

# Security
fingerprint
lt-cred-mech
no-multicast-peers
cipher-list=HIGH
EOF

sudo systemctl restart coturn
```

### 4. Test TURN Server

```bash
# Test if TURN is accessible
timeout 5 bash -c 'exec 3<>/dev/tcp/YOUR_SERVER_IP/3478' && echo "✓ TURN server reachable" || echo "✗ TURN server unreachable"
```

---

## Application Configuration

### Add to .env or Environment Variables

```bash
# WebRTC Configuration
WEBRTC_TURN_SERVER=turn:your-domain.com:3478
WEBRTC_TURN_USERNAME=metalingua
WEBRTC_TURN_PASSWORD=strong_password
WEBRTC_STUN_SERVER=stun:your-domain.com:3478
WEBRTC_ICE_SERVERS=stun:your-domain.com:3478,turn:your-domain.com:3478
```

### Frontend Integration (React)

```typescript
// src/config/webrtc.ts
export const rtcConfiguration = {
  iceServers: [
    {
      urls: ['stun:your-domain.com:3478']
    },
    {
      urls: ['turn:your-domain.com:3478'],
      username: 'metalingua',
      credential: 'strong_password'
    }
  ]
};

// Usage in PeerConnection
const peerConnection = new RTCPeerConnection({
  iceServers: rtcConfiguration.iceServers
});
```

---

## Performance Optimization

### 1. Increase Maximum Connections

```bash
# Edit systemd service
sudo systemctl edit coturn

[Service]
LimitNOFILE=1000000
LimitNPROC=unlimited
```

### 2. Kernel Tuning

```bash
sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'
# Network performance
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864
net.ipv4.udp_mem=3121242 4161656 6242484

# Increase connection limit
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
EOF

sudo sysctl -p
```

### 3. Monitoring Resource Usage

```bash
# Monitor TURN server in real-time
watch -n 1 'ss -tulpn | grep 3478'

# Monitor CPU and memory
top -p $(pgrep -f turnserver)
```

---

## Troubleshooting

### Issue: "No TURN server reachable"

**Solution:**
```bash
# 1. Check if coturn is running
sudo systemctl status coturn

# 2. Check port binding
sudo netstat -tulpn | grep 3478

# 3. Check firewall
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp

# 4. Test with stunclient
sudo apt install -y stunclient
stunclient your-domain.com 3478
```

### Issue: "Poor video quality during calls"

**Solutions:**
- Increase bandwidth: Adjust `bps-capacity` in turnserver.conf
- Enable UDP: Ensure UDP 3478 is not blocked
- Reduce media bitrate in frontend
- Check server CPU usage

### Issue: "Connection drops frequently"

**Solutions:**
```bash
# Enable connection keep-alive
sudo tee -a /etc/coturn/turnserver.conf > /dev/null << 'EOF'
external-ip=YOUR_PUBLIC_IP
user-quota=0
total-quota=0
EOF

sudo systemctl restart coturn
```

---

## Production Checklist

- [ ] TURN server is on separate machine or service
- [ ] Credentials are strong and rotated regularly
- [ ] Firewall allows UDP 3478 and TCP 3478
- [ ] Media ports (49152-65535) are open for UDP
- [ ] TURN server hostname resolves correctly
- [ ] SSL certificates are valid (for TLS/DTLS)
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] Performance tested with 100+ concurrent calls

---

## Advanced Configuration

### Multi-Region Setup (Optional)

For multiple data centers:

```bash
# Region 1 (Tehran)
external-ip=IP_TEHRAN

# Region 2 (Isfahan)
external-ip=IP_ISFAHAN

# Load balance with DNS
# turn.metalingua.ir -> round-robin to multiple IPs
```

### TLS/DTLS Encryption (Recommended)

```bash
# Generate certificates
openssl req -new -x509 -days 365 -nodes -out /etc/coturn/coturn.crt -keyout /etc/coturn/coturn.key

# Add to turnserver.conf
cert=/etc/coturn/coturn.crt
pkey=/etc/coturn/coturn.key
```

---

## Performance Metrics

Expected performance on standard 4-core server:

| Metric | Value |
|--------|-------|
| Max Concurrent Calls | 500+ |
| Bandwidth per Call | 1-5 Mbps |
| CPU Usage (50 calls) | ~15% |
| RAM Usage (50 calls) | ~200MB |
| Latency | <50ms (local) |

---

## Documentation References

- **coturn**: http://coturn.net/
- **WebRTC**: https://webrtc.org/
- **TURN Protocol**: https://tools.ietf.org/html/rfc5766

---

**Your CallerN video infrastructure is now ready! 🎥**
