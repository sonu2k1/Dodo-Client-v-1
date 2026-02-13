// Vercel Serverless Function entry point
// Re-exports the Express app for Vercel to use as a serverless function
import app from '../server/server.js';

export default app;
