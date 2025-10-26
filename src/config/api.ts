// API Configuration - Using FastAPI Backend for all operations
export const API_BASE_URL = "http://192.168.100.95:3040/api";

// Backend Configuration - Handles all Home Assistant operations
export const BACKEND_CONFIG = {
  BASE_URL: "http://192.168.100.95:3040",
  API_URL: "http://192.168.100.95:3040/api",
  ENDPOINTS: {
    // Home Assistant control endpoints (full paths from base URL)
    LIGHT_TOGGLE: "/api/ha/service/light_toggle",
    ENTITY_STATE: "/api/ha/state",
    SERVICE_CALL: "/api/ha/service/call", 
    // Dashboard endpoints
    DASHBOARD: "/api/dashboard",
    ENTITIES: "/api/entities",
    // Settings endpoints
    SETTINGS: "/api/settings",
    // Health check
    HEALTH: "/api/health"
  }
};

// Home Assistant Direct API (for fallback only)
export const HA_DIRECT_CONFIG = {
  BASE_URL: "http://192.168.100.60:8123",
  API_URL: "http://192.168.100.60:8123/api",
  TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwZGIwM2M1Y2Y2ZWI0MGFmYjNhMTUxNmU0Mzk4ZGQxOSIsImlhdCI6MTc1NzgwNDAxMiwiZXhwIjoyMDczMTY0MDEyfQ.bhrLV6mhfbVnhr7cuwyncUq1R_0SYT6RDWlHPRveZ1A"
};