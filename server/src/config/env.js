import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: serverEnvPath, override: true });

export const config = {
  port: Number(process.env.PORT || 3001),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-neuroflow-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaChatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.1:8b',
  ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  seedSampleData: String(process.env.SEED_SAMPLE_DATA || 'true') === 'true'
};
