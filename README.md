# Christ Revolution Movement (CRM) Platform

> Discipling 2 Billion Souls by 2033 through the undiluted gospel of Jesus Christ

## 🌍 Overview

The Christ Revolution Movement (CRM) is a global discipleship platform that brings together believers from over 78 nations. This platform enables:

- **Live Streaming** - Watch services and events in real-time with multi-language support
- **Media Library** - Access thousands of sermons, teachings, and resources
- **Prayer Wall** - Join the global prayer movement
- **Discipleship Library** - Courses, devotionals, daily spiritual materials, and training resources
- **Discipleship Tracking** - Track your spiritual growth journey
- **Digital Giving** - Support the mission via PayPal, M-Pesa, and Stripe
- **AI Translation** - Content and UI in 40+ languages including Kiswahili, Kikuyu, Luo, and more
- **Community Engagement** - Connect with believers worldwide

> **Full platform blueprint:** See [PLATFORM_FEATURES.md](./PLATFORM_FEATURES.md) for the complete feature structure — public website, member portal, Super Admin dashboard, and advanced Digital Kingdom Ecosystem roadmap.

## 🚀 Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.IO Client** for real-time features
- **React Player** for video/audio playback
- **Axios** for API communication

### Backend
- **Flask** (Python web framework)
- **Flask-SocketIO** for WebSocket support
- **Flask-JWT-Extended** for authentication
- **Supabase** (PostgreSQL) for database
- **Gunicorn** (gthread) for production server
- **httpx** for PayPal + Safaricom Daraja API calls

### Infrastructure
- **Supabase** - Database and authentication
- **Render** - Deployment platform
- **PostgreSQL** - Database

## 📦 Project Structure

```
CHRIST-REVOLUTION-MOVEMENT1/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── auth.py                # Authentication utilities
│   ├── supabase_client.py     # Supabase client configuration
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── audio/         # Audio player components
│   │   │   ├── chat/          # Live chat components
│   │   │   ├── common/        # Shared components
│   │   │   ├── media/         # Media library components
│   │   │   └── player/        # Video player components
│   │   ├── context/           # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── PlayerContext.jsx
│   │   ├── pages/             # Page components
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── index.html             # HTML template
│   ├── package.json           # Node dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── tailwind.config.js     # Tailwind configuration
│   └── postcss.config.js      # PostCSS configuration
├── database.sql               # Database schema
├── database_payments.sql      # Migration: PayPal/M-Pesa (existing DBs)
├── database_spiritual_materials.sql  # Discipleship library tables
├── PLATFORM_FEATURES.md       # Full platform feature blueprint & roadmap
├── .env.example               # Environment variables template
├── .env.payment.example       # Optional PayPal / M-Pesa env vars
├── Procfile                   # Render deployment config
├── render.yaml                # Render service configuration
└── requirements.txt           # Root Python dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Supabase Account** (for database)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CHRIST-REVOLUTION-MOVEMENT1
```

### 2. Environment Configuration
Copy the example environment file and fill in your values:
```bash
cp .env.example .env
```

Required environment variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SESSION_SECRET=your-random-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
ENVIRONMENT=development
PORT=8000
```

### 3. Database Setup
1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and service role key
3. Run the database schema:
   - Open Supabase SQL Editor
   - Copy and paste the contents of `database.sql`
   - Execute the script
4. **Existing databases** (already ran `database.sql` before donations): also run `database_payments.sql` once to add PayPal/M-Pesa tables and columns.

### 4. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python backend/app.py
```

The backend will start on `http://localhost:8000`

### 5. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🚢 Deployment

### Deploy to Render

1. **Connect your repository** to Render
2. **Use the render.yaml** configuration file (already configured)
3. **Set environment variables** in Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - Let Render generate `SESSION_SECRET` and `JWT_SECRET_KEY`

4. **Deploy!** Render will:
   - Install Python and Node dependencies
   - Build the React frontend
   - Start the Flask server with Gunicorn (gthread + Socket.IO threading)

### Digital Giving (PayPal + M-Pesa)

1. Log in as **superadmin** → **Admin** → **Payment Setup**
2. Add the church **PayPal Business email** (and optional Client ID)
3. Add the **M-Pesa Till / number**
4. For automatic STK Push, add Daraja shortcode, passkey, consumer key/secret, and set callback to:
   `https://YOUR-APP.onrender.com/api/payments/mpesa/callback`
5. Optional secrets can also be set as Render env vars (see `.env.payment.example`)

Donors use **Support** (`/give`): PayPal Checkout for international/cards, M-Pesa for Kenya.

## 🔑 Key Features

> See [PLATFORM_FEATURES.md](./PLATFORM_FEATURES.md) for the complete 36-module architecture, Super Admin sidebar structure, and advanced Digital Kingdom Ecosystem features.

### 1. Live Streaming
- Real-time video streaming with multi-language support
- Live chat with Socket.IO
- Viewer count tracking
- Service scheduling

### 2. Media Library
- Video and audio sermons
- Series-based organization
- Advanced filtering (topic, language, speaker)
- Trending and popular content

### 3. Member Portal
- Unique member IDs (e.g., CRM-AFR-NAI-000001)
- Spiritual growth tracking
- Course completion tracking
- Engagement scoring
- Attendance records

### 4. Prayer Wall
- Public and private prayer requests
- Community prayer counting
- Real-time updates

### 5. Discipleship Library & Daily Materials
- Super Admin-managed spiritual materials (courses, devotionals, PDFs, video, audio)
- Daily Christ Bites and scheduled publishing
- Member saves, completion tracking, and library search
- AI translation to Kenya's languages

### 6. Secure Authentication
- JWT-based authentication
- Password hashing with SHA-256
- Session management
- Role-based access control

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - Register new member
- `POST /api/login` - Member login
- `GET /api/me` - Get current member profile

### Live Streaming
- `GET /api/live/streams` - Get all streams
- `GET /api/live/streams/:id` - Get stream details
- `POST /api/live/streams/:id/comments` - Post comment (auth required)

### Media Library
- `GET /api/media/library` - Get media with filters
- `GET /api/media/:id` - Get single media item
- `GET /api/media/series` - Get all series
- `GET /api/media/series/:id` - Get series with episodes
- `GET /api/media/search` - Search media

### Prayer Wall
- `GET /api/prayers` - Get public prayers
- `POST /api/prayers` - Submit prayer request (auth required)
- `POST /api/prayers/:id/pray` - Pray for request (auth required)

### Giving
- `POST /api/give` - Process donation (auth required)

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Password hashing** with salt
- **JWT tokens** with 30-day expiration
- **CORS protection** with allowed origins
- **Service role bypass** for backend operations
- **Environment variable protection** for secrets

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm run test
```

## 📱 Mobile Responsiveness

The platform is fully responsive and works seamlessly on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1440px+)

## 🎨 Design System

### Colors
- **Primary Purple**: `#8b7fc7` (CRM Purple)
- **Light Purple**: `#b8aee0` (CRM Purple Light)
- **Dark Background**: `#0a0a0f` (CRM Black)
- **Secondary Dark**: `#1a1a2e` (CRM Dark)

### Typography
- **Headings**: Inter, system-ui, sans-serif (Bold/Black)
- **Body**: Inter, system-ui, sans-serif (Regular)
- **Tracking**: Wide letter spacing for emphasis

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary to Christ Revolution Movement.

## 📞 Support

For support, please contact:
- **Email**: support@christrevolution.org
- **Website**: https://christrevolution.org

## 🙏 Vision

> "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all that I have commanded you." - Matthew 28:19-20

Our mission is to disciple **2 billion souls by 2033** through the undiluted gospel of Jesus Christ, leveraging technology to reach every tribe, tongue, and nation.

---

**Built with ❤️ for the Kingdom of God**
