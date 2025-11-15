#!/bin/bash

# Quick APK Update Script for Smart Home Sensors App
# This script builds, installs, and launches your React Native Android app

set -e  # Exit on any error

echo "🚀 Starting APK update process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if emulator is running
echo "📱 Checking for connected devices..."
DEVICES=$(adb devices | grep -v "List of devices attached" | grep -E "device|emulator" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo -e "${RED}❌ No devices/emulators connected!${NC}"
    echo "Please start an emulator first:"
    echo "  emulator -avd Medium_Phone_API_36.1 &"
    echo "Or connect a physical device."
    exit 1
fi

echo -e "${GREEN}✅ Found $DEVICES device(s) connected${NC}"

# Clean previous build (optional)
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning previous build..."
    cd android
    ./gradlew clean
    cd ..
fi

# Build APK
echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease
cd ..

# Check if APK was created
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ APK build failed! File not found: $APK_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ APK built successfully${NC}"

# Install APK
echo "📦 Installing APK on device..."
adb install -r "$APK_PATH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK installed successfully${NC}"
else
    echo -e "${RED}❌ APK installation failed${NC}"
    exit 1
fi

# Launch app
echo "🎯 Launching app..."
adb shell am start -S -n com.uzairkhan12.primewave/.MainActivity

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App launched successfully!${NC}"
    echo ""
    echo "📋 You can now:"
    echo "  • Check the app on your emulator/device"
    echo "  • View logs with: adb logcat | grep ReactNativeJS"
    echo "  • View all logs with: adb logcat"
else
    echo -e "${RED}❌ App launch failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📱 Quick commands:${NC}"
echo "  View logs: adb logcat | grep ReactNativeJS"
echo "  Restart app: adb shell am start -S -n com.uzairkhan12.primewave/.MainActivity"
echo "  Uninstall: adb uninstall com.uzairkhan12.primewave"