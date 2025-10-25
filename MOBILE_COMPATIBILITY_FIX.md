# React Native Mobile Compatibility Fix

## Issue
The `AbortSignal.timeout()` method is not available in React Native's JavaScript engine, causing errors when making API calls on mobile devices:

```
ERROR: AbortSignal.timeout is not a function (it is undefined)
```

## Solution
Created a React Native-compatible timeout mechanism in `src/utils/fetch.ts`:

### 1. Custom Timeout Implementation
- `createTimeoutSignal(timeoutMs)` - Creates timeout signals compatible with React Native
- `fetchWithTimeout(url, options)` - Wrapper around fetch with timeout support

### 2. Updated Services
All services now use `fetchWithTimeout` instead of `fetch` with `AbortSignal.timeout`:

- ✅ `HomeAssistantService.ts`
- ✅ `HomeAssistantApiService.ts` 
- ✅ `HomeAssistantConfigService.ts`

### 3. Usage
```typescript
// Before (web-only)
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000)
});

// After (React Native compatible)
const response = await fetchWithTimeout(url, {
  timeout: 5000
});
```

## Testing
Run the app on mobile to verify:
1. Light controls work without timeout errors
2. API calls complete successfully
3. Timeouts work as expected

## Mobile Testing Setup
1. **Proxy server**: `npm run cors-proxy`
2. **Mobile URL**: `http://192.168.100.216:8080/ha-api/*`
3. **Expo app**: `npm start` and scan QR code

The fix ensures cross-platform compatibility while maintaining the same timeout functionality.