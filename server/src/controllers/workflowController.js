import { repository } from '../data/repository.js';
import { runWorkflow } from '../services/workflowService.js';
import { getOwnedRun, getOwnedWorkspace } from '../utils/resourceGuards.js';

export async function listRuns(req, res) {
  await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  const runs = await repository.getAll(
    'workflow_runs',
    { userId: req.user.id, workspaceId: req.params.workspaceId },
    { createdAt: -1 }
  );
  res.json({ runs });
}

export async function getRun(req, res) {
  const run = await getOwnedRun(req.user.id, req.params.id);
  res.json({ run });
}

export async function createWorkflowRun(req, res) {
  const workspace = await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  const run = await runWorkflow({
    userId: req.user.id,
    workspaceId: workspace.id,
    type: req.workflowType,
    input: req.body || {}
  });
  res.status(201).json({ run });
}
