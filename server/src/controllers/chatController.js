import { repository } from '../data/repository.js';
import { runWorkflow } from '../services/workflowService.js';
import { getOwnedWorkspace } from '../utils/resourceGuards.js';
import { httpError } from '../utils/httpError.js';

export async function listThreads(req, res) {
  await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  const threads = await repository.getAll(
    'chat_threads',
    { userId: req.user.id, workspaceId: req.params.workspaceId },
    { createdAt: -1 }
  );
  res.json({ threads });
}

export async function listMessages(req, res) {
  await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  const messages = await repository.getAll(
    'chat_messages',
    { userId: req.user.id, workspaceId: req.params.workspaceId, threadId: req.params.threadId },
    { createdAt: 1 }
  );
  res.json({ messages });
}

export async function sendMessage(req, res) {
  const workspace = await getOwnedWorkspace(req.user.id, req.params.workspaceId);
  const question = String(req.body.question || '').trim();
  if (!question) throw httpError(400, 'Question is required');

  let threadId = req.body.threadId;
  if (threadId) {
    const thread = await repository.getById('chat_threads', threadId);
    if (!thread || thread.userId !== req.user.id || thread.workspaceId !== workspace.id) {
      throw httpError(404, 'Chat thread not found');
    }
  } else {
    const thread = await repository.create('chat_threads', {
      userId: req.user.id,
      workspaceId: workspace.id,
      title: question.slice(0, 80)
    });
    threadId = thread.id;
  }

  const userMessage = await repository.create('chat_messages', {
    userId: req.user.id,
    workspaceId: workspace.id,
    threadId,
    role: 'user',
    content: question,
    citations: []
  });
  const run = await runWorkflow({ userId: req.user.id, workspaceId: workspace.id, type: 'ask', input: { question, threadId } });
  const assistantMessage = await repository.create('chat_messages', {
    userId: req.user.id,
    workspaceId: workspace.id,
    threadId,
    role: 'assistant',
    content: run.output.answer,
    citations: run.citations
  });

  res.status(201).json({ threadId, userMessage, assistantMessage, run });
}
