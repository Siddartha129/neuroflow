import { repository } from '../data/repository.js';
import { httpError } from './httpError.js';

export async function getOwnedWorkspace(userId, id) {
  const workspace = await repository.getById('workspaces', id);
  if (!workspace || workspace.userId !== userId) {
    throw httpError(404, 'Workspace not found');
  }
  return workspace;
}

export async function getOwnedDocument(userId, id) {
  const document = await repository.getById('documents', id);
  if (!document || document.userId !== userId) {
    throw httpError(404, 'Document not found');
  }
  return document;
}

export async function getOwnedRun(userId, id) {
  const run = await repository.getById('workflow_runs', id);
  if (!run || run.userId !== userId) {
    throw httpError(404, 'Run not found');
  }
  return run;
}
