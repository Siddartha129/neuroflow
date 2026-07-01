import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { parse } from 'csv-parse/sync';
import { repository } from '../data/repository.js';
import { embedText } from './ollamaService.js';
import { cleanText, makeChunks, summarizeText } from './textService.js';

export const allowedMimeTypes = new Map([
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['text/plain', 'txt'],
  ['text/markdown', 'md'],
  ['text/csv', 'csv'],
  ['image/png', 'image'],
  ['image/jpeg', 'image'],
  ['image/webp', 'image']
]);

export function fileTypeFor(file) {
  const byMime = allowedMimeTypes.get(file.mimetype);
  if (byMime) return byMime;
  const ext = path.extname(file.originalname).toLowerCase();
  return { '.md': 'md', '.txt': 'txt', '.csv': 'csv', '.pdf': 'pdf', '.docx': 'docx', '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.webp': 'image' }[ext];
}

export async function ingestDocument(document) {
  await repository.updateById('documents', document.id, { status: 'processing', processingError: '' });
  try {
    const result = await extractText(document);
    const extractedText = cleanText(result.text);
    if (extractedText.length < 10) throw new Error('No readable text could be extracted');

    await repository.deleteWhere('document_chunks', { documentId: document.id, userId: document.userId });
    const chunks = makeChunks(extractedText);
    for (const chunk of chunks) {
      const embedding = await embedText(chunk.text);
      await repository.create('document_chunks', {
        userId: document.userId,
        workspaceId: document.workspaceId,
        documentId: document.id,
        ...chunk,
        embedding,
        metadata: { source: document.originalName }
      });
    }

    return repository.updateById('documents', document.id, {
      status: 'ready',
      extractedText,
      summary: summarizeText(extractedText),
      pageCount: result.pageCount || 0,
      metadata: result.metadata || {},
      processingError: ''
    });
  } catch (error) {
    return repository.updateById('documents', document.id, {
      status: 'failed',
      processingError: error.message || 'Document processing failed'
    });
  }
}

async function extractText(document) {
  const buffer = await fs.readFile(document.metadata.path);
  if (document.fileType === 'pdf') {
    const result = await pdfParse(buffer);
    return { text: result.text, pageCount: result.numpages, metadata: result.info || {} };
  }
  if (document.fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, metadata: { messages: result.messages?.length || 0 } };
  }
  if (['txt', 'md'].includes(document.fileType)) {
    return { text: buffer.toString('utf8') };
  }
  if (document.fileType === 'csv') {
    const rows = parse(buffer.toString('utf8'), { skip_empty_lines: true, relax_column_count: true });
    return { text: rows.map((row) => row.join(' | ')).join('\n') };
  }
  if (document.fileType === 'image') {
    const png = await sharp(buffer).grayscale().normalize().png().toBuffer();
    const worker = await createWorker('eng');
    const result = await worker.recognize(png);
    await worker.terminate();
    return { text: result.data.text };
  }
  return { text: '' };
}
