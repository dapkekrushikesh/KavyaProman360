Kavu Proman - Node.js Backend

Quick start:
1. Copy `.env.example` to `.env` and set values (MONGO_URI, JWT_SECRET).
2. Install dependencies: npm install
3. Run in development: npm run dev
4. Backend serves the existing frontend files in the same directory. API base: /api

Main endpoints:
- POST /api/auth/signup { name, email, password }
- POST /api/auth/login { email, password }
- GET/POST/PUT/DELETE /api/projects
- GET/POST/PUT/DELETE /api/tasks
- POST /api/files/upload (multipart form-data file)
- GET /api/reports/summary
- GET/POST /api/settings

Notes:
- This is a starter backend. For production you should add validation, rate limiting, proper settings persistence, and secure file storage.
- Ensure MongoDB is running and MONGO_URI in .env points to it.
