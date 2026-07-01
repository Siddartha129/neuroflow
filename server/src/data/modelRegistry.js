import { ChatMessage } from '../models/ChatMessage.js';
import { ChatThread } from '../models/ChatThread.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { User } from '../models/User.js';
import { WorkflowRun } from '../models/WorkflowRun.js';
import { Workspace } from '../models/Workspace.js';

export const models = {
  users: User,
  workspaces: Workspace,
  documents: Document,
  document_chunks: DocumentChunk,
  chat_threads: ChatThread,
  chat_messages: ChatMessage,
  workflow_runs: WorkflowRun
};

export const collectionNames = Object.keys(models);
