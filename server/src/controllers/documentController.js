import fs from 'fs/promises';
import path from 'path';
import { repository } from '../data/repository.js';
import { fileTypeFor, ingestDocument } from '../services/ingestionService.js';
import { getOwnedDocument, getOwnedWorkspace } from '../utils/resourceGuards.js';
import { httpError } from '../utils/httpError.js';

export async function listDocuments(req, res) {
  await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  const documents = await repository.getAll(
    'documents',
    { userId: req.user.id, workspaceId: req.params.workspaceId },
    { createdAt: -1 }
  );
  res.json({ documents });
}

export async function uploadDocument(req, res) {
  const workspace = await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  if (!req.file) throw httpError(400, 'File is required');
  const fileType = fileTypeFor(req.file);
  if (!fileType) throw httpError(400, 'Unsupported file type');

  const document = await repository.create('documents', {
    userId: req.user.id,
    workspaceId: workspace.id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    fileType,
    status: 'uploaded',
    metadata: { path: req.file.path }
  });

  const processed = await ingestDocument(document);
  res.status(201).json({ document: processed });
}

export async function getDocument(req, res) {
  const document = await getOwnedDocument(req.user.id, req.params.id);
  res.json({ document });
}

export async function reprocessDocument(req, res) {
  const document = await getOwnedDocument(req.user.id, req.params.id);
  const processed = await ingestDocument(document);
  res.json({ document: processed });
}

export async function deleteDocument(req, res) {
  const document = await getOwnedDocument(req.user.id, req.params.id);
  await repository.deleteWhere('document_chunks', { userId: req.user.id, documentId: document.id });
  await repository.deleteById('documents', document.id);
  if (document.metadata?.path) {
    await fs.unlink(path.resolve(document.metadata.path)).catch(() => {});
  }
  res.status(204).send();
}
