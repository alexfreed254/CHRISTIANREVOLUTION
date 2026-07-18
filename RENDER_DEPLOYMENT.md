# Render Deployment Guide - Christ Revolution Movement

## 🚀 Fixed Deployment Issues

The dependency issues have been resolved! The project is now ready for deployment to Render.

---

## 🔧 Changes Made

### 1. **Fixed Python Dependencies**
- Updated `supabase` from 2.9.0 to 2.4.0 (stable version)
- Removed packages requiring Rust compilation
- Simplified dependency tree
- Both `requirements.txt` and `backend/requirements.txt` updated

### 2. **Fixed Module Import Path**
- Created root-level `app.py` entry point
- This file imports from `backend/app.py`
- Gunicorn now finds the app correctly
- Proper WSGI application structure

### 3. **Updated Render Configuration**
- Fixed app import path: `app:app` (simpler)
- Added pip upgrade step
- Set Python version to 3.11.0
- Changed plan from "standard" to "free" (you can change this)

### 4. **Updated Procfile**
- Fixed gunicorn import path to `app:app`

---

## 📋 Deployment Steps

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign in or create account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected

3. **Select Repository**
   - Choose: `alexfreed254/CHRISTIANREVOLUTION`
   - Branch: `main`

4. **Configure Service** (Auto-detected from render.yaml)
   - Name: christ-revolution-movement
   - Runtime: Python 3
   - Build Command: (auto-filled)
   - Start Command: (auto-filled)

5. **Add Environment Variables**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   ALLOWED_ORIGINS=*
   ENVIRONMENT=production
   ```
   
   Note: `SESSION_SECRET` and `JWT_SECRET_KEY` will be auto-generated

6. **Create Web Service**
   - Click "Create Web Service"
   - Render will start building and deploying

### Option 2: Deploy via render.yaml (Blueprint)

1. **Go to Render Dashboard**
   - Click "New +" → "Blueprint"

2. **Connect Repository**
   - Select: `alexfreed254/CHRISTIANREVOLUTION`
   - Render will detect `render.yaml`

3. **Add Environment Variables**
   - Add the required environment variables (see above)

4. **Deploy**
   - Click "Apply"
   - Render will create and deploy the service

---

## 🔐 Required Environment Variables

Add these in Render Dashboard → Service → Environment:

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | Your Supabase project URL | Get from Supabase dashboard |
| `SUPABASE_SERVICE_KEY` | Your service role key | Get from Supabase → Settings → API |
| `SESSION_SECRET` | Auto-generated | Render will create this |
| `JWT_SECRET_KEY` | Auto-generated | Render will create this |
| `ALLOWED_ORIGINS` | `*` (or specific domains) | CORS configuration |
| `ENVIRONMENT` | `production` | Application environment |
| `PYTHON_VERSION` | `3.11.0` | Already in render.yaml |

---

## 📦 Supabase Setup

Before deploying, ensure your Supabase database is set up:

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project

2. **Run Database Schema**
   - Go to SQL Editor in Supabase
   - Copy content from `database.sql`
   - Execute the script

3. **Get Credentials**
   - Go to Settings → API
   - Copy `URL` and `service_role` key
   - Add these to Render environment variables

---

## 🎯 Deployment Process

Once you click "Create Web Service" or "Apply", Render will:

1. ✅ Clone your GitHub repository
2. ✅ Install Python dependencies (3-5 minutes)
3. ✅ Install Node dependencies (2-3 minutes)
4. ✅ Build React frontend (1-2 minutes)
5. ✅ Start Flask backend with Gunicorn
6. ✅ Perform health check on `/api/health`
7. ✅ Assign a public URL

**Total deployment time:** ~8-12 minutes

---

## 🌐 Your Live URL

After successful deployment, Render will provide a URL like:
```
https://christ-revolution-movement.onrender.com
```

Or your custom domain if configured.

---

## ✅ Verify Deployment

1. **Check Health Endpoint**
   ```
   https://your-app.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "service": "CRM Central Command",
     "time": "2024-01-XX..."
   }
   ```

2. **Access Frontend**
   ```
   https://your-app.onrender.com
   ```
   Should load the home page with logo

3. **Test API**
   - Try registering a new account
   - Try logging in
   - Check live streams page
   - Test media library

---

## 🐛 Troubleshooting

### Build Fails on Python Dependencies

**Solution:** Already fixed! We're using `supabase==2.4.0` which doesn't require Rust.

### Frontend Build Fails

**Check:**
- Node version (should auto-detect)
- npm install logs
- Vite build logs

**Solution:**
```bash
# In render.yaml, buildCommand includes:
cd frontend && npm install && npm run build
```

### App Crashes on Start

**Check:**
- Supabase environment variables are correct
- Database schema is deployed
- Logs in Render dashboard

### CORS Errors

**Solution:**
Set `ALLOWED_ORIGINS` to your specific domain:
```
ALLOWED_ORIGINS=https://your-app.onrender.com
```

### Static Files Not Loading

**Check:**
- Frontend build completed successfully
- Static folder exists: `frontend/dist`
- Flask is serving static files correctly

---

## 📊 Monitoring

### Render Dashboard
- **Logs:** View real-time logs
- **Metrics:** CPU, memory usage
- **Events:** Deployment history
- **Health:** Service status

### Check Logs
```bash
# In Render Dashboard → Service → Logs
# Or use Render CLI
render logs christ-revolution-movement
```

---

## 🔄 Continuous Deployment

With `autoDeploy: true` in render.yaml:

1. Push changes to GitHub `main` branch
2. Render automatically detects changes
3. Triggers new build and deployment
4. Zero-downtime deployment

### Manual Deployment

In Render Dashboard:
- Click "Manual Deploy" → "Deploy latest commit"

---

## 💰 Pricing

**Free Tier:**
- 750 hours/month
- Spins down after 15 minutes of inactivity
- Spins up on first request (cold start ~30 seconds)

**Starter ($7/month):**
- Always-on
- No spin down
- Faster performance

**Standard ($25/month):**
- More resources
- Better for production

---

## 🎯 Post-Deployment Checklist

- [ ] Health endpoint working
- [ ] Frontend loads correctly
- [ ] Logo appears on all pages
- [ ] User registration works
- [ ] Login works
- [ ] Live streams accessible
- [ ] Media library loads
- [ ] Prayer wall functional
- [ ] Giving/Support page works
- [ ] WebSocket connections stable
- [ ] Database queries successful

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Render Docs:** https://render.com/docs
- **Your Repository:** https://github.com/alexfreed254/CHRISTIANREVOLUTION
- **Supabase Dashboard:** https://app.supabase.com

---

## 📞 Support

**Render Issues:**
- Render Community: https://community.render.com
- Render Status: https://status.render.com

**Application Issues:**
- Check logs in Render Dashboard
- Review `database.sql` execution in Supabase
- Verify environment variables

---

## ✅ Ready to Deploy!

Your application is now configured and ready for deployment. All dependency issues have been resolved.

**Next Step:** Go to https://dashboard.render.com and create your web service!

---

**Status:** Ready for Deployment ✅
**Last Updated:** January 2024
