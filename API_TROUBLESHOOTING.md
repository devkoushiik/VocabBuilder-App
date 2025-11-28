# API Troubleshooting Guide

## Issue: "Invalid response from server" or Data Not Fetching

### Common Causes:

1. **Vercel Deployment Protection**: The Vercel deployment might have protection enabled, returning HTML instead of JSON
2. **API URL Incorrect**: The API URL might be wrong or not accessible
3. **CORS Issues**: Cross-origin requests might be blocked
4. **Network Issues**: Device might not have internet connection

### Solutions:

#### 1. Verify API URL is Accessible
Test the API endpoint in a browser:
```
https://vocab-app-express-backend-j6sd4lic0-koushik-ahmeds-projects.vercel.app/api/health
```

You should see JSON like:
```json
{"status":"ok","timestamp":"2025-01-XX..."}
```

If you see an HTML login page, the deployment has protection enabled.

#### 2. Disable Vercel Deployment Protection
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Deployment Protection
4. Disable protection or configure it to allow public access

#### 3. Check Environment Variables
Make sure `.env` file in mobile directory has:
```
EXPO_PUBLIC_API_URL=https://vocab-app-express-backend-j6sd4lic0-koushik-ahmeds-projects.vercel.app
```

#### 4. Restart Expo Server
After changing `.env` file:
```bash
# Stop the server (Ctrl+C)
# Clear cache and restart
npx expo start -c
```

#### 5. Check Network Connection
- Make sure device has internet access
- Try accessing the API URL from device's browser
- Check if corporate/private networks are blocking requests

#### 6. Verify API Endpoints Work
Test endpoints:
- Health: `GET /api/health`
- Vocabulary: `GET /api/v1/vocabulary`

### Error Messages Explained:

- **"Server returned HTML instead of JSON"**: Vercel deployment protection is enabled
- **"Network error"**: No internet connection or API URL incorrect
- **"Invalid response from server"**: API returned unexpected format
- **"Request failed with status 404"**: API endpoint doesn't exist
- **"Request failed with status 500"**: Server error, check Vercel logs

### Debug Steps:

1. Open React Native debugger
2. Check console logs for API URL being used
3. Check network requests in React Native debugger
4. Verify API responses in network tab

