# Build APK - Step by Step Instructions

## ✅ What's Already Done
- ✅ EAS CLI installed
- ✅ Logged in to Expo
- ✅ `eas.json` configured for APK builds
- ✅ `app.json` updated with proper Android package name
- ✅ API URL configured for Vercel backend

## 🚀 Build Your APK Now

### Step 1: Configure EAS Project (First Time Only)
Run this command and **press Y when prompted**:
```bash
eas build:configure
```
This will:
- Create an EAS project for your app
- Set up project configuration
- Generate a project ID

### Step 2: Build APK

#### Option A: Preview/Testing APK (Recommended for first build)
```bash
eas build --platform android --profile preview
```

#### Option B: Production APK
```bash
eas build --platform android --profile production
```

### Step 3: Wait for Build
- Build will take **15-20 minutes** for first build
- You'll see build progress in terminal
- You'll receive email when build completes

### Step 4: Download APK
After build completes:
1. Check your terminal for download link
2. Or visit: https://expo.dev/accounts/koushikxahmed/projects/vocab-coach/builds
3. Download the `.apk` file
4. Install on Android device (enable "Install from Unknown Sources" if needed)

## 📱 Install APK on Android Device

1. Transfer APK to your Android device (via USB, email, or cloud)
2. On your device, go to Settings > Security
3. Enable "Install from Unknown Sources" or "Install Unknown Apps"
4. Tap the APK file to install
5. Open the "Vocab Coach" app

## 🔧 Build Profiles Explained

- **preview**: Best for testing, builds APK format
- **production**: Optimized build for release

## ⚠️ Important Notes

- First build takes longer (15-20 min)
- Subsequent builds are faster (5-10 min)
- Build runs on Expo servers (cloud)
- No Android Studio or local setup needed
- APK works on all Android devices (5.0+)

## 🆘 Troubleshooting

If build fails:
1. Check error message in terminal
2. Visit Expo dashboard: https://expo.dev/accounts/koushikxahmed/projects/vocab-coach/builds
3. Check build logs for detailed errors
4. Ensure API URL is correct in `.env` file

## 🎯 Quick Start (Copy & Paste)

Run these commands in order:

```bash
# 1. Configure (press Y when prompted)
eas build:configure

# 2. Build APK
eas build --platform android --profile preview
```

That's it! 🎉

