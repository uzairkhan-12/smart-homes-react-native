// Temporary file to update your token
// After getting a new token from Home Assistant, update this and copy to api.ts

export const NEW_HA_TOKEN = "PASTE_YOUR_NEW_TOKEN_HERE";

// Instructions:
// 1. Go to http://192.168.100.60:8123/profile
// 2. Create a new long-lived access token
// 3. Replace "PASTE_YOUR_NEW_TOKEN_HERE" with your actual token
// 4. Copy the token value to src/config/api.ts
// 5. Restart your app

console.log("Update HA_TOKEN in src/config/api.ts with:", NEW_HA_TOKEN);