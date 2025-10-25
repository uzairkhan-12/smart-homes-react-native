# Deploy CORS Proxy to Cloud

## Option A: Deploy to Vercel
1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "scripts/cors-proxy.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/scripts/cors-proxy.js"
    }
  ]
}
```

2. Deploy:
```bash
npm install -g vercel
vercel --prod
```

3. Update config to use Vercel URL:
```typescript
export const HA_API_URL = "https://your-app.vercel.app/ha-api";
```

## Option B: Deploy to Railway
1. Connect GitHub repo to Railway
2. Set environment variables:
   - `HA_BASE_URL=http://192.168.100.60:8123`
   - `PORT=3000`
3. Deploy automatically

## Option C: Deploy to Heroku
1. Create `Procfile`:
```
web: node scripts/cors-proxy.js
```

2. Deploy:
```bash
git add .
git commit -m "Add proxy server"
heroku create your-app-name
git push heroku main
```

## Benefits of Cloud Proxy:
- ✅ Works from any network
- ✅ No need to keep your computer running
- ✅ Standalone apps work perfectly
- ✅ Multiple devices can use it

## Security Considerations:
- 🔒 Use environment variables for sensitive data
- 🔒 Restrict CORS origins in production
- 🔒 Use HTTPS for cloud deployments