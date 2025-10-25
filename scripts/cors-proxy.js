const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Your Home Assistant configuration
const HA_BASE_URL = 'http://192.168.100.60:8123';

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    proxy_target: HA_BASE_URL 
  });
});

// Test endpoint to verify proxy setup
app.get('/test', async (req, res) => {
  try {
    const response = await fetch(`${HA_BASE_URL}/api/`, {
      headers: {
        'Authorization': req.headers.authorization || '',
      }
    });
    const data = await response.text();
    res.json({
      status: response.status,
      statusText: response.statusText,
      data: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple proxy for /ha-api routes
app.use('/ha-api', (req, res) => {
  // Remove /ha-api prefix and add /api prefix
  const apiPath = req.url; // This already has the path after /ha-api
  const targetUrl = `${HA_BASE_URL}/api${apiPath}`;
  
  console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[PROXY] Body:`, JSON.stringify(req.body));
  }
  
  const proxyOptions = {
    method: req.method,
    headers: {
      'Authorization': req.headers.authorization,
      'Content-Type': req.headers['content-type'] || 'application/json',
      'User-Agent': 'HomeAssistant-Proxy/1.0'
    }
  };
  
  // Add body for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    proxyOptions.body = JSON.stringify(req.body);
  }
  
  fetch(targetUrl, proxyOptions)
    .then(response => {
      console.log(`[PROXY] Response: ${response.status} ${response.statusText} for ${req.originalUrl}`);
      
      // Set status
      res.status(response.status);
      
      // Return JSON response if it's JSON
      if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json().then(data => {
          res.json(data);
        });
      } else {
        return response.text().then(data => {
          res.send(data);
        });
      }
    })
    .catch(error => {
      console.error(`[PROXY] Error for ${req.originalUrl}:`, error.message);
      res.status(500).json({
        error: 'Proxy error',
        message: error.message,
        url: req.originalUrl,
        target: targetUrl,
        details: error.toString()
      });
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CORS Proxy Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Proxying /ha-api/* to ${HA_BASE_URL}/api/*`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Example: http://localhost:${PORT}/ha-api/states`);
  console.log(`📱 Mobile access: http://192.168.100.216:${PORT}/ha-api/states`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 CORS Proxy Server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 CORS Proxy Server shutting down...');
  process.exit(0);
});