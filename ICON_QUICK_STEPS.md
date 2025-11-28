# Quick Icon Change Steps

## ⚠️ Change Icons BEFORE Building (Not After!)

Icons are generated during build. You must replace them before building the APK.

## 📋 Quick Checklist

1. **Prepare Your Icon**
   - Size: 1024x1024 pixels
   - Format: PNG
   - Name it: `icon.png`

2. **Replace Files**
   - Copy your icon to: `mobile/assets/icon.png`
   - Copy your icon to: `mobile/assets/adaptive-icon.png` (same or adapted version)

3. **Optional: Change Background Color**
   - Edit `mobile/app.json`
   - Change `backgroundColor` in `android.adaptiveIcon` section
   - Current: `"#1e40af"` (blue)

4. **Rebuild APK**
   ```bash
   eas build --platform android --profile preview
   ```

## 📁 Current Icon Locations

All icons should be in `mobile/assets/`:
- `icon.png` - Main app icon (1024x1024)
- `adaptive-icon.png` - Android adaptive icon (1024x1024)
- `splash-icon.png` - Splash screen (1242x2436) - Optional
- `favicon.png` - Web favicon (48x48) - Optional

## ✅ That's It!

After replacing the icon files, just rebuild the APK and the new icon will be included.

**Note**: If you've already built the APK, you need to rebuild it with the new icons.

