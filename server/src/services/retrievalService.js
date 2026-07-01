import { repository } from '../data/repository.js';
import { embedText } from './ollamaService.js';
import { keywordScore } from './textService.js';

function cosine(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

export async function retrieveChunks({ userId, workspaceId, query, documentIds = [], topK = 5 }) {
  const docs = await repository.getAll('documents', { userId, workspaceId, status: 'ready' });
  const allowedIds = new Set(documentIds.length ? documentIds : docs.map((doc) => doc.id));
  const docMap = new Map(docs.map((doc) => [doc.id, doc]));
  const chunks = (await repository.getAll('document_chunks', { userId, workspaceId })).filter((chunk) =>
    allowedIds.has(chunk.documentId)
  );
  const queryEmbedding = await embedText(query);

  return chunks
    .map((chunk) => {
      const vectorScore = queryEmbedding.length && chunk.embedding?.length ? cosine(queryEmbedding, chunk.embedding) : 0;
      const score = vectorScore || keywordScore(query, chunk.text);
      const document = docMap.get(chunk.documentId);
      return {
        ...chunk,
        documentName: document?.originalName || 'Document',
        snippet: chunk.text.slice(0, 280),
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function citationsFromChunks(chunks) {
  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    chunkId: chunk.id,
    chunkIndex: chunk.chunkIndex,
    snippet: chunk.snippet,
    score: Number((chunk.score || 0).toFixed(3))
  }));
}
