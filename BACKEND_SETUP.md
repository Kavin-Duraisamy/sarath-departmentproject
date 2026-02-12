# 🚀 Backend Setup & Deployment Guide

Complete guide to set up and deploy the Department Portal backend.

## Quick Start (Local Development)

### 1. Navigate to Server Directory
```bash
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev
```

This will:
- Create all database tables in Supabase
- Apply the schema to your PostgreSQL database

### 5. Seed Database with Demo Data
```bash
npm run seed
```

This creates:
- Admin user: `admin@example.com` / `admin123`
- HOD user: `nirmala` / `nirmala`
- Placement user: `placement@example.com` / `placement123`
- Faculty user: `vp` / `vp`
- Demo student: `AI2023001` / `2005-01-01`
- Sample departments

### 6. (Optional) Migrate Existing Data
```bash
npx tsx scripts/migrate-data.ts
```

This will migrate all users from `public/staff-users.json` to the database.

### 7. Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:5000` ✅

---

## Deployment to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add backend server"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:

**Basic Settings:**
- **Name**: `department-portal-backend`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: 
  ```bash
  npm install && npx prisma generate && npx prisma migrate deploy
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

### Step 3: Add Environment Variables

In Render dashboard, add these environment variables:

```
DATABASE_URL=postgresql://postgres.hxrjdqxkzxzttuwowkvk:Placement_and_AI_Portal@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

JWT_SECRET=dept-portal-super-secret-jwt-key-2026-production
JWT_REFRESH_SECRET=dept-portal-refresh-secret-key-2026-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

PORT=5000
NODE_ENV=production

CLOUDINARY_CLOUD_NAME=dfzc8ut44
CLOUDINARY_API_KEY=212485926727624
CLOUDINARY_API_SECRET=3KpsArPMFN0hR1bDi_fv-DHPpWQ

FRONTEND_URL=https://your-frontend-url.vercel.app
```

### Step 4: Deploy!

Click **"Create Web Service"** and wait for deployment to complete.

### Step 5: Seed Production Database

After deployment, go to Render Shell and run:
```bash
npm run seed
```

---

## Frontend Configuration

Update frontend `.env.local`:

**For Local Development:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

**For Production:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api/v1
```

---

## Testing the Backend

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Department Portal API is running"
}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "System Admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

---

## Database Management

### View Database (Prisma Studio)
```bash
npx prisma studio
```

Opens at `http://localhost:5555`

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
cd server
npm install
```

### Database connection errors
- Check DATABASE_URL in `.env`
- Verify Supabase database is running
- Check network connectivity

### Prisma errors
```bash
npx prisma generate
npx prisma migrate deploy
```

### Port already in use
```bash
# Change PORT in .env file
PORT=5001
```

---

## Production Checklist

- ✅ Supabase PostgreSQL database created
- ✅ Environment variables configured
- ✅ Database migrations applied
- ✅ Database seeded with initial data
- ✅ Backend deployed to Render
- ✅ Frontend updated with backend URL
- ✅ CORS configured for frontend domain
- ✅ JWT secrets are strong and unique
- ✅ Health check endpoint working

---

## Next Steps

1. **Start Backend**: `cd server && npm run dev`
2. **Start Frontend**: `cd .. && npm run dev`
3. **Test Login**: Use demo credentials
4. **Verify File Upload**: Upload a resume/certificate
5. **Check Database**: Open Prisma Studio

🎉 **Your backend is ready!**
