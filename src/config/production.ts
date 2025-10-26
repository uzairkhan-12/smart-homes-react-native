// Production configuration for standalone apps
// This configuration uses the FastAPI backend for all operations

import { BACKEND_CONFIG, HA_DIRECT_CONFIG } from './api';

// Environment detection
const isStandalone = typeof navigator !== 'undefined' && (navigator as any).standalone;
const isExpoGo = typeof window !== 'undefined' && window.location.href.includes('expo');

// Production API configuration
export const PRODUCTION_CONFIG = {
  // FastAPI Backend (preferred for all operations)
  BACKEND_URL: BACKEND_CONFIG.BASE_URL,
  
  // Direct Home Assistant access (fallback only)
  HA_DIRECT_URL: HA_DIRECT_CONFIG.API_URL,
  HA_TOKEN: HA_DIRECT_CONFIG.TOKEN,
  
  // For remote deployment: Update BACKEND_URL to your deployed backend
  // BACKEND_URL: "https://your-backend.herokuapp.com",
  
  USE_BACKEND: true, // Always use backend (no proxy needed)
};

// Auto-detect environment and use appropriate config
export const getApiConfig = () => {
  // Always use backend for both development and production
  return {
    backendUrl: PRODUCTION_CONFIG.BACKEND_URL,
    fallbackUrl: PRODUCTION_CONFIG.HA_DIRECT_URL,
    token: PRODUCTION_CONFIG.HA_TOKEN,
    useBackend: PRODUCTION_CONFIG.USE_BACKEND
  };
};