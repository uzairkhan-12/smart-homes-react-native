#!/bin/bash

# Setup script for CORS proxy development

echo "🚀 Setting up CORS Proxy for Home Assistant API..."

# Check if dependencies are installed
if ! npm list express cors http-proxy-middleware > /dev/null 2>&1; then
  echo "📦 Installing proxy dependencies..."
  npm install express cors http-proxy-middleware
fi

echo "✅ Dependencies installed"
echo ""
echo "🔧 Configuration:"
echo "  Proxy URL: http://localhost:8080/ha-api"
echo "  Home Assistant: http://192.168.100.60:8123"
echo "  Token: Set in src/config/api.ts"
echo ""
echo "🚀 To start the proxy server:"
echo "  npm run cors-proxy"
echo ""
echo "🔍 To test the proxy:"
echo "  curl http://localhost:8080/health"
echo "  curl -H \"Authorization: Bearer YOUR_TOKEN\" http://localhost:8080/ha-api/states"
echo ""
echo "✅ Setup complete!"