# Christ Revolution Movement - Setup Guide

## ✅ Complete File Structure

All files have been created and reviewed. Your project now includes:

### Backend Files ✓
- ✅ `backend/app.py` - Main Flask application with all API endpoints
- ✅ `backend/auth.py` - Authentication utilities (password hashing, sessions)
- ✅ `backend/supabase_client.py` - Supabase database client
- ✅ `backend/requirements.txt` - Python dependencies (including supabase)

### Frontend Files ✓
- ✅ `frontend/src/main.jsx` - React entry point
- ✅ `frontend/src/App.jsx` - Main app component with routing
- ✅ `frontend/src/index.css` - Global styles
- ✅ `frontend/package.json` - Node dependencies

### Frontend Pages ✓
- ✅ `frontend/src/pages/Home.jsx` - Homepage with live streams and trending media
- ✅ `frontend/src/pages/Login.jsx` - Login page
- ✅ `frontend/src/pages/Register.jsx` - Registration page
- ✅ `frontend/src/pages/LiveStreamPage.jsx` - Live streaming with real-time chat
- ✅ `frontend/src/pages/MediaLibrary.jsx` - Browse all sermons and teachings
- ✅ `frontend/src/pages/SeriesPage.jsx` - View sermon series
- ✅ `frontend/src/pages/PrayerWall.jsx` - Submit and pray for requests
- ✅ `frontend/src/pages/Portal.jsx` - Member dashboard
- ✅ `frontend/src/pages/Give.jsx` - Online giving

### Frontend Components ✓
- ✅ `frontend/src/components/common/Navbar.jsx`
- ✅ `frontend/src/components/common/GlassCard.jsx`
- ✅ `frontend/src/components/common/LiveBadge.jsx`
- ✅ `frontend/src/components/audio/MiniAudioPlayer.jsx`
- ✅ `frontend/src/components/chat/LiveChat.jsx`
- ✅ `frontend/src/components/media/VideoCard.jsx`
- ✅ `frontend/src/components/media/SeriesCarousel.jsx`
- ✅ `frontend/src/components/media/FilterBar.jsx`
- ✅ `frontend/src/components/player/VideoPlayer.jsx`

### Frontend Context ✓
- ✅ `frontend/src/context/AuthContext.jsx` - Authentication state management
- ✅ `frontend/src/context/PlayerContext.jsx` - Media player state

### Configuration Files ✓
- ✅ `frontend/vite.config.js` - Vite configuration
- ✅ `frontend/tailwind.config.js` - Tailwind CSS configuration
- ✅ `frontend/postcss.config.js` - PostCSS configuration

### Database & Deployment ✓
- ✅ `database.sql` - Complete PostgreSQL schema for Supabase
- ✅ `.env.example` - Environment variables template
- ✅ `Procfile` - Render deployment configuration
- ✅ `render.yaml` - Render service definition
- ✅ `requirements.txt` - Root Python dependencies

### Documentation ✓
- ✅ `README.md` - Comprehensive project documentation
- ✅ `SETUP.md` - This file

## 🚀 Quick Start

### 1. Install Dependencies

#### Backend
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SESSION_SECRET=your-random-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
ENVIRONMENT=development
PORT=8000
```

### 3. Setup Database

1. Go to https://supabase.com and create a new project
2. Copy your project URL and service role key
3. Open the SQL Editor in Supabase
4. Copy and paste the entire `database.sql` file
5. Execute the SQL script

### 4. Run the Application

#### Terminal 1 - Backend
```bash
# Make sure virtual environment is activated
python backend/app.py
```
Backend will run on http://localhost:8000

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

### 5. Access the Application

Open http://localhost:5173 in your browser

## 📋 Feature Checklist

### Core Features ✓
- ✅ User Registration & Authentication
- ✅ Live Streaming with Real-time Chat
- ✅ Media Library (Videos & Audio)
- ✅ Sermon Series Organization
- ✅ Prayer Wall
- ✅ Online Giving
- ✅ Member Dashboard
- ✅ Spiritual Growth Tracking
- ✅ Multi-language Support (UI ready)
- ✅ Mobile Responsive Design

### Technical Features ✓
- ✅ JWT Authentication
- ✅ WebSocket (Socket.IO) for real-time features
- ✅ PostgreSQL Database (Supabase)
- ✅ Row Level Security (RLS)
- ✅ RESTful API
- ✅ React Context for State Management
- ✅ Tailwind CSS for Styling
- ✅ Framer Motion for Animations
- ✅ Production-ready Deployment Config

## 🔧 Common Issues & Solutions

### Issue: "Module not found: supabase"
**Solution:** Make sure you installed backend dependencies with `pip install -r requirements.txt`

### Issue: "Failed to connect to database"
**Solution:** 
1. Check your `.env` file has correct Supabase credentials
2. Verify you ran the `database.sql` script in Supabase
3. Check RLS policies are properly configured

### Issue: "CORS errors in browser"
**Solution:** Make sure backend is running on port 8000 and frontend on 5173

### Issue: "Socket.IO connection failed"
**Solution:** 
1. Ensure backend is running
2. Check firewall settings
3. Verify eventlet is installed

## 📦 Deployment to Render

1. **Push your code to GitHub**
2. **Connect repository to Render**
3. **Use the `render.yaml` configuration** (already set up)
4. **Set environment variables in Render dashboard:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - Let Render auto-generate `SESSION_SECRET` and `JWT_SECRET_KEY`
5. **Deploy!**

Render will automatically:
- Install Python and Node dependencies
- Build the React frontend
- Start the Flask server with Gunicorn + Eventlet
- Handle SSL certificates

## 🎨 Customization

### Colors
Edit `frontend/tailwind.config.js` to change the color scheme:
```javascript
colors: {
  'crm-purple': '#8b7fc7',
  'crm-purple-light': '#b8aee0',
  'crm-black': '#0a0a0f',
  'crm-dark': '#1a1a2e',
  // ... add your colors
}
```

### Branding
- Replace logos in `frontend/src/components/common/Navbar.jsx`
- Update favicon in `frontend/index.html`
- Modify text in `frontend/src/pages/Home.jsx`

## 📞 Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the code comments in each file
- Check Supabase logs for database errors
- Review browser console for frontend errors

## 🎯 Next Steps

1. ✅ All files created
2. ⏳ Install dependencies
3. ⏳ Configure environment variables
4. ⏳ Set up Supabase database
5. ⏳ Run the application locally
6. ⏳ Test all features
7. ⏳ Deploy to Render

---

**Your project is now complete and ready for development!** 🎉
