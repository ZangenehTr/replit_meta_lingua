FROM node:18-alpine

WORKDIR /app

# Create package.json
RUN echo '{ \
  "name": "sms-gateway-mock", \
  "version": "1.0.0", \
  "type": "module", \
  "scripts": { \
    "start": "node server.js" \
  }, \
  "dependencies": { \
    "express": "^4.18.2", \
    "body-parser": "^1.20.2" \
  } \
}' > package.json

# Install dependencies
RUN npm install

# Create the mock SMS gateway server
COPY <<'EOF' /app/server.js
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

// Store sent messages in memory for testing
const sentMessages = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sms-gateway-mock' });
});

// Send SMS endpoint (Kavenegar-like API)
app.post('/api/v1/send', (req, res) => {
  const { receptor, message, sender } = req.body;
  
  if (!receptor || !message) {
    return res.status(400).json({
      return: {
        status: 400,
        message: 'Missing required parameters'
      }
    });
  }
  
  const messageId = Date.now().toString();
  const smsRecord = {
    messageid: messageId,
    receptor,
    message,
    sender: sender || '10001000',
    date: Date.now(),
    cost: 100,
    status: 1,
    statustext: 'sent'
  };
  
  sentMessages.push(smsRecord);
  
  console.log(`[SMS Mock] Sent to ${receptor}: ${message}`);
  
  // Simulate Kavenegar response
  res.json({
    return: {
      status: 200,
      message: 'تایید شد'
    },
    entries: [smsRecord]
  });
});

// OTP Send endpoint
app.post('/api/v1/verify/lookup', (req, res) => {
  const { receptor, token, template } = req.body;
  
  if (!receptor || !token) {
    return res.status(400).json({
      return: {
        status: 400,
        message: 'Missing required parameters'
      }
    });
  }
  
  const messageId = Date.now().toString();
  const message = `Your verification code is: ${token}`;
  
  const smsRecord = {
    messageid: messageId,
    receptor,
    message,
    token,
    template: template || 'verify',
    date: Date.now(),
    cost: 100,
    status: 1,
    statustext: 'sent'
  };
  
  sentMessages.push(smsRecord);
  
  console.log(`[OTP Mock] Sent to ${receptor}: ${message}`);
  
  res.json({
    return: {
      status: 200,
      message: 'تایید شد'
    },
    entries: [smsRecord]
  });
});

// Get sent messages (for testing)
app.get('/api/messages', (req, res) => {
  res.json({
    messages: sentMessages,
    count: sentMessages.length
  });
});

// Clear messages (for testing)
app.delete('/api/messages', (req, res) => {
  sentMessages.length = 0;
  res.json({ message: 'Messages cleared' });
});

// Status endpoint
app.get('/api/v1/account/info', (req, res) => {
  res.json({
    return: {
      status: 200,
      message: 'تایید شد'
    },
    entries: {
      remaincredit: 1000000,
      expiredate: Date.now() + 365 * 24 * 60 * 60 * 1000,
      type: 'mock'
    }
  });
});

const PORT = process.env.PORT || 8090;

app.listen(PORT, () => {
  console.log(`SMS Gateway Mock running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
EOF

CMD ["npm", "start"]