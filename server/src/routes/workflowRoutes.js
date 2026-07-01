import { Router } from 'express';
import { createWorkflowRun, getRun, listRuns } from '../controllers/workflowController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const workflowRoutes = Router();

workflowRoutes.use(requireAuth);
workflowRoutes.get('/workspaces/:workspaceId/runs', asyncHandler(listRuns));
workflowRoutes.get('/runs/:id', asyncHandler(getRun));

workflowRoutes.post('/workspaces/:workspaceId/runs/summarize', setType('summarize'), asyncHandler(createWorkflowRun));
workflowRoutes.post('/workspaces/:workspaceId/runs/compare', setType('compare'), asyncHandler(createWorkflowRun));
workflowRoutes.post(
  '/workspaces/:workspaceId/runs/meeting-action-items',
  setType('meeting_action_items'),
  asyncHandler(createWorkflowRun)
);
workflowRoutes.post('/workspaces/:workspaceId/runs/research-brief', setType('research_brief'), asyncHandler(createWorkflowRun));

function setType(type) {
  return (req, res, next) => {
    req.workflowType = type;
    next();
  };
}
