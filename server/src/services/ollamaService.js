import { config } from '../config/env.js';

async function postOllama(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${config.ollamaBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Ollama responded with ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateJson(prompt, fallback) {
  try {
    const data = await postOllama('/api/generate', {
      model: config.ollamaChatModel,
      prompt: `${prompt}\nReturn only valid JSON.`,
      stream: false,
      format: 'json'
    });
    return JSON.parse(data.response);
  } catch {
    return fallback;
  }
}

export async function embedText(text) {
  try {
    const data = await postOllama('/api/embeddings', {
      model: config.ollamaEmbedModel,
      prompt: text
    });
    return Array.isArray(data.embedding) ? data.embedding : [];
  } catch {
    return [];
  }
}
