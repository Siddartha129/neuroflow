export const queryKeys = {
  me: ['auth', 'me'],
  dashboard: ['dashboard'],
  workspaces: ['workspaces'],
  workspace: (id) => ['workspaces', id],
  workspaceDocuments: (id) => ['workspaces', id, 'documents'],
  workspaceChat: (id) => ['workspaces', id, 'chat'],
  workspaceRuns: (id) => ['workspaces', id, 'runs'],
  run: (id) => ['runs', id]
};
