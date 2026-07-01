import { Router } from 'express';
import {
  deleteDocument,
  getDocument,
  listDocuments,
  reprocessDocument,
  uploadDocument
} from '../controllers/documentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const documentRoutes = Router();

documentRoutes.use(requireAuth);
documentRoutes.get('/workspaces/:workspaceId/documents', asyncHandler(listDocuments));
documentRoutes.post('/workspaces/:workspaceId/documents/upload', upload.single('file'), asyncHandler(uploadDocument));
documentRoutes.get('/documents/:id', asyncHandler(getDocument));
documentRoutes.post('/documents/:id/reprocess', asyncHandler(reprocessDocument));
documentRoutes.delete('/documents/:id', asyncHandler(deleteDocument));
