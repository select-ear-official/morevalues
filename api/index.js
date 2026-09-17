import { app } from '../src/app.js';
import { dbManager } from '../src/dbManager.js';

// Vercel serverless instances are stateless, so we ensure the database is initialized
// exactly once per cold start.
const initPromise = dbManager.init().catch(err => {
  console.error("Failed to initialize database:", err);
});

export default async (req, res) => {
  await initPromise;
  
  // Vercel passes req and res to the Express app instance
  return app(req, res);
};
