import { Router } from 'express';
import { listMessages, listThreads, sendMessage } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const chatRoutes = Router();

chatRoutes.use(requireAuth);
chatRoutes.get('/workspaces/:workspaceId/chat', asyncHandler(listThreads));
chatRoutes.get('/workspaces/:workspaceId/chat/:threadId/messages', asyncHandler(listMessages));
chatRoutes.post('/workspaces/:workspaceId/chat', asyncHandler(sendMessage));
