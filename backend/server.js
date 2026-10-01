import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import computerRoutes from './routes/computerRoutes.js';
import extensionRoutes from './routes/extensionRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import slipRoutes from './routes/slipRoutes.js';
import barcodeRoutes from './routes/barcodeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 }));

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    ok: true,
    message: 'IT Management API running',
    database: states[mongoose.connection.readyState] || 'unknown',
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/computers', computerRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/slips', slipRoutes);
app.use('/api/barcodes', barcodeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/settings', settingsRoutes);

// NOTE: /api/dashboard/summary is served by dashboardRoutes (mounted above).
// A duplicate hardcoded app.get() used to live here and was unreachable dead
// code that shadowed nothing but disagreed with the real controller.

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Central error handler so controller failures surface as JSON instead of a hung request.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || error.statusCode || 500;
  if (status >= 500) console.error('Unhandled API error:', error);
  res.status(status).json({ success: false, message: error.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management')
  .then(() => {
    app.listen(PORT, HOST, () => console.log(`Backend listening on http://${HOST}:${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
