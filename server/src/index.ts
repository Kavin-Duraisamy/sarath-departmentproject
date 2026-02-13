import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import studentsRoutes from './routes/students.routes';
import uploadRoutes from './routes/upload.routes';
import progressionRoutes from './routes/progression.routes';
import placementRoutes from './routes/placement.routes';
import notificationRoutes from './routes/notifications.routes';
import timetableRoutes from './routes/timetable.routes';
import departmentRoutes from './routes/departments.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for debugging
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', message: 'Department Portal API is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/progression', progressionRoutes);
app.use('/api/v1/placement', placementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`DEBUG VERSION: 1.0.1 (Auth Fix Applied)`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

export default app;
