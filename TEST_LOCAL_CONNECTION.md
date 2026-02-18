# Local Development Connection Test

## Current Setup
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- Database: MongoDB Atlas (cloud)

## Configuration Status ✅

### Backend (.env)
```env
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://...
PORT=5000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### CORS (server/src/app.js)
```javascript
allowedOrigins = [
  'http://localhost:3000',  ✅
  'http://localhost:3001',  ✅
]
```

## Start Services

### 1. Start Backend
```bash
cd server
node server.js
```

Expected output:
```
✅ Environment validation passed
🚀 Server running on port 5000
✅ MongoDB connected
```

### 2. Start Frontend
```bash
cd client
npm run dev
```

Expected output:
```
▲ Next.js 15.5.12
- Local: http://localhost:3000
✓ Ready in 2.5s
```

## Test Connection

### 1. Test Backend Health
```bash
curl http://localhost:5000/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "checks": {
    "database": "connected"
  }
}
```

### 2. Test Frontend
1. Open: http://localhost:3000
2. Open browser console (F12)
3. Check Network tab
4. API calls should go to: `http://localhost:5000`

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify MongoDB connection string
- Check Node.js version (need 18+)

### Frontend won't start
- Check if port 3000 is already in use
- Run `npm install` in client folder
- Clear `.next` folder: `rm -rf .next`

### CORS errors
- Verify backend is running on port 5000
- Check CLIENT_URL in server/.env
- Restart backend after .env changes

### Database connection fails
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for development)
- Verify credentials in MONGODB_URI
- Check network connection

## Quick Commands

### Kill processes on ports
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Restart everything
```bash
# Terminal 1 - Backend
cd server
node server.js

# Terminal 2 - Frontend
cd client
npm run dev
```

## Everything Working When:
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] No CORS errors in browser console
- [ ] Can login/register
- [ ] API calls visible in Network tab

---

Your local development environment is ready! 🚀
