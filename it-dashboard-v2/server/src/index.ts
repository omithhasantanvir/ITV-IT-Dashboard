import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import computerRoutes from './routes/computerRoutes';
import extensionRoutes from './routes/extensionRoutes';
import serverRoutes from './routes/serverRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import activityRoutes from './routes/activityRoutes';
import settingsRoutes from './routes/settingsRoutes';
import slipRoutes from './routes/slipRoutes';
import rosterRoutes from './routes/rosterRoutes';
import ssdRoutes from './routes/ssdRoutes';
import prisma from './lib/prisma';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    ok: true,
    message: 'IT Dashboard v2 API (Express + TypeScript + Prisma) running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', userRoutes); // Alias for employee compatibility
app.use('/api/computers', computerRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/slips', slipRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/ssds', ssdRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Central Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('Unhandled Server Error:', err);
  }
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 IT Dashboard v2 Server listening on http://${HOST}:${PORT}`);
});

export default app;
