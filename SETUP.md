# 🚀 KavyaProman360 Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Brevo (formerly Sendinblue) account for email notifications

## 📋 Quick Setup Steps

### 1. Clone the Repository
```bash
git clone https://github.com/dapkekrushikesh/KavyaProman360.git
cd KavyaProman360
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `backend/.env` with your actual credentials:

**MongoDB Setup:**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string
- Replace `MONGO_URI` in `.env`

**Brevo Email Setup:**
- Sign up at [Brevo](https://app.brevo.com/account/register) (300 free emails/day)
- Go to Settings > SMTP & API > API Keys
- Create new API key
- Replace `BREVO_API_KEY` in `.env`
- Verify your sender email and add it as `BREVO_FROM_EMAIL`

**JWT Secret:**
- Generate a secure random string (or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Replace `JWT_SECRET` in `.env`

#### Start Backend Server
```bash
npm start
```
Server will run on `http://localhost:3000`

### 3. Frontend Setup

#### Open Frontend
Simply open `frontend/index.html` in your browser, or use a local server:

```bash
cd frontend
# Using Python
python -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

Then visit `http://localhost:8080`

## 🔐 Important Security Notes

⚠️ **NEVER commit the `.env` file to Git!**

The `.env` file contains sensitive credentials:
- Database passwords
- API keys
- JWT secrets

These are already excluded via `.gitignore`. When deploying or sharing the project:
1. Keep your `.env` file private
2. Share only the `.env.example` template
3. Each developer creates their own `.env` from the template

## 📧 Email Configuration (Brevo)

Brevo is used for:
- Project assignment notifications
- Calendar event reminders
- User notifications

Free tier includes:
- ✅ 300 emails/day
- ✅ Professional templates
- ✅ No credit card required

See `backend/BREVO_SETUP.md` for detailed email setup instructions.

## 🧪 Testing the Application

### Default Users (After DB seed)
- Admin: `admin@kavuproman.com`
- User 1: `bhagyashri@kavyainfoweb.com`
- User 2: `rushikesh@kavyainfoweb.com`

### Features to Test
1. **Login** - Use default credentials
2. **Projects** - Create, edit, assign members
3. **Tasks** - Create tasks, set priorities, track progress
4. **Calendar** - Schedule events, get reminders
5. **Reports** - View project analytics
6. **Settings** - Update profile, change password

## 🛠️ Troubleshooting

### Backend won't start
- Check if MongoDB URI is correct
- Ensure port 3000 is not in use
- Verify all dependencies are installed (`npm install`)

### Emails not sending
- Verify Brevo API key is valid
- Check sender email is verified in Brevo
- Review `backend/BREVO_SETUP.md`

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check browser console for CORS errors
- Verify API endpoints in frontend JS files

## 📁 Project Structure

```
KavyaProman360/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── utils/           # Helper functions (email, etc.)
│   ├── .env             # Environment variables (NOT in Git)
│   ├── .env.example     # Environment template (in Git)
│   └── server.js        # Main server file
├── frontend/
│   ├── assests/         # CSS, JS, images
│   ├── index.html       # Login page
│   ├── dashboard.html   # Main dashboard
│   └── ...              # Other pages
└── .gitignore           # Git exclusions
```

## 🚢 Deployment Tips

### Backend (Node.js)
- Deploy to: Heroku, Railway, Render, or DigitalOcean
- Set environment variables in hosting platform
- Ensure MongoDB Atlas allows connections from hosting IP

### Frontend (Static Files)
- Deploy to: Vercel, Netlify, GitHub Pages, or any static host
- Update API URLs to point to deployed backend
- Enable CORS on backend for frontend domain

## 📞 Support

For issues or questions:
- Check `backend/BREVO_SETUP.md` for email setup
- Review code comments
- Contact: dapkekrushikesh@gmail.com

---

Happy coding! 🎉
