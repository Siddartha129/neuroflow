import { app } from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { seedDemoData } from './data/seed.js';

async function start() {
  await connectDatabase();
  await seedDemoData();

  app.listen(config.port, () => {
    console.log(`NeuroFlow API running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
