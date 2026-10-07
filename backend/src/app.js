import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { uploadsDirectory } from './middleware/uploadMiddleware.js';
import { HttpError } from './utils/HttpError.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import errorRoutes from './routes/errorRoutes.js';
import subgroupRoutes from './routes/subgroupRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import validationRoutes from './routes/validationRoutes.js';
const app = express();
const configuredOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (configuredOrigins.includes(origin) || process.env.NODE_ENV !== 'production' && isLocalDevelopmentOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new HttpError(403, 'This origin is not allowed by the API CORS policy.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({
  limit: '10mb'
}));
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running'
  });
});
app.use('/uploads', express.static(uploadsDirectory, {
  dotfiles: 'deny',
  index: false,
  fallthrough: false
}));
app.use('/api/auth', authRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/subgroups', subgroupRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/errors', errorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
function isLocalDevelopmentOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}
export default app;
