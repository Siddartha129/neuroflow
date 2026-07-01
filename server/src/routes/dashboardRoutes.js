import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);
dashboardRoutes.get('/', asyncHandler(getDashboard));
