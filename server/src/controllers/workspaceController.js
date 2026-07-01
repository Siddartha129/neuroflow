import { repository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';

async function getUserWorkspace(userId, id) {
  const workspace = await repository.getOne('workspaces', { id, userId });
  if (workspace) return workspace;

  const byId = await repository.getById('workspaces', id);
  if (!byId || byId.userId !== userId) {
    throw httpError(404, 'Workspace not found');
  }
  return byId;
}

export async function listWorkspaces(req, res) {
  const workspaces = await repository.getAll('workspaces', { userId: req.user.id }, { createdAt: -1 });
  res.json({ workspaces });
}

export async function createWorkspace(req, res) {
  const { name, description = '', color = '#2563eb' } = req.body;

  if (!name || !name.trim()) {
    throw httpError(400, 'Workspace name is required');
  }

  const workspace = await repository.create('workspaces', {
    userId: req.user.id,
    name: name.trim(),
    description,
    color
  });

  res.status(201).json({ workspace });
}

export async function getWorkspace(req, res) {
  const workspace = await getUserWorkspace(req.user.id, req.params.id);
  const [documentCount, readyDocumentCount, runCount] = await Promise.all([
    repository.count('documents', { userId: req.user.id, workspaceId: workspace.id }),
    repository.count('documents', { userId: req.user.id, workspaceId: workspace.id, status: 'ready' }),
    repository.count('workflow_runs', { userId: req.user.id, workspaceId: workspace.id })
  ]);
  const completedRuns = await repository.getAll('workflow_runs', {
    userId: req.user.id,
    workspaceId: workspace.id,
    status: 'completed'
  });
  const completedRunCount = completedRuns.length;
  const completedRunWithOutputCount = completedRuns.filter((run) => Object.keys(run.output || {}).length > 0).length;
  const completedRunWithEvaluationCount = completedRuns.filter(
    (run) => Object.keys(run.evaluation || {}).length > 0
  ).length;

  res.json({
    workspace,
    stats: {
      documentCount,
      readyDocumentCount,
      runCount,
      completedRunCount,
      completedRunWithOutputCount,
      completedRunWithEvaluationCount
    }
  });
}

export async function updateWorkspace(req, res) {
  const workspace = await getUserWorkspace(req.user.id, req.params.id);
  const updates = {
    name: req.body.name ?? workspace.name,
    description: req.body.description ?? workspace.description,
    color: req.body.color ?? workspace.color
  };

  const updated = await repository.updateById('workspaces', workspace.id, updates);
  res.json({ workspace: updated });
}

export async function deleteWorkspace(req, res) {
  const workspace = await getUserWorkspace(req.user.id, req.params.id);
  await Promise.all([
    repository.deleteWhere('documents', { userId: req.user.id, workspaceId: workspace.id }),
    repository.deleteWhere('document_chunks', { userId: req.user.id, workspaceId: workspace.id }),
    repository.deleteWhere('chat_threads', { userId: req.user.id, workspaceId: workspace.id }),
    repository.deleteWhere('chat_messages', { userId: req.user.id, workspaceId: workspace.id }),
    repository.deleteWhere('workflow_runs', { userId: req.user.id, workspaceId: workspace.id })
  ]);
  await repository.deleteById('workspaces', workspace.id);
  res.status(204).send();
}
