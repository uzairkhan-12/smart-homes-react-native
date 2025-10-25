// API Configuration
// Note: Update this URL when deploying to different environments.
export const API_BASE_URL = "http://192.168.100.95:3040/api";

// Development configuration
export const DEV_CONFIG = {
  // Use proxy in development to avoid CORS issues
  USE_PROXY: true,
  PROXY_PORT: 8080,
  HA_HOST: "192.168.100.60",
  HA_PORT: 8123,
  // Your computer's IP for mobile access
  COMPUTER_IP: "192.168.100.216"
};

// Home Assistant API Configuration via CORS Proxy
// Use your computer's IP for mobile access, localhost for web
const PROXY_HOST = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'localhost' 
  : DEV_CONFIG.COMPUTER_IP;

export const HA_API_URL = `http://${PROXY_HOST}:${DEV_CONFIG.PROXY_PORT}/ha-api`;
export const HA_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZGIwM2M1Y2Y2ZWI0MGFmYjNhMTUxNmU0Mzk4ZGQxOSIsImlhdCI6MTc1NzgwNDAxMiwiZXhwIjoyMDczMTY0MDEyfQ.bhrLV6mhfbVnhr7cuwyncUq1R_0SYT6RDWlHPRveZ1A";

// Direct Home Assistant API (for fallback)
export const HA_DIRECT_URL = "http://192.168.100.60:8123/api";

// For mobile testing
export const HA_MOBILE_PROXY_URL = `http://${DEV_CONFIG.COMPUTER_IP}:${DEV_CONFIG.PROXY_PORT}/ha-api`;