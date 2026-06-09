import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/ticket.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { AppError } from './utils/AppError';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Fallback is for local development only — FRONTEND_URL must be set in production
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for unmatched routes
app.all('*', (req, res, next) => {
  next(new AppError('Route not found', 404));
});

// Global error handler must be at the very end
app.use(globalErrorHandler);

export default app;

