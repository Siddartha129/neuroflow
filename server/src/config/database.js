import mongoose from 'mongoose';
import { config } from './env.js';
import { repositoryState } from '../data/repository.js';

export async function connectDatabase() {
  if (!config.mongoUri) {
    repositoryState.mode = 'memory';
    console.log('MongoDB not configured. Using in-memory repository.');
    return;
  }

  try {
    await mongoose.connect(config.mongoUri);
    repositoryState.mode = 'mongo';
    console.log('MongoDB connected. Using Mongo repository.');
  } catch (error) {
    repositoryState.mode = 'memory';
    console.warn('MongoDB connection failed. Falling back to in-memory repository.');
    console.warn(error.message);
  }
}
