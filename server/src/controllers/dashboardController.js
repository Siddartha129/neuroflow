import { repository } from '../data/repository.js';

export async function getDashboard(req, res) {
  const [workspaces, documents, runs] = await Promise.all([
    repository.getAll('workspaces', { userId: req.user.id }, { createdAt: -1 }),
    repository.getAll('documents', { userId: req.user.id }, { createdAt: -1 }),
    repository.getAll('workflow_runs', { userId: req.user.id }, { createdAt: -1 })
  ]);
  res.json({
    stats: {
      workspaceCount: workspaces.length,
      documentCount: documents.length,
      runCount: runs.length,
      readyDocumentCount: documents.filter((doc) => doc.status === 'ready').length
    },
    workspaces: workspaces.slice(0, 5),
    recentRuns: runs.slice(0, 5)
  });
}
