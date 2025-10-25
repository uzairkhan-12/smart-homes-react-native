// Production configuration for standalone apps
// This configuration bypasses CORS by using direct Home Assistant access
// Note: Only works if Home Assistant allows direct access

import { HA_API_URL, HA_TOKEN } from './api';

// Environment detection
const isStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone;
const isExpoGo = typeof window !== 'undefined' && window.location.href.includes('expo');

// Production API configuration
export const PRODUCTION_CONFIG = {
  // Direct Home Assistant access (no proxy needed)
  HA_DIRECT_URL: "http://192.168.100.60:8123/api",
  HA_TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZGIwM2M1Y2Y2ZWI0MGFmYjNhMTUxNmU0Mzk4ZGQxOSIsImlhdCI6MTc1NzgwNDAxMiwiZXhwIjoyMDczMTY0MDEyfQ.bhrLV6mhfbVnhr7cuwyncUq1R_0SYT6RDWlHPRveZ1A",
  
  // Alternative: Use a remote proxy server
  REMOTE_PROXY_URL: "https://your-server.com/ha-api", // If you deploy proxy to cloud
  
  // Fallback configuration
  USE_DIRECT_ACCESS: true, // Set to false if you want to use remote proxy
};

// Auto-detect environment and use appropriate config
export const getApiConfig = () => {
  // For standalone apps (APK/IPA), use direct access or remote proxy
  if (isStandalone || !isExpoGo) {
    return {
      baseUrl: PRODUCTION_CONFIG.USE_DIRECT_ACCESS 
        ? PRODUCTION_CONFIG.HA_DIRECT_URL 
        : PRODUCTION_CONFIG.REMOTE_PROXY_URL,
      useProxy: !PRODUCTION_CONFIG.USE_DIRECT_ACCESS,
      token: PRODUCTION_CONFIG.HA_TOKEN
    };
  }
  
  // For development (Expo Go), use local proxy
  return {
    baseUrl: HA_API_URL,
    useProxy: true,
    token: HA_TOKEN
  };
};