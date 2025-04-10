import cors from 'cors';
import express, { Request, Response } from 'express';
import { BACKEND_PORT } from './config.js';
import authRoutes from './auth.js';
import  businessRoutes from './business.js';
import { resetDataStore, initializeDataStore } from './dataStore.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);

app.delete('/api/testing/clear-users', (req: Request, res: Response) => {
  resetDataStore();
  res.json({ success: true });
});

initializeDataStore();

app.listen(BACKEND_PORT, () => {
  console.log(`Server running on port ${BACKEND_PORT}`);
});

export default app;