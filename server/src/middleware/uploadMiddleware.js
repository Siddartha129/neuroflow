import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileTypeFor } from '../services/ingestionService.js';
import { httpError } from '../utils/httpError.js';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads', req.user.id, req.params.workspaceId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!fileTypeFor(file)) {
      cb(httpError(400, 'Unsupported file type'));
      return;
    }
    cb(null, true);
  }
});
