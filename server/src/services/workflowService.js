import { repository } from '../data/repository.js';
import { citationsFromChunks, retrieveChunks } from './retrievalService.js';
import { generateJson } from './ollamaService.js';
import { splitSentences, summarizeText, terms } from './textService.js';
import { httpError } from '../utils/httpError.js';

const labels = {
  ask: 'Ask workspace',
  summarize: 'Summarize workspace',
  compare: 'Compare documents',
  meeting_action_items: 'Action items',
  research_brief: 'Research brief'
};

export async function runWorkflow({ userId, workspaceId, type, input = {} }) {
  if (type === 'compare' && (!Array.isArray(input.documentIds) || input.documentIds.length < 2)) {
    throw httpError(400, 'Compare requires at least two documents');
  }

  const run = await repository.create('workflow_runs', {
    userId,
    workspaceId,
    type,
    status: 'queued',
    title: titleFor(type, input),
    input,
    trace: []
  });

  const trace = [];
  const mark = (stage, detail) => trace.push({ stage, status: 'completed', detail, at: new Date().toISOString() });

  try {
    await repository.updateById('workflow_runs', run.id, { status: 'running' });
    const plan = await planWorkflow(type, input);
    mark('Planner', plan);

    const chunks = await retrieveChunks({
      userId,
      workspaceId,
      query: plan.query,
      documentIds: plan.documentIds || input.documentIds || []
    });
    const citations = citationsFromChunks(chunks);
    mark('Retriever', { query: plan.query, chunks: chunks.length });

    const raw = await taskWorkflow(type, input, chunks);
    mark('Task', { outputFields: Object.keys(raw) });

    const output = await writeWorkflow(type, raw);
    mark('Writer', { outputFields: Object.keys(output) });

    const evaluation = evaluateOutput(output, chunks);
    mark('Evaluator', evaluation);

    const completed = await repository.updateById('workflow_runs', run.id, {
      status: 'completed',
      output,
      citations,
      evaluation,
      trace
    });
    return completed;
  } catch (error) {
    await repository.updateById('workflow_runs', run.id, {
      status: 'failed',
      trace: [...trace, { stage: 'Error', status: 'failed', detail: error.message, at: new Date().toISOString() }]
    });
    throw error;
  }
}

async function planWorkflow(type, input) {
  const fallback = {
    task: type,
    query: input.question || input.topic || input.prompt || labels[type],
    documentIds: input.documentIds || []
  };
  return generateJson(`Plan a document intelligence workflow for ${type}. Input: ${JSON.stringify(input)}`, fallback);
}

async function taskWorkflow(type, input, chunks) {
  const context = chunks.map((chunk) => `[${chunk.documentName}] ${chunk.text}`).join('\n\n');
  const fallback = fallbackOutput(type, input, chunks);
  return generateJson(
    `Use only this retrieved document context to produce ${type}. Context:\n${context}\nInput:${JSON.stringify(input)}`,
    fallback
  );
}

async function writeWorkflow(type, raw) {
  return normalizeOutput(type, raw);
}

function fallbackOutput(type, input, chunks) {
  const text = chunks.map((chunk) => chunk.text).join('\n\n');
  if (type === 'ask') {
    return { answer: groundedAnswer(input.question, chunks) };
  }
  if (type === 'summarize') {
    return {
      summary: summarizeText(text, 5) || 'No ready document text was found for this workspace.',
      keyPoints: splitSentences(summarizeText(text, 6)).slice(0, 5)
    };
  }
  if (type === 'compare') {
    const grouped = groupChunks(chunks);
    return {
      overview: `Compared ${Object.keys(grouped).length} documents using retrieved workspace evidence.`,
      similarities: sharedTerms(grouped).slice(0, 5).map((term) => `Shared topic: ${term}`),
      differences: Object.entries(grouped).map(([name, docText]) => `${name} emphasizes ${terms(docText).slice(0, 5).join(', ')}.`),
      documentTakeaways: Object.entries(grouped).map(([name, docText]) => ({
        documentId: chunks.find((chunk) => chunk.documentName === name)?.documentId || '',
        documentName: name,
        takeaway: summarizeText(docText, 2)
      }))
    };
  }
  if (type === 'meeting_action_items') {
    const candidates = splitSentences(text).filter((line) => /\b(todo|action|follow up|must|should|need to|assign|prepare|send|review)\b/i.test(line));
    return {
      summary: summarizeText(text, 3),
      actionItems: (candidates.length ? candidates : splitSentences(text).slice(0, 4)).map((line) => ({
        task: line,
        owner: 'Unassigned',
        priority: /urgent|must|critical/i.test(line) ? 'High' : 'Medium',
        dueNote: 'Not specified'
      }))
    };
  }
  return {
    title: input.topic || 'Research brief',
    executiveSummary: summarizeText(text, 4),
    themes: [
      { heading: 'Key evidence', details: splitSentences(summarizeText(text, 6)).slice(0, 3) },
      { heading: 'Notable documents', details: [...new Set(chunks.map((chunk) => chunk.documentName))].slice(0, 3) }
    ],
    conclusion: summarizeText(text, 2)
  };
}

function normalizeOutput(type, raw = {}) {
  if (type === 'ask') return { answer: String(raw.answer || '') };
  if (type === 'summarize') return { summary: String(raw.summary || ''), keyPoints: arrayOfStrings(raw.keyPoints) };
  if (type === 'compare') {
    return {
      overview: String(raw.overview || ''),
      similarities: arrayOfStrings(raw.similarities),
      differences: arrayOfStrings(raw.differences),
      documentTakeaways: Array.isArray(raw.documentTakeaways) ? raw.documentTakeaways : []
    };
  }
  if (type === 'meeting_action_items') {
    return { summary: String(raw.summary || ''), actionItems: Array.isArray(raw.actionItems) ? raw.actionItems : [] };
  }
  return {
    title: String(raw.title || 'Research brief'),
    executiveSummary: String(raw.executiveSummary || ''),
    themes: Array.isArray(raw.themes) ? raw.themes : [],
    conclusion: String(raw.conclusion || '')
  };
}

function evaluateOutput(output, chunks) {
  return {
    confidence: chunks.length >= 3 ? 'high' : chunks.length ? 'medium' : 'low',
    note: chunks.length
      ? `Grounded in ${chunks.length} retrieved chunks from uploaded documents.`
      : 'No ready document chunks were available; output used deterministic fallback structure.'
  };
}

function titleFor(type, input) {
  return input.question || input.topic || input.prompt || labels[type] || 'Workflow run';
}

function groundedAnswer(question, chunks) {
  if (!chunks.length) return 'I could not find ready document chunks in this workspace yet.';
  const lead = `Based on the uploaded documents, ${summarizeText(chunks.map((chunk) => chunk.text).join(' '), 4)}`;
  return question ? `${lead}\n\nQuestion: ${question}` : lead;
}

function groupChunks(chunks) {
  return chunks.reduce((acc, chunk) => {
    acc[chunk.documentName] = `${acc[chunk.documentName] || ''}\n${chunk.text}`;
    return acc;
  }, {});
}

function sharedTerms(grouped) {
  const sets = Object.values(grouped).map((text) => new Set(terms(text)));
  if (!sets.length) return [];
  return [...sets[0]].filter((term) => sets.every((set) => set.has(term)));
}

function arrayOfStrings(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
