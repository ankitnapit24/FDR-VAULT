import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import fdrRoutes from './routes/fdrRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import renewalRoutes from './routes/renewalRoutes.js';
import refundRoutes from './routes/refundRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import bankVerificationRoutes from './routes/bankVerificationRoutes.js';
import trustRoutes from './routes/trustRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Request Tracking ID Middleware
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', reqId);
  (req as any).requestId = reqId;
  next();
});

// Production-ready CORS with domain whitelisting
const corsOrigin = env.CORS_ORIGIN === '*'
  ? true
  : env.CORS_ORIGIN.split(',').map(s => s.trim());

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// API Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', limiter);

// Dedicated Strict Login Rate Limiter (Brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health & Liveness Checks
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'UP',
    name: 'FDRFlow Backend API',
    organization: 'All India Council for Technical Education (AICTE)',
    problemStatementId: 26265,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Production Readiness Probe (Monitors Database & Storage state)
app.get('/api/health/ready', (_req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const status = isDbReady ? 'READY' : 'DEGRADED';
  const statusCode = isDbReady ? 200 : 503;

  res.status(statusCode).json({
    status,
    database: isDbReady ? 'CONNECTED' : 'DISCONNECTED',
    storageDriver: env.STORAGE_DRIVER,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/fdrs', fdrRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/refund-requests', refundRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/bank-verification', bankVerificationRoutes);
app.use('/api/trusts', trustRoutes);

// Error Handler
app.use(errorHandler);
