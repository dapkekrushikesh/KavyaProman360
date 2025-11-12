# Kavu Proman - Full Stack Integration Guide

Your frontend is now fully integrated with the Node.js backend!

## What's Been Done

✅ Backend server configured to serve frontend from `../frontend` folder
✅ All API endpoints created (auth, projects, tasks, files, reports, settings)
✅ MongoDB connection configured
✅ JWT authentication implemented
✅ New integrated JS files created for all features

## File Structure

```
Kavu_proman 1/
├── backend/
│   ├── server.js           # Main server file
│   ├── .env                # Environment variables
│   ├── config/db.js        # MongoDB connection
│   ├── middleware/auth.js  # JWT authentication middleware
│   ├── models/             # MongoDB models (User, Project, Task, File)
│   └── routes/             # API routes
│
└── frontend/
    ├── *.html              # All HTML pages
    └── assests/js/
        ├── api.js          # API helper utilities
        ├── script.js       # Login & Signup (UPDATED)
        ├── project-api.js  # Projects integration (NEW)
        ├── task-api.js     # Tasks integration (NEW)
        ├── filesharing-api.js  # File sharing integration (NEW)
        ├── dashboard-api.js    # Dashboard integration (NEW)
        ├── reports-api.js      # Reports integration (NEW)
        └── settings-api.js     # Settings integration (NEW)
```

## How to Use the Integrated Files

### Method 1: Replace Old Files (Recommended)
Replace the old JS files with the new API-integrated versions:

1. **Project page** (`project.html`):
   - Replace `<script src="assests/js/project.js">` 
   - With `<script src="assests/js/project-api.js">`

2. **Task page** (`task.html`):
   - Replace `<script src="assests/js/task.js">` 
   - With `<script src="assests/js/task-api.js">`

3. **File Sharing page** (`filesharing.html`):
   - Replace `<script src="assests/js/filesharing.js">` 
   - With `<script src="assests/js/filesharing-api.js">`

4. **Dashboard page** (`dashboard.html`):
   - Replace `<script src="assests/js/dashboard.js">` 
   - With `<script src="assests/js/dashboard-api.js">`

5. **Reports page** (`reports.html`):
   - Replace `<script src="assests/js/reports.js">` 
   - With `<script src="assests/js/reports-api.js">`

6. **Settings page** (`setting.html`):
   - Replace `<script src="assests/js/setting.js">` 
   - With `<script src="assests/js/settings-api.js">`

### Method 2: Use Both (Load API file after original)
Or keep both and load the API file after the original:

```html
<script src="assests/js/project.js"></script>
<script src="assests/js/project-api.js"></script>
```

## API Endpoints Available

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Files
- `GET /api/files` - Get all files
- `POST /api/files/upload` - Upload file (multipart/form-data)

### Reports
- `GET /api/reports/summary` - Get reports summary

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Save user settings

## Testing the Integration

1. **Start the backend server** (if not already running):
   ```bash
   cd backend
   npm run dev
   ```

2. **Open browser** and go to `http://localhost:3000`

3. **Sign up** a new account on the signup page

4. **Login** with your credentials

5. **Test features**:
   - Create a project
   - Add tasks
   - Upload files
   - View dashboard
   - Check reports
   - Update settings

## Authentication Flow

- Login/Signup stores JWT token in `localStorage`
- All API calls include `Authorization: Bearer <token>` header
- If token expires or is invalid, user is redirected to login page
- Logout removes token from localStorage

## Important Notes

- ✅ Login & Signup already integrated in `script.js`
- ✅ All new `-api.js` files check authentication on page load
- ✅ Backend is already running and connected to MongoDB
- ⚠️ You need to update your HTML files to use the new JS files
- ⚠️ Old JS files used localStorage - new files use backend API

## Next Steps

1. Update your HTML pages to use the new `-api.js` files
2. Test each feature (login, projects, tasks, etc.)
3. Customize the UI/error messages as needed
4. Add more features or validation as required

## Troubleshooting

**Problem:** "Cannot read token" or redirects to login
**Solution:** Make sure you're logged in and token is in localStorage

**Problem:** "CORS error"
**Solution:** Backend already has CORS enabled, make sure server is running

**Problem:** "404 Not Found"
**Solution:** Check the API endpoint URL and make sure backend is running

**Problem:** File upload not working
**Solution:** Make sure `uploads` folder exists in backend directory

## Support

All integrated! Your frontend now communicates with your Node.js backend using REST APIs with JWT authentication.
