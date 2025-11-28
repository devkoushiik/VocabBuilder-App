# Changing App Icon Guide

## ⚠️ Important: Change Icons BEFORE Building

**Icons are generated during the build process**, so you must replace the icon files **BEFORE** running `eas build`. Icons cannot be changed after the APK is built.

## 📐 Icon Requirements

### Main Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Shape**: Square (will be automatically masked)
- **Background**: Transparent or solid color
- **Location**: `mobile/assets/icon.png`

### Android Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Shape**: Square
- **Background**: Transparent (background color set in app.json)
- **Location**: `mobile/assets/adaptive-icon.png`
- **Note**: Only the foreground part of your icon (will be placed on colored background)

### Splash Icon (Optional - `splash-icon.png`)
- **Size**: 1242x2436 pixels (recommended)
- **Format**: PNG
- **Location**: `mobile/assets/splash-icon.png`

### Favicon (Web - `favicon.png`)
- **Size**: 48x48 pixels (minimum)
- **Format**: PNG
- **Location**: `mobile/assets/favicon.png`

## 🔄 How to Change Icons

### Step 1: Prepare Your Icons
1. Create or design your app icon
2. Export in required sizes:
   - Main icon: 1024x1024px PNG
   - Adaptive icon: 1024x1024px PNG (foreground only)
   - Splash icon: 1242x2436px PNG (optional)

### Step 2: Replace Icon Files
Replace these files in `mobile/assets/` directory:
```
mobile/assets/
├── icon.png              ← Main app icon (1024x1024)
├── adaptive-icon.png     ← Android adaptive icon (1024x1024)
├── splash-icon.png       ← Splash screen icon (1242x2436)
└── favicon.png          ← Web favicon (48x48)
```

### Step 3: Update Background Color (Optional)
If you want to change the Android adaptive icon background color, edit `app.json`:
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#YOUR_COLOR"  // Change this hex color
  }
}
```

Current color: `#1e40af` (blue)

### Step 4: Verify Configuration
Check `app.json` to ensure paths are correct:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1e40af"
      }
    }
  }
}
```

### Step 5: Clear Cache & Test
```bash
# Clear Expo cache
npx expo start -c

# Or if you want to preview the icon in development
npx expo prebuild --clean
```

### Step 6: Rebuild APK
After replacing icons, rebuild your APK:
```bash
eas build --platform android --profile preview
```

The new icons will be included in the build.

## 🎨 Icon Design Tips

1. **Safe Area**: Keep important content in the center 80% of the icon (corners may be clipped)
2. **Adaptive Icon**: Design so it looks good on both light and dark backgrounds
3. **Simple Design**: Icons should be recognizable at small sizes
4. **Brand Colors**: Use your app's color scheme

## 📱 Preview Icons Locally

You can preview how your icons look:
```bash
# Generate native folders (iOS/Android) to preview
npx expo prebuild

# Then run on device/emulator
npx expo run:android
```

## ⚡ Quick Steps Summary

1. Create 1024x1024px icon designs
2. Replace `mobile/assets/icon.png` and `mobile/assets/adaptive-icon.png`
3. Update background color in `app.json` if needed (optional)
4. Run `npx expo start -c` to clear cache
5. Build APK: `eas build --platform android --profile preview`

## 🔗 Resources

- Expo Icon Documentation: https://docs.expo.dev/guides/app-icons/
- Android Adaptive Icons: https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive
- Icon Generator Tool: https://www.appicon.co/ (generates all sizes automatically)

