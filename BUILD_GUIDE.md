# Building APK for Vocab Coach

## Prerequisites
1. Expo account (free)
2. EAS CLI installed ✅ (already installed)

## Step-by-Step Build Process

### 1. Login to Expo
```bash
eas login
```

### 2. Configure Project
```bash
eas build:configure
```
(This will create/update eas.json - already created)

### 3. Build APK for Android

#### Option A: Build APK (Preview - for testing)
```bash
eas build --platform android --profile preview
```

#### Option B: Build Production APK
```bash
eas build --platform android --profile production
```

### 4. Download APK
After build completes:
- Build will be available in Expo dashboard
- Download link will be provided in terminal
- Or visit: https://expo.dev/accounts/[your-username]/projects/vocab-coach/builds

## Build Profiles

- **preview**: Builds APK for testing/internal distribution
- **production**: Builds APK for production release

## Notes

- First build may take 15-20 minutes
- You'll receive email notification when build completes
- APK can be downloaded directly and installed on Android devices
- No Google Play Store required for APK installation

## Troubleshooting

- If build fails, check logs in Expo dashboard
- Make sure all environment variables are set correctly
- API URL is already configured in .env file

