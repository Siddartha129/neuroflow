import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';
import { authRoutes } from './routes/authRoutes.js';
import { chatRoutes } from './routes/chatRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { workflowRoutes } from './routes/workflowRoutes.js';
import { workspaceRoutes } from './routes/workspaceRoutes.js';

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', documentRoutes);
app.use('/api', chatRoutes);
app.use('/api', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
