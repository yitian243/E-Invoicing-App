import cors from 'cors';
import express, { Request, Response } from 'express';
import { BACKEND_PORT } from './config.js';
import authRoutes from './auth.js';
import { resetDataStore } from './dataStore.js';
import http from 'http';

// Create Express app
export const app = express();

app.use(cors());
app.use(express.json());

// Register auth routes
app.use('/api/auth', authRoutes);

app.delete('/api/testing/clear-users', (req: Request, res: Response) => {
  resetDataStore();
  res.json({ success: true });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export const server = http.createServer(app);

let isServerRunning = false;

/**
 * Start the server if not already running
 */
export function startServer() {
  if (!isServerRunning) {
    server.listen(BACKEND_PORT, () => {
      console.log(`Server running on port ${BACKEND_PORT}`);
      isServerRunning = true;
    });
  }
  return server;
}

/**
 * Close the server
 */
export async function stopServer() {
  return new Promise<void>((resolve, reject) => {
    if (isServerRunning) {
      server.close((err) => {
        if (err) {
          console.error('Error closing server:', err);
          reject(err);
        } else {
          isServerRunning = false;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Only start the server if this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;