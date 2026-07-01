import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { repository } from './repository.js';

export async function seedDemoData() {
  if (!config.seedSampleData) return;

  const email = 'demo@neuroflow.ai';
  const existing = await repository.getOne('users', { email });
  if (existing) return;

  const password = await bcrypt.hash('Password@123', 10);
  const user = await repository.create('users', {
    name: 'Demo User',
    email,
    password
  });

  await repository.create('workspaces', {
    userId: user.id,
    name: 'Demo Research Workspace',
    description: 'Seed workspace for trying NeuroFlow AI.',
    color: '#2563eb'
  });
  const workspace = await repository.getOne('workspaces', { userId: user.id, name: 'Demo Research Workspace' });
  const document = await repository.create('documents', {
    userId: user.id,
    workspaceId: workspace.id,
    originalName: 'neuroflow-demo-notes.md',
    storedName: 'seed-demo-notes.md',
    mimeType: 'text/markdown',
    size: 712,
    fileType: 'md',
    status: 'ready',
    extractedText:
      'NeuroFlow helps teams organize workspace documents, retrieve relevant chunks, and run grounded AI workflows. The project supports fallback retrieval and deterministic outputs when local models are unavailable. Action items should include reviewing uploaded source material, assigning owners, and validating citations before sharing final briefs.',
    summary:
      'NeuroFlow organizes workspace documents, retrieves chunks, and runs grounded workflows with offline fallback support.',
    pageCount: 1,
    metadata: { seeded: true }
  });
  const chunk = await repository.create('document_chunks', {
    userId: user.id,
    workspaceId: workspace.id,
    documentId: document.id,
    chunkIndex: 0,
    text: document.extractedText,
    tokenCountApprox: 76,
    embedding: [],
    metadata: { source: document.originalName, seeded: true }
  });
  await repository.create('workflow_runs', {
    userId: user.id,
    workspaceId: workspace.id,
    type: 'summarize',
    status: 'completed',
    title: 'Demo summary',
    input: { prompt: 'Summarize the demo notes' },
    output: {
      summary: document.summary,
      keyPoints: ['Workspace documents are chunked for retrieval.', 'Workflow outputs remain available without Ollama.']
    },
    citations: [
      {
        documentId: document.id,
        documentName: document.originalName,
        chunkId: chunk.id,
        chunkIndex: 0,
        snippet: chunk.text.slice(0, 220),
        score: 1
      }
    ],
    evaluation: { confidence: 'medium', note: 'Seeded demo run grounded in one sample chunk.' },
    trace: [
      { stage: 'Planner', status: 'completed', detail: { task: 'summarize' }, at: new Date().toISOString() },
      { stage: 'Retriever', status: 'completed', detail: { chunks: 1 }, at: new Date().toISOString() },
      { stage: 'Task', status: 'completed', detail: { fallback: true }, at: new Date().toISOString() },
      { stage: 'Writer', status: 'completed', detail: { outputFields: ['summary', 'keyPoints'] }, at: new Date().toISOString() },
      { stage: 'Evaluator', status: 'completed', detail: { confidence: 'medium' }, at: new Date().toISOString() }
    ]
  });
}
