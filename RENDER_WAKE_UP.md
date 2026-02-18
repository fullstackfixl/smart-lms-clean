# Render Backend Wake Up

## Problem
Render free tier sleeps after 15 minutes of inactivity.
First request takes 30-60 seconds to wake up.

## Quick Fix

### Option 1: Wait for Wake Up
Just wait 30-60 seconds. The backend is waking up.

### Option 2: Keep Alive Service (Free)
Use cron-job.org to ping your backend every 14 minutes:

1. Go to: https://cron-job.org
2. Create free account
3. Add job:
   - URL: `https://smart-lms-clean-1.onrender.com/health`
   - Schedule: Every 14 minutes
   - Method: GET

### Option 3: Upgrade to Paid ($7/month)
Paid instances never sleep.

## Current Status
Your backend is waking up. Try again in 60 seconds.

## Test Wake Up
```bash
# This will take 30-60 seconds first time
curl https://smart-lms-clean-1.onrender.com/health
```

## For Vercel
Set environment variable:
```
NEXT_PUBLIC_API_URL=https://smart-lms-clean-1.onrender.com
```

Then redeploy Vercel.
