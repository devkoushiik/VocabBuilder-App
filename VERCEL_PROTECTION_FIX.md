# Fix Vercel Deployment Protection

## Issue
Your Vercel API is returning HTML authentication page instead of JSON. The URL works in browser but not in mobile app.

## Why Browser Works But App Doesn't
- **Browser**: Can handle authentication redirects and cookies
- **Mobile App**: Cannot handle Vercel's authentication flow

## Solution: Disable Vercel Deployment Protection

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find your project: `vocab-app-express-backend`

### Step 2: Disable Deployment Protection
1. Click on your project
2. Go to **Settings** tab
3. Click **Deployment Protection** in the sidebar
4. **Disable** or set to **"Allow Public Access"**
5. Save changes

### Step 3: Redeploy
After disabling protection, trigger a new deployment:
```bash
cd backend
vercel --prod
```

Or manually trigger from Vercel dashboard:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

### Alternative: Use Production Domain
If you have a custom domain configured:
- Use that domain instead (it usually doesn't have protection)
- Update `.env` file with production domain

## After Fix
1. Test the URL again in browser - should return JSON directly
2. Restart Expo app:
   ```bash
   npx expo start -c
   ```
3. App should now work!

