# Department Portal Backend

Production-ready backend API for the Department Portal application.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Deployment**: Render

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with demo data
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login (staff or student)
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Users (Staff)
- `GET /api/v1/users` - List all staff
- `POST /api/v1/users` - Create staff user
- `GET /api/v1/users/:id` - Get user details
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Students
- `GET /api/v1/students` - List students
- `POST /api/v1/students` - Create student
- `POST /api/v1/students/bulk` - Bulk upload students
- `GET /api/v1/students/:id` - Get student details
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

### File Uploads
- `POST /api/v1/upload/resume` - Upload resume
- `POST /api/v1/upload/certificate` - Upload certificate
- `POST /api/v1/upload/profile-photo` - Upload profile photo
- `POST /api/v1/upload/document` - Upload generic document

## Deployment to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`
5. Add environment variables from `.env`
6. Deploy!

## Database Management

```bash
# Open Prisma Studio
npm run studio

# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy
```

## Demo Credentials

### Staff
- **Admin**: `admin@example.com` / `admin123`
- **HOD**: `nirmala` / `nirmala`
- **Placement**: `placement@example.com` / `placement123`
- **Faculty**: `vp` / `vp`

### Student
- **Roll Number**: `AI2023001`
- **Password**: `2005-01-01` (DOB format)
