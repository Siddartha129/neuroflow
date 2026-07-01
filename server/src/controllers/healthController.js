import { repositoryState } from '../data/repository.js';

export async function health(req, res) {
  res.json({
    status: 'ok',
    repositoryMode: repositoryState.mode,
    time: new Date().toISOString()
  });
}
