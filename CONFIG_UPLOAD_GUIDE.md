# Configuration File Upload/Export

The Smart Home app now supports uploading and exporting configuration files to make setup easier and enable configuration sharing.

## 📁 File Upload Features

### Supported File Formats

1. **JSON Format (Recommended)**
   ```json
   {
     "haBaseUrl": "https://hajax.primewave1.click",
     "haToken": "your-long-lived-access-token",
     "websocketUrl": "ws://192.168.100.95:3040/api/ws/entities_live"
   }
   ```

2. **HA_Config Structure**
   ```json
   {
     "HA_Config": {
       "BASE_URL": "https://hajax.primewave1.click",
       "API_URL": "https://hajax.primewave1.click/api",
       "TOKEN": "your-long-lived-access-token",
       "WEBSOCKET_URL": "ws://192.168.100.95:3040/api/ws/entities_live"
     }
   }
   ```

3. **Text/Config Format**
   ```
   # Smart Home Configuration
   haBaseUrl=https://hajax.primewave1.click
   haToken=your-long-lived-access-token
   websocketUrl=ws://192.168.100.95:3040/api/ws/entities_live
   ```

4. **CSV Format**
   ```csv
   haBaseUrl,haToken,websocketUrl
   https://hajax.primewave1.click,your-long-lived-access-token,ws://192.168.100.95:3040/api/ws/entities_live
   ```

5. **CSV Format (Uppercase Headers)**
   ```csv
   BASE_URL,TOKEN,WEBSOCKET_URL
   https://hajax.primewave1.click,your-long-lived-access-token,ws://192.168.100.95:3040/api/ws/entities_live
   ```

6. **YAML-style Format**
   ```
   BASE_URL: "https://hajax.primewave1.click"
   TOKEN: "your-long-lived-access-token"
   WEBSOCKET_URL: "ws://192.168.100.95:3040/api/ws/entities_live"
   ```

### Field Name Recognition

The system automatically recognizes various field names (case-insensitive):

- **Base URL**: `haBaseUrl`, `HA_BASE_URL`, `baseUrl`, `base_url`, `BASE_URL`, `ha_base_url`, `homeassistant_url`
- **Token**: `haToken`, `HA_TOKEN`, `token`, `TOKEN`, `ha_token`, `access_token`, `accessToken`, `auth_token`
- **WebSocket URL**: `websocketUrl`, `WEBSOCKET_URL`, `websocket_url`, `ws_url`, `WS_URL`, `websocket`, `webSocketUrl`

## 📤 Export Feature

- Exports current configuration in HA_Config JSON format
- Includes timestamp and app version for tracking
- Copies to clipboard for easy sharing or backup

## 🔄 Hot Reloading

When you save configuration changes:
- WebSocket automatically reconnects with new settings
- No app restart required
- Real-time configuration updates
- Automatic cache invalidation

## 📋 Usage Steps

1. **Upload Configuration**:
   - Tap "📁 Upload" button in configuration modal
   - Select your configuration file (JSON, TXT, or other supported format)
   - Review auto-filled fields
   - Tap "Save Configuration"

2. **Export Configuration**:
   - Tap "📤 Export" button in configuration modal
   - Configuration is copied to clipboard
   - Paste into a text file for backup

3. **Automatic Updates**:
   - Configuration changes trigger automatic WebSocket reconnection
   - Dashboard updates immediately with new endpoints
   - No manual restart required

## 🛠️ Sample Files

Check the `sample-configs/` directory for example configuration files in different formats:
- `ha-config.json` - HA_Config structure
- `simple-config.json` - Simple JSON format
- `config.txt` - Text format with comments
- `yaml-style-config.txt` - YAML-style format

## ⚡ Performance Notes

- Configuration changes are applied instantly
- Cache is automatically cleared on updates
- WebSocket reconnection is handled gracefully
- Fallback to defaults if parsing fails