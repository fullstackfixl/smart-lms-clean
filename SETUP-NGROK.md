# Setup ngrok to Expose Local Backend

## Step 1: Install ngrok
```bash
# Option 1: Using Chocolatey (if you have it)
choco install ngrok

# Option 2: Download manually
# Go to: https://ngrok.com/download
# Download Windows version
# Extract ngrok.exe to C:\ngrok\ or any folder
# Add to PATH or run from that folder
```

## Step 2: Start ngrok
```bash
ngrok http 5000
```

## Step 3: Copy the HTTPS URL
You'll see something like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

Copy: `https://abc123.ngrok-free.app`

## Step 4: Update Backend CORS
Edit `server/src/app.js` line 82:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://smart-lms-clean.vercel.app',
  'https://abc123.ngrok-free.app', // ADD YOUR NGROK URL HERE
  ''
];
```

## Step 5: Restart Backend
```bash
# Press Ctrl+C in backend terminal
cd server
npm start
```

## Step 6: Update Vercel Environment Variables
Go to: https://vercel.com/your-project/settings/environment-variables

Add:
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://abc123.ngrok-free.app` (your ngrok URL)
- Environment: Production

## Step 7: Redeploy Vercel
```bash
cd client
vercel --prod
```

OR just push to GitHub and Vercel will auto-deploy.

## Alternative: Use Cloudflare Tunnel (No Account Needed)
```bash
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
cloudflared tunnel --url http://localhost:5000
```

This gives you a free HTTPS URL instantly!
