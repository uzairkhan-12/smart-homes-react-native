# Android Development Guide

This guide covers how to build, update, and run your React Native Android app on an emulator via terminal.

## Prerequisites

Make sure you have the following installed:
- Android Studio
- Android SDK
- Java Development Kit (JDK)
- Node.js and npm/yarn
- React Native CLI or Expo CLI

## Environment Setup

### 1. Set Android SDK Environment Variables

Add these to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### 2. Verify Setup

```bash
# Check if adb is available
adb version

# Check if emulator is available
emulator -version

# List available AVDs
emulator -list-avds
```

## Building and Updating APK

### Method 1: Using Gradle (Recommended)

Navigate to your project directory:
```bash
cd /path/to/your/smart-home-sensors
```

#### For Release APK:
```bash
cd android
./gradlew assembleRelease
```

#### For Debug APK:
```bash
cd android
./gradlew assembleDebug
```

The APK will be generated at:
- **Release**: `android/app/build/outputs/apk/release/app-release.apk`
- **Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Method 2: Using React Native CLI

```bash
# For debug build
npx react-native run-android

# For release build
npx react-native run-android --variant=release
```

### Method 3: Using Expo (if using Expo)

```bash
# Build locally
npx expo run:android

# For release
npx expo run:android --variant release
```

## Running Emulator via Terminal

### 1. List Available AVDs

```bash
emulator -list-avds
```

Example output:
```
Medium_Phone_API_36.1
Parent_Device_API_33
Pixel_7_API_33
```

### 2. Start an Emulator

```bash
# Basic command
emulator -avd AVD_NAME

# Examples:
emulator -avd Medium_Phone_API_36.1
emulator -avd Pixel_7_API_33

# Start in background
emulator -avd Medium_Phone_API_36.1 &

# Start with specific options
emulator -avd Medium_Phone_API_36.1 -no-snapshot-load -wipe-data
```

### 3. Useful Emulator Options

```bash
# Start with no audio (faster)
emulator -avd AVD_NAME -no-audio

# Start with specific memory
emulator -avd AVD_NAME -memory 2048

# Start with GPU acceleration
emulator -avd AVD_NAME -gpu host

# Start with network speed simulation
emulator -avd AVD_NAME -netspeed full

# Start with specific resolution
emulator -avd AVD_NAME -skin 1080x1920
```

### 4. Check Connected Devices

```bash
# List connected devices/emulators
adb devices

# List with more details
adb devices -l
```

## Installing and Running APK

### 1. Install APK on Emulator

```bash
# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Install with replacement (update existing app)
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Install debug APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. Launch the App

```bash
# Start the main activity
adb shell am start -n com.uzairkhan12.primewave/.MainActivity

# Start with clearing previous tasks
adb shell am start -S -n com.uzairkhan12.primewave/.MainActivity
```

### 3. Uninstall App (if needed)

```bash
adb uninstall com.uzairkhan12.primewave
```

## Complete Development Workflow

### When You Make Changes:

1. **Make your code changes**

2. **Clean previous build (optional but recommended)**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

3. **Build new APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   cd ..
   ```

4. **Install updated APK**:
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

5. **Launch the app**:
   ```bash
   adb shell am start -n com.uzairkhan12.primewave/.MainActivity
   ```

### One-liner Script for Quick Updates:

Create a script file `update-apk.sh`:

```bash
#!/bin/bash
cd android
./gradlew assembleRelease
cd ..
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n com.uzairkhan12.primewave/.MainActivity
echo "App updated and launched!"
```

Make it executable:
```bash
chmod +x update-apk.sh
```

Run it:
```bash
./update-apk.sh
```

## Debugging and Logs

### View App Logs

```bash
# View all logs
adb logcat

# Filter by your app
adb logcat | grep com.uzairkhan12.primewave

# Filter React Native logs
adb logcat | grep ReactNativeJS

# Clear logs and start fresh
adb logcat -c && adb logcat
```

### React Native Metro Bundler

If using React Native CLI, you can also start the Metro bundler:

```bash
npx react-native start
```

## Troubleshooting

### Common Issues:

1. **Emulator not starting**:
   ```bash
   # Kill all emulator processes
   pkill -f emulator
   
   # Start fresh
   emulator -avd AVD_NAME -wipe-data
   ```

2. **ADB not finding devices**:
   ```bash
   # Restart adb server
   adb kill-server
   adb start-server
   adb devices
   ```

3. **APK installation fails**:
   ```bash
   # Uninstall first
   adb uninstall com.uzairkhan12.primewave
   
   # Then install
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Build fails**:
   ```bash
   # Clean everything
   cd android
   ./gradlew clean
   cd ..
   rm -rf node_modules
   npm install
   # or yarn install
   ```

### Network Security (for WebSocket connections):

Your app includes network security configuration to allow cleartext traffic (HTTP/WebSocket). The configuration is in:
- `android/app/src/main/res/xml/network_security_config.xml`
- Referenced in `android/app/src/main/AndroidManifest.xml`

## Quick Reference Commands

```bash
# Environment check
adb version && emulator -version

# List AVDs
emulator -list-avds

# Start emulator
emulator -avd Medium_Phone_API_36.1 &

# Check devices
adb devices -l

# Build APK
cd android && ./gradlew assembleRelease && cd ..

# Install APK
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Launch app
adb shell am start -n com.uzairkhan12.primewave/.MainActivity

# View logs
adb logcat | grep ReactNativeJS
```

## Your Project Specifics

- **Package Name**: `com.uzairkhan12.primewave`
- **Main Activity**: `com.uzairkhan12.primewave.MainActivity`
- **APK Location**: `android/app/build/outputs/apk/release/app-release.apk`
- **Available AVDs**: Medium_Phone_API_36.1, Parent_Device_API_33, Pixel_7_API_33

Save this documentation and refer to it whenever you need to update your APK or work with the emulator!