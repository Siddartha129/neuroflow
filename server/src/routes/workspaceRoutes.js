import { Router } from 'express';
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  listWorkspaces,
  updateWorkspace
} from '../controllers/workspaceController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const workspaceRoutes = Router();

workspaceRoutes.use(requireAuth);
workspaceRoutes.get('/', asyncHandler(listWorkspaces));
workspaceRoutes.post('/', asyncHandler(createWorkspace));
workspaceRoutes.get('/:id', asyncHandler(getWorkspace));
workspaceRoutes.patch('/:id', asyncHandler(updateWorkspace));
workspaceRoutes.delete('/:id', asyncHandler(deleteWorkspace));
