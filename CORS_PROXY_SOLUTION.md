# CORS Proxy Solution for Home Assistant API

This solution implements the same CORS proxy approach used in your React Vite app to solve CORS issues when accessing Home Assistant API from React Native web.

## How It Works

1. **CORS Proxy Server**: Runs on `http://localhost:8080`
2. **API Routing**: Routes `/ha-api/*` requests to your Home Assistant API at `http://192.168.100.60:8123/api/*`
3. **CORS Headers**: Adds proper CORS headers to allow browser access
4. **Token Authentication**: Forwards your Bearer token to Home Assistant

## Quick Start

### 1. Start the CORS Proxy Server
```bash
npm run cors-proxy
```

### 2. Test the Proxy
```bash
# Health check
curl http://localhost:8080/health

# Test API access (replace YOUR_TOKEN with your actual token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/ha-api/states
```

### 3. Run Your App
```bash
npm run web
```

## Configuration

The app is pre-configured to use the proxy. Configuration is in:

- **API Config**: `src/config/api.ts`
- **Default Settings**: Uses `http://localhost:8080/ha-api` as base URL
- **Token**: Set in `src/config/api.ts` (already configured with your token)

## API Usage Examples

```typescript
// Fetch all states
const response = await fetch('http://localhost:8080/ha-api/states', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Get specific entity state
const lightState = await fetch('http://localhost:8080/ha-api/states/light.living_room', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Call a service
const serviceCall = await fetch('http://localhost:8080/ha-api/services/light/turn_on', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entity_id: 'light.living_room'
  })
});
```

## Proxy Configuration

The proxy server (`scripts/cors-proxy.js`) is configured to:

- **Listen on**: Port 8080
- **Target**: `http://192.168.100.60:8123` (your Home Assistant)
- **Path Rewriting**: `/ha-api/*` → `/api/*`
- **CORS**: Enabled for all origins
- **Logging**: Request/response logging for debugging

## Troubleshooting

### Proxy Not Starting
```bash
# Check if port 8080 is in use
lsof -ti:8080

# Kill any process using port 8080
kill -9 $(lsof -ti:8080)

# Start proxy again
npm run cors-proxy
```

### Connection Issues
1. Ensure Home Assistant is accessible at `http://192.168.100.60:8123`
2. Verify your token is correct in `src/config/api.ts`
3. Check proxy logs for error messages

### CORS Errors
- The proxy should eliminate all CORS errors
- If you still see CORS errors, ensure you're using `http://localhost:8080/ha-api` URLs
- Restart the proxy server if needed

## Development Workflow

1. **Start Proxy**: `npm run cors-proxy` (run this first)
2. **Start App**: `npm run web` (in a separate terminal)
3. **Development**: Both should run simultaneously

## Production Notes

For production deployment, you'll need to:

1. Set up a production proxy server or configure CORS on Home Assistant
2. Update the API URLs in `src/config/api.ts`
3. Ensure proper security for token handling

## Files Modified

- `src/config/api.ts` - API configuration
- `src/services/HomeAssistantConfigService.ts` - Config service with proxy support
- `src/services/HomeAssistantApiService.ts` - API service updated for proxy
- `src/services/HomeAssistantService.ts` - Service calls updated for proxy
- `scripts/cors-proxy.js` - Proxy server implementation
- `package.json` - Added cors-proxy script

This solution matches your Vite app approach and should eliminate all CORS issues! 🚀